# Brasil Atleta - Documento de Arquitetura

**Version:** 1.0.0
**Date:** 2026-03-26
**Status:** Draft

---

## 1. Pilha Tecnologica

### Frontend
| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Framework | **Next.js 15** (App Router) | SSR/SSG para SEO, performance, React Server Components |
| UI Library | **React 19** | Ecossistema maduro, componentes reutilizaveis |
| Styling | **Tailwind CSS 4** | Utility-first, design system consistente, dark mode |
| Design System | **shadcn/ui** + componentes customizados | Acessivel (WCAG 2.1), componentes sem lock-in |
| Mapas | **Mapbox GL JS** ou **Leaflet** | Mapa nacional de talentos interativo |
| Graficos | **Recharts** + **D3.js** | Dashboards de scouting, KPIs, funil esportivo |
| Forms | **React Hook Form** + **Zod** | Validacao type-safe dos formularios complexos |
| State | **Zustand** | Estado global leve para filtros de dashboard |
| i18n | **next-intl** | Portugues (principal) + Ingles (COI) |

### Backend
| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| BaaS | **Supabase** | Auth, DB, Storage, Realtime, RLS nativo |
| Database | **PostgreSQL 16** (via Supabase) | Relacional robusto, extensoes geoespaciais (PostGIS) |
| Auth | **Supabase Auth** | Multi-provider, MFA, roles hierarquicos |
| Storage | **Supabase Storage** | Videos/fotos de desempenho, documentos |
| Edge Functions | **Supabase Edge Functions** (Deno) | Logica server-side, webhooks, integracao |
| Geoespacial | **PostGIS** | Mapa nacional de talentos, queries geograficas |
| Search | **pg_trgm** + Full Text Search | Busca avancada de atletas |

### Mobile
| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Framework | **React Native** (Expo) | Compartilhar logica com web, deploy iOS/Android |
| Navigation | **Expo Router** | File-based routing, deep linking |

### Infraestrutura
| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Hosting | **Vercel** | Deploy automatico, edge network, preview deploys |
| CDN | **Vercel Edge Network** | Cache global para assets e paginas estaticas |
| CI/CD | **GitHub Actions** | Automacao de testes, lint, deploy |
| Monitoring | **Sentry** | Error tracking, performance monitoring |
| Analytics | **PostHog** ou **Plausible** | Privacy-first analytics (LGPD) |

---

## 2. Arquitetura de Alto Nivel

```
┌────────────────────────────────────────────────────────────┐
│                    CLIENTES                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Web App    │  │  Mobile App  │  │   Admin      │     │
│  │  (Next.js)   │  │  (Expo)      │  │  Dashboard   │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└─────────┼─────────────────┼─────────────────┼──────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌────────────────────────────────────────────────────────────┐
│                    SUPABASE                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   API Gateway                         │  │
│  │              (PostgREST + GoTrue)                     │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │                                   │
│  ┌──────────┐ ┌────────┴────────┐ ┌───────────────────┐   │
│  │   Auth   │ │   PostgreSQL    │ │     Storage       │   │
│  │ (GoTrue) │ │   + PostGIS     │ │ (Videos, Fotos)   │   │
│  │  MFA     │ │   + RLS         │ │                   │   │
│  └──────────┘ └─────────────────┘ └───────────────────┘   │
│                         │                                   │
│  ┌──────────────────────┴───────────────────────────────┐  │
│  │              Edge Functions (Deno)                    │  │
│  │  - Calculos de KPI        - Alertas de scouting      │  │
│  │  - Modelos preditivos     - Webhooks                  │  │
│  │  - Processamento de dados - Export/Import             │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## 3. Modelo de Dados (Schema)

### 3.1 Tabelas Principais

```sql
-- Entidades esportivas (hierarquia)
entities
├── id (uuid, PK)
├── name (text)
├── type (enum: school, club, training_center, federation, confederation, committee)
├── parent_entity_id (uuid, FK → entities) -- hierarquia
├── state (text) -- UF
├── city (text)
├── modalities (text[]) -- codigos: ATL, NAT, JUD...
├── level (enum: municipal, state, national)
├── logo_url (text)
└── timestamps

