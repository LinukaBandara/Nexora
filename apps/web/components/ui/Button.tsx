import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover hover:shadow-glow-sm",
  secondary: "bg-surface border border-border text-text-primary hover:bg-surface-secondary",
  ghost: "bg-transparent text-text-secondary hover:bg-surface-secondary",
  danger: "bg-danger text-white hover:opacity-90",
};

// One button component, used everywhere - see docs/design/design-system.md
// section "Component inventory": a button must be pixel-identical in
// every module, never redeclared per-screen. The hover glow on primary
// and the slight press-down on active are the "feels premium" details -
// subtle, not flashy, per design-system.md's motion guidance.
export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center gap-2 rounded-button px-4 py-2 text-body font-medium transition-all duration-base active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
