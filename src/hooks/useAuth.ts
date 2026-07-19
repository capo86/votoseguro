import { useCallback, useEffect } from "react";
import { signInIdentifierToEmail } from "../lib/authIdentity";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";
import { getCurrentUserProfile } from "../lib/userProfilesApi";
import { useAppStore } from "../store/appStore";

interface SignInCredentials {
  identifier: string;
  password: string;
}

export function useAuth() {
  const session = useAppStore((state) => state.session);
  const profile = useAppStore((state) => state.profile);
  const user = useAppStore((state) => state.user);
  const isLoading = useAppStore((state) => state.isAuthLoading);
  const setSession = useAppStore((state) => state.setSession);
  const setProfile = useAppStore((state) => state.setProfile);
  const setAuthLoading = useAppStore((state) => state.setAuthLoading);
  const setLoginError = useAppStore((state) => state.setLoginError);

  const loadProfileForSession = useCallback(
    async (nextSession: typeof session) => {
      if (!nextSession) {
        setSession(null);
        setProfile(null);
        setAuthLoading(false);
        return null;
      }

      setAuthLoading(true);
      setSession(nextSession);

      try {
        const nextProfile = await getCurrentUserProfile(nextSession.user.id);

        if (!nextProfile) {
          throw new Error("Tu usuario no tiene perfil operativo.");
        }

        if (nextProfile.estado !== "activo") {
          throw new Error("Tu usuario esta inactivo.");
        }

        setProfile(nextProfile);
        setLoginError(null);
        setAuthLoading(false);
        return null;
      } catch (error) {
        const message = error instanceof Error ? error.message : "No se pudo validar el usuario.";
        setProfile(null);
        setSession(null);
        setLoginError(message);
        setAuthLoading(false);
        await supabase?.auth.signOut();
        return message;
      }
    },
    [setAuthLoading, setLoginError, setProfile, setSession],
  );

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      void loadProfileForSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void loadProfileForSession(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfileForSession, setAuthLoading]);

  const signIn = useCallback(async ({ identifier, password }: SignInCredentials) => {
    if (!supabase) {
      return {
        error: "El acceso al sistema no esta configurado.",
      };
    }

    let email: string;

    try {
      email = signInIdentifierToEmail(identifier);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Ingresa una cedula valida.",
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        error: error.message ?? null,
      };
    }

    if (data.session) {
      const profileError = await loadProfileForSession(data.session);

      return {
        error: profileError,
      };
    }

    return {
      error: null,
    };
  }, [loadProfileForSession]);

  const signOut = useCallback(async () => {
    if (!supabase) {
      return;
    }

    setProfile(null);
    setSession(null);
    await supabase.auth.signOut();
  }, [setProfile, setSession]);

  return {
    isAdmin: profile?.role === "admin",
    isAuthenticated: Boolean(session),
    isConfigured: isSupabaseConfigured,
    isReferente: profile?.role === "referente",
    isLoading,
    profile,
    session,
    signIn,
    signOut,
    user,
  };
}
