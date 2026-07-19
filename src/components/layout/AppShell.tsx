import {
  BarChart3,
  LogOut,
  Menu,
  PanelLeftClose,
  UserCog,
  UserRound,
  UsersRound,
  Vote,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import type { ReactNode } from "react";
import type { AppSection } from "../../types/navigation";
import type { Theme } from "../../types/theme";
import type { UserProfile } from "../../types/userProfile";
import ThemeToggle from "./ThemeToggle";

interface AppShellProps {
  activeSection: AppSection;
  children: ReactNode;
  logoUrl: string;
  onNavigate: (section: AppSection) => void;
  onSignOut: () => void;
  onToggleMenu: () => void;
  onToggleTheme: () => void;
  isMenuOpen: boolean;
  onCloseMenu: () => void;
  profile: UserProfile | null;
  theme: Theme;
  user: User | null;
}

const navItems = [
  {
    id: "padron",
    label: "Padron",
    icon: BarChart3,
  },
  {
    id: "votoseguro",
    label: "Voto Seguro",
    icon: Vote,
  },
  {
    id: "candidatos",
    label: "Candidatos",
    icon: UsersRound,
  },
  {
    adminOnly: true,
    id: "usuarios",
    label: "Usuarios",
    icon: UserCog,
  },
] satisfies Array<{
  adminOnly?: boolean;
  id: AppSection;
  label: string;
  icon: typeof BarChart3;
}>;

function AppShell({
  activeSection,
  children,
  isMenuOpen,
  logoUrl,
  onCloseMenu,
  onNavigate,
  onSignOut,
  onToggleMenu,
  onToggleTheme,
  profile,
  theme,
  user,
}: AppShellProps) {
  const isAdmin = profile?.role === "admin";
  const userLabel = profile?.nombreApellido ?? "Usuario activo";
  const roleLabel = profile?.role === "admin" ? "Admin" : "Referente";
  const visibleNavItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-neutral-200 p-4 dark:border-brand-line">
        <div className="flex min-w-0 items-center gap-3">
          <img
            alt="PPC"
            className="h-12 w-12 rounded-panel bg-white object-contain p-1 ring-2 ring-brand-orange"
            src={logoUrl}
          />
          <div className="min-w-0">
            <p className="truncate font-body text-xs font-black uppercase text-brand-orange">
              VotoSeguro
            </p>
            <p className="truncate font-display text-xl text-brand-ink dark:text-white">
              PPC
            </p>
          </div>
        </div>
        <button
          aria-label="Cerrar menu"
          className="grid min-h-10 w-10 place-items-center rounded-panel border border-neutral-200 bg-white text-brand-ink transition hover:border-brand-orange focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange dark:border-brand-line dark:bg-white/5 dark:text-white lg:hidden"
          onClick={onCloseMenu}
          type="button"
        >
          <PanelLeftClose aria-hidden="true" size={19} strokeWidth={2.8} />
        </button>
      </div>

      <nav aria-label="Navegacion principal" className="grid gap-2 p-3">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              className={[
                "flex min-h-12 items-center gap-3 rounded-panel border px-3 py-2 text-left font-body text-sm font-black uppercase transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange",
                isActive
                  ? "border-brand-orange bg-brand-orange text-brand-ink shadow-action"
                  : "border-transparent text-neutral-700 hover:border-brand-orange hover:bg-white dark:text-orange-50/75 dark:hover:bg-white/[0.08]",
              ].join(" ")}
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                onCloseMenu();
              }}
              type="button"
            >
              <Icon aria-hidden="true" size={19} strokeWidth={2.8} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-neutral-200 p-4 dark:border-brand-line">
        <div className="mb-3 flex items-center gap-3 rounded-panel border border-neutral-200 bg-white/70 p-3 dark:border-brand-line dark:bg-black/[0.18]">
          <UserRound aria-hidden="true" className="text-brand-orange" size={19} strokeWidth={2.6} />
          <div className="min-w-0">
            <p className="font-body text-[0.68rem] font-black uppercase text-neutral-500 dark:text-orange-100/[0.58]">
              Sesion
            </p>
            <p className="truncate font-body text-sm font-black text-brand-ink dark:text-white">
              {userLabel}
            </p>
            <p className="mt-0.5 font-body text-[0.68rem] font-black uppercase text-brand-orange">
              {roleLabel}
            </p>
          </div>
        </div>
        <button
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-panel border border-neutral-200 bg-white px-3 py-2 font-body text-sm font-black uppercase text-brand-ink transition hover:border-brand-orange hover:text-brand-orange focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange dark:border-brand-line dark:bg-white/[0.08] dark:text-white"
          onClick={onSignOut}
          type="button"
        >
          <LogOut aria-hidden="true" size={18} strokeWidth={2.8} />
          Salir
        </button>
      </div>
    </div>
  );

  return (
    <main className="voto-page min-h-screen bg-brand-field text-brand-ink dark:bg-brand-ink dark:text-white">
      <div className="voto-sunburst" aria-hidden="true" />

      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-brand-field/[0.92] shadow-sm backdrop-blur-xl dark:border-brand-line dark:bg-brand-ink/[0.88] lg:hidden">
        <div className="flex min-h-16 items-center justify-between gap-3 px-4">
          <button
            aria-label="Abrir menu"
            className="grid min-h-11 w-11 place-items-center rounded-panel border border-neutral-200 bg-white text-brand-ink shadow-sm transition hover:border-brand-orange focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange dark:border-brand-line dark:bg-white/5 dark:text-white"
            onClick={onToggleMenu}
            type="button"
          >
            <Menu aria-hidden="true" size={20} strokeWidth={2.8} />
          </button>

          <div className="flex min-w-0 items-center gap-2">
            <img
              alt="PPC"
              className="h-9 w-9 shrink-0 rounded-panel bg-white object-contain p-1 ring-1 ring-brand-orange/70"
              src={logoUrl}
            />
            <span className="truncate font-display text-lg text-brand-ink dark:text-white">
              VotoSeguro
            </span>
          </div>

          <ThemeToggle onToggle={onToggleTheme} theme={theme} />
        </div>
      </header>

      <button
        aria-label="Cerrar menu"
        className={[
          "fixed inset-0 z-40 bg-brand-ink/[0.55] backdrop-blur-sm transition lg:hidden",
          isMenuOpen ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        onClick={onCloseMenu}
        type="button"
      />

      <aside
        aria-label="Menu principal"
        className={[
          "fixed left-0 top-0 z-50 h-dvh w-[min(20rem,calc(100vw-1rem))] -translate-x-full border-r border-neutral-200 bg-brand-field shadow-panel transition-transform duration-300 dark:border-brand-line dark:bg-brand-coal lg:z-20 lg:h-screen lg:w-72 lg:translate-x-0",
          isMenuOpen ? "translate-x-0" : "",
        ].join(" ")}
      >
        {sidebar}
      </aside>

      <div className="relative z-10 lg:ml-72">
        <div className="hidden border-b border-neutral-200 bg-brand-field/[0.84] px-8 py-4 backdrop-blur-xl dark:border-brand-line dark:bg-brand-ink/[0.82] lg:flex lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <img
              alt="PPC"
              className="h-11 w-11 rounded-panel bg-white object-contain p-1 ring-2 ring-brand-orange"
              src={logoUrl}
            />
            <div className="min-w-0">
              <p className="font-body text-xs font-black uppercase text-brand-orange">
                Panel de gestion
              </p>
              <h1 className="truncate font-display text-2xl text-brand-ink dark:text-white">VotoSeguro PPC</h1>
            </div>
          </div>
          <ThemeToggle onToggle={onToggleTheme} theme={theme} />
        </div>

        <div className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-6 lg:px-8 lg:py-6">
          {children}
        </div>
      </div>
    </main>
  );
}

export default AppShell;
