using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Nexora.Domain.Sync;

namespace Nexora.Infrastructure.Sync;

public class SyncWorkerOptions
{
    public bool Enabled { get; set; } = false;
    public string? CloudEndpointUrl { get; set; }
    public string? NodeId { get; set; }
    public string? NodeSecret { get; set; }
    public int PollIntervalSeconds { get; set; } = 15;
    public int BatchSize { get; set; } = 50;
    public int MaxAttempts { get; set; } = 8;
}

// Ships SyncOutboxEvent rows to the cloud's /api/v1/sync/events endpoint.
// Disabled by default (Sync:Enabled=false) - only a local-node deployment
// turns this on. Retries with backoff up to MaxAttempts, then marks an
// event Failed rather than retrying forever; nothing is ever dropped from
// the outbox table itself. See docs/sync.md.
public class SyncWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly HttpClient _httpClient;
    private readonly SyncWorkerOptions _options;
    private readonly ILogger<SyncWorker> _logger;

    public SyncWorker(
        IServiceScopeFactory scopeFactory, HttpClient httpClient,
        IOptions<SyncWorkerOptions> options, ILogger<SyncWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_options.Enabled)
        {
            _logger.LogInformation("SyncWorker disabled (Sync:Enabled=false) - poll loop not started.");
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await SyncOneBatchAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Sync batch attempt failed - will retry next interval.");
            }

            await Task.Delay(TimeSpan.FromSeconds(_options.PollIntervalSeconds), stoppingToken);
        }
    }

    private async Task SyncOneBatchAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<Persistence.NexoraDbContext>();

        var pending = await db.SyncOutboxEvents.IgnoreQueryFilters()
            .Where(e => e.Status == SyncOutboxStatus.Pending || e.Status == SyncOutboxStatus.Failed)
            .Where(e => e.AttemptCount < _options.MaxAttempts)
            .OrderBy(e => e.CreatedAt)
            .Take(_options.BatchSize)
            .ToListAsync(cancellationToken);

        if (pending.Count == 0) return;

        var payload = pending.Select(e => new
        {
            e.AggregateId,
            e.AggregateType,
            e.Version,
            EventTypeRaw = e.EventType.ToString(),
            e.Payload,
            e.IdempotencyKey,
        });

        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"{_options.CloudEndpointUrl}/api/v1/sync/events")
        {
            Content = JsonContent.Create(new { nodeId = _options.NodeId, events = payload }),
        };
        httpRequest.Headers.Add("X-Node-Secret", _options.NodeSecret);

        var now = DateTimeOffset.UtcNow;
        HttpResponseMessage response;

        try
        {
            response = await _httpClient.SendAsync(httpRequest, cancellationToken);
        }
        catch (Exception ex)
        {
            foreach (var e in pending)
            {
                e.AttemptCount++;
                e.LastAttemptAt = now;
                e.LastError = $"Connection failed: {ex.Message}";
            }
            await db.SaveChangesAsync(cancellationToken);
            return;
        }

        if (!response.IsSuccessStatusCode)
        {
            foreach (var e in pending)
            {
                e.AttemptCount++;
                e.LastAttemptAt = now;
                e.LastError = $"Cloud responded {(int)response.StatusCode}";
                e.Status = e.AttemptCount >= _options.MaxAttempts ? SyncOutboxStatus.Failed : SyncOutboxStatus.Pending;
            }
            await db.SaveChangesAsync(cancellationToken);
            return;
        }

        var result = await response.Content.ReadFromJsonAsync<SyncAckResponse>(cancellationToken: cancellationToken);
        var acksByKey = result?.Acks.ToDictionary(a => a.IdempotencyKey) ?? new();

        foreach (var e in pending)
        {
            e.AttemptCount++;
            e.LastAttemptAt = now;

            if (acksByKey.TryGetValue(e.IdempotencyKey, out var ack))
            {
                e.Status = SyncOutboxStatus.Acknowledged;
                e.LastError = ack.Outcome == "conflict" ? "Delivered - flagged as a conflict on the receiving side." : null;
            }
            else
            {
                e.Status = e.AttemptCount >= _options.MaxAttempts ? SyncOutboxStatus.Failed : SyncOutboxStatus.Pending;
                e.LastError = "No acknowledgment received for this event in the batch response.";
            }
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private record SyncAckResponse(List<SyncAck> Acks);
    private record SyncAck(Guid IdempotencyKey, string Outcome);
}
