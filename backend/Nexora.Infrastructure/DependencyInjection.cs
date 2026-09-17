using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Nexora.Application.Common.Interfaces;
using Nexora.Infrastructure.Persistence;
using Nexora.Infrastructure.Persistence.Interceptors;
using Nexora.Infrastructure.Services;
using Nexora.Infrastructure.Sync;

namespace Nexora.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHttpContextAccessor();

        services.Configure<JwtOptions>(configuration.GetSection("Jwt"));
        services.Configure<SyncWorkerOptions>(configuration.GetSection("Sync"));

        services.AddScoped<AuditableEntitySaveChangesInterceptor>();
        services.AddScoped<SyncOutboxInterceptor>();
        services.AddScoped<FinancialImmutabilityInterceptor>();

        services.AddDbContext<NexoraDbContext>(options =>
            options.UseNpgsql(
                configuration.GetConnectionString("Default"),
                npgsql => npgsql.MigrationsAssembly(typeof(NexoraDbContext).Assembly.FullName)));

        services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<NexoraDbContext>());

        services.AddScoped<ITenantContext, TenantContext>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddSingleton<IJwtTokenService, JwtTokenService>();
        services.AddSingleton<IPasswordHasher, PasswordHasher>();

        // SyncWorker itself no-ops at startup unless Sync:Enabled=true - see
        // docs/sync.md. Registered unconditionally so a local-node deployment
        // just needs a config flip, not a different DI wiring.
        services.AddHttpClient<SyncWorker>();
        services.AddHostedService<SyncWorker>();

        return services;
    }
}
