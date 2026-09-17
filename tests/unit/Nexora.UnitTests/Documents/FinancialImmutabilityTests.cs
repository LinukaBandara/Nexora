using FluentAssertions;
using Nexora.Domain.Identity;
using Nexora.Domain.Sales;
using Nexora.UnitTests.TestDoubles;
using Xunit;

namespace Nexora.UnitTests.Documents;

public class FinancialImmutabilityTests
{
    [Fact]
    public async Task ModifyingAPaidInvoice_Throws()
    {
        var tenantContext = new FakeTenantContext();
        var currentUser = new FakeCurrentUserService();
        await using var db = TestDbContextFactory.Create(tenantContext, currentUser);

        var org = new Organization { Name = "Acme", Slug = "acme" };
        db.Organizations.Add(org);
        var invoice = new Invoice
        {
            OrganizationId = org.Id, Number = "INV-1", CustomerId = Guid.NewGuid(),
            SalesOrderId = Guid.NewGuid(), Total = 500, AmountPaid = 500, Status = InvoiceStatus.Paid,
        };
        db.Invoices.Add(invoice);
        await db.SaveChangesAsync();

        invoice.Total = 999; // attempting to rewrite history on an already-paid invoice
        var act = () => db.SaveChangesAsync();

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*already finalized*");
    }

    [Fact]
    public async Task TransitioningIntoPaid_IsAllowed()
    {
        var tenantContext = new FakeTenantContext();
        var currentUser = new FakeCurrentUserService();
        await using var db = TestDbContextFactory.Create(tenantContext, currentUser);

        var org = new Organization { Name = "Acme", Slug = "acme" };
        db.Organizations.Add(org);
        var invoice = new Invoice
        {
            OrganizationId = org.Id, Number = "INV-1", CustomerId = Guid.NewGuid(),
            SalesOrderId = Guid.NewGuid(), Total = 500, Status = InvoiceStatus.Unpaid,
        };
        db.Invoices.Add(invoice);
        await db.SaveChangesAsync();

        // The legitimate transition INTO Paid must still work.
        invoice.AmountPaid = 500;
        invoice.Status = InvoiceStatus.Paid;
        var act = () => db.SaveChangesAsync();

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task ModifyingACancelledSalesOrder_Throws()
    {
        var tenantContext = new FakeTenantContext();
        var currentUser = new FakeCurrentUserService();
        await using var db = TestDbContextFactory.Create(tenantContext, currentUser);

        var org = new Organization { Name = "Acme", Slug = "acme" };
        db.Organizations.Add(org);
        var order = new SalesOrder
        {
            OrganizationId = org.Id, Number = "SO-1", CustomerId = Guid.NewGuid(),
            WarehouseId = Guid.NewGuid(), Status = SalesOrderStatus.Cancelled,
        };
        db.SalesOrders.Add(order);
        await db.SaveChangesAsync();

        order.Notes = "trying to sneak in a change";
        var act = () => db.SaveChangesAsync();

        await act.Should().ThrowAsync<InvalidOperationException>();
    }
}
