namespace Nexora.Domain.Common;

/// <summary>
/// Base type for every entity in the system. Provides identity, soft-delete,
/// audit timestamps and optimistic concurrency.
/// </summary>
public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public DateTimeOffset CreatedAt { get; set; }
    public Guid? CreatedBy { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }

    public DateTimeOffset? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }
    public bool IsDeleted => DeletedAt.HasValue;

    /// <summary>
    /// Optimistic concurrency token. Mapped to a PostgreSQL "xmin" system column
    /// via EF Core configuration - never set manually.
    /// </summary>
    public uint RowVersion { get; set; }

    private readonly List<IDomainEvent> _domainEvents = new();
    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    protected void AddDomainEvent(IDomainEvent domainEvent) => _domainEvents.Add(domainEvent);
    public void ClearDomainEvents() => _domainEvents.Clear();
}

/// <summary>
/// Base type for every entity that belongs to a tenant (Organization).
/// EF Core applies a global query filter on OrganizationId for every
/// type deriving from this - individual repositories/handlers never need
/// to remember to scope a query by tenant themselves.
/// </summary>
public abstract class TenantEntity : BaseEntity
{
    public Guid OrganizationId { get; set; }
    public Guid? BranchId { get; set; }
}
