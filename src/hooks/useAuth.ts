import { useCallback, useEffect } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";
import { useAppStore } from "../store/appStore";

interface SignInCredentials {
  email: string;
  password: string;
}

export function useAuth() {
  const session = useAppStore((state) => state.session);
  const user = useAppStore((state) => state.user);
  const isLoading = useAppStore((state) => state.isAuthLoading);
  const setSession = useAppStore((state) => state.setSession);
  const setAuthLoading = useAppStore((state) => state.setAuthLoading);

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

      setSession(data.session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [setAuthLoading, setSession]);

  const signIn = useCallback(async ({ email, password }: SignInCredentials) => {
    if (!supabase) {
      return {
        error: "Supabase no esta configurado.",
      };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return {
      error: error?.message ?? null,
    };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
  }, []);

  return {
    isAuthenticated: Boolean(session),
    isConfigured: isSupabaseConfigured,
    isLoading,
    session,
    signIn,
    signOut,
    user,
  };
}
