using Nexora.Domain.Common;

namespace Nexora.Domain.Inventory;

public class Warehouse : TenantEntity
{
    public string Name { get; set; } = default!;
    public string? Code { get; set; }
    public string? Address { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<WarehouseLocation> Locations { get; set; } = new List<WarehouseLocation>();
}

/// <summary>A bin/aisle/shelf within a warehouse. Optional granularity - most
/// small businesses will only ever use one location per warehouse (a default
/// "Main" location created alongside the warehouse), but the model supports
/// finer-grained picking locations for businesses that want it.</summary>
public class WarehouseLocation : TenantEntity
{
    public Guid WarehouseId { get; set; }
    public Warehouse? Warehouse { get; set; }

    public string Name { get; set; } = default!;
}
