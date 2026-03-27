import Link from "next/link";
import { Activity, Bell, ChevronDown } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DashboardNav } from "./nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        {/* Sidebar Header — Logo */}
        <SidebarHeader className="border-b border-sidebar-border px-3 py-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 rounded-lg px-1 py-1 transition-colors hover:bg-sidebar-accent"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary">
              <Activity className="size-4 text-white" />
            </div>
            <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
              <span className="truncate text-sm font-semibold text-sidebar-foreground">
                Brasil Atleta
              </span>
              <span className="truncate text-[10px] text-sidebar-foreground/60">
                Plataforma Nacional
              </span>
            </div>
          </Link>
        </SidebarHeader>

        {/* Sidebar Navigation */}
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navegação</SidebarGroupLabel>
            <SidebarGroupContent>
              <DashboardNav />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarSeparator />

        {/* Sidebar Footer — User */}
        <SidebarFooter className="p-2">
          <div className="flex items-center gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center">
            <Avatar size="sm" className="shrink-0">
              <AvatarFallback className="bg-primary/10 text-xs text-primary">
                US
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
              <span className="truncate text-xs font-medium text-sidebar-foreground">
                Usuário
              </span>
              <span className="truncate text-[10px] text-sidebar-foreground/60">
                Gestor Nacional
              </span>
            </div>
            <ChevronDown className="size-3.5 shrink-0 text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden" />
          </div>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      {/* Main Content Area */}
      <SidebarInset>
        {/* Top Bar */}
        <header className="sticky top-0 z-40 flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-4" />
            <div className="flex flex-1 items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {/* Page title area — kept empty for pages to fill */}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon-sm" className="relative">
                  <Bell className="size-4" />
                  <span className="sr-only">Notificações</span>
                  <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary" />
                </Button>
                <Avatar size="sm">
                  <AvatarFallback className="bg-primary/10 text-xs text-primary">
                    US
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
