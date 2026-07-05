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
