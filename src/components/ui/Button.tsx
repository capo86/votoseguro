import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  isLoading?: boolean;
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-orange text-brand-ink shadow-action hover:bg-orange-400 focus-visible:outline-brand-orange",
  secondary:
    "border border-neutral-200 bg-white text-brand-ink shadow-sm hover:border-brand-orange hover:text-brand-orange focus-visible:outline-brand-orange dark:border-brand-line dark:bg-white/[0.08] dark:text-white",
  ghost:
    "text-brand-ink hover:bg-neutral-100 focus-visible:outline-brand-orange dark:text-brand-field dark:hover:bg-white/[0.08]",
};

function Button({
  children,
  className = "",
  disabled,
  icon,
  isLoading = false,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-panel px-5 py-3 font-body text-sm font-black uppercase transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-55",
        variantClasses[variant],
        className,
      ].join(" ")}
      disabled={disabled || isLoading}
      type={type}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

export default Button;
