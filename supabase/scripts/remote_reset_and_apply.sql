-- =============================================================================
-- Brasil Atleta — Reset & Reapply Completo no Hosted (Remoto)
-- =============================================================================
-- Gerado em: 2026-07-05
-- Gerado a partir de (leitura literal, não de memória) — CONTEÚDO INLINADO
-- ABAIXO, na ordem, já com a correção auth.is_admin() -> public.is_admin():
--   supabase/migrations/00001_initial_schema.sql
--   supabase/migrations/00002_role_based_rls.sql
--   supabase/migrations/00003_secure_roles.sql
--   supabase/migrations/00004_achievements.sql
--   supabase/migrations/00005_schema_reconciliation.sql
--   supabase/migrations/00006_self_service_policies.sql
--   supabase/migrations/00007_lgpd_minors.sql
--
-- OBJETIVO (decisão de produto: o repositório é a fonte de verdade do
-- schema): o banco hosted divergiu — foi construído por migrations que não
-- estão neste repo, acumulou tabelas de OUTRO produto (financeiro/org, ver
-- lista abaixo) e ficou com RLS efetivamente aberto (policies
-- "allow_all_*" com USING(true) para authenticated em todas as 11 tabelas
-- do domínio Brasil Atleta), além de get_user_role()/get_user_entity_id()
-- ainda lendo JWT/user_metadata (o vetor de privilege-escalation que
-- 00003_secure_roles.sql corrige). Este script DROPA todo o footprint do
-- domínio Brasil Atleta no hosted e REAPLICA as migrations 00001-00007 do
-- zero (recriação limpa, não reconciliação incremental — ao contrário de
-- supabase/scripts/remote_fase0_apply.sql, que é um script anterior,
-- idempotente-aditivo, para um cenário DIFERENTE (drift preservado); aquele
-- script não foi tocado por esta tarefa e não deve ser reusado depois que
-- este reset for aplicado).
--
-- PERMISSÕES DO HOSTED (premissas firmes, sondadas pelo orquestrador antes
-- desta tarefa): Postgres 17.6; extensions em `public`: postgis, pg_trgm
-- (NUNCA dropadas). O role de acesso (postgres via pooler) PODE criar/dropar
-- em `public` e criar TRIGGER em `auth.users`; NÃO PODE criar/alterar
-- FUNÇÃO nem qualquer objeto DENTRO do schema `auth`. Por isso
-- `auth.is_admin()` (00001/00003) foi corrigida para `public.is_admin()`
-- nas migrations do repo ANTES deste script ser gerado — este script não
-- contém nenhum CREATE/ALTER em objeto do schema `auth`, exceto o
-- `CREATE TRIGGER ... ON auth.users` de 00003 (explicitamente permitido).
--
-- ESCOPO DO DROP — o que MORRE vs. o que é PRESERVADO
-- ---------------------------------------------------------------------------
-- DROPADO (objetos do domínio Brasil Atleta, geridos por 00001-00007):
--   Tabelas (14): as 11 tabelas centrais do domínio que já existem hoje no
--     hosted (achievements, assessments, athlete_entities, athletes, coaches,
--     competitions, entities, media, performance_kpis, results,
--     scouting_alerts) + 3 tabelas que as migrations 00003/00007 criam do
--     zero (user_roles, guardian_consents, abuse_reports) — estas 3 NÃO
--     existem ainda no hosted hoje (conferido no dump de backup), mas
--     precisam constar aqui para que este script seja idempotente numa
--     segunda execução (00003/00007 usam CREATE TABLE simples, sem
--     IF NOT EXISTS — sem este DROP, reexecutar o script falharia com
--     "relation already exists" na 2ª rodada).
--   Enums (15): os 8 enums do domínio que já existem hoje no hosted
--     (entity_type, entity_level, gender_type, competitive_level,
--     athlete_status, alert_type, alert_severity, media_type) + 7 que
--     00003-00007 criam do zero (app_role, achievement_type,
--     competition_status, athlete_profile_visibility,
--     guardian_relationship_type, guardian_consent_type,
--     abuse_report_category) — mesmo racional de idempotência acima
--     (CREATE TYPE não aceita IF NOT EXISTS).
--   Funções (3, apenas as explicitamente pré-existentes no hosted por
--     drift de deploy anterior — conferido no dump: public.get_user_role(),
--     public.get_user_entity_id(), public.trigger_set_updated_at()):
--     TODAS as demais funções que as migrations criam (public.is_admin(),
--     get_coach_entity_id(), get_own_athlete_id(),
--     handle_new_user_role(), generate_athlete_slug(), set_athlete_slug(),
--     athlete_is_minor(), enforce_athlete_profile_visibility(),
--     is_athlete_profile_public()) usam CREATE OR REPLACE FUNCTION nas
--     migrations — não precisam de DROP prévio, nem no primeiro apply nem
--     em reruns, pois CREATE OR REPLACE já as substitui com a mesma
--     assinatura em qualquer execução.
--     CUIDADO auditado: trigger_set_updated_at() é usada por TRIGGERS em
--     tabelas de outro produto? NÃO — conferido no dump
--     (backup_public_20260705.sql, seção de triggers): as únicas 8 triggers
--     que chamam public.trigger_set_updated_at() são em achievements,
--     assessments, athletes, coaches, competitions, entities, media,
--     performance_kpis — todas tabelas do domínio, já dropadas acima (com
--     CASCADE, o que já removeria essas triggers de qualquer forma antes
--     deste DROP FUNCTION rodar). Nenhuma tabela de outro produto usa essa
--     função. Seguro dropar e recriar via 00001.
--   1 trigger em auth.users: on_auth_user_created_set_role (00003) — dropado
--     explicitamente antes do reapply porque não é coberto pelo CASCADE de
--     nenhuma tabela `public.*` (ele vive em auth.users, que não é dropada) e
--     porque 00003 usa CREATE TRIGGER simples (sem OR REPLACE) — sem este
--     DROP, a 2ª execução falharia com "trigger already exists".
--     DROP TRIGGER em auth.users está dentro do mesmo escopo de permissão já
--     confirmado para CREATE TRIGGER em auth.users (não é CREATE/ALTER de
--     objeto due dentro do schema auth, apenas remove um trigger que este
--     mesmo script recria a seguir).
--
-- NUNCA DROPADO (fora do domínio Brasil Atleta — confirmado no dump que
-- nenhuma FK/policy cruza a fronteira domínio<->drift; são dois produtos
-- totalmente desacoplados no mesmo banco):
--   Tabelas de outro produto (14): accounts, ai_conversations, ai_insights,
--     ai_messages, categories, distributions, import_logs, organizations,
--     partners, transaction_edits, transactions, modalities,
--     brazilian_ufs, profiles.
--   Funções de outro produto: public.auth_org_id(), public.handle_new_user()
--     (provavelmente wired a um trigger em auth.users que este script nunca
--     toca — não sondado, pois está fora do schema public e fora de escopo),
--     public.rls_auto_enable() (event trigger function).
--   Enum de outro produto: public.allocation_bucket.
--   Extensions: postgis, pg_trgm (e pgcrypto/unaccent, que as migrations
--     apenas garantem via CREATE EXTENSION IF NOT EXISTS — nunca dropadas).
--   spatial_ref_sys (tabela do postgis) e as views geometry_columns/
--     geography_columns.
--
-- IDEMPOTÊNCIA: este script pode ser executado mais de uma vez seguida sem
-- erro — cada execução começa dropando o footprint completo do domínio
-- (incluindo os objetos que a própria execução anterior criou) antes de
-- reaplicar 00001-00007 do zero. Dado que é uma recriação COMPLETA (não
-- incremental), toda e qualquer LINHA de dado gravada nas tabelas do
-- domínio entre execuções É PERDIDA a cada rerun — isso é esperado e
-- deliberado para o cenário desta tarefa (banco ainda sem tráfego real no
-- domínio Brasil Atleta; ver backup feito pelo orquestrador antes de tudo).
-- =============================================================================

BEGIN;

-- =============================================================================
-- PASSO 1 — DROP do footprint completo do domínio Brasil Atleta
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1.1 — Trigger em auth.users (não coberto por CASCADE de tabela public.*)
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created_set_role ON auth.users;

