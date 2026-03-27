# Story 4.3: Codigos Tecnicos por Modalidade e Timeline Competitiva

## Status
Done

## Executor Assignment
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools: [build, typecheck, visual-review]
design_squad: "/design-squad:design-chief"

## Story
**As a** tecnico ou scout,
**I want** visualizar o historico competitivo completo de um atleta em uma timeline cronologica com codigos tecnicos por modalidade,
**so that** eu possa avaliar a progressao do atleta ao longo do tempo e tomar decisoes de scouting baseadas em dados.

## Acceptance Criteria
1. Timeline visual cronologica no perfil do atleta mostrando competicoes e resultados ao longo do tempo
2. Cada entrada na timeline: data, nome da competicao, grau (badge), resultado (posicao + marca)
3. Filtro por periodo (ano) na timeline
4. Codigos tecnicos das modalidades (ATL, NAT, JUD, etc.) exibidos como badges nos resultados
5. Indicador visual de progressao (melhoria/piora comparando com resultado anterior da mesma modalidade)
6. Design premium seguindo estetica "Athletic Data Monument"

## Design Squad Integration
- [x] Design: Layout/wireframe definido — Timeline vertical com cards de resultado
- [x] Design: Componentes do Design System identificados — Timeline (novo componente), Badge, Card, Separator
- [x] Design: Review de acessibilidade (WCAG 2.1 AA)
- [x] Design: Review de responsividade

## Tasks / Subtasks
- [x] Task 1: Componente Timeline reutilizavel (AC: 1, 2, 6)
  - [x] Timeline vertical com marcador de data, titulo e area de conteudo
  - [x] Design premium seguindo estetica "Athletic Data Monument"
  - [x] Exportar como componente em src/components/ui/timeline.tsx
- [x] Task 2: Integrar timeline no perfil do atleta (AC: 1, 3)
  - [x] Substituir placeholder na tab Historico/Timeline em /athletes/[id]
  - [x] Query resultados + competicoes do atleta ordenados por data DESC
  - [x] Filtro por ano via select (URL search param)
- [x] Task 3: Badges de codigo tecnico de modalidade (AC: 4)
  - [x] Badge com codigo tecnico (ATL, NAT, JUD, etc.) em cada entrada da timeline
  - [x] Mapeamento a partir de src/lib/constants/modalities.ts
- [x] Task 4: Indicador visual de progressao (AC: 5)
  - [x] Calcular delta comparando mark_numeric com resultado anterior da mesma modalidade
  - [x] Seta verde para cima (melhoria), seta vermelha para baixo (piora), traco neutro (primeiro resultado)
  - [x] Tooltip com valor do delta
- [x] Task 5: Build verification
  - [x] `npm run build` sem erros
  - [x] `npm run typecheck` sem erros

## Dev Notes
**Schema Ref:** Tabelas `results` e `competitions` com join em supabase/migrations/00001_initial_schema.sql
**Modalidades Ref:** src/lib/constants/modalities.ts — codigos tecnicos (ex: ATL, NAT, JUD)
**Progressao:** Comparar `mark_numeric` entre resultados da mesma modalidade ordenados por data; maior valor = melhor ou pior depende da modalidade (ex: tempo menor = melhor em corrida, distancia maior = melhor em salto)
**Dependencias:** Story 4.1 (competicoes), Story 4.2 (resultados), Story 3.2 (perfil do atleta)
**PRD Ref:** FR-02.3, FR-02.4
**Design:** Timeline e um componente novo — Design Squad deve definir o visual antes da implementacao

### Testing
- Timeline renderiza entradas corretamente com dados reais
- Filtro por ano exibe apenas resultados do periodo selecionado
- Badges de modalidade exibidos corretamente
- Indicadores de progressao calculados e exibidos corretamente
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
- Componente Timeline criado em `src/components/ui/timeline.tsx` — reutilizavel, props tipadas, dots coloridos por trend, cards premium, estado vazio
- Dot colors: verde (#009739) para melhoria, vermelho para piora, cinza neutro para primeiro resultado
- Logica de progressao: para `mark_unit === 's'` menor e melhor (tempo); para m/kg/pts maior e melhor
- Filtro por ano via URL search param `year` — links para cada ano disponivel nos resultados
- Badge de codigo tecnico (ATL, NAT, etc.) exibido em cada entrada da timeline
- Delta calculado e exibido com seta TrendingUp/TrendingDown e valor (+0.5s, -2.3m etc.)
- Legenda visual de cores adicionada acima da timeline
- Tab "Historico" substituida — placeholder removido, timeline completa com dados reais
- Estado vazio amigavel quando sem resultados

### File List
- `packages/web/src/components/ui/timeline.tsx` (CREATED)
- `packages/web/src/app/(dashboard)/athletes/[id]/page.tsx` (MODIFIED — tab Historico com Timeline, filtro por ano, indicadores de progressao)
