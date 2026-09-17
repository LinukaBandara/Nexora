using FluentAssertions;
using Nexora.Application.Common.Notifications;
using Nexora.Application.Sync.Commands.ReceiveSyncEvents;
using Nexora.Domain.Notifications;
using Nexora.Domain.Sync;
using Nexora.UnitTests.TestDoubles;
using Xunit;

namespace Nexora.UnitTests.Sync;

public class ReceiveSyncEventsTests
{
    private static IncomingSyncEvent Event(string aggregateType, int version, Guid? idempotencyKey = null) =>
        new(Guid.NewGuid(), aggregateType, version, "Updated", "{}", idempotencyKey ?? Guid.NewGuid());

    [Fact]
    public async Task DuplicateIdempotencyKey_IsAcknowledgedWithoutReapplying()
    {
        var tenantContext = new FakeTenantContext();
        var currentUser = new FakeCurrentUserService();
        await using var db = TestDbContextFactory.Create(tenantContext, currentUser);

        var orgId = Guid.NewGuid();
        var nodeId = Guid.NewGuid();
        var key = Guid.NewGuid();
        var evt = Event("Product", 1, key);

        var handler = new ReceiveSyncEventsCommandHandler(db, new NotificationService(db));

        var first = await handler.Handle(new ReceiveSyncEventsCommand(orgId, nodeId, new[] { evt }), default);
        first.Acks.Single().Outcome.Should().Be("applied");

        var second = await handler.Handle(new ReceiveSyncEventsCommand(orgId, nodeId, new[] { evt }), default);
        second.Acks.Single().Outcome.Should().Be("duplicate");

        db.SyncInboxEvents.Should().HaveCount(1);
    }

    [Fact]
    public async Task StockMovement_NeverConflicts_RegardlessOfVersion()
    {
        var tenantContext = new FakeTenantContext();
        var currentUser = new FakeCurrentUserService();
        await using var db = TestDbContextFactory.Create(tenantContext, currentUser);

        var handler = new ReceiveSyncEventsCommandHandler(db, new NotificationService(db));
        var orgId = Guid.NewGuid();
        var nodeId = Guid.NewGuid();

        var result1 = await handler.Handle(
            new ReceiveSyncEventsCommand(orgId, nodeId, new[] { Event("StockMovement", 5) }), default);
        var result2 = await handler.Handle(
            new ReceiveSyncEventsCommand(orgId, nodeId, new[] { Event("StockMovement", 1) }), default);

        result1.Acks.Single().Outcome.Should().Be("applied");
        result2.Acks.Single().Outcome.Should().Be("applied");
        db.SyncConflicts.Should().BeEmpty();
        db.Notifications.Should().BeEmpty();
    }

    [Fact]
    public async Task Invoice_VersionMismatch_CreatesOpenConflict_NotifiesForReview_AndDoesNotAdvanceCheckpoint()
    {
        var tenantContext = new FakeTenantContext();
        var currentUser = new FakeCurrentUserService();
        await using var db = TestDbContextFactory.Create(tenantContext, currentUser);

        var handler = new ReceiveSyncEventsCommandHandler(db, new NotificationService(db));
        var orgId = Guid.NewGuid();
        var nodeId = Guid.NewGuid();
        var aggregateId = Guid.NewGuid();

        await handler.Handle(new ReceiveSyncEventsCommand(orgId, nodeId,
            new[] { new IncomingSyncEvent(aggregateId, "Invoice", 1, "Created", "{}", Guid.NewGuid()) }), default);

        var result = await handler.Handle(new ReceiveSyncEventsCommand(orgId, nodeId,
            new[] { new IncomingSyncEvent(aggregateId, "Invoice", 3, "Updated", "{}", Guid.NewGuid()) }), default);

        result.Acks.Single().Outcome.Should().Be("conflict");

        var conflict = db.SyncConflicts.Single();
        conflict.Status.Should().Be(SyncConflictStatus.Open);
        conflict.AggregateType.Should().Be("Invoice");

        db.SyncCheckpoints.Single().LastAppliedVersion.Should().Be(1);

        var notification = db.Notifications.Single();
        notification.Type.Should().Be(NotificationType.SyncConflict);
        notification.EntityType.Should().Be("Invoice");
        notification.EntityId.Should().Be(aggregateId);
    }

    [Fact]
    public async Task Product_VersionMismatch_AutoResolvesLastWriteWins_ButStillLogsConflict_WithoutNotifying()
    {
        var tenantContext = new FakeTenantContext();
        var currentUser = new FakeCurrentUserService();
        await using var db = TestDbContextFactory.Create(tenantContext, currentUser);

        var handler = new ReceiveSyncEventsCommandHandler(db, new NotificationService(db));
        var orgId = Guid.NewGuid();
        var nodeId = Guid.NewGuid();
        var aggregateId = Guid.NewGuid();

        await handler.Handle(new ReceiveSyncEventsCommand(orgId, nodeId,
            new[] { new IncomingSyncEvent(aggregateId, "Product", 1, "Created", "{}", Guid.NewGuid()) }), default);

        var result = await handler.Handle(new ReceiveSyncEventsCommand(orgId, nodeId,
            new[] { new IncomingSyncEvent(aggregateId, "Product", 3, "Updated", "{}", Guid.NewGuid()) }), default);

        result.Acks.Single().Outcome.Should().Be("conflict");

        var conflict = db.SyncConflicts.Single();
        conflict.Status.Should().Be(SyncConflictStatus.ResolvedAuto);

        db.SyncCheckpoints.Single().LastAppliedVersion.Should().Be(3);
        db.Notifications.Should().BeEmpty();
    }
}
