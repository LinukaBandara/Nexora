using Microsoft.AspNetCore.Mvc.ApplicationParts;
using Microsoft.EntityFrameworkCore;
using Nexora.Api;
using Nexora.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

HostConfiguration.ConfigureServices(builder);

// Controllers live in Nexora.Api (AuthController, InventoryController,
// SalesController, ...) - this host runs the identical business API
// against its own local database, so it explicitly picks up that
// assembly's controllers rather than duplicating them here.
builder.Services.AddControllers().PartManager.ApplicationParts.Add(
    new AssemblyPart(typeof(Nexora.Api.Controllers.AuthController).Assembly));

var app = builder.Build();

HostConfiguration.ConfigurePipeline(app);

// A local node always migrates its own database on startup, in every
// environment - unlike the cloud host, there's no separate CI/CD deploy
// step for a machine sitting in the back office of a business. It does
// NOT run DbSeeder: that seeds a *cloud* demo organization and permission
// catalog, which only makes sense once, centrally, not once per node.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<NexoraDbContext>();
    await db.Database.MigrateAsync();
    await DbSeeder.SeedPermissionsAsync(db);
}

app.Run();
