namespace Nexora.Domain.Common;

// Implemented by financial/commercial documents that must never be
// silently mutated once they reach a terminal status (Paid, Cancelled,
// fully Invoiced/Received). Enforced by FinancialImmutabilityInterceptor,
// not by convention - see docs/document-lifecycle.md.
public interface IFinalizableDocument
{
    bool IsTerminalStatus(object status);
}
