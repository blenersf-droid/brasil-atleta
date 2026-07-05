-- =============================================================================
-- Brasil Atleta — RLS Test Harness: Shared Fixtures
-- =============================================================================
-- Runs as `postgres` (superuser, bypasses RLS) AFTER supabase/migrations/*.sql
-- and supabase/seed.sql. Creates the minimal, stable dataset every assertion
-- file relies on: 2 auth users + 2 athlete profiles they own, 1 competition,
-- and 1 achievement.
--
-- Fixed UUIDs so assertion files can reference these rows directly. Any row
-- an assertion file creates/mutates/deletes as part of its own test lifecycle
-- (e.g. the achievements/media CRUD checks in 02_recursion_self_service.sql)
-- MUST use its own ids, not the ones below — 05_public_read.sql depends on
-- the fixture achievement (d1000000-...-000000000001) still existing.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- auth.users — inserting these fires the on_auth_user_created_set_role
-- trigger (00003), which is itself asserted on in 01_roles_escalation.sql.
-- ---------------------------------------------------------------------------
INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
    ('a1000000-0000-0000-0000-000000000001', 'fixture.athlete1@test.dev', '{"full_name":"Fixture Athlete One"}'),
    ('a1000000-0000-0000-0000-000000000002', 'fixture.athlete2@test.dev', '{"full_name":"Fixture Athlete Two"}');

-- ---------------------------------------------------------------------------
-- athletes — 2 distinct owners, required for the "2+ athletes" recursion
-- regression scenario (00005) and for every "own vs. other" RLS assertion.
--
-- birth_date is set to an adult date on purpose: as of migration 00007 (LGPD
-- & protecao de menores, applied automatically by run.sh's migrations glob —
-- not itself asserted on here, see README.md), a BEFORE INSERT trigger
-- derives athletes.profile_visibility from birth_date, defaulting anyone
-- with a NULL/minor birth_date to 'restricted'. 05_public_read.sql's anon
-- read assertions need these two fixtures to be 'public' (the pre-00007
-- behavior every athlete had), so both get an unambiguous adult birth_date.
-- ---------------------------------------------------------------------------
INSERT INTO public.athletes (id, user_id, full_name, primary_modality, birth_date) VALUES
    ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Fixture Athlete One', 'ATL', '1995-06-15'),
    ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'Fixture Athlete Two', 'NAT', '1998-03-20');

-- ---------------------------------------------------------------------------
-- competitions — required as an FK target for the `results` self-service
-- tests (03_self_service_writes.sql).
-- ---------------------------------------------------------------------------
INSERT INTO public.competitions (id, name, modality_code) VALUES
    ('c1000000-0000-0000-0000-000000000001', 'Fixture Competition', 'ATL');

-- ---------------------------------------------------------------------------
-- achievements — one stable, publicly-readable row used by
-- 05_public_read.sql. Not touched by the CRUD lifecycle assertions.
-- ---------------------------------------------------------------------------
INSERT INTO public.achievements (id, athlete_id, title, date, type) VALUES
    ('d1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Fixture Achievement', '2024-01-01', 'gold');
