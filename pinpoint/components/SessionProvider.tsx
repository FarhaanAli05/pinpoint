"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type Session = { user?: { email?: string | null; name?: string | null } } | null;

const AuthContext = createContext<{
  data: Session;
  status: "loading" | "authenticated" | "unauthenticated";
  signOut: (options?: { callbackUrl?: string }) => void;
}>({
  data: null,
  status: "unauthenticated",
  signOut: () => {},
});

function userToSession(user: User | null): Session {
  if (!user) return null;
  return {
    user: {
      email: user.email ?? null,
      name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
    },
  };
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(userToSession(s?.user ?? null));
      setStatus(s?.user ? "authenticated" : "unauthenticated");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(userToSession(s?.user ?? null));
      setStatus(s?.user ? "authenticated" : "unauthenticated");
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = (options?: { callbackUrl?: string }) => {
    createSupabaseBrowserClient().auth.signOut().then(() => {
      if (options?.callbackUrl) {
        window.location.href = options.callbackUrl;
      }
    });
  };

  return (
    <AuthContext.Provider value={{ data: session, status, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useSession() {
  return useContext(AuthContext);
}
