using Nexora.Domain.Common;

namespace Nexora.Domain.Purchasing;

public class Supplier : TenantEntity
{
    public string Name { get; set; } = default!;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }

    public int DefaultPaymentTermDays { get; set; } = 30;
    public bool IsActive { get; set; } = true;
}
