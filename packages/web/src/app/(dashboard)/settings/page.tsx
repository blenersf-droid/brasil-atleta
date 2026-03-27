import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { getSession } from "@/lib/auth/roles";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProfileForm, PasswordForm } from "./settings-form";

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const { user, role, entityId, entityType, fullName } = session;
  const email = user.email ?? "";
  const initials = getInitials(fullName || email);
  const createdAt = user.created_at ? formatDate(user.created_at) : "—";

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Settings className="size-4 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Configuracoes
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie seu perfil e preferencias
          </p>
        </div>
      </div>

      {/* Section 1 — Dados Pessoais */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-xs flex flex-col gap-5">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Dados Pessoais
          </h2>
          <p className="text-sm text-muted-foreground">
            Atualize suas informacoes pessoais
          </p>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <Avatar size="lg">
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium text-foreground">{fullName || email}</p>
            <p className="text-xs text-muted-foreground">{email}</p>
          </div>
        </div>

        <Separator />

        <ProfileForm initialName={fullName} email={email} />
      </section>

      {/* Section 2 — Seguranca */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-xs flex flex-col gap-5">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Seguranca
          </h2>
          <p className="text-sm text-muted-foreground">
            Altere sua senha de acesso
          </p>
        </div>

        <PasswordForm />
      </section>

      {/* Section 3 — Meu Vinculo */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-xs flex flex-col gap-5">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Meu Vinculo
          </h2>
          <p className="text-sm text-muted-foreground">
            Informacoes sobre seu acesso na plataforma
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Perfil de acesso
            </span>
            <Badge variant="outline" className="w-fit text-xs font-medium">
              {ROLE_LABELS[role] ?? role}
            </Badge>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Tipo de usuario
            </span>
            <span className="text-sm text-foreground font-medium">
              {entityType ?? "—"}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              ID da entidade
            </span>
            <span className="font-mono text-xs text-muted-foreground break-all">
              {entityId ?? "—"}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Membro desde
            </span>
            <span className="text-sm text-foreground">
              {createdAt}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
