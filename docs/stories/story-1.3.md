# Story 1.3: Design System Brasil Atleta

## Status
Done

## Executor Assignment
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools: [build, visual-review]
design_squad: "/design-squad:design-chief"

## Story
**As a** equipe de design e desenvolvimento,
**I want** um design system completo com as cores do Brasil (verde #009739, amarelo #FEDD00, azul #002776), tipografia distintiva e componentes base estilizados,
**so that** toda a plataforma tenha identidade visual coesa, institucional e de alto padrao, refletindo a seriedade de uma plataforma nacional de esporte.

## Acceptance Criteria
1. Tema CSS com variaveis customizadas (oklch) para cores primaria (verde), secundaria (amarelo) e accent (azul)
2. Suporte a dark mode com variaveis complementares
3. Tipografia: DM Sans para body/headings, JetBrains Mono para dados/numeros
4. Landing page com hero dark "Athletic Data Monument", stats monoespacados, feature cards, secao institucional
5. Login page com split layout (branding dark + formulario claro)
6. Componentes shadcn/ui estilizados com o tema Brasil Atleta
7. Acessibilidade WCAG 2.1 AA (contraste minimo 4.5:1)
8. Design aprovado pelo Design Squad

## Design Squad Integration
- [x] Design: Layout/wireframe definido — Estetica "Athletic Data Monument" (Bloomberg meets Olympic Committee)
- [x] Design: Componentes do Design System identificados — shadcn base + customizacoes de cor/tipografia
- [x] Design: Review de acessibilidade (WCAG 2.1 AA) — Contrastes verificados em light e dark
- [x] Design: Review de responsividade — Mobile/tablet/desktop verificados

## Tasks / Subtasks
- [x] Task 1: Configurar tema CSS (AC: 1, 2)
  - [x] Definir variaveis oklch em globals.css para light mode
  - [x] Definir variaveis oklch em globals.css para dark mode
  - [x] Cores de charts com paleta Brasil
- [x] Task 2: Configurar tipografia (AC: 3)
  - [x] DM Sans via next/font/google
  - [x] JetBrains Mono via next/font/google
  - [x] CSS variables --font-sans e --font-mono
- [x] Task 3: Landing page de alto impacto (AC: 4)
  - [x] Navbar dark com branding "Brasil Atleta"
  - [x] Hero com pattern topografico, pulsos animados, tipografia ultra-bold
  - [x] Stats bar com font-mono (scoreboard feel)
  - [x] Feature cards com gradientes de topo (verde/azul/amarelo)
  - [x] Secao "Command Center" dark com parceiros institucionais (COB, CPB, ME)
  - [x] CTA final + footer institucional
- [x] Task 4: Login page split layout (AC: 5)
  - [x] Painel esquerdo dark com branding, frase bold, stats
  - [x] Painel direito claro com formulario, labels uppercase
- [x] Task 5: Verificar build e acessibilidade (AC: 6, 7)

## Dev Notes
**Design Direction:** "Athletic Data Monument" — fusao de editorial esportivo com terminal de dados financeiro. Dark hero como estadio a noite, cores do Brasil como accent lighting.
**Design Ref:** `/frontend-design:frontend-design` skill utilizada para qualidade visual premium.
**PRD Ref:** docs/prd/prd.md secao 5 (Design System guidelines)
**Arch Ref:** docs/architecture/architecture.md secao 5

### Testing
- Build: `npm run build` sem erros
- Visual: Screenshots capturadas e validadas

## Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-26 | 1.0 | Story criada retroativamente | @sm (River) |
| 2026-03-26 | 1.0 | Tema inicial implementado | @dev |
| 2026-03-26 | 2.0 | Redesign com frontend-design skill — upgrade dramatico | Design Squad + @dev |

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6 (1M context)

### Completion Notes List
- Tema CSS verde/amarelo/azul aplicado com oklch em light e dark mode
- Tipografia: DM Sans (body) + JetBrains Mono (dados)
- Landing page redesenhada com estetica "Athletic Data Monument"
- Login page com split layout responsivo
- Screenshots capturadas: screenshots/landing-v2.png, screenshots/login-v2.png

### File List
- packages/web/src/app/globals.css (tema CSS)
- packages/web/src/app/layout.tsx (fontes)
- packages/web/src/app/page.tsx (landing page)
- packages/web/src/app/(auth)/login/page.tsx (login page)
