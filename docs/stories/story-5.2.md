# Story 5.2: Rankings de Desempenho por Modalidade

## Status
Done

## Executor Assignment
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools: [build, typecheck]
design_squad: "/design-squad:design-chief"

## Story
**As a** scout ou tecnico,
**I want** visualizar rankings de desempenho por modalidade e categoria,
**so that** eu possa identificar os melhores atletas em cada contexto competitivo.

## Acceptance Criteria
1. Pagina /dashboard/scouting com rankings por modalidade
2. Select de modalidade no topo — muda os dados do ranking
3. Tabela de ranking: posicao (#), atleta (avatar + nome), melhor resultado, numero de competicoes, nivel, estado
4. Filtro por categoria (sub-15, sub-17, adulto, etc.)
5. Filtro por periodo (ultimo ano, ultimos 2 anos, todos)
6. Ranking calculado por melhor mark_numeric dos resultados
7. Link no nome do atleta para seu perfil

## Design Squad Integration
- [x] Design: Layout/wireframe definido — Ranking table com podium visual
- [x] Design: Componentes do Design System identificados — Table, Select, Badge, Avatar
- [x] Design: Review de acessibilidade
- [x] Design: Review de responsividade

## Tasks / Subtasks
- [x] Task 1: Pagina de scouting /dashboard/scouting (AC: 1)
- [x] Task 2: Select de modalidade e filtros (AC: 2, 4, 5)
- [x] Task 3: Tabela de ranking (AC: 3, 6, 7)
  - [x] Query com join results + athletes + competitions
  - [x] Ordenar por melhor mark_numeric
  - [x] Top 3 destacados visualmente (ouro, prata, bronze)
- [x] Task 4: Build verification

## Dev Notes
**Schema Ref:** Tabelas results + athletes + competitions com JOINs
**PRD Ref:** FR-04.2
**Ranking Logic:** Agrupar resultados por atleta+modalidade, pegar melhor mark_numeric

### Testing
- Rankings mostram atletas ordenados corretamente
- Filtros funcionam
- Build sem erros

## Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-26 | 1.0 | Story criada | @sm (River) |
| 2026-03-26 | 1.1 | Implementacao completa — build passou | @dev (Dex) |

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6

### Completion Notes List
- Criou /scouting como Server Component com query de 2 etapas (competitions -> results)
- Filtros: select de modalidade (MODALITIES), input de categoria com debounce, select de periodo
- Ranking calculado em-memoria: agrupa por atleta, seleciona melhor mark_numeric, conta competicoes unicas
- Tabela com Avatar + link para /athletes/[id], marca numerica com unidade, badge de nivel
- Top 3 com estilo podium: #1 ouro, #2 prata, #3 bronze (bg + cor do numero)
- ScoutingFilters: Client Component separado usando useRouter/useSearchParams
- Build: 17 pages, 0 erros

### File List
- packages/web/src/app/(dashboard)/scouting/page.tsx — CREATED (Server Component)
- packages/web/src/app/(dashboard)/scouting/scouting-filters.tsx — CREATED (Client Component)
