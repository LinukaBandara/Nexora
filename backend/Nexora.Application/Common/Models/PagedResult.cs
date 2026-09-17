namespace Nexora.Application.Common.Models;

public record PagedResult<T>(IReadOnlyCollection<T> Items, int TotalCount, int Page, int PageSize);