-- Atletas
athletes
├── id (uuid, PK)
├── user_id (uuid, FK → auth.users)
├── full_name (text)
├── birth_date (date)
├── gender (enum: M, F, NB)
├── state (text) -- UF de nascimento
├── city (text)
├── photo_url (text)
├── primary_modality (text) -- codigo tecnico
├── secondary_modalities (text[])
├── competitive_level (enum: school, state, national, elite)
├── status (enum: active, inactive, retired)
├── is_paralympic (boolean)
├── paralympic_classification (jsonb) -- classe funcional, tipo deficiencia
├── current_entity_id (uuid, FK → entities)
└── timestamps

-- Tecnicos / Profissionais
coaches
├── id (uuid, PK)
├── user_id (uuid, FK → auth.users)
├── full_name (text)
├── specialization (text)
├── certifications (jsonb[])
├── academic_background (text)
├── entity_id (uuid, FK → entities)
├── modalities (text[])
└── timestamps

-- Vinculos Atleta-Entidade (historico)
athlete_entities
├── id (uuid, PK)
├── athlete_id (uuid, FK → athletes)
├── entity_id (uuid, FK → entities)
├── coach_id (uuid, FK → coaches)
├── start_date (date)
├── end_date (date, nullable)
├── role (text) -- ex: atleta titular, reserva
└── is_current (boolean)

-- Competicoes
competitions
├── id (uuid, PK)
├── name (text)
├── date_start (date)
├── date_end (date)
├── location_state (text)
├── location_city (text)
├── grade (enum: school, state, national, elite) -- grau
├── modality_code (text) -- ATL, NAT, JUD...
├── organizing_entity_id (uuid, FK → entities)
└── timestamps

-- Resultados
results
├── id (uuid, PK)
├── athlete_id (uuid, FK → athletes)
├── competition_id (uuid, FK → competitions)
├── position (integer, nullable)
├── mark (text) -- tempo, distancia, pontuacao (formato livre)
├── mark_numeric (numeric) -- valor numerico para comparacao
├── mark_unit (text) -- s, m, kg, pts
├── category (text) -- sub-15, sub-17, adulto, etc.
├── notes (text)
└── timestamps

-- Testes Fisicos/Tecnicos
assessments
├── id (uuid, PK)
├── athlete_id (uuid, FK → athletes)
├── assessment_date (date)
├── modality_code (text)
├── protocol (text) -- nome do protocolo
├── metrics (jsonb) -- metricas especificas por modalidade
├── evaluator_id (uuid, FK → coaches)
├── entity_id (uuid, FK → entities)
└── timestamps

-- KPIs de Performance (calculados)
performance_kpis
├── id (uuid, PK)
├── athlete_id (uuid, FK → athletes)
├── period (text) -- "2025-Q1", "2025"
├── competitive_frequency (integer) -- # competicoes
├── result_progression (numeric) -- % melhora
├── performance_stability (numeric) -- desvio padrao
├── relative_evolution (numeric) -- vs categoria etaria
├── modality_specific (jsonb) -- KPIs customizados por esporte
└── timestamps

-- Alertas de Scouting
scouting_alerts
├── id (uuid, PK)
├── athlete_id (uuid, FK → athletes)
├── alert_type (enum: progression_spike, talent_detected, dropout_risk)
├── severity (enum: low, medium, high)
├── description (text)
├── data (jsonb)
├── is_read (boolean)
├── created_at (timestamp)
└── target_entity_id (uuid, FK → entities)

-- Midias
media
├── id (uuid, PK)
├── athlete_id (uuid, FK → athletes)
├── type (enum: video, photo, document)
├── url (text)
├── title (text)
├── competition_id (uuid, FK → competitions, nullable)
└── timestamps
```

### 3.2 Row Level Security (RLS)

```
Politica de Acesso:
1. Atleta → ve somente seu proprio perfil
2. Tecnico → ve atletas sob seu acompanhamento
3. Clube → ve atletas vinculados ao clube
4. Federacao → ve dados agregados de sua modalidade no estado
5. Confederacao → ve dados agregados da modalidade nacional
6. COB/CPB (Admin Nacional) → ve tudo (dados agregados)
```

### 3.3 PostGIS — Dados Geograficos

```sql
-- Extensao para mapa de talentos
CREATE EXTENSION IF NOT EXISTS postgis;

-- Adicionar coluna de geolocalizacao
ALTER TABLE entities ADD COLUMN location geography(POINT, 4326);
ALTER TABLE athletes ADD COLUMN birth_location geography(POINT, 4326);

