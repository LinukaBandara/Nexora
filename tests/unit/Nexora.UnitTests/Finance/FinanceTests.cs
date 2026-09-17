using FluentAssertions;
using Nexora.Application.Finance.Commands.RecordExpense;
using Nexora.Application.Finance.Queries.GetFinancialSummary;
using Nexora.Domain.Finance;
using Nexora.Domain.Identity;
using Nexora.Domain.Purchasing;
using Nexora.Domain.Sales;
using Nexora.UnitTests.TestDoubles;
using Xunit;

namespace Nexora.UnitTests.Finance;

public class FinanceTests
{
    [Fact]
    public async Task RecordExpense_AgainstSupplierInvoice_UpdatesInvoicePaidAmountAndStatus()
    {
        var tenantContext = new FakeTenantContext();
        var currentUser = new FakeCurrentUserService();
        await using var db = TestDbContextFactory.Create(tenantContext, currentUser);

        var org = new Organization { Name = "Acme", Slug = "acme" };
        db.Organizations.Add(org);
        var account = new Account { OrganizationId = org.Id, Name = "Operating Expenses", Type = AccountType.Expense };
        db.Accounts.Add(account);
        var supplierInvoice = new SupplierInvoice
        {
            OrganizationId = org.Id, Number = "SUP-INV-1", PurchaseOrderId = Guid.NewGuid(),
            SupplierId = Guid.NewGuid(), Total = 1000,
        };
        db.SupplierInvoices.Add(supplierInvoice);
        await db.SaveChangesAsync();
        tenantContext.Set(org.Id, null);
        currentUser.OrganizationId = org.Id;

        var handler = new RecordExpenseCommandHandler(db, currentUser);
        await handler.Handle(
            new RecordExpenseCommand(account.Id, 1000, "Paid supplier invoice SUP-INV-1", null, supplierInvoice.Id),
            default);

        var updated = db.SupplierInvoices.Single();
        updated.AmountPaid.Should().Be(1000);
        updated.Status.Should().Be(SupplierInvoiceStatus.Paid);
    }

    [Fact]
    public async Task GetFinancialSummary_CombinesStandaloneIncomeAndSalesPayments_MinusExpenses()
    {
        var tenantContext = new FakeTenantContext();
        var currentUser = new FakeCurrentUserService();
        await using var db = TestDbContextFactory.Create(tenantContext, currentUser);

        var org = new Organization { Name = "Acme", Slug = "acme" };
        db.Organizations.Add(org);
        var account = new Account { OrganizationId = org.Id, Name = "General", Type = AccountType.Income };
        db.Accounts.Add(account);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // Standalone income (e.g. a grant, an asset sale)
        db.Incomes.Add(new Income { OrganizationId = org.Id, AccountId = account.Id, Amount = 5000, Description = "Misc income", IncomeDate = today });

        // A sales payment - counted as income even though it's a Sales-owned record.
        var invoice = new Invoice { OrganizationId = org.Id, Number = "INV-1", CustomerId = Guid.NewGuid(), SalesOrderId = Guid.NewGuid(), Total = 2000 };
        db.Invoices.Add(invoice);
        db.Payments.Add(new Payment { OrganizationId = org.Id, InvoiceId = invoice.Id, Amount = 2000, Method = PaymentMethod.Cash });

        // An expense.
        var expenseAccount = new Account { OrganizationId = org.Id, Name = "Rent", Type = AccountType.Expense };
        db.Accounts.Add(expenseAccount);
        db.Expenses.Add(new Expense { OrganizationId = org.Id, AccountId = expenseAccount.Id, Amount = 3000, Description = "Rent", ExpenseDate = today });

        await db.SaveChangesAsync();
        tenantContext.Set(org.Id, null);

        var handler = new GetFinancialSummaryQueryHandler(db);
        var summary = await handler.Handle(new GetFinancialSummaryQuery(today, today), default);

        summary.Income.Should().Be(7000); // 5000 standalone + 2000 sales payment
        summary.Expenses.Should().Be(3000);
        summary.NetCashFlow.Should().Be(4000);
    }

    [Fact]
    public async Task GetFinancialSummary_Receivables_ExcludesFullyPaidInvoices()
    {
        var tenantContext = new FakeTenantContext();
        var currentUser = new FakeCurrentUserService();
        await using var db = TestDbContextFactory.Create(tenantContext, currentUser);

        var org = new Organization { Name = "Acme", Slug = "acme" };
        db.Organizations.Add(org);

        db.Invoices.Add(new Invoice
        {
            OrganizationId = org.Id, Number = "INV-PAID", CustomerId = Guid.NewGuid(), SalesOrderId = Guid.NewGuid(),
            Total = 1000, AmountPaid = 1000, Status = InvoiceStatus.Paid,
        });
        db.Invoices.Add(new Invoice
        {
            OrganizationId = org.Id, Number = "INV-UNPAID", CustomerId = Guid.NewGuid(), SalesOrderId = Guid.NewGuid(),
            Total = 1000, AmountPaid = 400, Status = InvoiceStatus.PartiallyPaid,
        });
        await db.SaveChangesAsync();
        tenantContext.Set(org.Id, null);

        var handler = new GetFinancialSummaryQueryHandler(db);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var summary = await handler.Handle(new GetFinancialSummaryQuery(today, today), default);

        summary.Receivables.Should().Be(600); // only the unpaid invoice's remaining balance
    }
}
