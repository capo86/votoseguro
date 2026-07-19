import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";
import type { AppSection } from "../types/navigation";
import type { Theme } from "../types/theme";
import type { UserProfile } from "../types/userProfile";

const THEME_STORAGE_KEY = "votoseguro-theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "dark";
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

interface AppState {
  activeSection: AppSection;
  closeMenu: () => void;
  isAuthLoading: boolean;
  isMenuOpen: boolean;
  isSigningIn: boolean;
  loginError: string | null;
  openMenu: () => void;
  profile: UserProfile | null;
  session: Session | null;
  setActiveSection: (section: AppSection) => void;
  setAuthLoading: (isLoading: boolean) => void;
  setLoginError: (error: string | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setSession: (session: Session | null) => void;
  setSigningIn: (isSigningIn: boolean) => void;
  setTheme: (theme: Theme) => void;
  theme: Theme;
  toggleTheme: () => void;
  user: User | null;
}

export const useAppStore = create<AppState>((set) => ({
  activeSection: "votoseguro",
  closeMenu: () => set({ isMenuOpen: false }),
  isAuthLoading: true,
  isMenuOpen: false,
  isSigningIn: false,
  loginError: null,
  openMenu: () => set({ isMenuOpen: true }),
  profile: null,
  session: null,
  setActiveSection: (activeSection) => set({ activeSection }),
  setAuthLoading: (isAuthLoading) => set({ isAuthLoading }),
  setLoginError: (loginError) => set({ loginError }),
  setProfile: (profile) => set({ profile }),
  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
    }),
  setSigningIn: (isSigningIn) => set({ isSigningIn }),
  setTheme: (theme) => set({ theme }),
  theme: getInitialTheme(),
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === "dark" ? "light" : "dark",
    })),
  user: null,
}));

export { THEME_STORAGE_KEY };
