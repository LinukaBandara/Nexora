using Microsoft.EntityFrameworkCore;
using Nexora.Infrastructure.Persistence;
using Nexora.Infrastructure.Persistence.Interceptors;
using Nexora.UnitTests.TestDoubles;

namespace Nexora.UnitTests.TestDoubles;

public static class TestDbContextFactory
{
    public static NexoraDbContext Create(FakeTenantContext tenantContext, FakeCurrentUserService currentUser)
    {
        var options = new DbContextOptionsBuilder<NexoraDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()) // isolated DB per test
            .Options;

        var auditInterceptor = new AuditableEntitySaveChangesInterceptor(currentUser);
        var syncOutboxInterceptor = new SyncOutboxInterceptor();
        var immutabilityInterceptor = new FinancialImmutabilityInterceptor();
        return new NexoraDbContext(options, tenantContext, auditInterceptor, syncOutboxInterceptor, immutabilityInterceptor);
    }
}
