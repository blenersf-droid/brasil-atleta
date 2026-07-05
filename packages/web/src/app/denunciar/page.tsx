import Link from "next/link";
import { Activity, ArrowLeft } from "lucide-react";
import { ReportForm } from "./report-form";

// FR-0.9/D6: public report/denuncia channel — deliberately NOT listed in
// PROTECTED_ROUTES (src/proxy.ts), reachable while logged out. Linked from
// the public profile footer (src/app/atleta/[slug]/page.tsx) as
// /denunciar?atleta=<slug>, but also directly reachable on its own.
export const metadata = {
  title: "Denunciar perfil — Brasil Atleta",
  description:
    "Canal de denuncia da Brasil Atleta para relatar abordagem inadequada, perfis falsos ou conteudo impropriado.",
};

interface DenunciarPageProps {
  searchParams: Promise<{ atleta?: string }>;
}

export default async function DenunciarPage({
  searchParams,
}: DenunciarPageProps) {
  const { atleta } = await searchParams;

  return (
    <div className="flex min-h-svh flex-col bg-[#fafaf8]">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#0a1628]/40 transition-colors hover:text-[#0a1628]/70"
        >
          <ArrowLeft className="size-3.5" />
          Voltar
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#009739]">
            <Activity className="size-[18px] text-white" />
          </div>
          <span className="text-[15px] font-bold text-[#0a1628] tracking-tight">
            Brasil <span className="text-[#009739]">Atleta</span>
          </span>
        </div>
        <div className="w-16" />
      </header>

      <main className="flex flex-1 items-start justify-center px-5 pb-16 pt-6 sm:px-8">
        <div className="w-full max-w-lg">
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0a1628]">
              Denunciar perfil ou conteudo
            </h1>
            <p className="mt-1.5 text-sm text-[#0a1628]/40">
              Use este canal para relatar abordagem inadequada, perfis falsos
              ou conteudo impropriado. Sua denuncia e analisada pela nossa
              equipe.
            </p>
          </div>

          <div className="rounded-2xl border border-[#0a1628]/[0.06] bg-white p-6 shadow-sm sm:p-8">
            <ReportForm initialSlug={atleta} />
          </div>
        </div>
      </main>
    </div>
  );
}
