using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.IdentityModel.Tokens;
using Nexora.Api.Authorization;
using Nexora.Api.Middleware;
using Nexora.Application;
using Nexora.Application.Common.Security;
using Nexora.Infrastructure;
using Serilog;

namespace Nexora.Api;

// Both NEXORA hosts - the cloud API and a local node - run the identical
// Domain/Application/Infrastructure stack and identical auth/tenancy
// wiring. Only the connection string, whether SyncWorker is enabled, and
// whether dev seeding runs differ between them. That wiring lives here
// once so the two hosts can't silently drift apart.
public static class HostConfiguration
{
    public static void ConfigureServices(WebApplicationBuilder builder)
    {
        builder.Host.UseSerilog((context, config) => config
            .ReadFrom.Configuration(context.Configuration)
            .Enrich.FromLogContext()
            .WriteTo.Console());

        builder.Services.AddApplication();
        builder.Services.AddInfrastructure(builder.Configuration);

        var jwtSection = builder.Configuration.GetSection("Jwt");
        var signingKey = jwtSection["SigningKey"]
            ?? throw new InvalidOperationException("Jwt:SigningKey is not configured.");

        builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtSection["Issuer"],
                    ValidAudience = jwtSection["Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(Convert.FromBase64String(signingKey)),
                    ClockSkew = TimeSpan.FromSeconds(30),
                };
            });

        builder.Services.AddAuthorizationBuilder();
        builder.Services.AddSingleton<IAuthorizationHandler, PermissionAuthorizationHandler>();
        builder.Services.AddAuthorization(options =>
        {
            foreach (var (code, _, _) in Permissions.All())
                options.AddPolicy(code, policy => policy.Requirements.Add(new PermissionRequirement(code)));
        });

        builder.Services.AddControllers();
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();
        builder.Services.AddHealthChecks()
            .AddNpgSql(builder.Configuration.GetConnectionString("Default")!, name: "postgres");

        builder.Services.AddCors(options =>
        {
            options.AddPolicy("Frontend", policy => policy
                .WithOrigins(builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>())
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials());
        });
    }

    public static void ConfigurePipeline(WebApplication app)
    {
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseNexoraExceptionHandling();
        app.UseSerilogRequestLogging();

        app.UseHttpsRedirection();
        app.UseCors("Frontend");

        app.UseAuthentication();
        app.UseTenantResolution();
        app.UseAuthorization();

        app.MapControllers();

        app.MapHealthChecks("/health");
        app.MapHealthChecks("/health/live", new HealthCheckOptions { Predicate = _ => false });
        app.MapHealthChecks("/health/ready");
    }
}
