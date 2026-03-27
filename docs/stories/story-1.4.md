# Story 1.4: Schema do Banco de Dados

## Status
Done

## Executor Assignment
executor: "@data-engineer"
quality_gate: "@dev"
quality_gate_tools: [sql-review, migration-test]

## Story
**As a** arquiteto de dados,
**I want** um schema PostgreSQL completo com PostGIS, enums, RLS policies e seed data para o Brasil Atleta,
**so that** a base de dados esteja pronta para suportar todas as entidades do sistema (atletas, tecnicos, entidades, competicoes, resultados, testes, KPIs, alertas, midias).

## Acceptance Criteria
1. Extensoes habilitadas: pgcrypto, postgis, pg_trgm
2. Enums criados: entity_type, entity_level, gender_type, competitive_level, athlete_status, alert_type, alert_severity, media_type
3. 10 tabelas criadas: entities, athletes, coaches, athlete_entities, competitions, results, assessments, performance_kpis, scouting_alerts, media
4. Todas as tabelas com uuid PK (gen_random_uuid), created_at, updated_at com defaults
5. Coluna PostGIS geography(POINT, 4326) em entities e athletes
6. 38+ indexes (B-tree, GIN para arrays/trgm, GIST para geoespacial)
7. Trigger de updated_at automatico em todas as tabelas aplicaveis
8. RLS habilitado em todas as 10 tabelas com 40+ policies (admin, atleta, tecnico, entidade)
9. Seed data: tabelas de referencia (modalities, brazilian_ufs) + hierarquia COB/CPB com confederacoes e federacoes de exemplo
10. Migration file em supabase/migrations/00001_initial_schema.sql

## Tasks / Subtasks
- [x] Task 1: Criar extensoes (AC: 1)
  - [x] pgcrypto, postgis, pg_trgm
- [x] Task 2: Criar enums (AC: 2)
- [x] Task 3: Criar tabelas core (AC: 3, 4, 5)
  - [x] entities com hierarquia e PostGIS
  - [x] athletes com PostGIS e paralympic_classification jsonb
  - [x] coaches com certifications jsonb
  - [x] athlete_entities (junction com historico)
  - [x] competitions, results, assessments
  - [x] performance_kpis, scouting_alerts, media
- [x] Task 4: Criar indexes (AC: 6)
  - [x] B-tree em FKs e colunas de filtro
  - [x] GIN em arrays text[] e pg_trgm para full_name
  - [x] GIST em colunas PostGIS
  - [x] Partial indexes (is_current, is_read)
- [x] Task 5: Criar triggers (AC: 7)
  - [x] trigger_set_updated_at() em todas as tabelas com updated_at
- [x] Task 6: Habilitar RLS e criar policies (AC: 8)
  - [x] Admin via app_metadata JWT claim
  - [x] Atleta le proprio perfil
  - [x] Tecnico le atletas vinculados
  - [x] Entidade le seus atletas
- [x] Task 7: Criar seed data (AC: 9)
  - [x] Tabela modalities com 50 codigos de modalidades
  - [x] Tabela brazilian_ufs com 27 UFs
  - [x] Hierarquia: COB + CPB → 15 confederacoes → 12 federacoes estaduais
- [x] Task 8: Verificar migration (AC: 10)

## Dev Notes
**Schema Ref:** docs/architecture/architecture.md secao 3
**Hierarquia:** COB/CPB > Confederacoes > Federacoes Estaduais > Clubes > Atletas
**Niveis do Funil:** Base escolar > Estadual > Nacional > Alto rendimento
**RLS Strategy:** Camadas de acesso por tipo de entidade (PRD secao 3 - FR-08)

### Testing
- SQL syntax validation
- Migration file executa sem erros em Supabase

## Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-26 | 1.0 | Story criada retroativamente | @sm (River) |
| 2026-03-26 | 1.0 | Schema completo implementado | @data-engineer |

## Dev Agent Record
### Agent Model Used
Claude Sonnet 4.6

### Completion Notes List
- 730 linhas de SQL no migration file
- 10 tabelas com PostGIS, 8 enums, 38 indexes, 40+ RLS policies
- Seed data com 50 modalidades, 27 UFs, hierarquia COB/CPB

### File List
- supabase/migrations/00001_initial_schema.sql
- supabase/seed.sql
