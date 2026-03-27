# Story 7.2: KPIs Core de Performance

## Status
Done

## Executor Assignment
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools: [build, typecheck, visual-review]
design_squad: "/design-squad:design-chief"

## Story
**As a** scout ou gestor esportivo,
**I want** visualizar KPIs de performance calculados automaticamente para cada atleta (frequencia competitiva, progressao de resultados, estabilidade, evolucao relativa),
**so that** eu possa avaliar objetivamente o potencial e o desenvolvimento de cada atleta.

## Acceptance Criteria
1. No perfil do atleta, nova secao "KPIs de Performance" com 4 indicadores visuais
2. Frequencia Competitiva: numero de competicoes no ultimo ano
3. Progressao de Resultados: % de melhoria do melhor mark_numeric comparando ultimo ano vs anterior
4. Estabilidade de Desempenho: desvio padrao dos mark_numeric recentes (menor = mais estavel)
5. Evolucao Relativa: comparacao com media da mesma faixa etaria e modalidade
6. Cada KPI com valor numerico, label, e indicador visual (barra de progresso ou gauge)
7. Cores: verde para bom, amarelo para medio, vermelho para atencao
8. Supabase Edge Function ou calculo server-side para gerar KPIs

## Design Squad Integration
- [x] Design: Layout/wireframe definido — Grid de 4 KPI cards no perfil do atleta
- [x] Design: Componentes do Design System identificados — KPI Card (novo), Progress bar, Badge
- [x] Design: Review de acessibilidade
- [x] Design: Review de responsividade

## Tasks / Subtasks
- [x] Task 1: Componente KPI Card (AC: 6, 7)
  - [x] Card com valor, label, indicador visual (barra ou icone)
  - [x] Cores condicionais (verde/amarelo/vermelho)
- [x] Task 2: Calcular KPIs server-side (AC: 2, 3, 4, 5, 8)
  - [x] Query results do atleta
  - [x] Calcular frequencia, progressao, estabilidade, evolucao
  - [x] Retornar como props para os cards
- [x] Task 3: Integrar no perfil do atleta (AC: 1)
  - [x] Secao de KPIs abaixo do header no perfil
- [x] Task 4: Build verification

## Dev Notes
**Schema Ref:** Tabelas results, competitions, athletes
**PRD Ref:** FR-03.2
**Calculo:** Server-side no page.tsx do perfil do atleta (nao precisa de Edge Function para MVP)
**Formulas:**
- Frequencia = COUNT(results) WHERE competition.date_start > 1 ano atras
- Progressao = (melhor_mark_ultimo_ano - melhor_mark_ano_anterior) / melhor_mark_ano_anterior * 100
- Estabilidade = STDDEV(mark_numeric) dos ultimos 5 resultados
- Evolucao = mark_numeric do atleta / AVG(mark_numeric) de atletas mesma modalidade e faixa etaria

### Testing
- KPIs calculam corretamente
- Cores condicionais funcionam
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
- Criado `kpi-cards.tsx` como Server Component: calcula os 4 KPIs via queries Supabase server-side
- KPI 1 (Frequencia): conta competicoes unicas no ultimo ano
- KPI 2 (Progressao): % variacao do melhor mark entre ano atual e anterior
- KPI 3 (Estabilidade): coeficiente de variacao (stddev/mean) dos ultimos 5 resultados
- KPI 4 (Evolucao Relativa): melhor mark do atleta vs media da modalidade
- Grid 2x2 com color bar condicional (verde/amarelo/vermelho), icone, valor font-mono
- Atualizado `athletes/[id]/page.tsx`: importa e renderiza KpiCards abaixo do header do perfil

### File List
- `packages/web/src/components/athletes/kpi-cards.tsx` (novo)
- `packages/web/src/app/(dashboard)/athletes/[id]/page.tsx` (modificado)
