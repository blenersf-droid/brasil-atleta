# Story 5.1: Dashboard Principal com KPIs Agregados

## Status
Done

## Executor Assignment
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools: [build, typecheck, visual-review]
design_squad: "/design-squad:design-chief"

## Story
**As a** gestor nacional ou de confederacao,
**I want** um dashboard principal com KPIs agregados por modalidade, regiao e nivel competitivo,
**so that** eu tenha visao estrategica do estado do esporte brasileiro para tomada de decisao baseada em dados.

## Acceptance Criteria
1. Pagina /dashboard substitui o placeholder atual com dashboard real
2. Cards de KPI no topo: total de atletas, total de entidades, total de competicoes, atletas ativos
3. Grafico de barras: distribuicao de atletas por regiao (Norte, Nordeste, Centro-Oeste, Sudeste, Sul) usando Recharts
4. Grafico de pizza: distribuicao por nivel competitivo (Base, Estadual, Nacional, Elite)
5. Grafico de barras horizontais: top 10 modalidades por numero de atletas
6. Tabela: ultimas competicoes registradas (5 mais recentes)
7. Cards adaptam conteudo conforme role do usuario (admin ve tudo, clube ve seus dados)
8. Design premium "Athletic Data Monument" com graficos escuros e accents verdes

## Design Squad Integration
- [x] Design: Layout/wireframe definido — Grid de KPIs + graficos + tabela
- [x] Design: Componentes do Design System identificados — Card, Recharts customizado, Table, Badge
- [x] Design: Review de acessibilidade
- [x] Design: Review de responsividade

## Tasks / Subtasks
- [x] Task 1: Substituir dashboard placeholder (AC: 1)
  - [x] Server component com queries agregadas
- [x] Task 2: Cards de KPI (AC: 2)
  - [x] Query counts de athletes, entities, competitions
  - [x] Cards com icones e valores monoespacados
- [x] Task 3: Graficos com Recharts (AC: 3, 4, 5)
  - [x] BarChart distribuicao por regiao
  - [x] PieChart por nivel competitivo
  - [x] Horizontal BarChart top 10 modalidades
  - [x] Tema escuro com cores Brasil (verde, amarelo, azul)
- [x] Task 4: Tabela de competicoes recentes (AC: 6)
- [x] Task 5: Adaptacao por role (AC: 7)
- [x] Task 6: Build verification

## Dev Notes
**Schema Ref:** Queries agregadas em athletes, entities, competitions
**Recharts:** Ja instalado (Story 1.1)
**Role Ref:** src/lib/auth/roles.ts — getSession() retorna role
**States Ref:** src/lib/constants/states.ts — BRAZILIAN_STATES com campo `region`
**PRD Ref:** FR-04.1
**Design:** Graficos devem usar tema escuro (#0a1628 bg) com verde (#009739) como cor primaria

### Testing
- KPIs mostram valores corretos
- Graficos renderizam com dados
- Dashboard adapta por role
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
- Substituiu placeholder com dashboard real (Server Component)
- 4 KPIs cards: Total Atletas, Total Entidades, Total Competicoes, Atletas Ativos
- RegionChart: BarChart vertical com 5 regioes brasileiras (verde #009739)
- LevelChart: PieChart com 4 niveis + legenda customizada
- ModalityChart: BarChart horizontal top 10 modalidades
- Tabela de 5 competicoes mais recentes com badges de nivel
- Role-based query scoping: admins/confederacoes/federacoes veem tudo; clubes/tecnicos filtram por entity_id
- Todos graficos em tema escuro (#0a1628) com accent verde (#009739)
- Build: 17 pages, 0 erros

### File List
- packages/web/src/app/(dashboard)/dashboard/page.tsx — REPLACED (Server Component)
- packages/web/src/app/(dashboard)/dashboard/charts.tsx — CREATED (Client Component: RegionChart, LevelChart, ModalityChart)
