import { Loader2 } from "lucide-react";
import { lazy, Suspense } from "react";
import logoUrl from "../logo.jpg";
import LoginPage from "./components/auth/LoginPage";
import AppShell from "./components/layout/AppShell";
import { useAuth } from "./hooks/useAuth";
import { useTheme } from "./hooks/useTheme";
import { useAppStore } from "./store/appStore";

const CandidatosPage = lazy(() => import("./pages/CandidatosPage"));
const RegistroVotantePage = lazy(() => import("./pages/RegistroVotantePage"));
const VotoSeguroHomePage = lazy(() => import("./pages/VotoSeguroHomePage"));

function SectionFallback() {
  return (
    <div className="voto-card flex items-center gap-3 rounded-panel border border-neutral-200 bg-white/[0.88] px-5 py-4 font-body font-black shadow-panel dark:border-brand-line dark:bg-neutral-900/[0.92]">
      <Loader2 aria-hidden="true" className="animate-spin text-brand-orange" size={22} />
      Cargando vista
    </div>
  );
}

function App() {
  const themeController = useTheme();
  const auth = useAuth();
  const activeSection = useAppStore((state) => state.activeSection);
  const closeMenu = useAppStore((state) => state.closeMenu);
  const isMenuOpen = useAppStore((state) => state.isMenuOpen);
  const isSigningIn = useAppStore((state) => state.isSigningIn);
  const loginError = useAppStore((state) => state.loginError);
  const openMenu = useAppStore((state) => state.openMenu);
  const setActiveSection = useAppStore((state) => state.setActiveSection);
  const setLoginError = useAppStore((state) => state.setLoginError);
  const setSigningIn = useAppStore((state) => state.setSigningIn);

  const handleSignIn = async (email: string, password: string) => {
    setSigningIn(true);
    setLoginError(null);

    const { error } = await auth.signIn({ email, password });

    if (error) {
      setLoginError(error);
    }

    setSigningIn(false);
  };

  const renderActiveSection = () => {
    if (activeSection === "votoseguro") {
      return <VotoSeguroHomePage />;
    }

    if (activeSection === "candidatos") {
      return <CandidatosPage />;
    }

    return <RegistroVotantePage />;
  };

  if (auth.isLoading) {
    return (
      <main className="voto-page grid min-h-screen place-items-center bg-brand-field text-brand-ink dark:bg-brand-ink dark:text-white">
        <div className="voto-card flex items-center gap-3 rounded-panel border border-neutral-200 bg-white/[0.88] px-5 py-4 font-body font-black shadow-panel dark:border-brand-line dark:bg-neutral-900/[0.92]">
          <Loader2 aria-hidden="true" className="animate-spin text-brand-orange" size={22} />
          Preparando sesion
        </div>
      </main>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <LoginPage
        error={loginError}
        isConfigured={auth.isConfigured}
        isLoading={isSigningIn}
        logoUrl={logoUrl}
        onSignIn={handleSignIn}
        onToggleTheme={themeController.toggleTheme}
        theme={themeController.theme}
      />
    );
  }

  return (
    <AppShell
      activeSection={activeSection}
      isMenuOpen={isMenuOpen}
      logoUrl={logoUrl}
      onCloseMenu={closeMenu}
      onNavigate={setActiveSection}
      onSignOut={auth.signOut}
      onToggleMenu={openMenu}
      onToggleTheme={themeController.toggleTheme}
      theme={themeController.theme}
      user={auth.user}
    >
      <Suspense fallback={<SectionFallback />}>{renderActiveSection()}</Suspense>
    </AppShell>
  );
}

export default App;
