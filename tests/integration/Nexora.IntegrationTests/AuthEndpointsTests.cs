using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Testcontainers.PostgreSql;
using Xunit;

namespace Nexora.IntegrationTests;

/// <summary>
/// Spins up a real, disposable Postgres container per test run (not
/// InMemory/SQLite) so migrations and Npgsql-specific mappings - like the
/// xmin concurrency token - are exercised the same way they will be in
/// production. Implements IAsyncLifetime so xUnit starts/stops the
/// container around the whole test class.
/// </summary>
public class NexoraApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .WithDatabase("nexora_test")
        .WithUsername("nexora")
        .WithPassword("nexora_test_password")
        .Build();

    protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:Default"] = _postgres.GetConnectionString(),
                ["Jwt:SigningKey"] = Convert.ToBase64String(new byte[32]),
            });
        });
    }

    public async Task InitializeAsync() => await _postgres.StartAsync();

    public new async Task DisposeAsync()
    {
        await _postgres.StopAsync();
        await base.DisposeAsync();
    }
}

public class AuthEndpointsTests : IClassFixture<NexoraApiFactory>
{
    private readonly NexoraApiFactory _factory;

    public AuthEndpointsTests(NexoraApiFactory factory) => _factory = factory;

    [Fact]
    public async Task RegisterThenLogin_ReturnsWorkingTokens()
    {
        var client = _factory.CreateClient();

        var registerResponse = await client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            organizationName = "Integration Test Co",
            fullName = "Test Owner",
            email = "owner@integrationtest.co",
            password = "CorrectHorseBatteryStaple1!",
        });

        registerResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var loginResponse = await client.PostAsJsonAsync("/api/v1/auth/login", new
        {
            email = "owner@integrationtest.co",
            password = "CorrectHorseBatteryStaple1!",
        });

        loginResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await loginResponse.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("tokens").GetProperty("accessToken").GetString().Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Me_WithoutToken_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/v1/auth/me");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
