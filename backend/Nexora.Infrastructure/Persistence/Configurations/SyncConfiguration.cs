using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexora.Domain.Sync;

namespace Nexora.Infrastructure.Persistence.Configurations;

public class SyncOutboxEventConfiguration : IEntityTypeConfiguration<SyncOutboxEvent>
{
    public void Configure(EntityTypeBuilder<SyncOutboxEvent> builder)
    {
        builder.ToTable("sync_outbox");
        builder.Property(e => e.AggregateType).HasMaxLength(128).IsRequired();
        builder.Property(e => e.EventType).HasConversion<string>().HasMaxLength(16);
        builder.Property(e => e.Status).HasConversion<string>().HasMaxLength(16);
        builder.Property(e => e.Payload).HasColumnType("text");

        // The Sync Worker's core query: "give me pending events for this org,
        // oldest first" - and idempotency-key lookups for retry handling.
        builder.HasIndex(e => new { e.OrganizationId, e.Status, e.CreatedAt });
        builder.HasIndex(e => e.IdempotencyKey).IsUnique();

        builder.UseXminAsConcurrencyToken();
    }
}

public class SyncInboxEventConfiguration : IEntityTypeConfiguration<SyncInboxEvent>
{
    public void Configure(EntityTypeBuilder<SyncInboxEvent> builder)
    {
        builder.ToTable("sync_inbox");
        builder.Property(e => e.AggregateType).HasMaxLength(128).IsRequired();
        builder.Property(e => e.EventType).HasConversion<string>().HasMaxLength(16);
        builder.Property(e => e.Status).HasConversion<string>().HasMaxLength(16);
        builder.Property(e => e.Payload).HasColumnType("text");

        // The uniqueness constraint that makes retried deliveries safe -
        // see ReceiveSyncEventsCommand.
        builder.HasIndex(e => e.IdempotencyKey).IsUnique();
        builder.HasIndex(e => new { e.OrganizationId, e.ReceivedAt });

        builder.UseXminAsConcurrencyToken();
    }
}

public class SyncConflictConfiguration : IEntityTypeConfiguration<SyncConflict>
{
    public void Configure(EntityTypeBuilder<SyncConflict> builder)
    {
        builder.ToTable("sync_conflicts");
        builder.Property(c => c.AggregateType).HasMaxLength(128).IsRequired();
        builder.Property(c => c.Reason).HasMaxLength(256).IsRequired();
        builder.Property(c => c.Status).HasConversion<string>().HasMaxLength(32);
        builder.Property(c => c.ExistingPayload).HasColumnType("text");
        builder.Property(c => c.IncomingPayload).HasColumnType("text");

        // Powers the Sync Center's "open conflicts" count and list.
        builder.HasIndex(c => new { c.OrganizationId, c.Status });

        builder.UseXminAsConcurrencyToken();
    }
}

public class SyncCheckpointConfiguration : IEntityTypeConfiguration<SyncCheckpoint>
{
    public void Configure(EntityTypeBuilder<SyncCheckpoint> builder)
    {
        builder.ToTable("sync_checkpoints");

        // Exactly one checkpoint per (node, aggregate) - ReceiveSyncEventsCommand
        // depends on this to safely find-or-create, same pattern as
        // InventoryItem's unique (ProductId, WarehouseId) index.
        builder.HasIndex(c => new { c.NodeId, c.AggregateType, c.AggregateId }).IsUnique();

        builder.UseXminAsConcurrencyToken();
    }
}

public class NodeRegistrationConfiguration : IEntityTypeConfiguration<NodeRegistration>
{
    public void Configure(EntityTypeBuilder<NodeRegistration> builder)
    {
        builder.ToTable("node_registrations");
        builder.Property(n => n.Name).HasMaxLength(128).IsRequired();
        builder.Property(n => n.NodeSecretHash).IsRequired();

        builder.HasIndex(n => new { n.OrganizationId, n.Name }).IsUnique();

        builder.UseXminAsConcurrencyToken();
    }
}
