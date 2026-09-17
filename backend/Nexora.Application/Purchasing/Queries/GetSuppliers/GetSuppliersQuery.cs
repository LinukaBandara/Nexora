using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Common.Interfaces;
using Nexora.Application.Common.Models;

namespace Nexora.Application.Purchasing.Queries.GetSuppliers;

public record GetSuppliersQuery(string? Search, int Page = 1, int PageSize = 25)
    : IRequest<PagedResult<SupplierListItemDto>>;

public record SupplierListItemDto(Guid Id, string Name, string? Email, string? Phone, bool IsActive);

public class GetSuppliersQueryHandler : IRequestHandler<GetSuppliersQuery, PagedResult<SupplierListItemDto>>
{
    private readonly IApplicationDbContext _db;

    public GetSuppliersQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<PagedResult<SupplierListItemDto>> Handle(GetSuppliersQuery request, CancellationToken cancellationToken)
    {
        var query = _db.Suppliers.AsNoTracking().Where(s => s.IsActive);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim().ToLower();
            query = query.Where(s => s.Name.ToLower().Contains(term));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(s => s.Name)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(s => new SupplierListItemDto(s.Id, s.Name, s.Email, s.Phone, s.IsActive))
            .ToListAsync(cancellationToken);

        return new PagedResult<SupplierListItemDto>(items, totalCount, request.Page, request.PageSize);
    }
}
