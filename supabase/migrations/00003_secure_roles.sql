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
