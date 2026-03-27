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
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auth.is_admin()
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
    USING (auth.is_admin());

-- Authenticated users can read all entities (public reference data)
CREATE POLICY "authenticated_read_entities"
    ON entities FOR SELECT
    TO authenticated
    USING (true);

-- Only admin can insert/update/delete entities
CREATE POLICY "admin_write_entities"
    ON entities FOR ALL
    USING (auth.is_admin())
    WITH CHECK (auth.is_admin());

-- ---------------------------------------------------------------------------
-- POLICY: athletes
-- ---------------------------------------------------------------------------
-- Admin sees all athletes
CREATE POLICY "admin_read_athletes"
    ON athletes FOR SELECT
    USING (auth.is_admin());

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
    USING (auth.is_admin());

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
    USING (auth.is_admin());

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
    USING (auth.is_admin())
    WITH CHECK (auth.is_admin());

-- ---------------------------------------------------------------------------
-- POLICY: results
-- ---------------------------------------------------------------------------
-- Admin sees all results
CREATE POLICY "admin_read_results"
    ON results FOR SELECT
    USING (auth.is_admin());

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
    USING (auth.is_admin());

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
    USING (auth.is_admin());

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
    USING (auth.is_admin());

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
    USING (auth.is_admin());

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
