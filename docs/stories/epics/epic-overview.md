# Brasil Atleta — Epic Overview

**Status:** Draft
**Date:** 2026-03-26

---

## Fase 1: MVP — Fundacao (Epics 1-4)

### Epic 1: Infraestrutura e Setup do Projeto
**Objetivo:** Inicializar o projeto fullstack com toda a infraestrutura necessaria.
**Agentes:** @architect, @dev, @devops, @data-engineer
**Squad:** `/design-squad:design-chief` (Design System)

| Story | Titulo | Prioridade |
|-------|--------|-----------|
| 1.1 | Setup do monorepo Next.js 15 + Supabase + Tailwind | P0 |
| 1.2 | Configuracao do Supabase (projeto, auth, storage) | P0 |
| 1.3 | Design System — tema Brasil Atleta (cores, tipografia, componentes base) | P0 |
| 1.4 | Schema do banco de dados — migrations iniciais | P0 |
| 1.5 | RLS policies — governanca de acesso multi-nivel | P0 |
| 1.6 | Seed data — modalidades olimpicas, UFs, dados de referencia | P1 |

### Epic 2: Autenticacao e Gestao de Usuarios
**Objetivo:** Sistema de auth multi-nivel com roles hierarquicos e LGPD compliance.
**Agentes:** @dev, @architect
**Squad:** `/cybersecurity:cyber-chief` (Security review)

| Story | Titulo | Prioridade |
|-------|--------|-----------|
| 2.1 | Login/Registro com Supabase Auth (email + social) | P0 |
| 2.2 | Sistema de roles hierarquicos (Admin, Confederacao, Federacao, Clube, Tecnico, Atleta) | P0 |
| 2.3 | Onboarding flow por tipo de usuario | P0 |
| 2.4 | Termos de uso, politica de privacidade, cookies (LGPD) | P0 |
| 2.5 | MFA (Multi-Factor Authentication) | P1 |
| 2.6 | Gestao de perfil e preferencias | P1 |

### Epic 3: Cadastro de Entidades Core
**Objetivo:** CRUD completo para atletas, tecnicos e entidades esportivas.
**Agentes:** @dev, @data-engineer
**Squad:** `/design-squad:ux-designer` (Fluxos UX)

| Story | Titulo | Prioridade |
|-------|--------|-----------|
| 3.1 | CRUD de entidades esportivas com hierarquia (escola > clube > federacao > confederacao) | P0 |
| 3.2 | CRUD de atletas com perfil completo | P0 |
| 3.3 | CRUD de tecnicos/preparadores com certificacoes | P0 |
| 3.4 | Vinculacao atleta-entidade-tecnico com historico | P0 |
| 3.5 | Perfis paralimpicos (classificacao funcional, tipo de deficiencia) | P1 |
| 3.6 | Upload de midias (fotos, videos de desempenho) | P2 |
| 3.7 | Busca avancada de atletas com filtros multiplos | P1 |

### Epic 4: Competicoes e Resultados
**Objetivo:** Registro e acompanhamento de competicoes e desempenho.
**Agentes:** @dev, @data-engineer

| Story | Titulo | Prioridade |
|-------|--------|-----------|
| 4.1 | CRUD de competicoes com classificacao por grau (Base, Estadual, Nacional, Elite) | P0 |
| 4.2 | Registro de resultados por atleta/competicao | P0 |
| 4.3 | Codigos tecnicos por modalidade (ATL, NAT, JUD, VEL...) | P0 |
| 4.4 | Timeline de historico competitivo do atleta | P1 |
| 4.5 | Import em lote de resultados (CSV/Excel) | P1 |

---

## Fase 2: Inteligencia Esportiva (Epics 5-7)

### Epic 5: Dashboard de Scouting
**Objetivo:** Dashboards interativos para identificacao e acompanhamento de talentos.
**Agentes:** @dev, @architect
**Squad:** `/design-squad:design-chief` (Visualizacoes), `/data-squad:data-chief` (Analytics)

| Story | Titulo | Prioridade |
|-------|--------|-----------|
| 5.1 | Dashboard principal com KPIs agregados por modalidade | P0 |
| 5.2 | Rankings de desempenho por modalidade e categoria | P0 |
| 5.3 | Filtros interativos (faixa etaria, estado, entidade, modalidade, nivel) | P0 |
| 5.4 | Graficos de evolucao temporal de performance | P1 |
| 5.5 | Comparativo entre atletas (side-by-side) | P1 |
| 5.6 | Alertas de progressao acima da media | P2 |

### Epic 6: Mapa Nacional de Talentos
**Objetivo:** Visualizacao geoespacial da distribuicao de atletas no Brasil.
**Agentes:** @dev, @architect
**Squad:** `/design-squad:design-chief` (Mapa UX)

