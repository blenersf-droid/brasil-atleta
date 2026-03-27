import Link from "next/link";
import { Activity, ArrowLeft } from "lucide-react";

export default function AtletaPublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Minimal public header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#00b846] to-[#006b28]">
              <Activity className="size-4 text-white" />
            </div>
            <span className="text-[14px] font-bold tracking-tight text-[#0a1628]">
              Brasil <span className="text-[#009739]">Atleta</span>
            </span>
          </Link>

          <Link
            href="/criar-conta"
            className="inline-flex h-8 items-center rounded-lg bg-[#009739] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#00b846]"
          >
            Criar perfil gratis
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col">{children}</main>

      {/* Minimal footer */}
      <footer className="border-t border-gray-100 bg-white py-6">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Brasil Atleta &mdash; Plataforma Nacional de Esporte
          </p>
        </div>
      </footer>
    </div>
  );
}
