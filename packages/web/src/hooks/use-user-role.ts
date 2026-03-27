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

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const role =
          (user.user_metadata?.user_type as UserRole) || "atleta";
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
        const role =
          (session.user.user_metadata?.user_type as UserRole) || "atleta";
        setState({
          role,
          entityId: session.user.user_metadata?.entity_id || null,
          entityType: session.user.user_metadata?.entity_type || null,
          fullName:
            session.user.user_metadata?.full_name ||
            session.user.email ||
            "",
          isLoading: false,
          isAdmin: role === "admin_nacional",
          isAuthenticated: true,
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
