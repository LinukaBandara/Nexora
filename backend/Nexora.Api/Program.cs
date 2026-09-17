using Microsoft.EntityFrameworkCore;
using Nexora.Api;
using Nexora.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

HostConfiguration.ConfigureServices(builder);

var app = builder.Build();

HostConfiguration.ConfigurePipeline(app);

// Apply pending migrations + seed permissions/demo org on startup in
// Development only. Production runs migrations explicitly via CI/CD.
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<NexoraDbContext>();
    await db.Database.MigrateAsync();
    await DbSeeder.SeedAsync(db);
}

app.Run();

public partial class Program { } // exposed for WebApplicationFactory in integration tests
