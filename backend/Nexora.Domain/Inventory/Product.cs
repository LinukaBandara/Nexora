using Nexora.Domain.Common;

namespace Nexora.Domain.Inventory;

public class ProductCategory : TenantEntity
{
    public string Name { get; set; } = default!;
    public Guid? ParentCategoryId { get; set; }
}

/// <summary>Unit of measure - "pcs", "kg", "box of 12", etc. Kept simple (no
/// conversion-factor graph) for Phase 2; multi-unit conversion is a Phase 2+
/// refinement once real usage shows it's needed.</summary>
public class Unit : TenantEntity
{
    public string Name { get; set; } = default!;
    public string Abbreviation { get; set; } = default!;
}

public class Product : TenantEntity, ISyncableAggregate
{
    public string Sku { get; set; } = default!;
    public string Name { get; set; } = default!;
    public string? Description { get; set; }

    public Guid CategoryId { get; set; }
    public ProductCategory? Category { get; set; }

    public Guid UnitId { get; set; }
    public Unit? Unit { get; set; }

    /// <summary>Default cost used for inventory valuation until batch/lot costing exists.</summary>
    public decimal CostPrice { get; set; }
    public decimal SellingPrice { get; set; }

    /// <summary>Triggers a low-stock notification/dashboard alert when total on-hand falls at or below this.</summary>
    public int ReorderLevel { get; set; }

    public bool IsActive { get; set; } = true;

    // ISyncableAggregate - product master data is a "last write wins by
    // version" conflict type (see Phase 0 doc, section 8) when synced
    // between a local node and the cloud.
    public Guid AggregateId => Id;
    public string AggregateType => nameof(Product);
    public int Version { get; set; }
}
