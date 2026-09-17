using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Common.Interfaces;
using Nexora.Domain.Sync;

namespace Nexora.Application.Sync.Commands.RegisterNode;

public record RegisterNodeCommand(string Name) : IRequest<RegisterNodeResult>;

public record RegisterNodeResult(Guid NodeId, string NodeSecret);

public class RegisterNodeCommandValidator : AbstractValidator<RegisterNodeCommand>
{
    public RegisterNodeCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(128);
    }
}

// Mirrors RegisterCommand's shape: the raw secret is generated here and
// returned exactly once. Only its hash is persisted - see
// SyncController.AuthenticateNodeAsync for how it's verified later.
public class RegisterNodeCommandHandler : IRequestHandler<RegisterNodeCommand, RegisterNodeResult>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IPasswordHasher _passwordHasher;

    public RegisterNodeCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser, IPasswordHasher passwordHasher)
    {
        _db = db;
        _currentUser = currentUser;
        _passwordHasher = passwordHasher;
    }

    public async Task<RegisterNodeResult> Handle(RegisterNodeCommand request, CancellationToken cancellationToken)
    {
        var organizationId = _currentUser.OrganizationId
            ?? throw new InvalidOperationException("No organization context on the current request.");

        var nameTaken = await _db.NodeRegistrations
            .AnyAsync(n => n.Name == request.Name, cancellationToken);
        if (nameTaken)
            throw new InvalidOperationException($"A node named '{request.Name}' is already registered for this organization.");

        var rawSecret = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32));

        var node = new NodeRegistration
        {
            OrganizationId = organizationId,
            Name = request.Name,
            NodeSecretHash = _passwordHasher.Hash(rawSecret),
        };

        _db.NodeRegistrations.Add(node);
        await _db.SaveChangesAsync(cancellationToken);

        return new RegisterNodeResult(node.Id, rawSecret);
    }
}
