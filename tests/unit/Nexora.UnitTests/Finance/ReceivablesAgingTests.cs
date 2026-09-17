using FluentAssertions;
using Nexora.Application.Finance.Queries.GetReceivablesAging;
using Nexora.Domain.Identity;
using Nexora.Domain.Sales;
using Nexora.UnitTests.TestDoubles;
using Xunit;

namespace Nexora.UnitTests.Finance;

public class ReceivablesAgingTests
{
    [Fact]
    public async Task Invoices_AreBucketedByDaysOverdue_AndPaidInvoicesAreExcluded()
    {
        var tenantContext = new FakeTenantContext();
        var currentUser = new FakeCurrentUserService();
        await using var db = TestDbContextFactory.Create(tenantContext, currentUser);

        var org = new Organization { Name = "Acme", Slug = "acme" };
        db.Organizations.Add(org);
        var customer = new Customer { OrganizationId = org.Id, Name = "ABC Traders" };
        db.Customers.Add(customer);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        db.Invoices.Add(new Invoice // not yet due - Current
        {
            OrganizationId = org.Id, Number = "INV-CURRENT", CustomerId = customer.Id, SalesOrderId = Guid.NewGuid(),
            Total = 100, DueDate = today.AddDays(10), Status = InvoiceStatus.Unpaid,
        });
        db.Invoices.Add(new Invoice // 45 days overdue - 31-60 bucket
        {
            OrganizationId = org.Id, Number = "INV-45", CustomerId = customer.Id, SalesOrderId = Guid.NewGuid(),
            Total = 200, DueDate = today.AddDays(-45), Status = InvoiceStatus.Unpaid,
        });
        db.Invoices.Add(new Invoice // fully paid - must be excluded entirely
        {
            OrganizationId = org.Id, Number = "INV-PAID", CustomerId = customer.Id, SalesOrderId = Guid.NewGuid(),
            Total = 300, AmountPaid = 300, DueDate = today.AddDays(-100), Status = InvoiceStatus.Paid,
        });

        await db.SaveChangesAsync();
        tenantContext.Set(org.Id, null);

        var handler = new GetReceivablesAgingQueryHandler(db);
        var result = await handler.Handle(new GetReceivablesAgingQuery(), default);

        result.Lines.Should().HaveCount(2); // paid invoice excluded
        result.Totals.Current.Should().Be(100);
        result.Totals.Days31To60.Should().Be(200);
        result.Totals.Days90Plus.Should().Be(0);
    }
}