-- ---------------------------------------------------------------------------
-- 1.2 — Tabelas do domínio, em ordem segura de dependência (filhas antes das
-- mães; CASCADE cobriria qualquer ordem, mas isto documenta a árvore de FKs
-- real conferida no dump). CASCADE remove policies/triggers/constraints
-- dependentes junto com cada tabela.
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS public.guardian_consents CASCADE;
DROP TABLE IF EXISTS public.abuse_reports CASCADE;
DROP TABLE IF EXISTS public.achievements CASCADE;
DROP TABLE IF EXISTS public.media CASCADE;
DROP TABLE IF EXISTS public.scouting_alerts CASCADE;
DROP TABLE IF EXISTS public.performance_kpis CASCADE;
DROP TABLE IF EXISTS public.assessments CASCADE;
DROP TABLE IF EXISTS public.results CASCADE;
DROP TABLE IF EXISTS public.athlete_entities CASCADE;
DROP TABLE IF EXISTS public.competitions CASCADE;
DROP TABLE IF EXISTS public.coaches CASCADE;
DROP TABLE IF EXISTS public.athletes CASCADE;
DROP TABLE IF EXISTS public.entities CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- ---------------------------------------------------------------------------
-- 1.3 — Enums do domínio (CREATE TYPE não aceita IF NOT EXISTS, por isso
-- precisam ser dropados explicitamente para o reapply/rerun funcionar).
-- ---------------------------------------------------------------------------
DROP TYPE IF EXISTS public.abuse_report_category CASCADE;
DROP TYPE IF EXISTS public.guardian_consent_type CASCADE;
DROP TYPE IF EXISTS public.guardian_relationship_type CASCADE;
DROP TYPE IF EXISTS public.athlete_profile_visibility CASCADE;
DROP TYPE IF EXISTS public.competition_status CASCADE;
DROP TYPE IF EXISTS public.achievement_type CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;
DROP TYPE IF EXISTS public.media_type CASCADE;
DROP TYPE IF EXISTS public.alert_severity CASCADE;
DROP TYPE IF EXISTS public.alert_type CASCADE;
DROP TYPE IF EXISTS public.athlete_status CASCADE;
DROP TYPE IF EXISTS public.competitive_level CASCADE;
DROP TYPE IF EXISTS public.gender_type CASCADE;
DROP TYPE IF EXISTS public.entity_level CASCADE;
DROP TYPE IF EXISTS public.entity_type CASCADE;

-- ---------------------------------------------------------------------------
-- 1.4 — Funções do domínio pré-existentes no hosted por drift de deploy
-- anterior (00002 aplicado sem 00003 em cima). Ver nota de auditoria no
-- cabeçalho sobre por que apenas estas 3 precisam de DROP explícito (as
-- demais funções das migrations usam CREATE OR REPLACE).
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_entity_id() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_set_updated_at() CASCADE;

