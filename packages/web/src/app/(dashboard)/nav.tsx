"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Medal,
  Search,
  Map,
  TrendingUp,
  Building2,
  UserCircle,
  Bell,
  Settings,
} from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/use-user-role";
import type { UserRole } from "@/lib/auth/roles";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  allowedRoles: UserRole[];
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    allowedRoles: [
      "admin_nacional",
      "confederacao",
      "federacao",
      "clube",
      "tecnico",
      "atleta",
    ],
  },
  {
    href: "/athletes",
    label: "Atletas",
    icon: Users,
    allowedRoles: [
      "admin_nacional",
      "confederacao",
      "federacao",
      "clube",
      "tecnico",
    ],
  },
  {
    href: "/competitions",
    label: "Competicoes",
    icon: Medal,
    allowedRoles: [
      "admin_nacional",
      "confederacao",
      "federacao",
      "clube",
      "tecnico",
    ],
  },
  {
    href: "/scouting",
    label: "Scouting",
    icon: Search,
    allowedRoles: ["admin_nacional", "confederacao", "federacao"],
  },
  {
    href: "/mapa-de-talentos",
    label: "Mapa de Talentos",
    icon: Map,
    allowedRoles: ["admin_nacional", "confederacao", "federacao"],
  },
  {
    href: "/funil-esportivo",
    label: "Funil Esportivo",
    icon: TrendingUp,
    allowedRoles: ["admin_nacional", "confederacao", "federacao"],
  },
  {
    href: "/entities",
    label: "Entidades",
    icon: Building2,
    allowedRoles: ["admin_nacional", "confederacao", "federacao"],
  },
  {
    href: "/alerts",
    label: "Alertas",
    icon: Bell,
    allowedRoles: ["admin_nacional", "confederacao", "federacao"],
  },
  {
    href: "/meu-perfil",
    label: "Meu Perfil",
    icon: UserCircle,
    allowedRoles: ["atleta"],
  },
  {
    href: "/settings",
    label: "Configuracoes",
    icon: Settings,
    allowedRoles: [
      "admin_nacional",
      "confederacao",
      "federacao",
      "clube",
      "tecnico",
      "atleta",
    ],
  },
];

export function DashboardNav() {
  const pathname = usePathname();
  const { role, isLoading } = useUserRole();

  const visibleItems = isLoading
    ? navItems.filter((item) =>
        item.allowedRoles.includes("atleta")
      )
    : navItems.filter(
        (item) => role && item.allowedRoles.includes(role)
      );

  return (
    <SidebarMenu>
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);

        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              render={<Link href={item.href} />}
              isActive={isActive}
              tooltip={item.label}
              className={cn(
                isActive &&
                  "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
              )}
            >
              <Icon />
              <span>{item.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