| Story | Titulo | Prioridade |
|-------|--------|-----------|
| 6.1 | Mapa interativo do Brasil com PostGIS + Mapbox | P0 |
| 6.2 | Clusters de atletas por estado/municipio | P0 |
| 6.3 | Filtros no mapa por modalidade, nivel, faixa etaria | P0 |
| 6.4 | Identificacao visual de polos esportivos vs vazios estruturais | P1 |
| 6.5 | Heatmap de densidade de talentos | P1 |
| 6.6 | Drill-down do mapa: estado > municipio > entidades > atletas | P1 |

### Epic 7: Testes Fisicos e Metricas de Performance
**Objetivo:** Registro e analise de testes fisicos/tecnicos com KPIs por modalidade.
**Agentes:** @dev, @data-engineer

| Story | Titulo | Prioridade |
|-------|--------|-----------|
| 7.1 | Registro de testes fisicos/tecnicos com protocolos padronizados | P0 |
| 7.2 | KPIs core: frequencia competitiva, progressao, estabilidade, evolucao relativa | P0 |
| 7.3 | Metricas especificas por modalidade (camadas tecnicas customizadas) | P1 |
| 7.4 | Graficos de evolucao de metricas ao longo do tempo | P1 |
| 7.5 | Metricas adaptadas para esporte paralimpico | P1 |

---

## Fase 3: Governance e Analytics Avancado (Epics 8-9)

### Epic 8: Funil Esportivo Nacional
**Objetivo:** Visualizacao e metricas do funil de desenvolvimento esportivo.
**Agentes:** @dev, @architect
**Squad:** `/data-squad:data-chief` (Growth metrics)

| Story | Titulo | Prioridade |
|-------|--------|-----------|
| 8.1 | Visualizacao do funil: Base > Estadual > Nacional > Elite | P0 |
| 8.2 | Taxas de retencao e conversao entre niveis | P1 |
| 8.3 | Analise de evasao por regiao/modalidade | P1 |
| 8.4 | Dashboard executivo para COB/CPB com indicadores agregados | P1 |

### Epic 9: Analytics com IA
**Objetivo:** Modelos preditivos e inteligencia artificial para scouting.
**Agentes:** @dev, @architect, @analyst

| Story | Titulo | Prioridade |
|-------|--------|-----------|
| 9.1 | Modelo preditivo de progressao atletica | P2 |
| 9.2 | Deteccao automatica de talentos de alto potencial | P2 |
| 9.3 | Alerta preditivo de risco de evasao esportiva | P2 |
| 9.4 | Recomendacoes automatizadas de perfis esportivos | P2 |

---

## Fase 4: Ecossistema (Epic 10)

### Epic 10: Mobile e Integracoes
**Objetivo:** App mobile e integracoes com sistemas de federacoes.
**Agentes:** @dev, @architect, @devops

| Story | Titulo | Prioridade |
|-------|--------|-----------|
| 10.1 | App mobile com React Native/Expo | P2 |
| 10.2 | APIs de integracao com sistemas de federacoes | P2 |
| 10.3 | Export de relatorios (PDF, Excel) | P1 |
| 10.4 | Notificacoes push (alertas de scouting) | P2 |

---

## Resumo de Priorizacao

| Fase | Epics | Stories | Estimativa |
|------|-------|---------|-----------|
| **Fase 1: MVP** | 1-4 | 24 stories | Primeiro milestone |
| **Fase 2: Inteligencia** | 5-7 | 17 stories | Segundo milestone |
| **Fase 3: Governance** | 8-9 | 8 stories | Terceiro milestone |
| **Fase 4: Ecossistema** | 10 | 4 stories | Quarto milestone |
| **Total** | **10 epics** | **53 stories** | — |

---

## Orquestracao de Squads

| Squad | Papel no Projeto | Epics |
|-------|-----------------|-------|
| **AIOX Core** (@dev, @qa, @architect, etc.) | Desenvolvimento principal | Todos |
| **Design Squad** (`/design-squad:design-chief`) | Design system, UX flows, dashboards, mapa | 1, 3, 5, 6 |
| **Data Squad** (`/data-squad:data-chief`) | Analytics, metricas, growth | 5, 7, 8 |
| **Cybersecurity** (`/cybersecurity:cyber-chief`) | Security audit, LGPD, RLS | 2 |
| **Brand Squad** (`/brand-squad:brand-chief`) | Identidade visual Brasil Atleta | 1 |
| **Copy Squad** (`/copy-squad:copy-chief`) | Textos, onboarding, landing page | 2, 3 |
| **Movement Squad** (`/movement:movement-chief`) | Estrategia de comunidade/adocao | 8, 10 |

---

*Epic Overview — Brasil Atleta v1.0.0*
