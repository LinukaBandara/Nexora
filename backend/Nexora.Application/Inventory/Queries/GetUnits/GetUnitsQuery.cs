using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Common.Interfaces;

namespace Nexora.Application.Inventory.Queries.GetUnits;

public record GetUnitsQuery : IRequest<IReadOnlyCollection<UnitDto>>;

public record UnitDto(Guid Id, string Name, string Abbreviation);

public class GetUnitsQueryHandler : IRequestHandler<GetUnitsQuery, IReadOnlyCollection<UnitDto>>
{
    private readonly IApplicationDbContext _db;

    public GetUnitsQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<IReadOnlyCollection<UnitDto>> Handle(GetUnitsQuery request, CancellationToken cancellationToken)
    {
        return await _db.Units.AsNoTracking()
            .OrderBy(u => u.Name)
            .Select(u => new UnitDto(u.Id, u.Name, u.Abbreviation))
            .ToListAsync(cancellationToken);
    }
}
