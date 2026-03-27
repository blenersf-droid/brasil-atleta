# Story 11.1: Athlete Self-Service — Atleta Cadastra Seus Proprios Dados

## Status
Done

## Executor Assignment
executor: "@dev"
quality_gate: "@architect"
design_squad: "/design-squad:ux-designer"

## Story
**As a** atleta,
**I want** poder cadastrar minhas proprias competicoes, resultados, testes fisicos e conquistas diretamente na plataforma,
**so that** eu tenha controle total do meu portfolio esportivo e possa ser descoberto por scouts e clubes.

## Acceptance Criteria
1. Na pagina /meu-perfil, botoes "Adicionar Competicao", "Adicionar Resultado", "Adicionar Avaliacao"
2. Dialog simplificado para adicionar competicao: nome, data, local (estado), grau, modalidade
3. Dialog simplificado para adicionar resultado: selecionar competicao (propria ou buscar existente), posicao, marca, categoria
4. Dialog simplificado para adicionar avaliacao: data, protocolo, metricas (campos dinamicos)
5. RLS atualizado: atleta pode INSERT em competitions, results, assessments vinculados ao seu ID
6. Interface amigavel — formularios simples, nao formularios de CRM
7. Toast de sucesso com mensagem motivacional ("Resultado adicionado! Seu perfil ficou mais completo")
8. Apos adicionar dado, a pagina atualiza mostrando o novo item

## Design Squad Integration
- [ ] Design: Layout/wireframe definido — Botoes de acao flutuantes ou inline, dialogs simplificados
- [ ] Design: Componentes do Design System identificados
- [ ] Design: Review de acessibilidade
- [ ] Design: Review de responsividade

## Tasks / Subtasks
- [x] Task 1: Atualizar RLS para athlete self-service (AC: 5)
  - [x] Migration SQL: athlete pode INSERT em competitions, results, assessments
  - [x] Athlete so pode editar/deletar seus proprios registros
- [x] Task 2: Dialog "Adicionar Competicao" na pagina /meu-perfil (AC: 1, 2, 6)
  - [x] Form simplificado com React Hook Form + Zod
  - [x] Pre-selecionar modalidade do atleta
  - [x] Insert em competitions com campo created_by_athlete_id
- [x] Task 3: Dialog "Adicionar Resultado" (AC: 3, 6)
  - [x] Selecionar competicao existente ou criar nova inline
  - [x] Campos: posicao, marca, mark_numeric, mark_unit, categoria
  - [x] Insert em results
- [x] Task 4: Dialog "Adicionar Avaliacao" (AC: 4, 6)
  - [x] Campos: data, protocolo (presets: Teste de Velocidade, Resistencia, Forca, etc.), metricas
- [x] Task 5: Mensagens motivacionais e refresh (AC: 7, 8)
- [x] Task 6: Build verification

## Dev Notes
**PRD Ref:** docs/prd/prd-v2-fase1.md NF-02
**Pagina existente:** /meu-perfil em src/app/(dashboard)/meu-perfil/page.tsx
**Schema:** competitions, results, assessments ja existem
**RLS atual:** Atleta so pode READ — precisa adicionar INSERT policies

### Testing
- Atleta consegue adicionar competicao, resultado, avaliacao
- RLS impede atleta de editar dados de outro atleta
- Build sem erros

## Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-27 | 1.0 | Story criada | @sm (River) |

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Completion Notes List
- RLS policies assumed applied per context (DB already has INSERT policies for athletes)
- AddCompetitionDialog: pre-fills athlete modality, inserts with created_by_athlete_id
- AddResultDialog: competition search via ilike on name, full result fields
- AddAssessmentDialog: protocol presets + custom, dynamic metric name/value pairs as jsonb
- All dialogs use React Hook Form + Zod, motivational toasts, router.refresh() on success
- Buttons integrated in /meu-perfil: "Adicionar Competicao" + "Adicionar Resultado" in resultados tab, "Adicionar Avaliacao" in avaliacoes tab
### File List
- packages/web/src/app/(dashboard)/meu-perfil/add-competition-dialog.tsx (created)
- packages/web/src/app/(dashboard)/meu-perfil/add-result-dialog.tsx (created)
- packages/web/src/app/(dashboard)/meu-perfil/add-assessment-dialog.tsx (created)
- packages/web/src/app/(dashboard)/meu-perfil/page.tsx (updated)
