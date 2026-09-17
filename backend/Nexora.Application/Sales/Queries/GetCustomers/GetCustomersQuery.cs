using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Common.Interfaces;
using Nexora.Application.Common.Models;

namespace Nexora.Application.Sales.Queries.GetCustomers;

public record GetCustomersQuery(string? Search, int Page = 1, int PageSize = 25)
    : IRequest<PagedResult<CustomerListItemDto>>;

public record CustomerListItemDto(Guid Id, string Name, string? Email, string? Phone, bool IsActive);

public class GetCustomersQueryHandler : IRequestHandler<GetCustomersQuery, PagedResult<CustomerListItemDto>>
{
    private readonly IApplicationDbContext _db;

    public GetCustomersQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<PagedResult<CustomerListItemDto>> Handle(GetCustomersQuery request, CancellationToken cancellationToken)
    {
        var query = _db.Customers.AsNoTracking().Where(c => c.IsActive);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim().ToLower();
            query = query.Where(c => c.Name.ToLower().Contains(term)
                || (c.Email != null && c.Email.ToLower().Contains(term)));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(c => c.Name)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(c => new CustomerListItemDto(c.Id, c.Name, c.Email, c.Phone, c.IsActive))
            .ToListAsync(cancellationToken);

        return new PagedResult<CustomerListItemDto>(items, totalCount, request.Page, request.PageSize);
    }
}
