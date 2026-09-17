using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Common.Interfaces;
using Nexora.Domain.Identity;

namespace Nexora.Application.Auth.Commands.Register;

/// <summary>
/// Registers a brand-new Organization together with its first user, who is
/// automatically granted the OrgAdmin role. This is the only auth flow that
/// runs without an existing tenant context, since it's what creates the tenant.
/// </summary>
public record RegisterCommand(
    string OrganizationName,
    string FullName,
    string Email,
    string Password) : IRequest<RegisterResult>;

public record RegisterResult(Guid OrganizationId, Guid UserId, TokenPair Tokens);

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, RegisterResult>
{
    private readonly IApplicationDbContext _db;
    private readonly IJwtTokenService _tokenService;
    private readonly IPasswordHasher _passwordHasher;

    public RegisterCommandHandler(
        IApplicationDbContext db,
        IJwtTokenService tokenService,
        IPasswordHasher passwordHasher)
    {
        _db = db;
        _tokenService = tokenService;
        _passwordHasher = passwordHasher;
    }

    public async Task<RegisterResult> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        var emailExists = await _db.Users
            .IgnoreQueryFilters() // email uniqueness must be checked across all orgs' users
            .AnyAsync(u => u.Email == request.Email.ToLowerInvariant(), cancellationToken);

        if (emailExists)
            throw new InvalidOperationException("An account with this email already exists.");

        var organization = new Organization
        {
            Name = request.OrganizationName,
            Slug = SlugGenerator.FromName(request.OrganizationName),
            PlanTier = "starter",
        };
        _db.Organizations.Add(organization);

        var headOffice = new Branch
        {
            OrganizationId = organization.Id,
            Name = "Head Office",
            IsHeadOffice = true,
        };
        _db.Branches.Add(headOffice);

        var orgAdminRole = new Role
        {
            OrganizationId = organization.Id,
            Name = "Organization Admin",
            IsSystemRole = true,
        };
        _db.Roles.Add(orgAdminRole);

        // Grant every permission to the seeded OrgAdmin role.
        var allPermissions = await _db.Permissions.ToListAsync(cancellationToken);
        foreach (var permission in allPermissions)
        {
            _db.RolePermissions.Add(new RolePermission
            {
                RoleId = orgAdminRole.Id,
                PermissionId = permission.Id,
            });
        }

        var user = new User
        {
            OrganizationId = organization.Id,
            BranchId = headOffice.Id,
            Email = request.Email.ToLowerInvariant(),
            FullName = request.FullName,
            PasswordHash = _passwordHasher.Hash(request.Password),
            EmailConfirmed = false,
        };
        _db.Users.Add(user);

        _db.UserRoles.Add(new UserRole
        {
            OrganizationId = organization.Id,
            UserId = user.Id,
            RoleId = orgAdminRole.Id,
        });

        await _db.SaveChangesAsync(cancellationToken);

        var accessToken = _tokenService.CreateAccessToken(user, allPermissions.Select(p => p.Code));
        var (rawRefresh, refreshHash) = _tokenService.CreateRefreshToken();

        _db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            TokenHash = refreshHash,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(30),
        });
        await _db.SaveChangesAsync(cancellationToken);

        return new RegisterResult(
            organization.Id,
            user.Id,
            new TokenPair(accessToken, rawRefresh, DateTimeOffset.UtcNow.AddMinutes(15)));
    }
}

internal static class SlugGenerator
{
    public static string FromName(string name)
    {
        var slug = name.Trim().ToLowerInvariant().Replace(" ", "-");
        var suffix = Guid.NewGuid().ToString("N")[..6];
        return $"{slug}-{suffix}";
    }
}
