"use client";

import { useUserRole } from "@/hooks/use-user-role";
import type { UserRole } from "@/lib/auth/roles";

interface RoleGateProps {
  role: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGate({
  role,
  children,
  fallback = null,
}: RoleGateProps) {
  const { role: userRole, isLoading } = useUserRole();

  if (isLoading) return null;
  if (!userRole || !role.includes(userRole)) return <>{fallback}</>;
  return <>{children}</>;
}
