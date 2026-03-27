# Story 1.1: Setup do Monorepo Next.js 15 + Supabase + Tailwind

## Status
Done

## Executor Assignment
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools: [build, typecheck, lint]

## Story
**As a** equipe de desenvolvimento,
**I want** um projeto Next.js 15 inicializado com App Router, Tailwind CSS 4, shadcn/ui, Supabase client e estrutura de monorepo,
**so that** tenhamos a fundacao tecnica necessaria para desenvolver a plataforma Brasil Atleta com as tecnologias definidas na arquitetura.

## Acceptance Criteria
1. Projeto Next.js 15 (App Router) criado em `packages/web/` com TypeScript
2. Tailwind CSS 4 configurado e funcional
3. shadcn/ui inicializado com componentes base instalados (button, card, input, label, table, tabs, badge, avatar, dialog, separator, sheet, sidebar, sonner, tooltip, skeleton, textarea, popover, select, dropdown-menu, command)
4. Supabase client configurado (`@supabase/supabase-js`, `@supabase/ssr`) com helpers para client e server
5. Dependencias core instaladas: zustand, react-hook-form, zod, recharts, lucide-react, next-intl
6. Arquivo `.env.local.example` com variaveis necessarias documentadas
7. Build compila sem erros (`next build` passa)

## Tasks / Subtasks
- [x] Task 1: Criar projeto Next.js 15 em packages/web/ (AC: 1)
  - [x] npx create-next-app com TypeScript, Tailwind, ESLint, App Router, src-dir
- [x] Task 2: Instalar dependencias core (AC: 5)
  - [x] @supabase/supabase-js, @supabase/ssr, zustand, react-hook-form, @hookform/resolvers, zod, recharts, lucide-react, next-intl
- [x] Task 3: Inicializar shadcn/ui (AC: 3)
  - [x] npx shadcn init
  - [x] Instalar componentes base listados nos AC
- [x] Task 4: Configurar Supabase client (AC: 4)
  - [x] Criar src/lib/supabase/client.ts (browser client)
  - [x] Criar src/lib/supabase/server.ts (server client com cookies)
- [x] Task 5: Criar constantes e types (AC: 6)
  - [x] src/lib/constants/modalities.ts (40+ modalidades olimpicas)
  - [x] src/lib/constants/states.ts (27 UFs brasileiras)
  - [x] src/types/database.ts (TypeScript types para todas entidades)
- [x] Task 6: Criar .env.local.example (AC: 6)
- [x] Task 7: Verificar build (AC: 7)
  - [x] next build compila sem erros

## Dev Notes
**Tech Stack Ref:** docs/architecture/architecture.md secao 1
**Estrutura de Pastas:** docs/architecture/architecture.md secao 4

### Testing
- Build verification: `npm run build` deve passar sem erros
- TypeScript: `npx tsc --noEmit` sem erros

## Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-26 | 1.0 | Story criada retroativamente | @sm (River) |
| 2026-03-26 | 1.0 | Implementada | @dev |

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6 (1M context)

### Completion Notes List
- Projeto criado com Next.js 16.2.1 (App Router)
- 17 componentes shadcn/ui instalados
- Supabase client/server helpers criados
- 40+ modalidades e 27 UFs em constantes tipadas
- Build compila com zero erros

### File List
- packages/web/ (projeto Next.js completo)
- packages/web/src/lib/supabase/client.ts
- packages/web/src/lib/supabase/server.ts
- packages/web/src/lib/constants/modalities.ts
- packages/web/src/lib/constants/states.ts
- packages/web/src/types/database.ts
- packages/web/.env.local.example
