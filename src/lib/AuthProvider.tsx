import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  error: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        // Reuse an existing guest session if one is stored in the browser…
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          if (mounted) setUser(session.user);
        } else {
          // …otherwise create a fresh anonymous guest.
          const { data, error } = await supabase.auth.signInAnonymously();
          if (error) throw error;
          if (mounted) setUser(data.user);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error ? err.message : "Authentication failed",
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    bootstrap();

    // Keep local state in sync if the session refreshes or changes.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
