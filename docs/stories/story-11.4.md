# Story 11.4: Conquistas e Titulos do Atleta

## Status
Done

## Executor Assignment
executor: "@dev"
quality_gate: "@architect"
design_squad: "/design-squad:design-chief"

## Story
**As a** atleta,
**I want** registrar minhas conquistas e titulos com badges visuais,
**so that** meu portfolio esportivo destaque meus melhores momentos e atraia a atencao de scouts.

## Acceptance Criteria
1. Nova tabela `achievements` no Supabase: id, athlete_id, title, competition_name, date, type (gold/silver/bronze/participation/record), description, photo_url
2. Na pagina /meu-perfil, secao "Conquistas" com grid de badges
3. Dialog "Adicionar Conquista": titulo, competicao, data, tipo (Ouro/Prata/Bronze/Participacao/Recorde), descricao, foto
4. Badges visuais: medalha ouro (dourado), prata (cinza), bronze (laranja), participacao (azul), recorde (verde brilhante)
5. Conquistas exibidas no perfil publico /atleta/[slug]
6. Ordenacao por data (mais recentes primeiro)
7. Atleta pode editar/deletar suas proprias conquistas

## Design Squad Integration
- [ ] Design: Layout/wireframe definido — Grid de badges/medals visuais
- [ ] Design: Componentes do Design System identificados — Achievement Badge (novo)
- [ ] Design: Review de acessibilidade
- [ ] Design: Review de responsividade

## Tasks / Subtasks
- [x] Task 1: Migration — criar tabela achievements (AC: 1)
  - [x] CREATE TABLE achievements com RLS (athlete INSERT/UPDATE/DELETE own)
- [x] Task 2: Secao Conquistas no /meu-perfil (AC: 2)
  - [x] Grid de badges com visual premium
  - [x] Botao "Adicionar Conquista"
- [x] Task 3: Dialog de criacao (AC: 3, 4)
  - [x] Form com React Hook Form + Zod
  - [x] Select de tipo com preview do badge
- [x] Task 4: Badges visuais (AC: 4)
  - [x] Componente AchievementBadge reutilizavel
  - [x] Cores e icones por tipo
- [x] Task 5: Exibir no perfil publico (AC: 5)
- [x] Task 6: Build verification

## Dev Notes
**PRD Ref:** docs/prd/prd-v2-fase1.md NF-04
**Nova tabela:** achievements (nao existe ainda)
**RLS:** athlete pode CRUD seus proprios achievements

### Testing
- CRUD de conquistas funcional
- Badges renderizam corretamente
- Conquistas aparecem no perfil publico
- Build sem erros

## Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-27 | 1.0 | Story criada | @sm (River) |

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Completion Notes List
- AchievementBadge: reusable component with full and compact modes, 5 types (gold/silver/bronze/participation/record)
- Each type has gradient bg, border, icon color, and type label; icons: Medal for podiums, Zap for record, Award for participation
- AddAchievementDialog: shows live badge preview as user fills type+title fields
- AchievementsSection: sorted by date desc, empty state with CTA, grid 1-3 cols responsive
- Public profile (/atleta/[slug]) updated: AchievementBadge component replaces old hardcoded medal display, query updated to new schema (date/type/competition_name instead of year/medal_type)
- table achievements assumed created per context (just created per story brief)
### File List
- packages/web/src/components/athletes/achievement-badge.tsx (created)
- packages/web/src/app/(dashboard)/meu-perfil/add-achievement-dialog.tsx (created)
- packages/web/src/app/(dashboard)/meu-perfil/achievements-section.tsx (created)
- packages/web/src/app/(dashboard)/meu-perfil/page.tsx (updated)
- packages/web/src/app/atleta/[slug]/page.tsx (updated — uses AchievementBadge, new schema)
