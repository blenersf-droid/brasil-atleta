# Story 7.3: Metricas Adaptadas para Esporte Paralimpico

## Status
Done

## Executor Assignment
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools: [build, typecheck]
design_squad: "/design-squad:design-chief"

## Story
**As a** tecnico de esporte paralimpico,
**I want** registrar e visualizar metricas de performance adaptadas para a classificacao funcional do atleta,
**so that** a avaliacao de desempenho considere as particularidades de cada classe funcional, garantindo equidade analitica.

## Acceptance Criteria
1. No perfil de atleta paralimpico, secao "Metricas Paralimpicas" com classificacao funcional visivel
2. Avaliacoes de atletas paralimpicos incluem campo de classe funcional no formulario
3. Rankings e comparativos filtram por classe funcional (nao comparam classes diferentes)
4. Badge de classe funcional nos resultados e perfil
5. Campo opcional de "adaptacoes necessarias" no registro de avaliacao

## Design Squad Integration
- [x] Design: Layout/wireframe definido
- [x] Design: Componentes do Design System identificados — Badge (classe funcional), Card, Input
- [x] Design: Review de acessibilidade
- [x] Design: Review de responsividade

## Tasks / Subtasks
- [x] Task 1: Secao Metricas Paralimpicas no perfil (AC: 1)
  - [x] Condicional: so aparece se is_paralympic = true (ja existia no perfil)
  - [x] Exibe classificacao funcional e tipo de deficiencia
- [x] Task 2: Campo de classe funcional nas avaliacoes (AC: 2, 5)
  - [x] Adicionar campos no dialog de avaliacao (functional_class, adaptations)
- [x] Task 3: Filtro por classe funcional no scouting (AC: 3)
  - [x] Adicionar filtro de functional_class na pagina de scouting/rankings
- [x] Task 4: Badges de classe funcional (AC: 4)
  - [x] Badge "P" paralimpico nos cards de atletas no scouting
  - [x] Exibicao da classe funcional abaixo do nome no ranking
- [x] Task 5: Build verification

## Dev Notes
**Schema Ref:** athletes.paralympic_classification jsonb, athletes.is_paralympic
**PRD Ref:** FR-03.5, FR-01.5
**IPC Classes:** T/F (track/field), S (swimming), etc. — usar texto livre para flexibilidade

### Testing
- Metricas aparecem apenas para paralimpicos
- Filtro por classe funcional funciona
- Build sem erros

## Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-27 | 1.0 | Story criada | @sm (River) |
| 2026-03-26 | 1.1 | Implementacao completa | @dev (Dex) |

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6

### Completion Notes List
- Atualizado `create-assessment-dialog.tsx`: campos condicionais de classe funcional e adaptacoes quando is_paralympic=true
- Atualizado `scouting-filters.tsx`: novo filtro de texto para classe funcional
- Atualizado `scouting/page.tsx`: parametro functional_class no searchParams, filtragem no loop de resultados, badge "P" e exibicao de classe funcional no ranking
- Perfil do atleta ja tinha secao "Informacoes Paralimpicas" condicional (badge "P" no avatar, card com classificacao e deficiencia)

### File List
- `packages/web/src/app/(dashboard)/athletes/[id]/create-assessment-dialog.tsx` (modificado)
- `packages/web/src/app/(dashboard)/scouting/scouting-filters.tsx` (modificado)
- `packages/web/src/app/(dashboard)/scouting/page.tsx` (modificado)
