using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Nexora.Domain.Common;

namespace Nexora.Infrastructure.Persistence.Interceptors;

// Blocks further changes to an entity whose status was already terminal
// before this SaveChanges call. Does not block the transition INTO a
// terminal status, only modifications after it's already there.
public class FinancialImmutabilityInterceptor : SaveChangesInterceptor
{
    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        if (eventData.Context is not null)
            EnforceImmutability(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
    {
        if (eventData.Context is not null)
            EnforceImmutability(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private static void EnforceImmutability(DbContext context)
    {
        foreach (var entry in context.ChangeTracker.Entries())
        {
            if (entry.Entity is not IFinalizableDocument finalizable) continue;
            if (entry.State != EntityState.Modified) continue;

            var statusProperty = entry.Properties.FirstOrDefault(p => p.Metadata.Name == "Status");
            if (statusProperty is null) continue;

            var originalStatus = statusProperty.OriginalValue;
            if (originalStatus is null) continue;

            if (finalizable.IsTerminalStatus(originalStatus))
            {
                throw new InvalidOperationException(
                    $"'{entry.Entity.GetType().Name}' is already finalized (status: {originalStatus}) and cannot be modified further.");
            }
        }
    }
}
