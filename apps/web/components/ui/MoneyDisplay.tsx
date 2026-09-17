// Single formatting rule for money across the whole app - see the
// commercial spec section 75 ("make currency configurable... do not
// hardcode currency throughout the application"). Currently hardcoded to
// LKR because no organization-level currency setting exists on the
// backend yet (see docs/audit/phase1-audit.md, "currency is hardcoded
// implicitly") - this component is the one place that will need to
// change once that setting exists, not every screen that displays money.
const CURRENCY_FORMATTER = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  currencyDisplay: "code",
  minimumFractionDigits: 2,
});

export function MoneyDisplay({ amount }: { amount: number }) {
  return <span className="tabular-nums">{CURRENCY_FORMATTER.format(amount)}</span>;
}
