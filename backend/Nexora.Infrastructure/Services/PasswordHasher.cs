using Microsoft.AspNetCore.Identity;
using Nexora.Application.Common.Interfaces;
using Nexora.Domain.Identity;

namespace Nexora.Infrastructure.Services;

/// <summary>
/// Wraps ASP.NET Core Identity's battle-tested PBKDF2 hasher rather than
/// hand-rolling one. The generic type parameter is unused functionally,
/// just satisfying Identity's API shape.
/// </summary>
public class PasswordHasher : IPasswordHasher
{
    private readonly PasswordHasher<User> _inner = new();

    public string Hash(string password) => _inner.HashPassword(null!, password);

    public bool Verify(string password, string hash)
    {
        var result = _inner.VerifyHashedPassword(null!, hash, password);
        return result is PasswordVerificationResult.Success or PasswordVerificationResult.SuccessRehashNeeded;
    }
}
