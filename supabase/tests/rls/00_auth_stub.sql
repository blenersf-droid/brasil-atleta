-- =============================================================================
-- Brasil Atleta — RLS Test Harness: Auth Stub
-- =============================================================================
-- Recreates the minimal subset of Supabase's managed `auth` schema that the
-- migrations in supabase/migrations/ depend on (auth.users as an FK target,
-- auth.uid()/auth.jwt() consumed by RLS policies) plus the anon/authenticated/
-- service_role Postgres roles Supabase provisions in every project.
--
-- This file MUST run BEFORE supabase/migrations/*.sql: 00001 references
-- auth.users(id) via FK (athletes.user_id, coaches.user_id), 00003 adds a PK
-- FK to auth.users on public.user_roles plus an AFTER INSERT trigger on
-- auth.users itself.
--
-- Also defines a tiny `_test` helper schema (results table + record/set_jwt/
-- clear_jwt functions) used by every assertion file in this directory.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Roles — mirrors Supabase's built-in Postgres roles. The container's
-- `postgres` user is a superuser, so it can `SET ROLE` to any of these
-- without an explicit GRANT (superusers bypass role-membership checks for
-- SET ROLE) and always bypasses RLS regardless of role, which is exactly why
-- every assertion below does its setup/fixture work as `postgres` and only
-- switches role for the specific statement under test.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOLOGIN BYPASSRLS;
    END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- Schema: auth
-- ---------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS auth;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;

-- Minimal auth.users: only the columns the migrations/app actually read
-- (id, email, raw_user_meta_data — see 00003's backfill query).
CREATE TABLE auth.users (
    id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    email               text,
    raw_user_meta_data  jsonb       NOT NULL DEFAULT '{}'::jsonb,
    raw_app_meta_data   jsonb       NOT NULL DEFAULT '{}'::jsonb,
    created_at          timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON auth.users TO anon, authenticated;
GRANT ALL ON auth.users TO service_role;

-- ---------------------------------------------------------------------------
-- auth.uid() / auth.jwt() — read the fake JWT claims set via _test.set_jwt()
-- (session GUC `request.jwt.claims`), same contract as real Supabase.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auth.jwt()
RETURNS jsonb
LANGUAGE sql STABLE AS $$
    SELECT COALESCE(NULLIF(current_setting('request.jwt.claims', true), ''), '{}')::jsonb;
$$;

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql STABLE AS $$
    SELECT NULLIF(auth.jwt() ->> 'sub', '')::uuid;
$$;

-- ---------------------------------------------------------------------------
-- Default privileges for `public` — applied to every table the migrations
-- create afterwards (this ALTER DEFAULT PRIVILEGES is scoped to statements
-- run by the executing role, i.e. `postgres`, which is also the role that
-- runs every migration in this harness).
-- ---------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL ON SEQUENCES TO service_role;

-- =============================================================================
-- `_test` helper schema — shared by every assertion file.
-- =============================================================================
CREATE SCHEMA IF NOT EXISTS _test;
GRANT USAGE ON SCHEMA _test TO anon, authenticated, service_role;

CREATE TABLE _test.results (
    id      serial PRIMARY KEY,
    name    text        NOT NULL,
    passed  boolean     NOT NULL,
    detail  text,
    ts      timestamptz NOT NULL DEFAULT now()
);

-- Records one assertion outcome and immediately echoes it as PASS/FAIL via
-- RAISE so `run.sh` sees it live in the psql output. SECURITY DEFINER so it
-- can be called while the session role is `anon`/`authenticated` (which have
-- no direct grants on _test.results) without that write itself being subject
-- to the RLS/role context under test.
CREATE OR REPLACE FUNCTION _test.record(p_name text, p_passed boolean, p_detail text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO _test.results (name, passed, detail) VALUES (p_name, p_passed, p_detail);
    IF p_passed THEN
        RAISE NOTICE 'PASS: %', p_name;
    ELSE
        RAISE WARNING 'FAIL: % — %', p_name, COALESCE(p_detail, '(sem detalhe)');
    END IF;
END;
$$;

-- Sets the fake JWT for the *current session* (`sub` = user id under test,
-- optionally merged with extra claims). Call as `postgres` BEFORE `SET ROLE`.
CREATE OR REPLACE FUNCTION _test.set_jwt(p_user_id uuid, p_extra jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE sql AS $$
    SELECT set_config(
        'request.jwt.claims',
        (jsonb_build_object('sub', p_user_id::text) || p_extra)::text,
        false
    );
$$;

-- Clears the fake JWT — simulates a fully anonymous request (no `sub`).
CREATE OR REPLACE FUNCTION _test.clear_jwt()
RETURNS void
LANGUAGE sql AS $$
    SELECT set_config('request.jwt.claims', '{}', false);
$$;

-- =============================================================================
-- END OF 00_auth_stub.sql
-- =============================================================================
