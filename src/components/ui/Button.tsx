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
    "border border-brand-line bg-white/8 text-white hover:border-brand-orange hover:text-brand-orange focus-visible:outline-brand-orange",
  ghost: "text-brand-field hover:bg-white/8 focus-visible:outline-brand-orange",
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
