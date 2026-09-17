using Nexora.Domain.Common;

namespace Nexora.Domain.Identity;

public class User : TenantEntity
{
    public string Email { get; set; } = default!;
    public string PasswordHash { get; set; } = default!;
    public string FullName { get; set; } = default!;

    public bool IsActive { get; set; } = true;
    public bool EmailConfirmed { get; set; }

    // MFA-ready from day one, even though the MFA UI ships later.
    public bool MfaEnabled { get; set; }
    public string? MfaSecret { get; set; }

    // Account lockout / brute-force protection.
    public int AccessFailedCount { get; set; }
    public DateTimeOffset? LockoutEnd { get; set; }
    public bool IsLockedOut => LockoutEnd.HasValue && LockoutEnd > DateTimeOffset.UtcNow;

    public DateTimeOffset? LastLoginAt { get; set; }

    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}

public class RefreshToken : BaseEntity
{
    public Guid UserId { get; set; }
    public User? User { get; set; }

    /// <summary>Stored as a hash - the raw token is only ever returned to the client once.</summary>
    public string TokenHash { get; set; } = default!;

    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset? RevokedAt { get; set; }
    public Guid? ReplacedByTokenId { get; set; }

    public bool IsActive => RevokedAt is null && ExpiresAt > DateTimeOffset.UtcNow;
}
