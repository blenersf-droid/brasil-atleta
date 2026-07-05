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
