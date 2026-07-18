import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: ReactNode;
  label: string;
}

const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { className = "", error, icon, id, label, ...props },
  ref,
) {
  return (
    <div className="space-y-2">
      <label
        className="block font-body text-xs font-black uppercase text-neutral-600 dark:text-orange-100/80"
        htmlFor={id}
      >
        {label}
      </label>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 text-brand-orange">
            {icon}
          </span>
        ) : null}
        <input
          aria-invalid={Boolean(error)}
          className={[
            "min-h-12 w-full rounded-panel border border-neutral-300 border-l-4 border-l-brand-orange bg-white px-4 py-3 font-body text-base font-bold text-brand-ink outline-none transition placeholder:text-brand-muted focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/20 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-600 dark:bg-brand-field",
            icon ? "pl-12" : "",
            className,
          ].join(" ")}
          id={id}
          ref={ref}
          {...props}
        />
      </div>
      {error ? (
        <p className="font-body text-sm font-semibold text-red-700 dark:text-red-200">{error}</p>
      ) : null}
    </div>
  );
});

export default TextInput;
