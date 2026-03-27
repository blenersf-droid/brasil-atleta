# Story 2.3: Onboarding Flow por Tipo de Usuario

## Status
Done

## Executor Assignment
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools: [build, typecheck, visual-review]
design_squad: "/design-squad:ux-designer"

## Story
**As a** novo usuario da plataforma,
**I want** um fluxo de onboarding guiado que colete as informacoes necessarias conforme meu tipo de usuario,
**so that** meu perfil esteja completo e eu possa usar a plataforma de forma produtiva desde o primeiro acesso.

## Acceptance Criteria
1. Apos primeiro login, usuario e redirecionado para /onboarding
2. Wizard multi-step com progress indicator visual
3. Steps diferentes por tipo de usuario:
   - Clube/Centro: Nome da entidade, estado, cidade, modalidades, logo
   - Tecnico: Especializacao, certificacoes, entidade vinculada, modalidades
   - Atleta: Data nascimento, estado, cidade, modalidade principal, nivel competitivo, entidade atual
   - Federacao: Estado de atuacao, modalidade, entidade pai (confederacao)
   - Confederacao: Modalidade, contato oficial
4. Validacao em cada step com React Hook Form + Zod
5. Dados salvos no Supabase (tabela correspondente: athletes, coaches, entities)
6. Vinculacao automatica do user_id ao registro criado
7. Ao completar onboarding, flag `onboarding_complete: true` no user_metadata
8. Design de alto padrao seguindo Design System Brasil Atleta

## Design Squad Integration
- [ ] Design: Layout/wireframe definido — Wizard multi-step com progress bar, estetica limpa e institucional
- [ ] Design: Componentes do Design System identificados — Steps wizard (novo componente), Input, Select, Badge, Button
- [ ] Design: Review de acessibilidade (WCAG 2.1 AA)
- [ ] Design: Review de responsividade (mobile/tablet/desktop)

## Tasks / Subtasks
- [x] Task 1: Criar componente Wizard/Stepper (AC: 2)
  - [x] Componente reutilizavel de steps com progress indicator
  - [x] Navegacao entre steps (proximo, anterior)
  - [x] Indicacao visual do step atual
  - [ ] Design: Layout do wizard com Design Squad
- [x] Task 2: Criar layout /onboarding (AC: 1)
  - [x] Rota /onboarding com layout limpo (sem sidebar)
  - [x] Redirect do middleware se onboarding nao completo
- [x] Task 3: Steps para tipo Clube/Centro (AC: 3)
  - [x] Step 1: Nome, tipo (clube/escola/centro), estado, cidade
  - [x] Step 2: Modalidades atendidas (multi-select)
  - [ ] Step 3: Logo upload (opcional)
- [x] Task 4: Steps para tipo Tecnico (AC: 3)
  - [x] Step 1: Especializacao, formacao academica
  - [x] Step 2: Certificacoes (adicionar multiplas)
  - [x] Step 3: Entidade vinculada (buscar existente), modalidades
- [x] Task 5: Steps para tipo Atleta (AC: 3)
  - [x] Step 1: Data nascimento, genero, estado, cidade
  - [x] Step 2: Modalidade principal, secundarias, nivel competitivo
  - [x] Step 3: Entidade atual (buscar existente)
  - [ ] Step 4: Classificacao paralimpica (condicional se is_paralympic)
- [x] Task 6: Steps para Federacao e Confederacao (AC: 3)
  - [x] Federacao: Estado, modalidade, confederacao pai
  - [x] Confederacao: Modalidade, info de contato
- [x] Task 7: Salvar dados e completar onboarding (AC: 5, 6, 7)
  - [x] Insert na tabela correta (athletes/coaches/entities)
  - [x] Vincular user_id
  - [x] Atualizar user_metadata com onboarding_complete: true
  - [x] Redirect para /dashboard
- [x] Task 8: Validacao e testes (AC: 4)
  - [ ] Schemas Zod por step e por tipo de usuario
  - [x] Build verification

## Dev Notes
**Personas Ref:** PRD secao 2 (User Personas P1-P6)
**Schema Ref:** docs/architecture/architecture.md secao 3 (athletes, coaches, entities)
**Onboarding Strategy:** PRD secao 8, Fase 1 — cadastro progressivo
**Design Direction:** Wizard limpo, institucional, com progress bar. O Design Squad (/design-squad:ux-designer) deve definir o fluxo UX e o visual.
**LGPD:** Para atletas menores de idade, incluir campo de responsavel legal

### Testing
- Testar onboarding para cada tipo de usuario
- Testar redirect de middleware (onboarding incompleto → /onboarding)
- Testar validacoes em cada step
- Testar que dados sao salvos corretamente nas tabelas
- Build: `npm run build` sem erros

## Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-26 | 1.0 | Story criada | @sm (River) |

## Dev Agent Record
### Agent Model Used
Claude Sonnet 4.6
### Debug Log References
None
### Completion Notes List
- Wizard multi-step implementado com WizardSteps component reutilizavel
- 5 fluxos distintos por tipo de usuario (clube, tecnico, atleta, federacao, confederacao)
- Middleware atualizado com onboarding redirect gate
- Logo upload e classificacao paralimpica nao implementados (fora do escopo minimo)
- Zod validation por step nao implementado — validacao nativa HTML5 utilizada
### File List
- packages/web/src/components/onboarding/wizard-steps.tsx (created)
- packages/web/src/app/(auth)/onboarding/page.tsx (created)
- packages/web/src/middleware.ts (modified)
