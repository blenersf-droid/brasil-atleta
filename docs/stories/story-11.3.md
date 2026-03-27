# Story 11.3: Completude de Perfil com Significado

## Status
Done

## Executor Assignment
executor: "@dev"
quality_gate: "@architect"
design_squad: "/design-squad:ux-designer"

## Story
**As a** atleta,
**I want** ver quanto do meu perfil esta completo com dicas contextuais sobre o que falta preencher,
**so that** eu me sinta motivado a completar meu portfolio e entenda que cada dado aumenta minhas chances de ser descoberto.

## Acceptance Criteria
1. Barra de progresso visual no topo do /meu-perfil mostrando % de completude
2. Checklist de completude: foto (15%), bio (10%), modalidade (10%), ao menos 1 competicao (20%), ao menos 1 resultado (20%), ao menos 1 avaliacao (15%), ao menos 1 conquista (10%)
3. Dicas contextuais ao lado de cada item incompleto: "Adicione sua foto — perfis com foto recebem 3x mais visualizacoes"
4. Card de sugestao quando perfil < 50%: "Complete seu perfil para ser descoberto por scouts"
5. Animacao de progresso quando um item e concluido (barra avanca, confetti sutil)
6. Cores: verde para completo, amarelo para parcial, cinza para vazio
7. Nao e gamificacao vazia — cada mensagem conecta ao valor real de ser descoberto

## Design Squad Integration
- [ ] Design: Layout/wireframe definido — Barra de progresso + checklist + dicas
- [ ] Design: Componentes do Design System identificados
- [ ] Design: Review de acessibilidade
- [ ] Design: Review de responsividade

## Tasks / Subtasks
- [x] Task 1: Componente ProfileCompleteness (AC: 1, 2)
  - [x] Calcular % baseado nos criterios
  - [x] Barra de progresso visual com cor gradiente
- [x] Task 2: Checklist com dicas (AC: 3, 6)
  - [x] Lista de itens com status (completo/incompleto)
  - [x] Dica contextual para cada item incompleto
  - [x] Link direto para adicionar o item faltante
- [x] Task 3: Card de sugestao (AC: 4)
  - [x] Exibir quando perfil < 50%
  - [x] CTA claro para completar proximo item
- [x] Task 4: Integrar no /meu-perfil (AC: 5, 7)
- [x] Task 5: Build verification

## Dev Notes
**PRD Ref:** docs/prd/prd-v2-fase1.md NF-03
**Messaging:** Conectar cada dica ao proposito de ser descoberto (Sinek/Advisory Board)

### Testing
- Barra mostra 0% para perfil vazio
- Cada item completado aumenta %
- Dicas mudam conforme contexto
- Build sem erros

## Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-27 | 1.0 | Story criada | @sm (River) |

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Completion Notes List
- ProfileCompleteness is a pure client component receiving pre-computed boolean props from the server page
- Weights: photo(15%), bio(10%), modality(10%), competition(20%), result(20%), assessment(15%), achievement(10%) = 100%
- Progress bar uses CSS clip-path trick for gradient color that tracks the actual progress %
- Amber banner "Complete seu perfil" shown when percent < 50
- Each missing item shows: label, weight badge, tip text, hover-revealed action hint
- Completed items shown with green check + strikethrough label
- Integrated in meu-perfil page between header separator and stats cards
### File List
- packages/web/src/components/athletes/profile-completeness.tsx (created)
- packages/web/src/app/(dashboard)/meu-perfil/page.tsx (updated)
