# Story 4.1: CRUD de Competicoes com Classificacao por Grau

## Status
Done

## Executor Assignment
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools: [build, typecheck]
design_squad: "/design-squad:design-chief"

## Story
**As a** gestor de federacao ou confederacao,
**I want** registrar competicoes esportivas com classificacao por grau (Base escolar, Estadual, Nacional, Alto rendimento),
**so that** cada evento tenha seu nivel hierarquico definido, permitindo analises normalizadas por contexto competitivo.

## Acceptance Criteria
1. Listagem de competicoes em tabela com: nome, data, local (estado/cidade), grau (badge), modalidade, entidade organizadora
2. Filtros por grau, modalidade, estado, periodo (data inicio/fim)
3. Formulario de criacao: nome, data_start, data_end, location_state, location_city, grade (school/state/national/elite), modality_code, organizing_entity_id
4. Formulario de edicao com mesmos campos
5. Pagina de detalhes da competicao com lista de resultados vinculados
6. Paginacao server-side
7. Busca por nome
8. Grade badges: Base=gray, Estadual=blue, Nacional=green, Elite=gold

## Design Squad Integration
- [x] Design: Layout/wireframe definido
- [x] Design: Componentes do Design System identificados — Table, Badge, Dialog, Input, Select, Card
- [x] Design: Review de acessibilidade (WCAG 2.1 AA)
- [x] Design: Review de responsividade

## Tasks / Subtasks
- [x] Task 1: Pagina de listagem /dashboard/competitions (AC: 1, 6, 7)
  - [x] Server component com query Supabase paginada
  - [x] Tabela com badges de grau e modalidade
  - [x] Busca por nome com debounce
- [x] Task 2: Filtros (AC: 2)
  - [x] Client component com filtros por grau, modalidade, estado, periodo
  - [x] URL search params
- [x] Task 3: Formulario de criacao (AC: 3)
  - [x] Dialog com React Hook Form + Zod
  - [x] Select para entidade organizadora
  - [x] Date inputs para data_start e data_end
- [x] Task 4: Formulario de edicao (AC: 4)
  - [x] Reutilizar form de criacao com dados pre-preenchidos
  - [x] Server action de update
- [x] Task 5: Pagina de detalhes /dashboard/competitions/[id] (AC: 5)
  - [x] Info da competicao + lista de resultados
- [x] Task 6: Build verification
  - [x] `npm run build` sem erros
  - [x] `npm run typecheck` sem erros

## Dev Notes
**Schema Ref:** Tabela `competitions` em supabase/migrations/00001_initial_schema.sql
**Grades:** school, state, national, elite (competitive_level enum)
**Modalities:** src/lib/constants/modalities.ts
**States:** src/lib/constants/states.ts
**PRD Ref:** FR-02.1

### Testing
- CRUD completo funcional
- Filtros e busca operando corretamente
- Paginacao server-side verificada
- Build: `npm run build` sem erros
- Typecheck: `npm run typecheck` sem erros

## Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-26 | 1.0 | Story criada | @sm (River) |
| 2026-03-26 | 1.1 | Implementacao completa | @dev (Dex) |

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6

### Completion Notes List
- Pagina de listagem criada em `packages/web/src/app/(dashboard)/competitions/page.tsx` — server component com paginacao 10/page, busca ilike, filtros por grau/modalidade/estado
- Filtros criados em `competition-filters.tsx` — client component com debounce de 400ms e URL search params
- Dialog de criacao em `create-competition-dialog.tsx` — React Hook Form + Zod, busca de entidades, todos os campos do schema
- Pagina de detalhes em `competitions/[id]/page.tsx` — info completa da competicao + tabela de resultados com join em athletes
- Badges de grau: school=gray, state=blue, national=green, elite=amber (consistente com padrao do projeto)
- Organizernames resolvidos com query adicional de entities para evitar joins complexos

### File List
- `packages/web/src/app/(dashboard)/competitions/page.tsx` (CREATED)
- `packages/web/src/app/(dashboard)/competitions/competition-filters.tsx` (CREATED)
- `packages/web/src/app/(dashboard)/competitions/create-competition-dialog.tsx` (CREATED)
- `packages/web/src/app/(dashboard)/competitions/[id]/page.tsx` (CREATED)
