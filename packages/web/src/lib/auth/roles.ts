import { createClient } from "@/lib/supabase/server";

export type UserRole =
  | "admin_nacional"
  | "confederacao"
  | "federacao"
  | "clube"
  | "tecnico"
  | "atleta";

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin_nacional: 6,
  confederacao: 5,
  federacao: 4,
  clube: 3,
  tecnico: 2,
  atleta: 1,
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin_nacional: "Admin Nacional",
  confederacao: "Confederacao",
  federacao: "Federacao",
  clube: "Clube / Centro",
  tecnico: "Tecnico",
  atleta: "Atleta",
};

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Role is server-controlled (public.user_roles), never trust
  // user_metadata for this — it is fully client-writable.
  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    user,
    role: roleRow?.role || "atleta",
    entityId: user.user_metadata?.entity_id as string | undefined,
    entityType: user.user_metadata?.entity_type as string | undefined,
    fullName:
      (user.user_metadata?.full_name as string) || user.email || "",
    onboardingComplete: user.user_metadata?.onboarding_complete === true,
  };
}

export async function getUserRole(): Promise<UserRole | null> {
  const session = await getSession();
  return session?.role ?? null;
}

export async function getUserEntityId(): Promise<string | null> {
  const session = await getSession();
  return session?.entityId ?? null;
}

export function hasMinimumRole(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function canAccessRole(
  userRole: UserRole,
  allowedRoles: UserRole[]
): boolean {
  return allowedRoles.includes(userRole);
}
