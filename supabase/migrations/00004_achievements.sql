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
    USING (auth.is_admin());

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