-- Indices espaciais para queries de mapa
CREATE INDEX idx_entities_location ON entities USING GIST(location);
CREATE INDEX idx_athletes_birth_location ON athletes USING GIST(birth_location);
```

---

## 4. Estrutura de Pastas (Monorepo)

```
sys-brasil-atleta/
├── packages/
│   ├── web/                    # Next.js 15 app
│   │   ├── app/
│   │   │   ├── (auth)/         # Login, Register, Forgot Password
│   │   │   ├── (dashboard)/    # Area logada
│   │   │   │   ├── athletes/   # CRUD + perfil de atletas
│   │   │   │   ├── competitions/ # Competicoes e resultados
│   │   │   │   ├── scouting/   # Dashboard de scouting
│   │   │   │   ├── talent-map/ # Mapa nacional de talentos
│   │   │   │   ├── funnel/     # Funil esportivo nacional
│   │   │   │   ├── entities/   # Gestao de entidades
│   │   │   │   ├── coaches/    # Gestao de tecnicos
│   │   │   │   └── settings/   # Configuracoes
│   │   │   ├── (public)/       # Paginas publicas
│   │   │   │   ├── page.tsx    # Landing page
│   │   │   │   └── about/
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/             # Design system (shadcn + custom)
│   │   │   ├── dashboard/      # Componentes de dashboard
│   │   │   ├── maps/           # Componentes de mapa
│   │   │   ├── charts/         # Componentes de graficos
│   │   │   └── forms/          # Formularios complexos
│   │   ├── lib/
│   │   │   ├── supabase/       # Client + server Supabase
│   │   │   ├── utils/          # Utilidades
│   │   │   └── constants/      # Constantes (modalidades, UFs, etc.)
│   │   └── types/              # TypeScript types
│   │
│   ├── mobile/                 # React Native (Expo) — Fase 4
│   │   └── ...
│   │
│   └── shared/                 # Codigo compartilhado
│       ├── types/              # Types compartilhados web/mobile
│       ├── constants/          # Constantes compartilhadas
│       └── utils/              # Utilidades compartilhadas
│
├── supabase/
│   ├── migrations/             # SQL migrations
│   ├── functions/              # Edge Functions
│   ├── seed.sql                # Dados iniciais (modalidades, UFs)
│   └── config.toml
│
├── docs/                       # Documentacao do projeto
├── squads/                     # Agentes AIOX
├── .aiox-core/                 # Framework AIOX
└── .claude/                    # Claude Code config
```

---

## 5. Design System — Diretrizes

### 5.1 Identidade Visual

- **Cores primarias:** Verde (#009739) e Amarelo (#FEDD00) — cores do Brasil
- **Cor secundaria:** Azul (#002776) — bandeira do Brasil
- **Neutros:** Tons de cinza para backgrounds e textos
- **Accent:** Cores por modalidade esportiva (diferenciacao visual)
- **Dark mode:** Suporte nativo

### 5.2 Tipografia
- **Headings:** Inter (bold, sem serifa)
- **Body:** Inter (regular)
- **Data/Numbers:** JetBrains Mono (monoespacada para metricas)

### 5.3 Componentes Core
- Cards de atleta com foto, modalidade, nivel, KPIs resumidos
- Tabelas de ranking com sort e filtros
- Graficos de evolucao temporal (line charts)
- Mapa interativo com clusters e filtros
- Funil visual com taxas de conversao
- Badges de nivel competitivo (Base, Estadual, Nacional, Elite)
- Timeline de historico competitivo

### 5.4 Acessibilidade (WCAG 2.1 AA)
- Contraste minimo 4.5:1
- Navegacao por teclado completa
- Screen reader labels
- Focus indicators visiveis
- Suporte a preferencias de reducao de movimento

---

## 6. Decisoes Arquiteturais

| Decisao | Escolha | Alternativa Considerada | Razao |
|---------|---------|------------------------|-------|
| BaaS vs Backend custom | Supabase | API Node.js custom | Velocidade de desenvolvimento, RLS nativo, Auth pronto |
| SSR Framework | Next.js 15 | Remix, Nuxt | Ecossistema React, Vercel deploy, Server Components |
| Mapas | Mapbox GL JS | Google Maps, Leaflet | Performance com grandes datasets, customizacao visual |
| Graficos | Recharts | Chart.js, Victory | React-native, API declarativa, responsividade |
| Mobile | React Native (Expo) | Flutter | Compartilhamento de tipos e logica com web |
| Geoespacial | PostGIS | MongoDB Geo | Integracao nativa com PostgreSQL/Supabase |

---

*Arquitetura — Brasil Atleta v1.0.0*
