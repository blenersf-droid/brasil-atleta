import Link from "next/link";
import {
  MapPin,
  BarChart3,
  TrendingUp,
  ChevronRight,
  Activity,
  Radar,
  Shield,
  Zap,
  ArrowRight,
  Globe2,
  Database,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 bg-[#fafaf8]">
      {/* ─── NAVIGATION ─── */}
      <header className="sticky top-0 z-50 w-full bg-[#0a1628]/95 backdrop-blur-md border-b border-white/[0.06]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="relative flex h-8 w-8 items-center justify-center">
              <div className="absolute inset-0 rounded-lg bg-[#009739]" />
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-[#00b846] to-[#006b28]" />
              <Activity className="relative size-[18px] text-white" />
            </div>
            <span className="text-[15px] font-bold tracking-tight text-white">
              Brasil <span className="text-[#FEDD00]">Atleta</span>
            </span>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden sm:inline-flex px-4 py-2 text-[13px] font-medium text-white/60 transition-colors hover:text-white"
            >
              Entrar
            </Link>
            <Button
              render={<Link href="/login" />}
              className="h-9 rounded-lg bg-[#009739] px-5 text-[13px] font-semibold text-white hover:bg-[#00b846] border-none"
            >
              Acessar Plataforma
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        {/* ─── HERO ─── */}
        <section className="relative overflow-hidden bg-[#0a1628] pb-32 pt-20 sm:pt-28 sm:pb-40">
          {/* Topographic pattern overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                repeating-conic-gradient(rgba(255,255,255,0.8) 0% 25%, transparent 0% 50%) 0 0 / 60px 60px,
                repeating-conic-gradient(rgba(255,255,255,0.4) 0% 25%, transparent 0% 50%) 30px 30px / 60px 60px
              `,
            }}
          />

          {/* Radial glow — green */}
          <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[700px] rounded-full bg-[#009739]/8 blur-[120px]" />
          {/* Radial glow — yellow accent */}
          <div className="pointer-events-none absolute -top-20 right-0 h-[400px] w-[400px] rounded-full bg-[#FEDD00]/5 blur-[100px]" />
          {/* Radial glow — blue */}
          <div className="pointer-events-none absolute bottom-0 -left-20 h-[500px] w-[500px] rounded-full bg-[#002776]/15 blur-[100px]" />

          {/* Animated pulse rings */}
          <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="h-[300px] w-[300px] rounded-full border border-[#009739]/10 animate-[ping_4s_ease-in-out_infinite]" />
          </div>
          <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="h-[500px] w-[500px] rounded-full border border-[#009739]/5 animate-[ping_6s_ease-in-out_infinite_1s]" />
          </div>

          <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
            <div className="mx-auto max-w-4xl">
              {/* Status badge */}
              <div className="flex justify-center mb-8">
                <div className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#009739] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00c04b]" />
                  </span>
                  <span className="text-xs font-medium tracking-wide text-white/70 uppercase">
                    Plataforma Nacional Oficial
                  </span>
                </div>
              </div>

              {/* Main heading */}
              <h1 className="text-center">
                <span className="block text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tighter text-white leading-[0.9]">
                  Brasil
                </span>
                <span className="block text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tighter text-[#FEDD00] leading-[0.9] mt-1">
                  Atleta
                </span>
              </h1>

              <p className="mx-auto mt-8 max-w-2xl text-center text-base sm:text-lg leading-relaxed text-white/50 font-normal">
                A plataforma que integra, monitora e revela o potencial atlético de todo o Brasil.
                Do esporte escolar ao alto rendimento — dados unificados para{" "}
                <span className="text-white/80 font-medium">27 estados</span>,{" "}
                <span className="text-white/80 font-medium">40+ modalidades</span> e{" "}
                <span className="text-white/80 font-medium">milhares de atletas</span>.
              </p>

              {/* CTAs */}
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  render={<Link href="/login" />}
                  className="h-12 rounded-xl bg-[#009739] px-8 text-sm font-bold text-white hover:bg-[#00b846] border-none shadow-[0_0_30px_rgba(0,151,57,0.3)] hover:shadow-[0_0_40px_rgba(0,151,57,0.5)] transition-all"
                >
                  Acessar Plataforma
                  <ArrowRight className="ml-2 size-4" />
                </Button>
                <Button
                  render={<Link href="#plataforma" />}
                  variant="outline"
                  className="h-12 rounded-xl border-white/10 bg-white/[0.04] px-8 text-sm font-medium text-white/70 hover:bg-white/[0.08] hover:text-white"
                >
                  Conhecer a Plataforma
                </Button>
              </div>
            </div>

            {/* Stats bar — floating over the hero */}
            <div className="mt-20 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {[
                { value: "27", label: "Estados", sub: "Cobertura total" },
                { value: "40+", label: "Modalidades", sub: "Olímpicas e paralímpicas" },
                { value: "100K", label: "Atletas", sub: "Na base de dados" },
                { value: "24/7", label: "Tempo Real", sub: "Monitoramento contínuo" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6 backdrop-blur-sm transition-all hover:border-[#009739]/20 hover:bg-white/[0.04]"
                >
                  <div className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-white">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white/80">
                    {stat.label}
                  </div>
                  <div className="mt-0.5 text-xs text-white/35">
                    {stat.sub}
                  </div>
                  <div className="absolute top-4 right-4 h-1 w-6 rounded-full bg-[#009739]/40 group-hover:bg-[#009739]/70 transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FEATURES ─── */}
        <section id="plataforma" className="relative py-24 sm:py-32 bg-[#fafaf8]">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            {/* Section header */}
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-10 bg-[#009739]" />
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#009739]">
                  Plataforma
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0a1628] leading-[1.1]">
                Inteligência esportiva
                <br />
                <span className="text-[#0a1628]/40">em escala nacional</span>
              </h2>
              <p className="mt-5 text-base text-[#0a1628]/50 leading-relaxed max-w-lg">
                Ferramentas projetadas para transformar dados fragmentados em decisões estratégicas para o esporte brasileiro.
              </p>
            </div>

            {/* Feature cards */}
            <div className="mt-16 grid gap-5 lg:grid-cols-3">
              {/* Mapa de Talentos */}
              <div className="group relative overflow-hidden rounded-2xl border border-[#0a1628]/[0.06] bg-white p-8 transition-all hover:shadow-xl hover:shadow-[#009739]/5 hover:border-[#009739]/20">
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-[#009739] via-[#009739]/60 to-transparent" />
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#009739]/8 mb-6">
                  <MapPin className="size-6 text-[#009739]" />
                </div>
                <h3 className="text-lg font-bold text-[#0a1628] tracking-tight">
                  Mapa Nacional de Talentos
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#0a1628]/50">
                  Visualização geográfica interativa com distribuição de atletas por estado, modalidade e nível competitivo. Identifique polos esportivos e vazios estruturais em tempo real.
                </p>
                <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-[#009739]">
                  <Globe2 className="size-3.5" />
                  PostGIS + Mapbox
                </div>
              </div>

              {/* Dashboard de Scouting */}
              <div className="group relative overflow-hidden rounded-2xl border border-[#0a1628]/[0.06] bg-white p-8 transition-all hover:shadow-xl hover:shadow-[#002776]/5 hover:border-[#002776]/20">
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-[#002776] via-[#002776]/60 to-transparent" />
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#002776]/8 mb-6">
                  <BarChart3 className="size-6 text-[#002776]" />
                </div>
                <h3 className="text-lg font-bold text-[#0a1628] tracking-tight">
                  Dashboard de Scouting
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#0a1628]/50">
                  Rankings nacionais, comparativos de desempenho e evolução atlética. Alertas automatizados para progressões acima da média e detecção de talentos emergentes.
                </p>
                <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-[#002776]">
                  <Radar className="size-3.5" />
                  Analytics em tempo real
                </div>
              </div>

              {/* Funil Esportivo */}
              <div className="group relative overflow-hidden rounded-2xl border border-[#0a1628]/[0.06] bg-white p-8 transition-all hover:shadow-xl hover:shadow-[#FEDD00]/10 hover:border-[#c4a900]/20">
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-[#c4a900] via-[#c4a900]/60 to-transparent" />
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FEDD00]/12 mb-6">
                  <TrendingUp className="size-6 text-[#a38a00]" />
                </div>
                <h3 className="text-lg font-bold text-[#0a1628] tracking-tight">
                  Funil Esportivo Nacional
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#0a1628]/50">
                  Acompanhamento da jornada completa: base escolar, estadual, nacional e alto rendimento. Taxas de retenção, conversão e identificação de pontos de evasão.
                </p>
                <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-[#a38a00]">
                  <TrendingUp className="size-3.5" />
                  Tracking longitudinal
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── DATA COMMAND CENTER ─── */}
        <section className="relative bg-[#0a1628] py-24 sm:py-32 overflow-hidden">
          {/* Subtle grid */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />
          <div className="pointer-events-none absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-[#009739]/6 blur-[120px]" />

          <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
            <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
              {/* Left — text */}
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-px w-10 bg-[#009739]" />
                  <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#009739]">
                    Governança
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-[1.1]">
                  Dados que transformam
                  <br />
                  <span className="text-white/30">o esporte nacional</span>
                </h2>
                <p className="mt-6 text-base leading-relaxed text-white/40 max-w-md">
                  A fragmentação de dados custa ao Brasil talentos que nunca são identificados. O Brasil Atleta conecta toda a cadeia esportiva — da base ao pódio.
                </p>

                {/* Capabilities */}
                <div className="mt-10 space-y-5">
                  {[
                    {
                      icon: Database,
                      title: "Base centralizada",
                      desc: "Clubes, federações, confederações e comitês em um único ecossistema",
                    },
                    {
                      icon: Eye,
                      title: "Acompanhamento longitudinal",
                      desc: "Do esporte escolar ao alto rendimento, sem perder nenhum talento no caminho",
                    },
                    {
                      icon: Shield,
                      title: "LGPD compliance",
                      desc: "Governança de dados com camadas de acesso e proteção total",
                    },
                    {
                      icon: Zap,
                      title: "IA preditiva",
                      desc: "Modelos de projeção atlética e detecção de risco de evasão esportiva",
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="flex gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03]">
                          <Icon className="size-[18px] text-[#009739]" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white/90">
                            {item.title}
                          </div>
                          <div className="mt-0.5 text-sm text-white/35">
                            {item.desc}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right — institutional trust */}
              <div className="relative">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 sm:p-10 backdrop-blur-sm">
                  <div className="text-xs font-bold tracking-[0.2em] uppercase text-white/30 mb-8">
                    Parceiros Institucionais
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    {[
                      { name: "Comitê Olímpico do Brasil", abbr: "COB" },
                      { name: "Comitê Paralímpico Brasileiro", abbr: "CPB" },
                      { name: "Ministério do Esporte", abbr: "ME" },
                      { name: "Confederações Nacionais", abbr: "40+" },
                    ].map((partner) => (
                      <div
                        key={partner.abbr}
                        className="flex flex-col items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-6 text-center transition-colors hover:border-[#009739]/15"
                      >
                        <div className="font-mono text-2xl font-bold text-[#009739]">
                          {partner.abbr}
                        </div>
                        <div className="text-[11px] leading-tight text-white/40">
                          {partner.name}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 flex items-center gap-3 rounded-xl border border-[#009739]/10 bg-[#009739]/[0.04] p-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#009739]/15">
                      <Activity className="size-4 text-[#009739]" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white/70">
                        Projeto FGV/FIFA/CIES
                      </div>
                      <div className="text-[11px] text-white/30">
                        Gestão de Esportes — Rio de Janeiro, 2026
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── CTA SECTION ─── */}
        <section className="relative py-24 sm:py-32 bg-[#fafaf8] overflow-hidden">
          <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-[#009739]/5 blur-[100px]" />

          <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0a1628]">
                Pronto para transformar o esporte brasileiro?
              </h2>
              <p className="mt-4 text-base text-[#0a1628]/45">
                Junte-se à plataforma que conecta toda a cadeia esportiva nacional.
                Identifique talentos, tome decisões baseadas em dados e reduza desigualdades regionais.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  render={<Link href="/login" />}
                  className="h-12 rounded-xl bg-[#009739] px-8 text-sm font-bold text-white hover:bg-[#00b846] border-none"
                >
                  Começar Agora
                  <ArrowRight className="ml-2 size-4" />
                </Button>
                <Button
                  render={<Link href="/login" />}
                  variant="outline"
                  className="h-12 rounded-xl px-8 text-sm font-medium"
                >
                  Solicitar Demonstração
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[#0a1628] border-t border-white/[0.04]">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#009739]">
                <Activity className="size-3.5 text-white" />
              </div>
              <span className="text-sm font-bold text-white/80 tracking-tight">
                Brasil <span className="text-[#FEDD00]">Atleta</span>
              </span>
            </div>

            <p className="text-xs text-white/25 text-center">
              &copy; {new Date().getFullYear()} Brasil Atleta. Plataforma Nacional de Esporte Olímpico e Paralímpico.
            </p>

            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#009739]" />
              <span className="h-2.5 w-2.5 rounded-sm bg-[#FEDD00]" />
              <span className="h-2.5 w-2.5 rounded-sm bg-[#002776]" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
