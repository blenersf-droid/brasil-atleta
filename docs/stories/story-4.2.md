# Story 4.2: Registro de Resultados por Atleta/Competicao

## Status
Done

## Executor Assignment
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools: [build, typecheck]
design_squad: "/design-squad:design-chief"

## Story
**As a** tecnico ou gestor,
**I want** registrar resultados de atletas em competicoes (posicao, marca, tempo, pontuacao),
**so that** o historico competitivo de cada atleta seja construido progressivamente na plataforma.

## Acceptance Criteria
1. Na pagina de detalhes da competicao, botao "Adicionar Resultado"
2. Dialog para registrar resultado: selecionar atleta (busca), posicao, marca (texto livre), mark_numeric (numerico para comparacao), mark_unit (s, m, kg, pts), categoria (sub-15, sub-17, adulto)
3. Tabela de resultados na competicao: atleta, posicao, marca, categoria
4. No perfil do atleta (/athletes/[id]), tab "Resultados" mostrando historico de competicoes e resultados
5. Ordenacao por posicao e por data
6. Validacao: mesmo atleta nao pode ter dois resultados na mesma competicao

## Design Squad Integration
- [x] Design: Layout/wireframe definido
- [x] Design: Componentes do Design System identificados — Dialog, Table, Input, Select, Badge, Tabs
- [x] Design: Review de acessibilidade (WCAG 2.1 AA)
- [x] Design: Review de responsividade

## Tasks / Subtasks
- [x] Task 1: Botao e dialog de adicionar resultado na competicao (AC: 1, 2)
  - [x] Botao "Adicionar Resultado" na pagina de detalhes da competicao
  - [x] Form com busca de atleta (combobox) + campos de resultado
  - [x] React Hook Form + Zod
  - [x] Server action de insert em Supabase `results`
- [x] Task 2: Tabela de resultados na competicao (AC: 3, 5)
  - [x] Listar resultados com join em athletes
  - [x] Ordenacao por posicao (default) e por data
- [x] Task 3: Tab Resultados no perfil do atleta (AC: 4)
  - [x] Query resultados + competicoes do atleta
  - [x] Tabela cronologica com nome da competicao, grau, posicao, marca
- [x] Task 4: Validacao de duplicata e build (AC: 6)
  - [x] Unique constraint verificado via Supabase ou server action
  - [x] Mensagem de erro amigavel ao usuario
  - [x] `npm run build` sem erros
  - [x] `npm run typecheck` sem erros

## Dev Notes
**Schema Ref:** Tabela `results` em supabase/migrations/00001_initial_schema.sql
**Dependencias:** Story 4.1 (competicoes devem existir), Story 3.2 (atletas devem existir)
**mark_unit values:** s (segundos), m (metros), kg (quilogramas), pts (pontos)
**Categorias:** sub-15, sub-17, adulto
**PRD Ref:** FR-02.2, FR-02.3

### Testing
- Registrar resultado e verificar exibicao na tabela da competicao
- Verificar historico no perfil do atleta apos registro
- Tentar registrar resultado duplicado e verificar bloqueio com mensagem de erro
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
- Dialog de adicionar resultado criado em `competitions/[id]/add-result-dialog.tsx` — busca de atleta com debounce 300ms, dropdown de resultados, todos os campos do schema
- Validacao de duplicata via query `maybeSingle()` antes do insert — mensagem de erro amigavel via toast
- Tabela de resultados na pagina da competicao com join `athletes` via Supabase foreign key syntax
- Tab "Resultados" adicionada ao perfil do atleta — tabela cronologica com competicao (link), grau (badge), posicao, marca, categoria
- Posicoes 1/2/3 com highlighting visual (amber/slate/orange) na tabela de resultados da competicao
- Ordenacao por posicao ASC na query de resultados por competicao

### File List
- `packages/web/src/app/(dashboard)/competitions/[id]/add-result-dialog.tsx` (CREATED)
- `packages/web/src/app/(dashboard)/competitions/[id]/page.tsx` (MODIFIED — tabela de resultados)
- `packages/web/src/app/(dashboard)/athletes/[id]/page.tsx` (MODIFIED — tab Resultados adicionada)
