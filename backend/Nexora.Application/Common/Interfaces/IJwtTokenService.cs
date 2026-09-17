using Nexora.Domain.Identity;

namespace Nexora.Application.Common.Interfaces;

public record TokenPair(string AccessToken, string RefreshToken, DateTimeOffset AccessTokenExpiresAt);

public interface IJwtTokenService
{
    /// <summary>Issues a short-lived access token embedding user id, org id, branch id and permission claims.</summary>
    string CreateAccessToken(User user, IEnumerable<string> permissionCodes);

    /// <summary>Generates a cryptographically random refresh token. The raw value is returned once;
    /// only its hash is persisted (see RefreshToken.TokenHash).</summary>
    (string RawToken, string Hash) CreateRefreshToken();

    string Hash(string rawToken);
}
