# Story 10.1: Export de Relatorios (PDF e Excel)

## Status
Done

## Executor Assignment
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools: [build, typecheck]

## Story
**As a** gestor de federacao ou confederacao,
**I want** exportar relatorios de atletas, competicoes e rankings em formato PDF e Excel,
**so that** eu possa apresentar dados a stakeholders, submeter relatorios institucionais e trabalhar offline com os dados.

## Acceptance Criteria
1. Botao "Exportar" nas paginas: atletas, competicoes, scouting
2. Opcoes de formato: PDF e Excel (CSV)
3. Export de atletas: tabela com nome, modalidade, nivel, estado, entidade, status
4. Export de competicoes: tabela com nome, data, grau, modalidade, local
5. Export de ranking/scouting: tabela com posicao, atleta, melhor resultado, competicoes
6. PDF com header "Brasil Atleta" e data de geracao
7. Excel/CSV com headers de coluna claros
8. Download automatico no navegador

## Tasks / Subtasks
- [x] Task 1: Utilidade de geracao CSV (AC: 7, 8)
  - [x] src/lib/export/csv.ts — funcao que converte array de objetos em CSV e faz download
- [x] Task 2: Utilidade de geracao PDF (AC: 6, 8)
  - [x] Usar html2canvas + jsPDF ou solucao server-side simples
  - [x] Alternativa: gerar HTML formatado e usar window.print() como PDF
- [x] Task 3: Botao export na listagem de atletas (AC: 1, 3)
- [x] Task 4: Botao export na listagem de competicoes (AC: 1, 4)
- [x] Task 5: Botao export no scouting (AC: 1, 5)
- [x] Task 6: Build verification

## Dev Notes
**Abordagem CSV:** Simples, sem dependencia — gerar string CSV e criar Blob para download
**Abordagem PDF:** Para MVP, usar window.print() com CSS @media print. Mais simples que jsPDF.
**PRD Ref:** Epic 10, Story 10.3 no epic-overview

### Testing
- Download CSV funciona em todos os browsers
- CSV abre corretamente no Excel
- Print/PDF tem header correto
- Build sem erros

## Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-27 | 1.0 | Story criada | @sm (River) |

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Completion Notes List
- CSV utility created with BOM for Excel compatibility
- ExportButton uses Base UI DropdownMenu with onClick (not onSelect)
- PDF export uses window.print() — no extra dependencies
- AthleteFilters wrapped in flex container alongside ExportButton
- Scouting page updated with functional_class from linter update
### File List
- packages/web/src/lib/export/csv.ts (created)
- packages/web/src/components/export/export-button.tsx (created)
- packages/web/src/app/(dashboard)/athletes/page.tsx (updated)
- packages/web/src/app/(dashboard)/competitions/page.tsx (updated)
- packages/web/src/app/(dashboard)/scouting/page.tsx (updated)
