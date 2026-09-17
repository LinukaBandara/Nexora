using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Nexora.Application.Common.Notifications;
using Nexora.Application.Inventory.Common;

namespace Nexora.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly));
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);
        services.AddScoped<StockMovementRecorder>();
        services.AddScoped<INotificationService, NotificationService>();
        return services;
    }
}
