"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/auth/roles";

interface UserRoleState {
  role: UserRole | null;
  entityId: string | null;
  entityType: string | null;
  fullName: string;
  isLoading: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
}

export function useUserRole(): UserRoleState {
  const [state, setState] = useState<UserRoleState>({
    role: null,
    entityId: null,
    entityType: null,
    fullName: "",
    isLoading: true,
    isAdmin: false,
    isAuthenticated: false,
  });

  useEffect(() => {
    const supabase = createClient();

    // Role is server-controlled (public.user_roles), never trust
    // user_metadata for this — it is fully client-writable.
    async function fetchRole(userId: string): Promise<UserRole> {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();
      return data?.role ?? "atleta";
    }

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const role = await fetchRole(user.id);
        setState({
          role,
          entityId: user.user_metadata?.entity_id || null,
          entityType: user.user_metadata?.entity_type || null,
          fullName:
            user.user_metadata?.full_name || user.email || "",
          isLoading: false,
          isAdmin: role === "admin_nacional",
          isAuthenticated: true,
        });
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const user = session.user;
        fetchRole(user.id).then((role) => {
          setState({
            role,
            entityId: user.user_metadata?.entity_id || null,
            entityType: user.user_metadata?.entity_type || null,
            fullName: user.user_metadata?.full_name || user.email || "",
            isLoading: false,
            isAdmin: role === "admin_nacional",
            isAuthenticated: true,
          });
        });
      } else {
        setState({
          role: null,
          entityId: null,
          entityType: null,
          fullName: "",
          isLoading: false,
          isAdmin: false,
          isAuthenticated: false,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return state;
}
