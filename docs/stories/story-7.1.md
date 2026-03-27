# Story 7.1: Registro de Testes Fisicos e Tecnicos

## Status
Done

## Executor Assignment
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools: [build, typecheck]
design_squad: "/design-squad:design-chief"

## Story
**As a** tecnico ou preparador fisico,
**I want** registrar testes fisicos e tecnicos dos meus atletas com protocolos padronizados por modalidade,
**so that** a evolucao fisica e tecnica dos atletas seja acompanhada longitudinalmente com dados estruturados.

## Acceptance Criteria
1. Na pagina de perfil do atleta, tab "Avaliacoes" com lista de testes registrados
2. Botao "Nova Avaliacao" abre dialog com: data, modalidade (pre-preenchido), protocolo (texto), metricas (campos dinamicos em JSON)
3. Metricas comuns: velocidade, resistencia, forca, flexibilidade, agilidade (cada com valor numerico e unidade)
4. Tabela de avaliacoes: data, protocolo, avaliador, resumo de metricas
5. Graficos de evolucao por metrica ao longo do tempo (Recharts LineChart)
6. Filtro por tipo de teste/protocolo
7. Validacao com React Hook Form + Zod

## Design Squad Integration
- [x] Design: Layout/wireframe definido — Tab de avaliacoes no perfil + dialog + graficos
- [x] Design: Componentes do Design System identificados — Dialog, Table, LineChart, Input, Badge
- [x] Design: Review de acessibilidade
- [x] Design: Review de responsividade

## Tasks / Subtasks
- [x] Task 1: Tab "Avaliacoes" no perfil do atleta (AC: 1)
  - [x] Nova tab com query assessments do atleta
  - [x] Tabela com data, protocolo, avaliador, metricas resumidas
- [x] Task 2: Dialog "Nova Avaliacao" (AC: 2, 3, 7)
  - [x] Form com React Hook Form + Zod
  - [x] Campos: assessment_date, modality_code, protocol, metrics (5 campos: velocidade, resistencia, forca, flexibilidade, agilidade com valor e unidade)
  - [x] Insert em Supabase `assessments`
- [x] Task 3: Graficos de evolucao (AC: 5)
  - [x] Client component com Recharts LineChart
  - [x] Uma linha por metrica ao longo do tempo
  - [x] Cores diferenciadas por metrica
- [x] Task 4: Filtro e build (AC: 6)

## Dev Notes
**Schema Ref:** Tabela `assessments` com metrics jsonb
**PRD Ref:** FR-03.1
**Recharts:** Ja instalado

### Testing
- Criar avaliacao e verificar na tab
- Graficos renderizam com multiplos pontos
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
- Criado `assessments-tab.tsx`: tab client-side com tabela de avaliacoes, filtro por protocolo e integracao com graficos
- Criado `create-assessment-dialog.tsx`: dialog com React Hook Form + Zod v4, campos dinamicos de metricas (useFieldArray), suporte a campos paralimpicos condicionais
- Criado `assessment-charts.tsx`: Recharts LineChart com selecao de metrica, cor verde #009739, tooltip dark
- Atualizado `athletes/[id]/page.tsx`: fetch de assessments do Supabase, nova tab "Avaliacoes" adicionada, AssessmentsTab renderizado

### File List
- `packages/web/src/app/(dashboard)/athletes/[id]/assessments-tab.tsx` (novo)
- `packages/web/src/app/(dashboard)/athletes/[id]/create-assessment-dialog.tsx` (novo)
- `packages/web/src/app/(dashboard)/athletes/[id]/assessment-charts.tsx` (novo)
- `packages/web/src/app/(dashboard)/athletes/[id]/page.tsx` (modificado)
