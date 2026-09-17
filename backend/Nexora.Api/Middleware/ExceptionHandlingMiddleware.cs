using System.Net;
using System.Text.Json;

namespace Nexora.Api.Middleware;

/// <summary>
/// Every unhandled exception is converted into a consistent JSON envelope
/// (see Phase 0 architecture doc, section 6/36): a human-readable message,
/// a correlation id for support/log lookup, and never a raw stack trace or
/// "500 Internal Server Error" shown to a normal user. Full technical detail
/// is logged server-side via Serilog with the same correlation id.
/// </summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = context.TraceIdentifier;

        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            var (statusCode, message) = MapException(ex);

            _logger.LogError(ex, "Unhandled exception. CorrelationId={CorrelationId}", correlationId);

            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)statusCode;

            var payload = JsonSerializer.Serialize(new
            {
                message,
                correlationId,
            });

            await context.Response.WriteAsync(payload);
        }
    }

    private static (HttpStatusCode, string) MapException(Exception ex) => ex switch
    {
        UnauthorizedAccessException => (HttpStatusCode.Unauthorized, ex.Message),
        InvalidOperationException => (HttpStatusCode.BadRequest, ex.Message),
        KeyNotFoundException => (HttpStatusCode.NotFound, "The requested resource was not found."),
        _ => (HttpStatusCode.InternalServerError,
              "Something went wrong on our end. Our team has been notified - please try again, and reference the correlation ID below if you contact support."),
    };
}

public static class ExceptionHandlingMiddlewareExtensions
{
    public static IApplicationBuilder UseNexoraExceptionHandling(this IApplicationBuilder app) =>
        app.UseMiddleware<ExceptionHandlingMiddleware>();
}
