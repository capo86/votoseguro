import { Loader2, WifiOff } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import logoUrl from "../logo ppc oficial.png";
import LoginPage from "./components/auth/LoginPage";
import AppShell from "./components/layout/AppShell";
import { useAuth } from "./hooks/useAuth";
import { useTheme } from "./hooks/useTheme";
import { useAppStore } from "./store/appStore";

const CandidatosPage = lazy(() => import("./pages/CandidatosPage"));
const ConsultaPadronPage = lazy(() => import("./pages/ConsultaPadronPage"));
const PanelPage = lazy(() => import("./pages/PanelPage"));
const RegistroVotantePage = lazy(() => import("./pages/RegistroVotantePage"));
const UsuariosPage = lazy(() => import("./pages/UsuariosPage"));

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator === "undefined") {
      return true;
    }

    return navigator.onLine;
  });

  useEffect(() => {
    const setOnline = () => setIsOnline(true);
    const setOffline = () => setIsOnline(false);

    window.addEventListener("online", setOnline);
    window.addEventListener("offline", setOffline);

    return () => {
      window.removeEventListener("online", setOnline);
      window.removeEventListener("offline", setOffline);
    };
  }, []);

  return isOnline;
}

function OfflineNotice() {
  return (
    <div
      className="fixed inset-x-3 top-3 z-50 mx-auto flex max-w-md items-center gap-3 rounded-panel border border-orange-300 bg-white px-4 py-3 font-body text-sm font-black text-brand-ink shadow-action dark:border-orange-300/40 dark:bg-brand-coal dark:text-white"
      role="status"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-brand-orange text-white">
        <WifiOff aria-hidden="true" size={19} strokeWidth={2.8} />
      </span>
      <span>
        Sin conexion. La app queda disponible, pero las consultas y cargas necesitan internet.
      </span>
    </div>
  );
}

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
  const isOnline = useOnlineStatus();
  const activeSection = useAppStore((state) => state.activeSection);
  const closeMenu = useAppStore((state) => state.closeMenu);
  const isMenuOpen = useAppStore((state) => state.isMenuOpen);
  const isSigningIn = useAppStore((state) => state.isSigningIn);
  const loginError = useAppStore((state) => state.loginError);
  const openMenu = useAppStore((state) => state.openMenu);
  const setActiveSection = useAppStore((state) => state.setActiveSection);
  const setLoginError = useAppStore((state) => state.setLoginError);
  const setSigningIn = useAppStore((state) => state.setSigningIn);

  const handleSignIn = async (identifier: string, password: string) => {
    setSigningIn(true);
    setLoginError(null);

    const { error } = await auth.signIn({ identifier, password });

    if (error) {
      setLoginError(error);
    }

    setSigningIn(false);
  };

  const renderActiveSection = () => {
    if (activeSection === "panel" && auth.isAdmin) {
      return <PanelPage />;
    }

    if (activeSection === "consulta-padron") {
      return <ConsultaPadronPage />;
    }

    if (activeSection === "votoseguro") {
      return <RegistroVotantePage />;
    }

    if (activeSection === "candidatos") {
      return <CandidatosPage />;
    }

    if (activeSection === "usuarios" && auth.isAdmin) {
      return <UsuariosPage />;
    }

    return <RegistroVotantePage />;
  };

  if (auth.isLoading) {
    return (
      <main className="voto-page grid min-h-screen place-items-center bg-brand-field px-6 text-brand-ink dark:bg-brand-ink dark:text-white">
        {!isOnline ? <OfflineNotice /> : null}
        <div className="voto-sunburst" aria-hidden="true" />
        <div className="voto-card relative z-10 flex w-full max-w-sm flex-col items-center text-center">
          <img alt="PPC" className="h-32 w-32 object-contain drop-shadow-xl" src={logoUrl} />
          <p className="mt-6 font-body text-xs font-black uppercase text-brand-orange">
            Partido de la Participación Ciudadana
          </p>
          <h1 className="mt-2 font-display text-3xl leading-none text-brand-ink dark:text-white">
            Preparando VotoSeguro
          </h1>
          <div className="mt-6 flex items-center gap-2 font-body text-sm font-black text-neutral-600 dark:text-orange-100/70">
            <Loader2 aria-hidden="true" className="animate-spin text-brand-orange" size={20} />
            Cargando acceso
          </div>
          <div className="mt-5 h-1.5 w-48 overflow-hidden rounded-full bg-brand-orange/20">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-brand-orange" />
          </div>
        </div>
      </main>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <>
        {!isOnline ? <OfflineNotice /> : null}
        <LoginPage
          error={loginError}
          isConfigured={auth.isConfigured}
          isLoading={isSigningIn}
          logoUrl={logoUrl}
          onSignIn={handleSignIn}
          onToggleTheme={themeController.toggleTheme}
          theme={themeController.theme}
        />
      </>
    );
  }

  return (
    <>
      {!isOnline ? <OfflineNotice /> : null}
      <AppShell
        activeSection={activeSection}
        isMenuOpen={isMenuOpen}
        logoUrl={logoUrl}
        onCloseMenu={closeMenu}
        onNavigate={setActiveSection}
        onSignOut={auth.signOut}
        onToggleMenu={openMenu}
        onToggleTheme={themeController.toggleTheme}
        profile={auth.profile}
        theme={themeController.theme}
        user={auth.user}
      >
        <Suspense fallback={<SectionFallback />}>{renderActiveSection()}</Suspense>
      </AppShell>
    </>
  );
}

export default App;
