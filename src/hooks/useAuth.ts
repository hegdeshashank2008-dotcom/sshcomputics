import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface AuthState {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  username: string | null;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const hydrate = async (next: Session | null) => {
      if (!active) return;
      setSession(next);
      if (!next?.user) {
        setIsAdmin(false);
        setUsername(null);
        setLoading(false);
        return;
      }
      const [{ data: roles }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", next.user.id),
        supabase.from("profiles").select("username").eq("id", next.user.id).maybeSingle(),
      ]);
      if (!active) return;
      setIsAdmin((roles ?? []).some((r) => r.role === "admin"));
      setUsername(profile?.username ?? null);
      setLoading(false);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      void hydrate(next);
    });
    void supabase.auth.getSession().then(({ data }) => hydrate(data.session));

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, user: session?.user ?? null, isAdmin, username, loading };
}

/** Usernames are the login handle; auth itself always uses an email address. */
export function usernameToEmail(username: string) {
  return `${username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "")}@shashankcomputics.app`;
}
