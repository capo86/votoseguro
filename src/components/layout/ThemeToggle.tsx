import { Moon, Sun } from "lucide-react";
import type { Theme } from "../../types/theme";

interface ThemeToggleProps {
  onToggle: () => void;
  theme: Theme;
}

function ThemeToggle({ onToggle, theme }: ThemeToggleProps) {
  const isDark = theme === "dark";

  return (
    <button
      aria-checked={isDark}
      aria-label={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      className="group inline-flex min-h-11 items-center gap-2 rounded-panel border border-neutral-200 bg-white px-2 py-2 text-brand-ink shadow-sm transition hover:border-brand-orange focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange dark:border-brand-line dark:bg-white/5 dark:text-white"
      onClick={onToggle}
      role="switch"
      type="button"
    >
      <span
        className={[
          "grid h-7 w-7 place-items-center rounded-md transition",
          isDark ? "bg-transparent text-orange-100/70" : "bg-brand-orange text-brand-ink",
        ].join(" ")}
      >
        <Sun aria-hidden="true" size={16} strokeWidth={2.6} />
      </span>
      <span
        className={[
          "grid h-7 w-7 place-items-center rounded-md transition",
          isDark ? "bg-brand-orange text-brand-ink" : "bg-transparent text-neutral-500",
        ].join(" ")}
      >
        <Moon aria-hidden="true" size={16} strokeWidth={2.6} />
      </span>
    </button>
  );
}

export default ThemeToggle;
