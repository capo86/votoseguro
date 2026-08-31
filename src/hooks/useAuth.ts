import { useCallback, useEffect, useRef } from "react";
import { signInIdentifierToEmail } from "../lib/authIdentity";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";
import { canAccessTerritoryManagement, isDistrictAdminProfile, isGeneralAdminProfile } from "../lib/userRoles";
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
  const profileLoadRef = useRef<Promise<string | null> | null>(null);
  const profileLoadUserIdRef = useRef<string | null>(null);

  const loadProfileForSession = useCallback(
    (nextSession: typeof session) => {
      if (!nextSession) {
        profileLoadRef.current = null;
        profileLoadUserIdRef.current = null;
        setSession(null);
        setProfile(null);
        setAuthLoading(false);
        return Promise.resolve(null);
      }

      const { profile: currentProfile, session: currentSession } = useAppStore.getState();

      // Supabase emits session events again when a tab regains focus or a token
      // refreshes. The existing session/profile is still valid, so preserve the UI.
      if (
        currentSession?.user.id === nextSession.user.id ||
        currentProfile?.authUserId === nextSession.user.id
      ) {
        setSession(nextSession);
        return Promise.resolve(null);
      }

      if (
        profileLoadUserIdRef.current === nextSession.user.id &&
        profileLoadRef.current
      ) {
        return profileLoadRef.current;
      }

      setAuthLoading(true);
      setSession(nextSession);

      const profileRequest = getCurrentUserProfile(nextSession.user.id)
        .then((nextProfile) => {
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
        })
        .catch(async (error) => {
          const message = error instanceof Error ? error.message : "No se pudo validar el usuario.";
          setProfile(null);
          setSession(null);
          setLoginError(message);
          setAuthLoading(false);
          await supabase?.auth.signOut();
          return message;
        });

      profileLoadUserIdRef.current = nextSession.user.id;
      profileLoadRef.current = profileRequest;

      void profileRequest.finally(() => {
        if (profileLoadRef.current === profileRequest) {
          profileLoadRef.current = null;
          profileLoadUserIdRef.current = null;
        }
      });

      return profileRequest;
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
    canAccessTerritoryManagement: canAccessTerritoryManagement(profile),
    isAdmin: isGeneralAdminProfile(profile),
    isAuthenticated: Boolean(session),
    isConfigured: isSupabaseConfigured,
    isDistrictAdmin: isDistrictAdminProfile(profile),
    isReferente: profile?.role === "referente",
    isLoading,
    profile,
    session,
    signIn,
    signOut,
    user,
  };
}
