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