-- =============================================================================
-- PASSO 2 — Reaplicação das migrations 00001 -> 00007 (conteúdo inlinado
-- abaixo, verbatim, já com a correção auth.is_admin() -> public.is_admin()
-- feita diretamente nos arquivos supabase/migrations/*.sql antes de gerar
-- este script). Cada bloco abaixo carrega seu próprio cabeçalho
-- "-- === Brasil Atleta — <nome> — Version: 0000X ===" identificando a
-- migration de origem.
-- =============================================================================

-- =============================================================================
-- Brasil Atleta — Initial Schema Migration
-- Version: 00001
-- Description: Full initial schema with PostGIS, RLS, indexes, and enums
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------

CREATE TYPE entity_type AS ENUM (
    'school',
    'club',
    'training_center',
    'federation',
    'confederation',
    'committee'
);

CREATE TYPE entity_level AS ENUM (
    'municipal',
    'state',
    'national'
);

CREATE TYPE gender_type AS ENUM (
    'M',
    'F',
    'NB'
);

CREATE TYPE competitive_level AS ENUM (
    'school',
    'state',
    'national',
    'elite'
);

CREATE TYPE athlete_status AS ENUM (
    'active',
    'inactive',
    'retired'
);

CREATE TYPE alert_type AS ENUM (
    'progression_spike',
    'talent_detected',
    'dropout_risk'
);

CREATE TYPE alert_severity AS ENUM (
    'low',
    'medium',
    'high'
);

CREATE TYPE media_type AS ENUM (
    'video',
    'photo',
    'document'
);

-- ---------------------------------------------------------------------------
-- TABLE: entities
-- Sports entities with hierarchy support
-- ---------------------------------------------------------------------------
CREATE TABLE entities (
    id                  uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
    name                text            NOT NULL,
    type                entity_type     NOT NULL,
    parent_entity_id    uuid            REFERENCES entities(id) ON DELETE SET NULL,
    state               text,                       -- UF code (e.g., SP, RJ)
    city                text,
    modalities          text[]          NOT NULL DEFAULT '{}', -- e.g., ARRAY['ATL','NAT']
    level               entity_level,
    logo_url            text,
    location            geography(POINT, 4326),     -- PostGIS: lon/lat
    created_at          timestamptz     NOT NULL DEFAULT now(),
    updated_at          timestamptz     NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- TABLE: athletes
-- Full athlete profiles
-- ---------------------------------------------------------------------------
CREATE TABLE athletes (
    id                          uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                     uuid            REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name                   text            NOT NULL,
    birth_date                  date,
    gender                      gender_type,
    state                       text,           -- UF of birth
    city                        text,
    photo_url                   text,
    primary_modality            text,           -- technical code, e.g., 'ATL'
    secondary_modalities        text[]          NOT NULL DEFAULT '{}',
    competitive_level           competitive_level,
    status                      athlete_status  NOT NULL DEFAULT 'active',
    is_paralympic               boolean         NOT NULL DEFAULT false,
    paralympic_classification   jsonb,          -- { "class": "T54", "disability_type": "..." }
    current_entity_id           uuid            REFERENCES entities(id) ON DELETE SET NULL,
    birth_location              geography(POINT, 4326),  -- PostGIS: birthplace coordinates
    created_at                  timestamptz     NOT NULL DEFAULT now(),
    updated_at                  timestamptz     NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- TABLE: coaches
-- Coach / technical staff profiles
-- ---------------------------------------------------------------------------
CREATE TABLE coaches (
    id                  uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             uuid            REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name           text            NOT NULL,
    specialization      text,
    certifications      jsonb           NOT NULL DEFAULT '[]', -- array of { "name": "...", "issuer": "...", "year": 2023 }
    academic_background text,
    entity_id           uuid            REFERENCES entities(id) ON DELETE SET NULL,
    modalities          text[]          NOT NULL DEFAULT '{}',
    created_at          timestamptz     NOT NULL DEFAULT now(),
    updated_at          timestamptz     NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- TABLE: athlete_entities
-- Junction table: athlete ↔ entity history
-- ---------------------------------------------------------------------------
CREATE TABLE athlete_entities (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id  uuid        NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    entity_id   uuid        NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    coach_id    uuid        REFERENCES coaches(id) ON DELETE SET NULL,
    start_date  date        NOT NULL,
    end_date    date,                       -- NULL = still active
    role        text,                       -- e.g., 'titular', 'reserva'
    is_current  boolean     NOT NULL DEFAULT false,
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- TABLE: competitions
-- Competition records
-- ---------------------------------------------------------------------------
CREATE TABLE competitions (
    id                    uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
    name                  text                NOT NULL,
    date_start            date,
    date_end              date,
    location_state        text,               -- UF
    location_city         text,
    grade                 competitive_level,
    modality_code         text,               -- e.g., 'ATL', 'NAT'
    organizing_entity_id  uuid                REFERENCES entities(id) ON DELETE SET NULL,
    created_at            timestamptz         NOT NULL DEFAULT now(),
    updated_at            timestamptz         NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- TABLE: results
-- Competition results per athlete
-- ---------------------------------------------------------------------------
CREATE TABLE results (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id      uuid        NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    competition_id  uuid        NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    position        integer,                -- rank/placement, NULL if unranked
    mark            text,                  -- free-form: "9.58", "2:09:40", "8.95m"
    mark_numeric    numeric,               -- numeric value for sorting/comparison
    mark_unit       text,                  -- 's', 'm', 'kg', 'pts'
    category        text,                  -- 'sub-15', 'sub-17', 'adulto', etc.
    notes           text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- TABLE: assessments
-- Physical / technical test records
-- ---------------------------------------------------------------------------
CREATE TABLE assessments (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id      uuid        NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    assessment_date date        NOT NULL,
    modality_code   text,
    protocol        text,                  -- assessment protocol name
    metrics         jsonb       NOT NULL DEFAULT '{}', -- { "vo2max": 65, "40m_sprint": 4.8, ... }
    evaluator_id    uuid        REFERENCES coaches(id) ON DELETE SET NULL,
    entity_id       uuid        REFERENCES entities(id) ON DELETE SET NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- TABLE: performance_kpis
-- Calculated performance indicators per athlete per period
-- ---------------------------------------------------------------------------
CREATE TABLE performance_kpis (
    id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id              uuid        NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    period                  text        NOT NULL,       -- '2025-Q1', '2025', '2024-S2'
    competitive_frequency   integer,                   -- number of competitions in period
    result_progression      numeric,                   -- % improvement vs prior period
    performance_stability   numeric,                   -- std dev of marks
    relative_evolution      numeric,                   -- evolution vs age-category peers
    modality_specific       jsonb       NOT NULL DEFAULT '{}', -- sport-specific KPIs
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now(),
    UNIQUE (athlete_id, period)
);

-- ---------------------------------------------------------------------------
-- TABLE: scouting_alerts
-- Automated and manual scouting alerts
-- ---------------------------------------------------------------------------
CREATE TABLE scouting_alerts (
    id                uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id        uuid            NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    alert_type        alert_type      NOT NULL,
    severity          alert_severity  NOT NULL DEFAULT 'medium',
    description       text,
    data              jsonb           NOT NULL DEFAULT '{}',
    is_read           boolean         NOT NULL DEFAULT false,
    target_entity_id  uuid            REFERENCES entities(id) ON DELETE SET NULL,
    created_at        timestamptz     NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- TABLE: media
-- Media files linked to athletes and optionally to competitions
-- ---------------------------------------------------------------------------
CREATE TABLE media (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id      uuid        NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    type            media_type  NOT NULL,
    url             text        NOT NULL,
    title           text,
    competition_id  uuid        REFERENCES competitions(id) ON DELETE SET NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- entities
CREATE INDEX idx_entities_type          ON entities(type);
CREATE INDEX idx_entities_state         ON entities(state);
CREATE INDEX idx_entities_parent        ON entities(parent_entity_id);
CREATE INDEX idx_entities_modalities    ON entities USING GIN(modalities);
CREATE INDEX idx_entities_location      ON entities USING GIST(location);

-- athletes
CREATE INDEX idx_athletes_user_id               ON athletes(user_id);
CREATE INDEX idx_athletes_state                 ON athletes(state);
CREATE INDEX idx_athletes_primary_modality      ON athletes(primary_modality);
CREATE INDEX idx_athletes_competitive_level     ON athletes(competitive_level);
CREATE INDEX idx_athletes_status                ON athletes(status);
CREATE INDEX idx_athletes_current_entity        ON athletes(current_entity_id);
CREATE INDEX idx_athletes_is_paralympic         ON athletes(is_paralympic);
CREATE INDEX idx_athletes_secondary_modalities  ON athletes USING GIN(secondary_modalities);
CREATE INDEX idx_athletes_birth_location        ON athletes USING GIST(birth_location);
CREATE INDEX idx_athletes_full_name_trgm        ON athletes USING GIN(full_name gin_trgm_ops);

-- coaches
CREATE INDEX idx_coaches_user_id        ON coaches(user_id);
CREATE INDEX idx_coaches_entity_id      ON coaches(entity_id);
CREATE INDEX idx_coaches_modalities     ON coaches USING GIN(modalities);

-- athlete_entities
CREATE INDEX idx_athlete_entities_athlete   ON athlete_entities(athlete_id);
CREATE INDEX idx_athlete_entities_entity    ON athlete_entities(entity_id);
CREATE INDEX idx_athlete_entities_coach     ON athlete_entities(coach_id);
CREATE INDEX idx_athlete_entities_current   ON athlete_entities(is_current) WHERE is_current = true;

-- competitions
CREATE INDEX idx_competitions_modality_code     ON competitions(modality_code);
CREATE INDEX idx_competitions_grade             ON competitions(grade);
CREATE INDEX idx_competitions_location_state    ON competitions(location_state);
CREATE INDEX idx_competitions_date_start        ON competitions(date_start);

-- results
CREATE INDEX idx_results_athlete_id     ON results(athlete_id);
CREATE INDEX idx_results_competition_id ON results(competition_id);
CREATE INDEX idx_results_mark_numeric   ON results(mark_numeric);

-- assessments
CREATE INDEX idx_assessments_athlete_id     ON assessments(athlete_id);
CREATE INDEX idx_assessments_evaluator_id   ON assessments(evaluator_id);
CREATE INDEX idx_assessments_date           ON assessments(assessment_date);
CREATE INDEX idx_assessments_modality_code  ON assessments(modality_code);

-- performance_kpis
CREATE INDEX idx_performance_kpis_athlete_id    ON performance_kpis(athlete_id);
CREATE INDEX idx_performance_kpis_period        ON performance_kpis(period);

-- scouting_alerts
CREATE INDEX idx_scouting_alerts_athlete_id     ON scouting_alerts(athlete_id);
CREATE INDEX idx_scouting_alerts_alert_type     ON scouting_alerts(alert_type);
CREATE INDEX idx_scouting_alerts_severity       ON scouting_alerts(severity);
CREATE INDEX idx_scouting_alerts_is_read        ON scouting_alerts(is_read) WHERE is_read = false;
CREATE INDEX idx_scouting_alerts_target_entity  ON scouting_alerts(target_entity_id);

-- media
CREATE INDEX idx_media_athlete_id       ON media(athlete_id);
CREATE INDEX idx_media_type             ON media(type);
CREATE INDEX idx_media_competition_id   ON media(competition_id);

-- =============================================================================
-- TRIGGERS: updated_at auto-maintenance
-- =============================================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_entities
    BEFORE UPDATE ON entities
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_athletes
    BEFORE UPDATE ON athletes
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_coaches
    BEFORE UPDATE ON coaches
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_competitions
    BEFORE UPDATE ON competitions
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_results
    BEFORE UPDATE ON results
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_assessments
    BEFORE UPDATE ON assessments
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_performance_kpis
    BEFORE UPDATE ON performance_kpis
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_media
    BEFORE UPDATE ON media
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE entities         ENABLE ROW LEVEL SECURITY;
ALTER TABLE athletes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches          ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE results          ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE scouting_alerts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE media            ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Helper: check admin role
-- Uses app_metadata claim set by Supabase Auth hooks or edge functions
--
-- Lives in `public` (not `auth`): the `auth` schema is managed by Supabase
-- itself — on the hosted project the connecting role is not permitted to
-- create or alter any object inside `auth` (verified against the hosted
-- database's actual grants), so application-defined functions must live in
-- `public` instead. Rewritten in 00003_secure_roles.sql to read from
-- public.get_user_role()/public.user_roles instead of the JWT claim below.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
    SELECT COALESCE(
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
        false
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- POLICY: entities
-- ---------------------------------------------------------------------------
-- Admin sees all
CREATE POLICY "admin_read_entities"
    ON entities FOR SELECT
    USING (public.is_admin());

-- Authenticated users can read all entities (public reference data)
CREATE POLICY "authenticated_read_entities"
    ON entities FOR SELECT
    TO authenticated
    USING (true);

-- Only admin can insert/update/delete entities
CREATE POLICY "admin_write_entities"
    ON entities FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- POLICY: athletes
-- ---------------------------------------------------------------------------
-- Admin sees all athletes
CREATE POLICY "admin_read_athletes"
    ON athletes FOR SELECT
    USING (public.is_admin());

-- Athlete can read their own profile
CREATE POLICY "athlete_read_own"
    ON athletes FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Athlete can update their own profile
CREATE POLICY "athlete_update_own"
    ON athletes FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Coaches can read athletes linked to them (via athlete_entities)
CREATE POLICY "coach_read_linked_athletes"
    ON athletes FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM athlete_entities ae
            JOIN coaches c ON c.id = ae.coach_id
            WHERE ae.athlete_id = athletes.id
              AND c.user_id = auth.uid()
              AND ae.is_current = true
        )
    );

-- Entities can read their own athletes (athletes linked to this entity via athlete_entities)
CREATE POLICY "entity_read_own_athletes"
    ON athletes FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM athlete_entities ae
            JOIN entities e ON e.id = ae.entity_id
            WHERE ae.athlete_id = athletes.id
              AND ae.is_current = true
              -- entity manager: check via coaches table entity_id matching the user
              AND e.id IN (
                  SELECT entity_id FROM coaches WHERE user_id = auth.uid()
              )
        )
    );

-- ---------------------------------------------------------------------------
-- POLICY: coaches
-- ---------------------------------------------------------------------------
-- Admin sees all coaches
CREATE POLICY "admin_read_coaches"
    ON coaches FOR SELECT
    USING (public.is_admin());

-- Coach can read their own record
CREATE POLICY "coach_read_own"
    ON coaches FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Coach can update their own record
CREATE POLICY "coach_update_own"
    ON coaches FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Entities can read coaches linked to them
CREATE POLICY "entity_read_own_coaches"
    ON coaches FOR SELECT
    TO authenticated
    USING (
        entity_id IN (
            SELECT entity_id FROM coaches WHERE user_id = auth.uid()
        )
    );

-- ---------------------------------------------------------------------------
-- POLICY: athlete_entities
-- ---------------------------------------------------------------------------
-- Admin sees all
CREATE POLICY "admin_read_athlete_entities"
    ON athlete_entities FOR SELECT
    USING (public.is_admin());

-- Athlete can read their own history
CREATE POLICY "athlete_read_own_athlete_entities"
    ON athlete_entities FOR SELECT
    TO authenticated
    USING (
        athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid())
    );

-- Coach can read athlete_entities for athletes they coach
CREATE POLICY "coach_read_athlete_entities"
    ON athlete_entities FOR SELECT
    TO authenticated
    USING (
        coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid())
    );

-- Entity manager can read athlete_entities for their entity
CREATE POLICY "entity_read_athlete_entities"
    ON athlete_entities FOR SELECT
    TO authenticated
    USING (
        entity_id IN (SELECT entity_id FROM coaches WHERE user_id = auth.uid())
    );

-- ---------------------------------------------------------------------------
-- POLICY: competitions
-- ---------------------------------------------------------------------------
-- Competitions are publicly readable for authenticated users
CREATE POLICY "authenticated_read_competitions"
    ON competitions FOR SELECT
    TO authenticated
    USING (true);

-- Only admin can create/update/delete competitions
CREATE POLICY "admin_write_competitions"
    ON competitions FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- POLICY: results
-- ---------------------------------------------------------------------------
-- Admin sees all results
CREATE POLICY "admin_read_results"
    ON results FOR SELECT
    USING (public.is_admin());

-- Athlete can read their own results
CREATE POLICY "athlete_read_own_results"
    ON results FOR SELECT
    TO authenticated
    USING (
        athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid())
    );

-- Coach can read results of athletes they coach
CREATE POLICY "coach_read_results"
    ON results FOR SELECT
    TO authenticated
    USING (
        athlete_id IN (
            SELECT ae.athlete_id
            FROM athlete_entities ae
            JOIN coaches c ON c.id = ae.coach_id
            WHERE c.user_id = auth.uid()
              AND ae.is_current = true
        )
    );

-- Entity can read results of their athletes
CREATE POLICY "entity_read_results"
    ON results FOR SELECT
    TO authenticated
    USING (
        athlete_id IN (
            SELECT ae.athlete_id
            FROM athlete_entities ae
            WHERE ae.entity_id IN (
                SELECT entity_id FROM coaches WHERE user_id = auth.uid()
            )
            AND ae.is_current = true
        )
    );

-- ---------------------------------------------------------------------------
-- POLICY: assessments
-- ---------------------------------------------------------------------------
-- Admin sees all assessments
CREATE POLICY "admin_read_assessments"
    ON assessments FOR SELECT
    USING (public.is_admin());

-- Athlete can read their own assessments
CREATE POLICY "athlete_read_own_assessments"
    ON assessments FOR SELECT
    TO authenticated
    USING (
        athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid())
    );

-- Coach can read assessments for athletes they coach
CREATE POLICY "coach_read_assessments"
    ON assessments FOR SELECT
    TO authenticated
    USING (
        evaluator_id IN (SELECT id FROM coaches WHERE user_id = auth.uid())
        OR
        athlete_id IN (
            SELECT ae.athlete_id
            FROM athlete_entities ae
            JOIN coaches c ON c.id = ae.coach_id
            WHERE c.user_id = auth.uid()
              AND ae.is_current = true
        )
    );

-- ---------------------------------------------------------------------------
-- POLICY: performance_kpis
-- ---------------------------------------------------------------------------
-- Admin sees all KPIs
CREATE POLICY "admin_read_performance_kpis"
    ON performance_kpis FOR SELECT
    USING (public.is_admin());

-- Athlete can read their own KPIs
CREATE POLICY "athlete_read_own_performance_kpis"
    ON performance_kpis FOR SELECT
    TO authenticated
    USING (
        athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid())
    );

-- Coach can read KPIs of athletes they coach
CREATE POLICY "coach_read_performance_kpis"
    ON performance_kpis FOR SELECT
    TO authenticated
    USING (
        athlete_id IN (
            SELECT ae.athlete_id
            FROM athlete_entities ae
            JOIN coaches c ON c.id = ae.coach_id
            WHERE c.user_id = auth.uid()
              AND ae.is_current = true
        )
    );

-- ---------------------------------------------------------------------------
-- POLICY: scouting_alerts
-- ---------------------------------------------------------------------------
-- Admin sees all alerts
CREATE POLICY "admin_read_scouting_alerts"
    ON scouting_alerts FOR SELECT
    USING (public.is_admin());

-- Athlete can read alerts about themselves
CREATE POLICY "athlete_read_own_scouting_alerts"
    ON scouting_alerts FOR SELECT
    TO authenticated
    USING (
        athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid())
    );

-- Coach can read alerts for athletes they coach
CREATE POLICY "coach_read_scouting_alerts"
    ON scouting_alerts FOR SELECT
    TO authenticated
    USING (
        athlete_id IN (
            SELECT ae.athlete_id
            FROM athlete_entities ae
            JOIN coaches c ON c.id = ae.coach_id
            WHERE c.user_id = auth.uid()
              AND ae.is_current = true
        )
    );

-- Entity can read alerts targeted at their entity
CREATE POLICY "entity_read_scouting_alerts"
    ON scouting_alerts FOR SELECT
    TO authenticated
    USING (
        target_entity_id IN (
            SELECT entity_id FROM coaches WHERE user_id = auth.uid()
        )
    );

-- ---------------------------------------------------------------------------
-- POLICY: media
-- ---------------------------------------------------------------------------
-- Admin sees all media
CREATE POLICY "admin_read_media"
    ON media FOR SELECT
    USING (public.is_admin());

-- Athlete can read their own media
CREATE POLICY "athlete_read_own_media"
    ON media FOR SELECT
    TO authenticated
    USING (
        athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid())
    );

-- Athlete can insert/update/delete their own media
CREATE POLICY "athlete_write_own_media"
    ON media FOR ALL
    TO authenticated
    USING (
        athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid())
    )
    WITH CHECK (
        athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid())
    );

-- Coach can read media of athletes they coach
CREATE POLICY "coach_read_media"
    ON media FOR SELECT
    TO authenticated
    USING (
        athlete_id IN (
            SELECT ae.athlete_id
            FROM athlete_entities ae
            JOIN coaches c ON c.id = ae.coach_id
            WHERE c.user_id = auth.uid()
              AND ae.is_current = true
        )
    );

-- =============================================================================
-- END OF MIGRATION 00001
-- =============================================================================
-- Role-based RLS enhancements for Story 2.2
-- Adds helper function to extract role from JWT

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'user_type'),
    'atleta'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_entity_id()
RETURNS uuid AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'entity_id')::uuid;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_user_role IS 'Returns the role of the authenticated user from JWT metadata';
COMMENT ON FUNCTION public.get_user_entity_id IS 'Returns the entity_id of the authenticated user from JWT metadata';
-- =============================================================================
-- Brasil Atleta — Secure Server-Controlled Roles
-- Version: 00003
-- Description: Fixes privilege-escalation via client-controlled user_metadata.
--   Introduces public.user_roles as the sole source of truth for user roles,
--   defaulted to 'atleta' by a trigger on signup, writable only by
--   service_role. Rewrites get_user_role()/public.is_admin() to read from this
--   table instead of trusting values sent by the client (JWT / user_metadata
--   / app_metadata).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ENUM: app_role
-- Mirrors packages/web/src/lib/auth/roles.ts UserRole union.
-- ---------------------------------------------------------------------------
CREATE TYPE public.app_role AS ENUM (
    'admin_nacional',
    'confederacao',
    'federacao',
    'clube',
    'tecnico',
    'atleta'
);

-- ---------------------------------------------------------------------------
-- TABLE: user_roles
-- One row per auth user. Role assignment source of truth for RLS and app
-- code. No INSERT/UPDATE/DELETE policy is granted to `authenticated` below —
-- writes are only possible via service_role (e.g. admin tooling) or the
-- on_auth_user_created_set_role trigger, which always assigns 'atleta'.
-- ---------------------------------------------------------------------------
CREATE TABLE public.user_roles (
    user_id     uuid            PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role        public.app_role NOT NULL DEFAULT 'atleta',
    created_at  timestamptz     NOT NULL DEFAULT now(),
    updated_at  timestamptz     NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.user_roles IS 'Server-controlled source of truth for user roles. No client-writable path exists — only service_role or the on_auth_user_created_set_role trigger can write to this table.';

CREATE TRIGGER set_updated_at_user_roles
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Authenticated users may read their own role row (needed by the app to
-- render role-aware navigation/session data). Deliberately no INSERT/UPDATE/
-- DELETE policy is defined for `authenticated`, so those actions are denied
-- by default RLS behavior.
CREATE POLICY "user_read_own_role"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- BACKFILL: migrate existing users' roles as-is from user_metadata.
-- This is a one-time copy of the current values (per product decision) — it
-- does not re-validate who *should* hold a privileged role, it only
-- preserves the status quo for users created before this migration.
-- ---------------------------------------------------------------------------
INSERT INTO public.user_roles (user_id, role)
SELECT
    u.id,
    (CASE
        WHEN (u.raw_user_meta_data ->> 'user_type') IN (
            'admin_nacional', 'confederacao', 'federacao', 'clube', 'tecnico', 'atleta'
        )
        THEN (u.raw_user_meta_data ->> 'user_type')
        ELSE 'atleta'
    END)::public.app_role
FROM auth.users u
ON CONFLICT (user_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- TRIGGER: default every newly created auth user to 'atleta'.
-- Runs regardless of any user_type/role value the client may have sent in
-- signUp()'s options.data — that value is never consulted here, closing the
-- signup privilege-escalation path (FR-0.1).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'atleta')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created_set_role
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- ---------------------------------------------------------------------------
-- FUNCTION: get_user_role() — now reads from public.user_roles instead of
-- the client-controlled JWT user_metadata claim (previous definition lived
-- in 00002_role_based_rls.sql). Signature (name/return type) is unchanged so
-- existing callers keep working.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
    SELECT COALESCE(
        (SELECT role::text FROM public.user_roles WHERE user_id = auth.uid()),
        'atleta'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.get_user_role IS 'Returns the authenticated user role from public.user_roles (server-controlled). No longer reads JWT/user_metadata.';

-- ---------------------------------------------------------------------------
-- FUNCTION: public.is_admin() — now backed by public.get_user_role() instead
-- of auth.jwt() -> app_metadata (previous definition lived in
-- 00001_initial_schema.sql), so the 00001 admin_* policies are enforced
-- against the same server-controlled source of truth instead of any JWT
-- claim. Kept in `public` (see 00001's comment on public.is_admin()) rather
-- than `auth` — the `auth` schema is Supabase-managed and the hosted
-- project's connecting role cannot create/alter objects inside it.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
    SELECT public.get_user_role() = 'admin_nacional';
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------------
-- CLEANUP: drop public.get_user_entity_id() (dead & dangerous code from
-- 00002_role_based_rls.sql).
--
-- Signature (00002): CREATE OR REPLACE FUNCTION public.get_user_entity_id()
-- RETURNS uuid — reads (auth.jwt() -> 'user_metadata' ->> 'entity_id')::uuid,
-- i.e. an entity_id fully controlled by the client at signUp()/updateUser()
-- time, the same class of privilege-escalation vector get_user_role() itself
-- was rewritten to close earlier in this migration. A repo-wide grep across
-- every migration's CREATE POLICY definitions (00001-00007 at the time of
-- this change) confirms no RLS policy ever calls get_user_entity_id() — it
-- is unused dead code, not a load-bearing helper. Dropped here (rather than
-- edited in 00002) because 00002 may already have been applied to a real
-- database in the past; DROP FUNCTION in this migration removes it in both
-- the "00002 was already applied" and "fresh database" cases.
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_user_entity_id();

-- =============================================================================
-- END OF MIGRATION 00003
-- =============================================================================
-- =============================================================================
-- Brasil Atleta — Achievements Migration
-- Version: 00004
-- Description: Athlete achievements/titles table (Story 11.4) + RLS
-- FR-0.2: table was consumed by /meu-perfil and /atleta/[slug] but never
--         formally migrated — this creates it from scratch.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ENUM: achievement_type
-- Mirrors AchievementType in packages/web/src/components/athletes/achievement-badge.tsx
-- ---------------------------------------------------------------------------
CREATE TYPE achievement_type AS ENUM (
    'gold',
    'silver',
    'bronze',
    'participation',
    'record'
);

-- ---------------------------------------------------------------------------
-- TABLE: achievements
-- Athlete achievements / titles portfolio (Story 11.4, AC 1)
-- ---------------------------------------------------------------------------
CREATE TABLE achievements (
    id                  uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id          uuid                NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    title               text                NOT NULL,
    competition_name    text,
    date                date                NOT NULL,
    type                achievement_type    NOT NULL,
    description         text,
    photo_url           text,
    created_at          timestamptz         NOT NULL DEFAULT now(),
    updated_at          timestamptz         NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------------
CREATE INDEX idx_achievements_athlete_id  ON achievements(athlete_id);
CREATE INDEX idx_achievements_type        ON achievements(type);
CREATE INDEX idx_achievements_date        ON achievements(date);

-- ---------------------------------------------------------------------------
-- TRIGGER: updated_at auto-maintenance (reuses function created in 00001)
-- ---------------------------------------------------------------------------
CREATE TRIGGER set_updated_at_achievements
    BEFORE UPDATE ON achievements
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- POLICY: achievements
-- ---------------------------------------------------------------------------
-- Admin sees all achievements (pattern: admin_read_* in 00001)
CREATE POLICY "admin_read_achievements"
    ON achievements FOR SELECT
    USING (public.is_admin());

-- Achievements are shown on the public athlete profile (/atleta/[slug], Story 11.4 AC 5)
-- so, unlike results/assessments, they are publicly readable (no TO clause = all roles,
-- including anon), same rationale as the public sports-portfolio pages.
CREATE POLICY "public_read_achievements"
    ON achievements FOR SELECT
    USING (true);

-- Athlete manages (insert/update/delete/select) their own achievements (Story 11.4 AC 7)
CREATE POLICY "athlete_manage_own_achievements"
    ON achievements FOR ALL
    TO authenticated
    USING (
        athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid())
    )
    WITH CHECK (
        athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid())
    );

-- =============================================================================
-- END OF MIGRATION 00004
-- =============================================================================
-- =============================================================================
-- Brasil Atleta — Schema Reconciliation
-- Version: 00005
-- Description: Reconciles schema with UI features shipped in Stories 11.1/11.2
--   that were never fully migrated: fixes two infinite-recursion RLS bugs
--   (coaches self-reference; athletes<->athlete_entities mutual recursion)
--   discovered while testing athlete self-service writes (achievements/media)
--   with 2+ athletes in the database, adds the missing anon-read policy that
--   the public athlete profile page has always needed, and adds the
--   athletes.slug/.bio and competitions.created_by_athlete_id/.status
--   columns those same stories' UI already depends on.
-- =============================================================================

-- =============================================================================
-- PART 1 — [CRITICAL] Fix infinite recursion in "entity_read_own_coaches"
-- =============================================================================
-- Root cause: the policy below (defined in 00001_initial_schema.sql) is
-- self-referential — it is a policy ON `coaches` whose USING clause runs a
-- SELECT ... FROM coaches. To evaluate that subquery, Postgres must apply RLS
-- to `coaches` again, which means evaluating "entity_read_own_coaches" again,
-- forever: "infinite recursion detected in policy for relation coaches".
--
-- This is not confined to direct queries on `coaches` — it is also reached
-- transitively any time RLS on `athletes` evaluates "entity_read_own_athletes"
-- (00001), whose USING clause queries `coaches` the same way. That policy is
-- itself evaluated (as part of the OR'd set of SELECT policies) whenever an
-- authenticated non-admin user is subject to a `SELECT ... FROM athletes`,
-- including the `athlete_id IN (SELECT id FROM athletes WHERE user_id =
-- auth.uid())` subqueries used throughout 00001/00004 RLS (e.g.
-- "athlete_manage_own_achievements", "athlete_write_own_media"). With 2+
-- athletes present, Postgres's planner takes the code path that actually
-- evaluates "entity_read_own_athletes" (and therefore "entity_read_own_coaches")
-- for the query, surfacing the recursion error on athlete INSERT/UPDATE/DELETE
-- into achievements/media.
--
-- Fix: break the self-reference with a SECURITY DEFINER STABLE helper that
-- queries `public.coaches` directly. SECURITY DEFINER functions execute with
-- the privileges of their owner (the migration role, which bypasses RLS in
-- Supabase), so the query inside never re-enters `coaches` RLS — no recursion.
-- Same pattern already used by `public.is_admin()` / `public.get_user_role()`.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_coach_entity_id()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT entity_id
    FROM public.coaches
    WHERE user_id = auth.uid()
      AND entity_id IS NOT NULL;
$$;

COMMENT ON FUNCTION public.get_coach_entity_id IS 'Returns the entity_id(s) of the coach row(s) owned by the authenticated user, bypassing RLS on public.coaches (SECURITY DEFINER) to avoid the self-referential recursion that "entity_read_own_coaches" used to trigger when queried from within its own policy.';

DROP POLICY IF EXISTS "entity_read_own_coaches" ON coaches;

CREATE POLICY "entity_read_own_coaches"
    ON coaches FOR SELECT
    TO authenticated
    USING (
        entity_id IN (SELECT public.get_coach_entity_id())
    );

-- NOTE on scope: a grep of every USING/WITH CHECK clause in 00001/00002/00003/
-- 00004 for the single-table self-referential pattern ("policy ON table X
-- that subqueries table X") found exactly one occurrence — the one fixed
-- above. However, testing this migration end-to-end (2+ athletes, athlete
-- self-INSERT into achievements/media) surfaced a SECOND, mutual two-table
-- recursion cycle that the single-table grep does not catch — fixed next.
-- ---------------------------------------------------------------------------
-- Second recursion: athletes <-> athlete_entities
-- ---------------------------------------------------------------------------
-- "entity_read_own_athletes" (ON athletes, 00001) subqueries `athlete_entities`.
-- "athlete_read_own_athlete_entities" (ON athlete_entities, 00001) subqueries
-- `athletes` via `athlete_id IN (SELECT id FROM athletes WHERE user_id =
-- auth.uid())`. Evaluating RLS on `athletes` therefore requires evaluating
-- "entity_read_own_athletes", which requires RLS on `athlete_entities`, which
-- requires evaluating "athlete_read_own_athlete_entities", which requires RLS
-- on `athletes` again: "infinite recursion detected in policy for relation
-- athletes". This is reached by ANY policy anywhere that subqueries `athletes`
-- with `... WHERE user_id = auth.uid()` — i.e. it is the actual root cause
-- blocking self-service INSERT into achievements/media/results/assessments/
-- performance_kpis/scouting_alerts for an authenticated athlete (the coaches
-- fix above was necessary but not sufficient). Same fix shape: a SECURITY
-- DEFINER STABLE helper breaks the cycle at the athlete_entities edge.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_own_athlete_id()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id
    FROM public.athletes
    WHERE user_id = auth.uid();
$$;

COMMENT ON FUNCTION public.get_own_athlete_id IS 'Returns the athlete id(s) owned by the authenticated user, bypassing RLS on public.athletes (SECURITY DEFINER) to avoid the athletes<->athlete_entities mutual recursion that "athlete_read_own_athlete_entities" used to trigger via "entity_read_own_athletes".';

DROP POLICY IF EXISTS "athlete_read_own_athlete_entities" ON athlete_entities;

CREATE POLICY "athlete_read_own_athlete_entities"
    ON athlete_entities FOR SELECT
    TO authenticated
    USING (
        athlete_id IN (SELECT public.get_own_athlete_id())
    );

-- All other policies audited ("entity_read_own_athletes",
-- "coach_read_athlete_entities", "entity_read_athlete_entities",
-- "coach_read_results"/"entity_read_results", "coach_read_assessments",
-- "coach_read_scouting_alerts"/"entity_read_scouting_alerts",
-- "coach_read_media") subquery athletes/coaches/athlete_entities but do not
-- themselves sit on a cycle — they only surfaced errors transitively through
-- the two cycles fixed above, both of which are now broken.

-- =============================================================================
-- PART 2 — Phantom columns: athletes.slug / athletes.bio (Story 11.2)
-- =============================================================================
-- Consumed by src/app/atleta/[slug]/page.tsx (public athlete profile) and
-- generated by src/lib/utils/slug.ts::generateSlug(), but never migrated.
-- generateSlug() = fullName.toLowerCase().normalize("NFD")
--   .replace(<NFD combining diacritical marks range>, "")  -- strip accents
--   .replace(/[^a-z0-9]+/g, "-")       -- non-alphanumeric runs -> single hyphen
--   .replace(/^-|-$/g, "");            -- trim leading/trailing hyphen
-- `unaccent()` + lower() + regexp_replace() below reproduce that in SQL for
-- the one-time backfill of pre-existing rows.
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "unaccent";

ALTER TABLE athletes ADD COLUMN slug text;
ALTER TABLE athletes ADD COLUMN bio text;

CREATE OR REPLACE FUNCTION public.generate_athlete_slug(p_full_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT trim(both '-' from regexp_replace(lower(unaccent(p_full_name)), '[^a-z0-9]+', '-', 'g'));
$$;

COMMENT ON FUNCTION public.generate_athlete_slug IS 'SQL port of generateSlug() in packages/web/src/lib/utils/slug.ts, used only for the one-time backfill of athletes.slug in this migration. The app itself still generates slugs client/server-side with the TS implementation; this migration does not add a trigger to auto-populate slug for new rows (see orchestrator report — flagged as a separate gap, not part of this reconciliation).';

-- Backfill existing athletes with a unique slug, in creation order, with a
-- numeric-suffix fallback on collision (Story 11.2 AC 2: "nome-sobrenome ...
-- com fallback"); if a name yields an empty slug (e.g. no a-z0-9 chars),
-- fall back to "atleta-<first 8 chars of id>" per the same AC's "fallback
-- para nome-id".
DO $$
DECLARE
    r RECORD;
    base_slug text;
    candidate_slug text;
    suffix integer;
BEGIN
    FOR r IN SELECT id, full_name FROM athletes ORDER BY created_at, id LOOP
        base_slug := public.generate_athlete_slug(r.full_name);
        IF base_slug IS NULL OR base_slug = '' THEN
            base_slug := 'atleta-' || substr(r.id::text, 1, 8);
        END IF;

        candidate_slug := base_slug;
        suffix := 1;
        WHILE EXISTS (
            SELECT 1 FROM athletes WHERE slug = candidate_slug AND id <> r.id
        ) LOOP
            suffix := suffix + 1;
            candidate_slug := base_slug || '-' || suffix;
        END LOOP;

        UPDATE athletes SET slug = candidate_slug WHERE id = r.id;
    END LOOP;
END;
$$;

ALTER TABLE athletes ADD CONSTRAINT athletes_slug_unique UNIQUE (slug);

-- =============================================================================
-- PART 3 — Phantom columns: competitions.created_by_athlete_id / .status
-- (Story 11.1 self-service — src/app/(dashboard)/meu-perfil/add-competition-dialog.tsx)
-- =============================================================================
-- add-competition-dialog.tsx inserts `created_by_athlete_id: athleteId` and a
-- literal `status: "completed"` (the only status value written anywhere in
-- packages/web/src today — grep confirmed). No query in the app currently
-- reads/filters by `status`. competition_status models the natural lifecycle
-- of a competition record; DEFAULT 'scheduled' is applied to pre-existing rows
-- (none currently set a status, and nothing depends on their value).
-- ---------------------------------------------------------------------------

CREATE TYPE competition_status AS ENUM (
    'scheduled',
    'ongoing',
    'completed',
    'cancelled'
);

ALTER TABLE competitions
    ADD COLUMN created_by_athlete_id uuid REFERENCES athletes(id) ON DELETE SET NULL,
    ADD COLUMN status competition_status NOT NULL DEFAULT 'scheduled';

CREATE INDEX idx_competitions_created_by_athlete ON competitions(created_by_athlete_id);

-- =============================================================================
-- PART 4 — [CRITICAL] Missing RLS: anon/public read on `athletes`
-- =============================================================================
-- src/app/atleta/[slug]/page.tsx (Story 11.2, "Perfil Publico do Atleta",
-- AC 1: "Rota publica /atleta/[slug] acessivel SEM login") queries `athletes`
-- with no auth requirement, relying entirely on RLS to gate visibility — the
-- Story 11.2 Dev Notes even call this out ("RLS: Precisa policy para anon
-- SELECT em athletes"). No migration (00001-00004) ever added it: every
-- existing SELECT policy on `athletes` is `TO authenticated` (or admin-only),
-- so `anon` has always been denied by default-deny RLS — the public profile
-- page has been non-functional for logged-out visitors since it shipped.
-- Fixed here using the same "no TO clause = all roles" pattern already
-- established by "public_read_achievements" in 00004_achievements.sql, for
-- the same reason: this is a deliberately public, shareable profile page.
-- ---------------------------------------------------------------------------

CREATE POLICY "public_read_athletes"
    ON athletes FOR SELECT
    USING (true);

-- =============================================================================
-- END OF MIGRATION 00005
-- =============================================================================
-- =============================================================================
-- Brasil Atleta — Self-Service Policies & Slug Trigger
-- Version: 00006
-- Description: Adds the missing athlete self-service write policies for
--   results/assessments/competitions (Story 11.1 self-service flows —
--   src/app/(dashboard)/meu-perfil/add-competition-dialog.tsx,
--   src/app/(dashboard)/meu-perfil/add-result-dialog.tsx,
--   src/app/(dashboard)/athletes/[id]/create-assessment-dialog.tsx — all
--   currently blocked by RLS on a freshly-created database since 00001/00002
--   never defined an INSERT/UPDATE/DELETE policy for `authenticated` on these
--   3 tables beyond the admin-only "admin_write_competitions"), and a
--   BEFORE INSERT/UPDATE trigger on `athletes` that auto-generates `slug`
--   (Story 11.2) so newly created athletes are never left without a public
--   profile URL — no code path in packages/web calls generateSlug()
--   (src/lib/utils/slug.ts) on INSERT; only 00005's one-time DO block
--   backfilled slugs for rows that existed before that migration ran.
-- =============================================================================

-- =============================================================================
-- PART 1 — Athlete self-service write policies
-- =============================================================================
-- Uses public.get_own_athlete_id() (created in 00005_schema_reconciliation.sql),
-- the SECURITY DEFINER helper that returns the athlete id(s) owned by the
-- authenticated user while bypassing RLS on `athletes` (it exists specifically
-- to break the athletes<->athlete_entities recursion — see 00005 comments).
-- Same `athlete_id IN (SELECT public.get_own_athlete_id())` shape already used
-- by "athlete_read_own_athlete_entities" (00005).
--
-- Audit of pre-existing policies on these 3 tables (00001/00002/00003/00004/
-- 00005) found SELECT-only policies — no INSERT/UPDATE/DELETE policy existed
-- for `results` or `assessments` at all, and `competitions` only had
-- "admin_write_competitions" (admin-only, FOR ALL). None of the policies
-- created below replace or conflict with an existing one, so no DROP POLICY
-- is needed here (unlike 00005, which had to fix pre-existing recursive
-- policies).
-- ---------------------------------------------------------------------------

-- results: athlete can insert/update/delete only their own results rows.
-- FOR ALL (rather than separate INSERT/UPDATE/DELETE policies) mirrors the
-- existing "athlete_write_own_media" (00001) / "athlete_manage_own_achievements"
-- (00004) pattern — the redundant SELECT grant it also implies is harmless
-- (permissive policies OR together) and already narrower than the existing
-- "athlete_read_own_results" (00001) it overlaps with.
CREATE POLICY "athlete_write_own_results"
    ON results FOR ALL
    TO authenticated
    USING (
        athlete_id IN (SELECT public.get_own_athlete_id())
    )
    WITH CHECK (
        athlete_id IN (SELECT public.get_own_athlete_id())
    );

-- assessments: same gap and same fix shape as results.
CREATE POLICY "athlete_write_own_assessments"
    ON assessments FOR ALL
    TO authenticated
    USING (
        athlete_id IN (SELECT public.get_own_athlete_id())
    )
    WITH CHECK (
        athlete_id IN (SELECT public.get_own_athlete_id())
    );

-- competitions: add-competition-dialog.tsx (src/app/(dashboard)/meu-perfil)
-- inserts { name, date_start, location_state, grade, modality_code,
-- created_by_athlete_id: athleteId, status: "completed" } — it always stamps
-- created_by_athlete_id with the caller's own athlete id and never sets
-- organizing_entity_id, so WITH CHECK only needs to validate ownership of
-- created_by_athlete_id (no other column the app sends is restricted here).
-- USING restricts UPDATE/DELETE to competitions the athlete created —
-- admin-seeded competitions have created_by_athlete_id IS NULL, which never
-- matches an athlete's own id, so those remain admin-only as before.
CREATE POLICY "athlete_write_own_competitions"
    ON competitions FOR ALL
    TO authenticated
    USING (
        created_by_athlete_id IN (SELECT public.get_own_athlete_id())
    )
    WITH CHECK (
        created_by_athlete_id IN (SELECT public.get_own_athlete_id())
    );

-- =============================================================================
-- PART 2 — Auto-generate athletes.slug on INSERT (and protect it from being
-- nulled on UPDATE)
-- =============================================================================
-- Extracts the collision-suffix logic 00005 used inline in its one-time
-- backfill DO block into a reusable SECURITY DEFINER trigger function, reusing
-- public.generate_athlete_slug() (00005) for the name normalization (itself a
-- SQL port of generateSlug() in packages/web/src/lib/utils/slug.ts), and wires
-- it into BEFORE INSERT/UPDATE triggers so every new athlete row gets a slug
-- without any app code path having to call generateSlug() on write — closing
-- the gap 00005 flagged ("this migration does not add a trigger to
-- auto-populate slug for new rows").
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_athlete_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    base_slug      text;
    candidate_slug text;
    suffix         integer;
BEGIN
    -- NEW.id is already populated at this point: Postgres substitutes column
    -- defaults (including athletes.id's gen_random_uuid()) before a BEFORE ROW
    -- trigger fires, the same assumption 00005's backfill made for existing rows.
    base_slug := public.generate_athlete_slug(NEW.full_name);
    IF base_slug IS NULL OR base_slug = '' THEN
        base_slug := 'atleta-' || substr(NEW.id::text, 1, 8);
    END IF;

    candidate_slug := base_slug;
    suffix := 1;
    WHILE EXISTS (
        SELECT 1 FROM public.athletes WHERE slug = candidate_slug AND id <> NEW.id
    ) LOOP
        suffix := suffix + 1;
        candidate_slug := base_slug || '-' || suffix;
    END LOOP;

    NEW.slug := candidate_slug;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_athlete_slug IS 'BEFORE INSERT/UPDATE trigger function for athletes.slug: generates a slug from full_name using the same normalization as public.generate_athlete_slug() (00005), with a numeric-suffix fallback (-2, -3, ...) on collision. Only runs when NEW.slug IS NULL — see the WHEN clauses on set_athlete_slug_before_insert/_before_update — so an explicit slug supplied by the caller is always preserved. SECURITY DEFINER (with SET search_path = public) so the uniqueness check bypasses RLS on athletes, matching public.get_own_athlete_id()/public.get_coach_entity_id().';

CREATE TRIGGER set_athlete_slug_before_insert
    BEFORE INSERT ON athletes
    FOR EACH ROW
    WHEN (NEW.slug IS NULL)
    EXECUTE FUNCTION public.set_athlete_slug();

-- Protects against slug being wiped out on UPDATE (e.g. a future admin tool
-- naively setting slug = NULL) — regenerates it the same way instead of
-- leaving the athlete without a public profile URL.
CREATE TRIGGER set_athlete_slug_before_update
    BEFORE UPDATE ON athletes
    FOR EACH ROW
    WHEN (NEW.slug IS NULL)
    EXECUTE FUNCTION public.set_athlete_slug();

-- =============================================================================
-- END OF MIGRATION 00006
-- =============================================================================
-- =============================================================================
-- Brasil Atleta — LGPD & Proteção de Menores
-- Version: 00007
-- Description: Implements PRD v3 Fase 0 requirements FR-0.7 to FR-0.10 (Secao
--   6.3/6.4, decisao D6): consentimento verificavel do responsavel legal para
--   atletas menores de 18 anos, visibilidade de perfil restrita por padrao
--   para menores (so publica com opt-in do responsavel), leitura publica
--   (anon) gated por essa visibilidade nas 4 tabelas que a pagina publica
--   /atleta/[slug] consome, e um canal de denuncia acessivel a visitantes
--   nao autenticados. Also closes a pre-existing gap surfaced by this work:
--   `athletes` never had an INSERT policy for `authenticated` (00001 only
--   ever defined SELECT-own/UPDATE-own), so onboarding self-signup athlete
--   creation has been silently rejected by RLS on any clean database.
-- =============================================================================

-- =============================================================================
-- PART 1 — [CRITICAL] Missing RLS: athlete self-service INSERT on `athletes`
-- =============================================================================
-- Audit of 00001/00002/00003/00004/00005/00006: `athletes` has
-- "athlete_read_own" (SELECT) and "athlete_update_own" (UPDATE), both scoped
-- to `auth.uid() = user_id`, but no INSERT policy for `authenticated` was
-- ever defined — only "admin_write_athletes" would cover admin, and no such
-- policy exists either. src/app/(auth)/onboarding/page.tsx's
-- `supabase.from("athletes").insert({ user_id: user.id, ... })` for the
-- atleta path has therefore always been rejected by default-deny RLS on a
-- freshly-provisioned database. Fixed the same way "athlete_update_own"
-- already works: WITH CHECK ties the inserted row's user_id to the caller's
-- own auth.uid(), so a client cannot spoof another user's id.
-- ---------------------------------------------------------------------------

CREATE POLICY "athlete_insert_own"
    ON athletes FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- PART 2 — `athletes.profile_visibility` (FR-0.8 / D6)
-- =============================================================================
-- Every athlete profile carries a visibility flag. Effective default:
--   - adult (18+, based on birth_date)  -> 'public'
--   - minor (< 18, based on birth_date) -> 'restricted'
--   - birth_date unknown (NULL)         -> treated as minor (conservative:
--     we cannot confirm adulthood, so we do not default to public — product
--     decision, not explicitly specified in the brief).
-- ---------------------------------------------------------------------------

CREATE TYPE public.athlete_profile_visibility AS ENUM (
    'public',
    'restricted'
);

ALTER TABLE athletes
    ADD COLUMN profile_visibility public.athlete_profile_visibility NOT NULL DEFAULT 'restricted';

-- ---------------------------------------------------------------------------
-- HELPER: public.athlete_is_minor(birth_date)
-- Single source of truth for "is this athlete under 18", reused by the
-- backfill below and by the BEFORE INSERT/UPDATE trigger in PART 4.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.athlete_is_minor(p_birth_date date)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT p_birth_date IS NULL OR p_birth_date > (CURRENT_DATE - INTERVAL '18 years')::date;
$$;

COMMENT ON FUNCTION public.athlete_is_minor IS 'Returns true if p_birth_date represents someone under 18 as of today, or if p_birth_date is NULL (conservative: unknown age is never treated as adult). Single source of truth for athletes.profile_visibility defaulting/enforcement (see enforce_athlete_profile_visibility) — do not duplicate this age math elsewhere.';

-- Backfill pre-existing rows: adults -> public, minors/unknown -> restricted.
-- (The column DEFAULT above already set every existing row to 'restricted';
-- this UPDATE only needs to flip the adults to 'public', but is written as a
-- full CASE for clarity/idempotency.)
UPDATE athletes
SET profile_visibility = CASE
    WHEN public.athlete_is_minor(birth_date) THEN 'restricted'::public.athlete_profile_visibility
    ELSE 'public'::public.athlete_profile_visibility
END;

-- =============================================================================
-- PART 3 — `guardian_consents` (FR-0.7 / D6)
-- =============================================================================
-- One immutable row per consent event. An athlete can accumulate more than
-- one row over time (e.g. 'account' consent at onboarding, later a separate
-- 'public_profile' consent when the responsible opts the minor's profile
-- into public visibility) — see PART 4 for how 'public_profile' consents
-- gate profile_visibility.
-- ---------------------------------------------------------------------------

CREATE TYPE public.guardian_relationship_type AS ENUM (
    'mae',
    'pai',
    'tutor',
    'outro'
);

CREATE TYPE public.guardian_consent_type AS ENUM (
    'account',
    'public_profile'
);

CREATE TABLE public.guardian_consents (
    id                      uuid                            PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id              uuid                            NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
    guardian_full_name      text                            NOT NULL,
    guardian_email          text                            NOT NULL,
    guardian_relationship   public.guardian_relationship_type NOT NULL,
    consent_type            public.guardian_consent_type    NOT NULL,
    consented_at            timestamptz                     NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.guardian_consents IS 'Immutable log of guardian/responsible-adult consent events for minor athletes (LGPD art. 14). No UPDATE/DELETE policy is granted to authenticated — see RLS below — this is an audit trail, not an editable record. A minor athlete profile may only carry profile_visibility = public if a row with consent_type = public_profile exists here (enforced by enforce_athlete_profile_visibility, PART 4).';

CREATE INDEX idx_guardian_consents_athlete_id    ON public.guardian_consents(athlete_id);
CREATE INDEX idx_guardian_consents_consent_type  ON public.guardian_consents(consent_type);

ALTER TABLE public.guardian_consents ENABLE ROW LEVEL SECURITY;

-- Admin can read all consents (audit) — same "admin_read_*" pattern used by
-- every other table in 00001/00004.
CREATE POLICY "admin_read_guardian_consents"
    ON public.guardian_consents FOR SELECT
    USING (public.is_admin());

-- Athlete reads their own consent history.
CREATE POLICY "athlete_read_own_guardian_consents"
    ON public.guardian_consents FOR SELECT
    TO authenticated
    USING (athlete_id IN (SELECT public.get_own_athlete_id()));

-- Athlete (acting on behalf of the guardian at intake time — the product has
-- no separate guardian login) can register a consent for their own athlete
-- row only. No INSERT policy exists for any other athlete_id, and no
-- UPDATE/DELETE policy exists at all for `authenticated` — both are
-- deliberate (immutability / auditability).
CREATE POLICY "athlete_insert_own_guardian_consents"
    ON public.guardian_consents FOR INSERT
    TO authenticated
    WITH CHECK (athlete_id IN (SELECT public.get_own_athlete_id()));

-- =============================================================================
-- PART 4 — Enforce profile_visibility at write time (FR-0.8 / FR-1.8 / D6)
-- =============================================================================
-- BEFORE INSERT: visibility is always computed from age, never taken from
-- client input — no guardian_consents row can exist yet for a brand-new
-- athlete (guardian_consents.athlete_id FKs to athletes.id), so a minor can
-- only ever be created 'restricted'.
--
-- BEFORE UPDATE: an adult can freely toggle profile_visibility either way
-- (no restriction). A minor can only move to 'public' if a
-- guardian_consents row with consent_type = 'public_profile' already exists
-- for that athlete — otherwise the UPDATE is rejected outright (RAISE
-- EXCEPTION), matching the brief's "impeça menor de virar 'public' sem
-- consentimento" (block, not silently rewrite).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_athlete_profile_visibility()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.profile_visibility := CASE
            WHEN public.athlete_is_minor(NEW.birth_date) THEN 'restricted'::public.athlete_profile_visibility
            ELSE 'public'::public.athlete_profile_visibility
        END;
        RETURN NEW;
    END IF;

    -- TG_OP = 'UPDATE'
    IF public.athlete_is_minor(NEW.birth_date) AND NEW.profile_visibility = 'public' THEN
        IF NOT EXISTS (
            SELECT 1
            FROM public.guardian_consents
            WHERE athlete_id = NEW.id
              AND consent_type = 'public_profile'
        ) THEN
            RAISE EXCEPTION 'Perfil de atleta menor de idade so pode ser tornado publico com consentimento do responsavel (guardian_consents.consent_type = public_profile) registrado.'
                USING ERRCODE = 'check_violation';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_athlete_profile_visibility IS 'BEFORE INSERT/UPDATE trigger on athletes. INSERT: always recomputes profile_visibility from birth_date (client input ignored — no consent can exist yet for a new row). UPDATE: blocks (RAISE EXCEPTION) any attempt to set profile_visibility = public for a minor unless a guardian_consents row with consent_type = public_profile already exists for that athlete. SECURITY DEFINER so the guardian_consents lookup bypasses RLS (same pattern as get_own_athlete_id/get_coach_entity_id in 00005), since the caller (authenticated athlete) already has SELECT on their own consents anyway — this just avoids depending on that policy staying compatible.';

CREATE TRIGGER enforce_athlete_profile_visibility_before_insert
    BEFORE INSERT ON athletes
    FOR EACH ROW EXECUTE FUNCTION public.enforce_athlete_profile_visibility();

CREATE TRIGGER enforce_athlete_profile_visibility_before_update
    BEFORE UPDATE ON athletes
    FOR EACH ROW EXECUTE FUNCTION public.enforce_athlete_profile_visibility();

-- =============================================================================
-- PART 5 — Gate public (anon) read access by profile_visibility (FR-0.8 / D6)
-- =============================================================================
-- "public_read_athletes" (00005) and "public_read_achievements" (00004) were
-- both created with USING (true) — every profile was publicly readable
-- regardless of age. Recreated below scoped to profile_visibility = 'public'.
-- results/assessments never had a public-read policy at all even though
-- src/app/atleta/[slug]/page.tsx has queried both since Story 11.2/11.1 —
-- anon has always read zero rows from them (silently, no error, since RLS
-- default-deny just returns an empty set) — added here with the same gate.
--
-- Athlete's own SELECT access (athlete_read_own / athlete_read_own_results /
-- athlete_read_own_assessments / athlete_manage_own_achievements) is
-- untouched by this PART and keeps working regardless of profile_visibility
-- — those policies check ownership (auth.uid() / get_own_athlete_id()), not
-- profile_visibility, so a restricted athlete always sees their own data.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_athlete_profile_public(p_athlete_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.athletes
        WHERE id = p_athlete_id AND profile_visibility = 'public'
    );
$$;

COMMENT ON FUNCTION public.is_athlete_profile_public IS 'SECURITY DEFINER helper (same rationale as get_own_athlete_id/get_coach_entity_id, 00005) so the public_read_* policies on achievements/results/assessments below can check the linked athlete''s profile_visibility without depending on athletes RLS granting that access to the caller (anon never gets a row-level grant on athletes beyond public_read_athletes itself).';

DROP POLICY IF EXISTS "public_read_athletes" ON athletes;
CREATE POLICY "public_read_athletes"
    ON athletes FOR SELECT
    USING (profile_visibility = 'public');

DROP POLICY IF EXISTS "public_read_achievements" ON achievements;
CREATE POLICY "public_read_achievements"
    ON achievements FOR SELECT
    USING (public.is_athlete_profile_public(athlete_id));

CREATE POLICY "public_read_results"
    ON results FOR SELECT
    USING (public.is_athlete_profile_public(athlete_id));

CREATE POLICY "public_read_assessments"
    ON assessments FOR SELECT
    USING (public.is_athlete_profile_public(athlete_id));

-- =============================================================================
-- PART 6 — `abuse_reports` (FR-0.9 / D6)
-- =============================================================================
-- Public abuse/report channel, reachable from the public profile page and
-- (per D-B) a standalone /denunciar route, without requiring login.
-- ---------------------------------------------------------------------------

CREATE TYPE public.abuse_report_category AS ENUM (
    'abordagem_inadequada',
    'perfil_falso',
    'conteudo_inadequado',
    'outro'
);

CREATE TABLE public.abuse_reports (
    id                      uuid                        PRIMARY KEY DEFAULT gen_random_uuid(),
    reported_athlete_slug   text,
    reporter_email          text,
    category                public.abuse_report_category NOT NULL,
    description             text                        NOT NULL,
    created_at              timestamptz                 NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.abuse_reports IS 'Public report/denuncia channel (FR-0.9). reported_athlete_slug/reporter_email are both nullable by design: a report may reference the platform in general rather than a specific profile, and the reporter may choose to stay anonymous.';

CREATE INDEX idx_abuse_reports_created_at  ON public.abuse_reports(created_at);
CREATE INDEX idx_abuse_reports_category    ON public.abuse_reports(category);

ALTER TABLE public.abuse_reports ENABLE ROW LEVEL SECURITY;

-- Anyone (logged in or not) can file a report. No SELECT/UPDATE/DELETE
-- grant is given alongside this INSERT policy, so a reporter cannot read
-- back their own (or anyone else's) submitted reports.
CREATE POLICY "anyone_insert_abuse_reports"
    ON public.abuse_reports FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Only admin can review submitted reports.
CREATE POLICY "admin_read_abuse_reports"
    ON public.abuse_reports FOR SELECT
    USING (public.is_admin());

-- =============================================================================
-- END OF MIGRATION 00007
-- =============================================================================

COMMIT;

-- =============================================================================
-- VERIFICAÇÃO (rodar e revisar manualmente após o COMMIT acima)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- V1 — Contagem de tabelas do domínio recriadas (esperado: 14 — as 11
-- centrais + user_roles + guardian_consents + abuse_reports).
-- ---------------------------------------------------------------------------
SELECT count(*) AS domain_tables_recreated
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
      'entities', 'athletes', 'coaches', 'athlete_entities', 'competitions',
      'results', 'assessments', 'media', 'performance_kpis',
      'scouting_alerts', 'achievements', 'user_roles', 'guardian_consents',
      'abuse_reports'
  );

-- ---------------------------------------------------------------------------
-- V2 — Listagem de policies por tabela do domínio, para confirmar visualmente
-- que NENHUMA delas é do tipo "allow_all" (USING(true) para ALL/authenticated
-- irrestrito) — todas devem ter uma condição de posse/visibilidade real.
-- ---------------------------------------------------------------------------
SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
      'entities', 'athletes', 'coaches', 'athlete_entities', 'competitions',
      'results', 'assessments', 'media', 'performance_kpis',
      'scouting_alerts', 'achievements', 'user_roles', 'guardian_consents',
      'abuse_reports'
  )
ORDER BY tablename, policyname;

-- Assinatura explícita de que nenhuma policy "allow_all_*"/USING(true)-irrestrita
-- sobrou nas tabelas do domínio (deve retornar 0 linhas).
SELECT tablename, policyname, cmd, roles, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
      'entities', 'athletes', 'coaches', 'athlete_entities', 'competitions',
      'results', 'assessments', 'media', 'performance_kpis',
      'scouting_alerts', 'achievements'
  )
  AND cmd = 'ALL'
  AND qual = 'true';

-- ---------------------------------------------------------------------------
-- V3 — public.is_admin() existe (schema public) e auth.is_admin() NÃO existe.
-- ---------------------------------------------------------------------------
SELECT p.proname, n.nspname AS schema
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname = 'is_admin';

-- ---------------------------------------------------------------------------
-- V4 — Distribuição de roles em user_roles (audite qualquer role != 'atleta'
-- — mesmo racional de auditoria do remote_fase0_apply.sql: confirme se cada
-- usuário com role privilegiado realmente deveria tê-lo).
-- ---------------------------------------------------------------------------
SELECT role, count(*) AS total
FROM public.user_roles
GROUP BY role
ORDER BY role;

-- ---------------------------------------------------------------------------
-- V5 — Confirma que as tabelas/tipos de OUTRO produto e o postgis continuam
-- intactos (não foram tocados por este script).
-- ---------------------------------------------------------------------------
SELECT count(*) AS drift_tables_intact
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
      'accounts', 'ai_conversations', 'ai_insights', 'ai_messages',
      'categories', 'distributions', 'import_logs', 'organizations',
      'partners', 'transaction_edits', 'transactions', 'modalities',
      'brazilian_ufs', 'profiles'
  );

SELECT count(*) AS postgis_objects_intact
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'spatial_ref_sys';
