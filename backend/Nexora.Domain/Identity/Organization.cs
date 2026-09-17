using Nexora.Domain.Common;

namespace Nexora.Domain.Identity;

/// <summary>
/// The tenant root. Every TenantEntity in the system carries an
/// OrganizationId back to one of these. Deliberately does not hard-code
/// any region: currency, tax rules and locale live in OrganizationSettings
/// (key/value) rather than as columns here, so regional behaviour stays
/// configuration rather than code.
/// </summary>
public class Organization : BaseEntity
{
    public string Name { get; set; } = default!;
    public string Slug { get; set; } = default!;

    public string PlanTier { get; set; } = "starter"; // starter | business | enterprise
    public bool IsActive { get; set; } = true;

    public ICollection<Branch> Branches { get; set; } = new List<Branch>();
    public ICollection<OrganizationSetting> Settings { get; set; } = new List<OrganizationSetting>();
}

public class Branch : TenantEntity
{
    public string Name { get; set; } = default!;
    public string? Code { get; set; }
    public bool IsHeadOffice { get; set; }
    public bool IsActive { get; set; } = true;
}

/// <summary>
/// Free-form per-organization configuration (currency, tax rules,
/// locale, feature flags tied to PlanTier). Keeping this key/value
/// rather than typed columns is what keeps regional/plan logic out
/// of the core schema.
/// </summary>
public class OrganizationSetting : TenantEntity
{
    public string Key { get; set; } = default!;
    public string Value { get; set; } = default!;
}
