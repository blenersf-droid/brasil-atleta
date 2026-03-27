import Link from "next/link";
import {
  UserPlus,
  Trophy,
  Search,
  Activity,
  ArrowRight,
  MapPin,
  Medal,
  Star,
  BarChart3,
  ChevronRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ─── Focus modalities for the pivot ───────────────────────────────────────────
const FOCUS_MODALITIES = [
  { code: "FUT", name: "Futebol", color: "bg-green-50 text-green-700 border-green-200" },
  { code: "ATL", name: "Atletismo", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { code: "NAT", name: "Natacao", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  { code: "JUD", name: "Judo", color: "bg-red-50 text-red-700 border-red-200" },
  { code: "JJB", name: "Jiu-Jitsu", color: "bg-purple-50 text-purple-700 border-purple-200" },
];

export default function Home() {
  return (
    <div className="flex flex-col flex-1 bg-[#fafaf8]">
      {/* ─── NAVIGATION ─── */}
      <header className="sticky top-0 z-50 w-full bg-[#0a1628]/95 backdrop-blur-md border-b border-white/[0.06]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="relative flex h-8 w-8 items-center justify-center">
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
              render={<Link href="/criar-conta" />}
              className="h-9 rounded-lg bg-[#009739] px-5 text-[13px] font-semibold text-white hover:bg-[#00b846] border-none"
            >
              Criar perfil gratis
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        {/* ─── HERO ─── */}
        <section className="relative overflow-hidden bg-[#0a1628] pb-28 pt-20 sm:pt-28 sm:pb-36">
          {/* Topographic pattern overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.025]"
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

          {/* Pulse rings */}
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
                    Portfolio Esportivo Gratuito
                  </span>
                </div>
              </div>

              {/* Main heading */}
              <h1 className="text-center">
                <span className="block text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tighter text-white leading-[0.9]">
                  Seu portfolio
                </span>
                <span className="block text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tighter text-white leading-[0.9] mt-1">
                  esportivo.
                </span>
                <span className="block text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter text-[#FEDD00] leading-[0.95] mt-2">
                  Seja descoberto.
                </span>
              </h1>

              <p className="mx-auto mt-8 max-w-2xl text-center text-base sm:text-lg leading-relaxed text-white/50 font-normal">
                Crie seu perfil gratuito, registre suas conquistas e seja visto por scouts e clubes de todo o Brasil.
              </p>

              {/* CTAs */}
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  render={<Link href="/criar-conta" />}
                  className="h-12 rounded-xl bg-[#009739] px-8 text-sm font-bold text-white hover:bg-[#00b846] border-none shadow-[0_0_30px_rgba(0,151,57,0.3)] hover:shadow-[0_0_40px_rgba(0,151,57,0.5)] transition-all"
                >
                  Criar perfil gratis
                  <ArrowRight className="ml-2 size-4" />
                </Button>
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center gap-1 px-6 text-sm font-medium text-white/55 transition-colors hover:text-white/80"
                >
                  Ja tem conta? Entrar
                </Link>
              </div>
            </div>

            {/* Stats bar */}
            <div className="mt-20 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {[
                { value: "27", label: "Estados", sub: "Cobertura total" },
                { value: "40+", label: "Modalidades", sub: "Olimpicas e paralimpicas" },
                { value: "100K", label: "Atletas", sub: "Na base de dados" },
                { value: "100%", label: "Gratis", sub: "Para atletas" },
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
                  <div className="mt-0.5 text-xs text-white/35">{stat.sub}</div>
                  <div className="absolute top-4 right-4 h-1 w-6 rounded-full bg-[#009739]/40 group-hover:bg-[#009739]/70 transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ─── */}
        <section className="relative py-24 sm:py-32 bg-[#fafaf8]">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            {/* Section header */}
            <div className="max-w-2xl mx-auto text-center mb-16">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px w-10 bg-[#009739]" />
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#009739]">
                  Como funciona
                </span>
                <div className="h-px w-10 bg-[#009739]" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0a1628] leading-[1.1]">
                Tres passos para
                <br />
                <span className="text-[#0a1628]/40">comecar sua jornada</span>
              </h2>
            </div>

            {/* Steps */}
            <div className="grid gap-6 sm:grid-cols-3">
              {[
                {
                  icon: UserPlus,
                  step: "01",
                  title: "Crie seu perfil",
                  desc: "Cadastre-se gratuitamente e monte seu portfolio esportivo completo com foto, modalidade, nivel e localizacao.",
                  color: "text-[#009739]",
                  bg: "bg-[#009739]/8",
                  border: "border-[#009739]/20",
                  accent: "from-[#009739]",
                },
                {
                  icon: Trophy,
                  step: "02",
                  title: "Registre suas conquistas",
                  desc: "Adicione competicoes, resultados, testes fisicos e titulos. Construa um historico esportivo completo.",
                  color: "text-[#002776]",
                  bg: "bg-[#002776]/8",
                  border: "border-[#002776]/20",
                  accent: "from-[#002776]",
                },
                {
                  icon: Search,
                  step: "03",
                  title: "Seja descoberto",
                  desc: "Scouts e clubes de todo o Brasil encontram voce na plataforma. Compartilhe seu perfil nas redes sociais.",
                  color: "text-amber-600",
                  bg: "bg-amber-50",
                  border: "border-amber-200",
                  accent: "from-amber-500",
                },
              ].map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.step}
                    className="group relative overflow-hidden rounded-2xl border border-[#0a1628]/[0.06] bg-white p-8 transition-all hover:shadow-xl hover:shadow-[#009739]/5"
                  >
                    <div
                      className={`absolute top-0 left-0 h-1 w-full bg-gradient-to-r ${step.accent} via-transparent to-transparent`}
                    />
                    {/* Step number */}
                    <div className="text-[10px] font-bold tracking-[0.25em] text-[#0a1628]/20 uppercase mb-4">
                      Passo {step.step}
                    </div>
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${step.bg} border ${step.border} mb-5`}
                    >
                      <Icon className={`size-6 ${step.color}`} />
                    </div>
                    <h3 className="text-lg font-bold text-[#0a1628] tracking-tight mb-3">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[#0a1628]/50">
                      {step.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── PROFILE MOCK ─── */}
        <section className="relative bg-[#0a1628] py-24 sm:py-32 overflow-hidden">
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
                    Seu portfolio
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-[1.1]">
                  Veja como fica
                  <br />
                  <span className="text-white/30">o seu perfil</span>
                </h2>
                <p className="mt-6 text-base leading-relaxed text-white/40 max-w-md">
                  Um portfolio profissional que voce pode compartilhar com scouts, clubes e nas redes sociais. Tudo gratuito.
                </p>

                <div className="mt-8 space-y-3">
                  {[
                    "Perfil publico acessivel por link",
                    "Historico de competicoes e resultados",
                    "Badges de conquistas e titulos",
                    "Avaliacoes fisicas e tecnicas",
                    "Compartilhamento por WhatsApp e Instagram",
                  ].map((feat) => (
                    <div key={feat} className="flex items-center gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#009739]/15">
                        <Check className="size-3 text-[#009739]" />
                      </div>
                      <span className="text-sm text-white/60">{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  <Button
                    render={<Link href="/criar-conta" />}
                    className="h-11 rounded-xl bg-[#009739] px-6 text-sm font-bold text-white hover:bg-[#00b846] border-none"
                  >
                    Criar meu perfil gratis
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </div>
              </div>

              {/* Right — Profile card mock */}
              <div className="relative">
                <div className="rounded-2xl border border-white/[0.08] bg-white shadow-2xl overflow-hidden">
                  {/* Mock profile header */}
                  <div className="bg-gradient-to-br from-[#0a1628] to-[#0d1f38] px-6 py-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#009739] shadow-lg ring-4 ring-white/10">
                        <span className="text-xl font-bold text-white">JS</span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <h3 className="text-lg font-bold text-white">Joao Silva</h3>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#009739]/20 px-2.5 py-0.5 text-[11px] font-semibold text-[#4ade80] border border-[#009739]/30">
                            <Activity className="size-2.5" />
                            Atletismo
                          </span>
                          <span className="inline-flex items-center rounded-full bg-green-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-green-300 border border-green-500/30">
                            Nacional
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[12px] text-white/40">
                          <span>23 anos</span>
                          <span className="text-white/20">·</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3" />
                            Sao Paulo, SP
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {[
                        { icon: Trophy, value: "12", label: "Competicoes" },
                        { icon: Medal, value: "3", label: "Podios" },
                        { icon: Star, value: "8", label: "Avaliacoes" },
                      ].map((s) => {
                        const Icon = s.icon;
                        return (
                          <div
                            key={s.label}
                            className="flex flex-col items-center gap-0.5 rounded-lg border border-white/[0.05] bg-white/[0.03] py-2.5"
                          >
                            <Icon className="size-3.5 text-[#009739]" />
                            <span className="font-mono text-lg font-bold text-white">
                              {s.value}
                            </span>
                            <span className="text-[10px] text-white/30 uppercase tracking-wide">
                              {s.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recent results mock */}
                  <div className="px-5 py-4 bg-white">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#009739] mb-3">
                      Resultados Recentes
                    </p>
                    <div className="flex flex-col gap-2">
                      {[
                        { name: "Campeonato Estadual SP", pos: 1, mark: "10.42s", date: "mar. 2026" },
                        { name: "Torneio Nacional Atletismo", pos: 2, mark: "10.51s", date: "jan. 2026" },
                        { name: "Copa Brasil Atletismo", pos: 3, mark: "10.67s", date: "nov. 2025" },
                      ].map((r, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2.5 rounded-lg border border-gray-50 bg-gray-50/50 px-3 py-2"
                        >
                          <div
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded font-mono text-[11px] font-bold ${
                              r.pos === 1
                                ? "bg-amber-50 text-amber-600 border border-amber-200"
                                : r.pos === 2
                                ? "bg-gray-100 text-gray-500 border border-gray-200"
                                : "bg-orange-50 text-orange-500 border border-orange-200"
                            }`}
                          >
                            {r.pos}
                          </div>
                          <div className="flex flex-1 flex-col min-w-0">
                            <span className="truncate text-[12px] font-semibold text-gray-700">
                              {r.name}
                            </span>
                            <span className="text-[11px] text-gray-400">{r.date}</span>
                          </div>
                          <span className="font-mono text-[12px] font-bold text-gray-600">
                            {r.mark}
                          </span>
                          {r.pos <= 3 && (
                            <Trophy className="size-3 text-amber-400" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA inside mock */}
                  <div className="border-t border-gray-100 px-5 py-3 bg-gray-50/50 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">
                      brasilatleta.com.br/atleta/joao-silva
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#009739]">
                      Ver perfil completo
                      <ChevronRight className="size-3" />
                    </span>
                  </div>
                </div>

                {/* Floating badge */}
                <div className="absolute -top-3 -right-3 rounded-full bg-[#009739] px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-[#009739]/30">
                  100% Gratis
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── MODALITIES ─── */}
        <section className="relative py-20 sm:py-24 bg-[#fafaf8]">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="max-w-2xl mx-auto text-center mb-10">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px w-10 bg-[#009739]" />
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#009739]">
                  Modalidades
                </span>
                <div className="h-px w-10 bg-[#009739]" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0a1628]">
                Modalidades em destaque
              </h2>
              <p className="mt-3 text-sm text-[#0a1628]/50">
                Plataforma aberta para todos os esportes. Foco inicial em:
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {FOCUS_MODALITIES.map((m) => (
                <div
                  key={m.code}
                  className={`inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition-all hover:scale-105 cursor-default ${m.color}`}
                >
                  <span className="font-mono text-xs font-bold opacity-60">
                    {m.code}
                  </span>
                  {m.name}
                </div>
              ))}
              <div className="inline-flex items-center gap-2 rounded-xl border border-[#0a1628]/10 px-5 py-3 text-sm font-medium text-[#0a1628]/40">
                e mais 35 modalidades
              </div>
            </div>
          </div>
        </section>

        {/* ─── FOR CLUBS & SCOUTS ─── */}
        <section className="relative bg-[#0a1628] py-20 sm:py-24 overflow-hidden">
          <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-[#002776]/20 blur-[100px]" />

          <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
            <div className="mx-auto max-w-2xl">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 sm:p-10 backdrop-blur-sm text-center">
                <div className="flex justify-center mb-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#009739]/10 border border-[#009739]/20">
                    <Search className="size-6 text-[#009739]" />
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#009739]">
                    Em breve
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-3">
                  Para clubes, federacoes
                  <br />
                  <span className="text-white/40">e scouts</span>
                </h2>

                <p className="text-sm leading-relaxed text-white/40 mb-8 max-w-md mx-auto">
                  Encontre talentos em todo o Brasil. Acesse rankings, mapa de talentos e alertas de scouting personalizados.
                </p>

                {/* Email waitlist form — UI only */}
                <div className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto">
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    className="flex-1 h-10 rounded-lg border border-white/10 bg-white/[0.05] px-4 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#009739]/40 focus:bg-white/[0.08] transition-all"
                  />
                  <button
                    type="button"
                    className="h-10 rounded-lg bg-[#009739] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#00b846] whitespace-nowrap"
                  >
                    Quero ser avisado
                  </button>
                </div>

                <p className="mt-3 text-[11px] text-white/25">
                  Sem spam. Apenas uma notificacao quando abrir.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── FINAL CTA ─── */}
        <section className="relative py-24 sm:py-32 bg-[#fafaf8] overflow-hidden">
          <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-[#009739]/5 blur-[100px]" />

          <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0a1628]">
                Pronto para ser descoberto?
              </h2>
              <p className="mt-4 text-base text-[#0a1628]/45">
                Junte-se a milhares de atletas que ja constroem seu portfolio no Brasil Atleta. Totalmente gratuito.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  render={<Link href="/criar-conta" />}
                  className="h-12 rounded-xl bg-[#009739] px-8 text-sm font-bold text-white hover:bg-[#00b846] border-none"
                >
                  Criar perfil gratis
                  <ArrowRight className="ml-2 size-4" />
                </Button>
                <Button
                  render={<Link href="/login" />}
                  variant="outline"
                  className="h-12 rounded-xl px-8 text-sm font-medium"
                >
                  Ja tenho conta
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
              &copy; {new Date().getFullYear()} Brasil Atleta. Plataforma Nacional de Esporte Olimpico e Paralimpico.
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
