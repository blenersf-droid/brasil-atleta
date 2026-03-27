# Story 11.5: Landing Page B2C — "Seu Portfolio Esportivo"

## Status
Done

## Executor Assignment
executor: "@dev"
quality_gate: "@architect"
design_squad: "/design-squad:design-chief"

## Story
**As a** visitante (atleta potencial),
**I want** entender imediatamente que o Brasil Atleta e uma plataforma gratuita para criar meu portfolio esportivo,
**so that** eu me sinta motivado a criar minha conta e comecar a construir meu perfil.

## Acceptance Criteria
1. Landing page reposicionada para B2C (atleta como publico principal)
2. Hero: "Seu portfolio esportivo. Seja descoberto." com CTA "Criar perfil gratis"
3. Secao "Como funciona": 3 steps (Crie seu perfil -> Adicione suas conquistas -> Seja descoberto)
4. Secao com mock de perfil de atleta mostrando como fica
5. Secao de modalidades foco com badges: Futebol, Atletismo, Natacao, Judo, Jiu-Jitsu (+ "e mais 35 modalidades")
6. Secao "Para clubes e federacoes" (teaser da Fase 2 — "Em breve: encontre talentos")
7. Social proof: numeros (atletas cadastrados, modalidades, estados)
8. Footer com links uteis
9. Design premium mantendo estetica "Athletic Data Monument" mas com tom mais acessivel/jovem
10. Mobile-first — perfeito no celular

## Design Squad Integration
- [x] Design: Layout/wireframe definido — Landing B2C com foco no atleta
- [x] Design: Componentes do Design System identificados
- [x] Design: Review de acessibilidade
- [x] Design: Review de responsividade (MOBILE-FIRST)

## Tasks / Subtasks
- [x] Task 1: Redesign do hero (AC: 1, 2)
  - [x] Novo headline focado no atleta: "Seu portfolio esportivo. Seja descoberto."
  - [x] CTA "Criar perfil gratis" (verde, grande)
  - [x] Sub-CTA "Ja tem conta? Entrar" (link secundario)
- [x] Task 2: Secao "Como funciona" (AC: 3)
  - [x] 3 steps visuais com icones e descricoes curtas
- [x] Task 3: Mock de perfil (AC: 4)
  - [x] Componente visual simulando um perfil preenchido (Joao Silva — Atletismo — Nacional — SP)
  - [x] Stats: 12 competicoes, 3 podios, 8 avaliacoes
  - [x] Resultados recentes mockados
- [x] Task 4: Modalidades foco (AC: 5)
  - [x] 5 badges destacados (FUT, ATL, NAT, JUD, JJB) + "e mais 35 modalidades"
- [x] Task 5: Secao entidades (AC: 6)
  - [x] Teaser "Em breve" com formulario de email para waitlist (UI only)
- [x] Task 6: Social proof e footer (AC: 7, 8)
  - [x] Stats: 27 estados, 40+ modalidades, 100K atletas, 100% gratis
  - [x] Footer mantido do design original
- [x] Task 7: Build verification

## Dev Notes
**PRD Ref:** docs/prd/prd-v2-fase1.md NF-06
**Landing atual:** src/app/page.tsx — substituida
**Design:** Manter estetica Athletic Data Monument mas com tom mais jovem e acessivel
**Advisory Board:** Sinek recomendou messaging "Seja descoberto" conectado ao proposito
**Modalidades foco:** FUT, ATL, NAT, JUD, JJB

### Testing
- Landing renderiza perfeitamente em mobile
- CTAs levam para /criar-conta
- Social proof mostra dados
- Build sem erros

## Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-27 | 1.0 | Story criada | @sm (River) |
| 2026-03-26 | 1.1 | Implementacao completa — reescrita da landing page B2C | @dev (Dex) |

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6

### Completion Notes List
- src/app/page.tsx reescrito mantendo estetica "Athletic Data Monument" + reposicionamento B2C
- Navbar: CTA alterado para "Criar perfil gratis" (verde) + link "Entrar" secundario
- Hero: headline em 3 linhas — "Seu portfolio esportivo." (branco) + "Seja descoberto." (amarelo #FEDD00)
- Secao "Como funciona" com 3 cards (UserPlus/Trophy/Search icons) — estetica premium
- Profile mock card completo com header dark, stats, resultados recentes mockados (Joao Silva, Atletismo, SP)
- Feature list com checkmarks mostrando beneficios do perfil
- Secao de 5 modalidades foco + contador de mais 35
- Secao "Para clubes" com email input + waitlist (UI only, sem backend)
- Stats section atualizada: 27 estados, 40+ modalidades, 100K atletas, 100% Gratis
- Footer identico ao original
- Build verificado: compilacao TypeScript passou sem erros

### File List
- src/app/page.tsx (MODIFIED) — landing page B2C reescrita
