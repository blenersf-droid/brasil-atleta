-- =============================================================================
-- Brasil Atleta — Fase 0: Aplicação Consolidada e Idempotente no Remoto (Hosted)
-- =============================================================================
-- Gerado em: 2026-07-05
-- Gerado a partir de (leitura literal, não de memória):
--   supabase/migrations/00003_secure_roles.sql
--   supabase/migrations/00004_achievements.sql
--   supabase/migrations/00005_schema_reconciliation.sql
--   supabase/migrations/00006_self_service_policies.sql
--   supabase/migrations/00007_lgpd_minors.sql
--
-- OBJETIVO
-- Levar o banco Supabase HOSTED (que já tem 00001+00002 aplicadas, mas nunca
-- recebeu 00003-00007 via migration formal, e que acumulou DRIFT — objetos
-- criados manualmente pelo dashboard) ao estado funcional equivalente ao da
-- cadeia local 00003→00007, SEM apagar dados e SEM tocar em objetos de drift
-- que não pertencem a estas migrations.
--
-- IDEMPOTÊNCIA
-- Todo CREATE TABLE/INDEX/COLUMN usa IF NOT EXISTS; todo CREATE TYPE é
-- guardado por um DO $$ ... IF NOT EXISTS (SELECT 1 FROM pg_type ...) $$; toda
-- CREATE POLICY é precedida de DROP POLICY IF EXISTS; toda CREATE TRIGGER é
-- precedida de DROP TRIGGER IF EXISTS; toda função usa CREATE OR REPLACE.
-- Este script pode ser colado e executado no SQL Editor do dashboard MAIS DE
-- UMA VEZ sem erro.
--
-- DIVERGÊNCIAS DELIBERADAS vs. as migrations locais (por causa do drift real
-- do remoto, sondado via REST/PostgREST — ver brief da tarefa):
--
--   (1) achievements.type permanece TEXT — a tabela `achievements` já existe
--       no remoto com 10 colunas e `type text` (não o enum `achievement_type`
--       que 00004 definiria do zero). NÃO convertemos essa coluna para enum
--       aqui: seria uma ALTER COLUMN potencialmente destrutiva sobre dados
--       reais, e o app hoje já envia/lê strings livremente nesse campo. O
--       enum `achievement_type` também NÃO é criado por este script (nenhuma
--       policy de `achievements` depende dele — conferido lendo 00004: as 3
--       policies só referenciam `athlete_id`/`auth.is_admin()`). A tabela em
--       si também NÃO é recriada/alterada estruturalmente — apenas RLS,
--       policies, índices e trigger de updated_at são aplicados sobre ela.
--
--   (2) Tabelas de drift fora do escopo das migrations — `profiles`,
--       `modalities`, `brazilian_ufs` — não são referenciadas, alteradas ou
--       removidas em nenhum ponto deste script.
--
--   (3) Backfill de athletes.slug (00005 PART 2): o loop original varre TODOS
--       os atletas incondicionalmente. Adaptado aqui para rodar apenas sobre
--       linhas com slug IS NULL, preservando qualquer slug já preenchido
--       manualmente no remoto (drift confirmado: "athletes.slug já existe").
--
--   (4) Unicidade de athletes.slug (00005 PART 2): PostgreSQL não suporta
--       `ALTER TABLE ... ADD CONSTRAINT IF NOT EXISTS` para UNIQUE constraints
--       — substituído por `CREATE UNIQUE INDEX IF NOT EXISTS
--       athletes_slug_unique_idx ON athletes(slug)`, funcionalmente
--       equivalente (permite múltiplos NULLs, garante unicidade de valores
--       não-nulos).
--
-- ATENÇÃO / RISCO CONHECIDO (não é um bug do script, é uma característica do
-- backfill original que decidimos preservar — ver Decisões no retorno):
--   PART 2 da seção 00007 (profile_visibility) recalcula a visibilidade de
--   TODOS os atletas a partir de birth_date TODA VEZ que este script roda.
--   Se este script for reexecutado depois que o responsável de um atleta
--   menor já tiver dado consentimento e o app tiver marcado o perfil como
--   'public', essa reexecução vai reverter esse perfil para 'restricted'
--   (a idade continua indicando menor de idade). Isso NÃO gera erro (a
--   condição da trigger enforce_athlete_profile_visibility só bloqueia
--   tentativas de setar 'public' para um menor sem consentimento — setar
--   'restricted' nunca é bloqueado), mas é uma reversão de estado de negócio
--   indesejada. Recomendação: rodar este script apenas para o apply inicial
--   da Fase 0 (banco ainda sem consentimentos reais); não usá-lo como rotina
--   de manutenção recorrente depois que o fluxo de consentimento estiver em
--   produção.
--
-- FORA DO ESCOPO: migrations 00001-00007 não foram editadas; nada em
-- packages/web foi tocado; nada foi aplicado no banco remoto por este agente.
-- =============================================================================

BEGIN;

-- =============================================================================
-- SEÇÃO 00003 — Secure Server-Controlled Roles
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ENUM: app_role
-- ---------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type
        WHERE typname = 'app_role' AND typnamespace = 'public'::regnamespace
    ) THEN
        CREATE TYPE public.app_role AS ENUM (
            'admin_nacional',
            'confederacao',
            'federacao',
            'clube',
            'tecnico',
            'atleta'
        );
    END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- TABLE: user_roles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id     uuid            PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role        public.app_role NOT NULL DEFAULT 'atleta',
    created_at  timestamptz     NOT NULL DEFAULT now(),
    updated_at  timestamptz     NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.user_roles IS 'Server-controlled source of truth for user roles. No client-writable path exists — only service_role or the on_auth_user_created_set_role trigger can write to this table.';

DROP TRIGGER IF EXISTS set_updated_at_user_roles ON public.user_roles;
CREATE TRIGGER set_updated_at_user_roles
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_read_own_role" ON public.user_roles;
CREATE POLICY "user_read_own_role"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- BACKFILL: migra o papel atual (de user_metadata) para user_roles.
-- Naturalmente idempotente via ON CONFLICT DO NOTHING.
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
-- TRIGGER: default de todo novo auth user para 'atleta'
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

DROP TRIGGER IF EXISTS on_auth_user_created_set_role ON auth.users;
CREATE TRIGGER on_auth_user_created_set_role
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- ---------------------------------------------------------------------------
-- FUNCTION: get_user_role() — lê de public.user_roles (não mais de JWT).
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
-- FUNCTION: auth.is_admin() — agora baseada em public.get_user_role().
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS boolean AS $$
    SELECT public.get_user_role() = 'admin_nacional';
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------------
-- CLEANUP: remove função morta/perigosa de 00002.
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_user_entity_id();

-- =============================================================================
-- SEÇÃO 00004 — Achievements: RLS/policies/índices/trigger
-- (a TABELA em si já existe no remoto por drift — NÃO é criada/alterada
-- estruturalmente aqui; ver DIVERGÊNCIA (1) no cabeçalho)
-- =============================================================================

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_achievements_athlete_id ON public.achievements(athlete_id);
CREATE INDEX IF NOT EXISTS idx_achievements_type       ON public.achievements(type);
CREATE INDEX IF NOT EXISTS idx_achievements_date       ON public.achievements(date);

DROP TRIGGER IF EXISTS set_updated_at_achievements ON public.achievements;
CREATE TRIGGER set_updated_at_achievements
    BEFORE UPDATE ON public.achievements
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Admin vê tudo
DROP POLICY IF EXISTS "admin_read_achievements" ON public.achievements;
CREATE POLICY "admin_read_achievements"
    ON public.achievements FOR SELECT
    USING (auth.is_admin());

-- Leitura pública (USING true) — será sobrescrita na SEÇÃO 00007 PART 5,
-- restrita por profile_visibility. Mantida aqui na mesma ordem da cadeia
-- original 00004 -> 00007.
DROP POLICY IF EXISTS "public_read_achievements" ON public.achievements;
CREATE POLICY "public_read_achievements"
    ON public.achievements FOR SELECT
    USING (true);

-- Atleta gerencia (insert/update/delete/select) suas próprias conquistas
DROP POLICY IF EXISTS "athlete_manage_own_achievements" ON public.achievements;
CREATE POLICY "athlete_manage_own_achievements"
    ON public.achievements FOR ALL
    TO authenticated
    USING (
        athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
    )
    WITH CHECK (
        athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
    );

-- =============================================================================
-- SEÇÃO 00005 — Schema Reconciliation
-- =============================================================================

-- ---------------------------------------------------------------------------
-- PART 1 — Corrige recursão infinita em "entity_read_own_coaches"
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

DROP POLICY IF EXISTS "entity_read_own_coaches" ON public.coaches;
CREATE POLICY "entity_read_own_coaches"
    ON public.coaches FOR SELECT
    TO authenticated
    USING (
        entity_id IN (SELECT public.get_coach_entity_id())
    );

-- ---------------------------------------------------------------------------
-- Corrige recursão mútua athletes <-> athlete_entities
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

DROP POLICY IF EXISTS "athlete_read_own_athlete_entities" ON public.athlete_entities;
CREATE POLICY "athlete_read_own_athlete_entities"
    ON public.athlete_entities FOR SELECT
    TO authenticated
    USING (
        athlete_id IN (SELECT public.get_own_athlete_id())
    );

-- ---------------------------------------------------------------------------
-- PART 2 — athletes.slug / athletes.bio
-- (colunas já existem no remoto por drift — ADD COLUMN IF NOT EXISTS é no-op)
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "unaccent";

ALTER TABLE public.athletes
    ADD COLUMN IF NOT EXISTS slug text,
    ADD COLUMN IF NOT EXISTS bio text;

CREATE OR REPLACE FUNCTION public.generate_athlete_slug(p_full_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT trim(both '-' from regexp_replace(lower(unaccent(p_full_name)), '[^a-z0-9]+', '-', 'g'));
$$;

COMMENT ON FUNCTION public.generate_athlete_slug IS 'SQL port of generateSlug() in packages/web/src/lib/utils/slug.ts, used for backfill of athletes.slug. The app itself still generates slugs client/server-side with the TS implementation.';

-- Backfill: SOMENTE linhas com slug IS NULL (divergência (3) do cabeçalho —
-- preserva qualquer slug já preenchido manualmente no remoto).
DO $$
DECLARE
    r RECORD;
    base_slug text;
    candidate_slug text;
    suffix integer;
BEGIN
    FOR r IN
        SELECT id, full_name FROM public.athletes WHERE slug IS NULL ORDER BY created_at, id
    LOOP
        base_slug := public.generate_athlete_slug(r.full_name);
        IF base_slug IS NULL OR base_slug = '' THEN
            base_slug := 'atleta-' || substr(r.id::text, 1, 8);
        END IF;

        candidate_slug := base_slug;
        suffix := 1;
        WHILE EXISTS (
            SELECT 1 FROM public.athletes WHERE slug = candidate_slug AND id <> r.id
        ) LOOP
            suffix := suffix + 1;
            candidate_slug := base_slug || '-' || suffix;
        END LOOP;

        UPDATE public.athletes SET slug = candidate_slug WHERE id = r.id;
    END LOOP;
END;
$$;

-- Divergência (4) do cabeçalho: índice único no lugar de ADD CONSTRAINT
-- (Postgres não suporta ADD CONSTRAINT IF NOT EXISTS para UNIQUE).
CREATE UNIQUE INDEX IF NOT EXISTS athletes_slug_unique_idx ON public.athletes(slug);

-- ---------------------------------------------------------------------------
-- PART 3 — competitions.created_by_athlete_id / .status
-- ---------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type
        WHERE typname = 'competition_status' AND typnamespace = 'public'::regnamespace
    ) THEN
        CREATE TYPE public.competition_status AS ENUM (
            'scheduled',
            'ongoing',
            'completed',
            'cancelled'
        );
    END IF;
END
$$;

ALTER TABLE public.competitions
    ADD COLUMN IF NOT EXISTS created_by_athlete_id uuid REFERENCES public.athletes(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS status public.competition_status NOT NULL DEFAULT 'scheduled';

CREATE INDEX IF NOT EXISTS idx_competitions_created_by_athlete ON public.competitions(created_by_athlete_id);

-- ---------------------------------------------------------------------------
-- PART 4 — Leitura pública (anon) em `athletes`
-- (será restrita por profile_visibility na SEÇÃO 00007 PART 5)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "public_read_athletes" ON public.athletes;
CREATE POLICY "public_read_athletes"
    ON public.athletes FOR SELECT
    USING (true);

-- =============================================================================
-- SEÇÃO 00006 — Self-Service Policies & Slug Trigger
-- =============================================================================

-- ---------------------------------------------------------------------------
-- PART 1 — Policies de escrita self-service (results/assessments/competitions)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "athlete_write_own_results" ON public.results;
CREATE POLICY "athlete_write_own_results"
    ON public.results FOR ALL
    TO authenticated
    USING (
        athlete_id IN (SELECT public.get_own_athlete_id())
    )
    WITH CHECK (
        athlete_id IN (SELECT public.get_own_athlete_id())
    );

DROP POLICY IF EXISTS "athlete_write_own_assessments" ON public.assessments;
CREATE POLICY "athlete_write_own_assessments"
    ON public.assessments FOR ALL
    TO authenticated
    USING (
        athlete_id IN (SELECT public.get_own_athlete_id())
    )
    WITH CHECK (
        athlete_id IN (SELECT public.get_own_athlete_id())
    );

DROP POLICY IF EXISTS "athlete_write_own_competitions" ON public.competitions;
CREATE POLICY "athlete_write_own_competitions"
    ON public.competitions FOR ALL
    TO authenticated
    USING (
        created_by_athlete_id IN (SELECT public.get_own_athlete_id())
    )
    WITH CHECK (
        created_by_athlete_id IN (SELECT public.get_own_athlete_id())
    );

-- ---------------------------------------------------------------------------
-- PART 2 — Auto-geração de athletes.slug em INSERT/UPDATE
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

COMMENT ON FUNCTION public.set_athlete_slug IS 'BEFORE INSERT/UPDATE trigger function for athletes.slug: generates a slug from full_name with a numeric-suffix fallback on collision. Only runs when NEW.slug IS NULL (see WHEN clauses below) — an explicit/pre-existing slug is always preserved.';

DROP TRIGGER IF EXISTS set_athlete_slug_before_insert ON public.athletes;
CREATE TRIGGER set_athlete_slug_before_insert
    BEFORE INSERT ON public.athletes
    FOR EACH ROW
    WHEN (NEW.slug IS NULL)
    EXECUTE FUNCTION public.set_athlete_slug();

DROP TRIGGER IF EXISTS set_athlete_slug_before_update ON public.athletes;
CREATE TRIGGER set_athlete_slug_before_update
    BEFORE UPDATE ON public.athletes
    FOR EACH ROW
    WHEN (NEW.slug IS NULL)
    EXECUTE FUNCTION public.set_athlete_slug();

-- =============================================================================
-- SEÇÃO 00007 — LGPD & Proteção de Menores
-- =============================================================================

-- ---------------------------------------------------------------------------
-- PART 1 — INSERT self-service em `athletes`
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "athlete_insert_own" ON public.athletes;
CREATE POLICY "athlete_insert_own"
    ON public.athletes FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- PART 2 — athletes.profile_visibility
-- ---------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type
        WHERE typname = 'athlete_profile_visibility' AND typnamespace = 'public'::regnamespace
    ) THEN
        CREATE TYPE public.athlete_profile_visibility AS ENUM (
            'public',
            'restricted'
        );
    END IF;
END
$$;

ALTER TABLE public.athletes
    ADD COLUMN IF NOT EXISTS profile_visibility public.athlete_profile_visibility NOT NULL DEFAULT 'restricted';

CREATE OR REPLACE FUNCTION public.athlete_is_minor(p_birth_date date)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT p_birth_date IS NULL OR p_birth_date > (CURRENT_DATE - INTERVAL '18 years')::date;
$$;

COMMENT ON FUNCTION public.athlete_is_minor IS 'Returns true if p_birth_date represents someone under 18 as of today, or if p_birth_date is NULL (conservative: unknown age is never treated as adult).';

-- Backfill: adultos -> public, menores/desconhecido -> restricted.
-- ATENÇÃO: ver nota de risco no cabeçalho deste arquivo — este UPDATE
-- recalcula profile_visibility de TODOS os atletas a cada execução deste
-- script, a partir apenas da idade (fiel ao comportamento original de 00007).
UPDATE public.athletes
SET profile_visibility = CASE
    WHEN public.athlete_is_minor(birth_date) THEN 'restricted'::public.athlete_profile_visibility
    ELSE 'public'::public.athlete_profile_visibility
END;

-- ---------------------------------------------------------------------------
-- PART 3 — guardian_consents
-- ---------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type
        WHERE typname = 'guardian_relationship_type' AND typnamespace = 'public'::regnamespace
    ) THEN
        CREATE TYPE public.guardian_relationship_type AS ENUM (
            'mae',
            'pai',
            'tutor',
            'outro'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type
        WHERE typname = 'guardian_consent_type' AND typnamespace = 'public'::regnamespace
    ) THEN
        CREATE TYPE public.guardian_consent_type AS ENUM (
            'account',
            'public_profile'
        );
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.guardian_consents (
    id                      uuid                              PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id              uuid                              NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
    guardian_full_name      text                              NOT NULL,
    guardian_email          text                              NOT NULL,
    guardian_relationship   public.guardian_relationship_type NOT NULL,
    consent_type            public.guardian_consent_type      NOT NULL,
    consented_at            timestamptz                       NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.guardian_consents IS 'Immutable log of guardian/responsible-adult consent events for minor athletes (LGPD art. 14). No UPDATE/DELETE policy is granted to authenticated — this is an audit trail, not an editable record.';

CREATE INDEX IF NOT EXISTS idx_guardian_consents_athlete_id    ON public.guardian_consents(athlete_id);
CREATE INDEX IF NOT EXISTS idx_guardian_consents_consent_type  ON public.guardian_consents(consent_type);

ALTER TABLE public.guardian_consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_guardian_consents" ON public.guardian_consents;
CREATE POLICY "admin_read_guardian_consents"
    ON public.guardian_consents FOR SELECT
    USING (auth.is_admin());

DROP POLICY IF EXISTS "athlete_read_own_guardian_consents" ON public.guardian_consents;
CREATE POLICY "athlete_read_own_guardian_consents"
    ON public.guardian_consents FOR SELECT
    TO authenticated
    USING (athlete_id IN (SELECT public.get_own_athlete_id()));

DROP POLICY IF EXISTS "athlete_insert_own_guardian_consents" ON public.guardian_consents;
CREATE POLICY "athlete_insert_own_guardian_consents"
    ON public.guardian_consents FOR INSERT
    TO authenticated
    WITH CHECK (athlete_id IN (SELECT public.get_own_athlete_id()));

-- ---------------------------------------------------------------------------
-- PART 4 — Enforce profile_visibility em tempo de escrita
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

COMMENT ON FUNCTION public.enforce_athlete_profile_visibility IS 'BEFORE INSERT/UPDATE trigger on athletes. INSERT: always recomputes profile_visibility from birth_date. UPDATE: blocks setting profile_visibility = public for a minor unless a guardian_consents row with consent_type = public_profile already exists.';

DROP TRIGGER IF EXISTS enforce_athlete_profile_visibility_before_insert ON public.athletes;
CREATE TRIGGER enforce_athlete_profile_visibility_before_insert
    BEFORE INSERT ON public.athletes
    FOR EACH ROW EXECUTE FUNCTION public.enforce_athlete_profile_visibility();

DROP TRIGGER IF EXISTS enforce_athlete_profile_visibility_before_update ON public.athletes;
CREATE TRIGGER enforce_athlete_profile_visibility_before_update
    BEFORE UPDATE ON public.athletes
    FOR EACH ROW EXECUTE FUNCTION public.enforce_athlete_profile_visibility();

-- ---------------------------------------------------------------------------
-- PART 5 — Gate de leitura pública (anon) por profile_visibility
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

COMMENT ON FUNCTION public.is_athlete_profile_public IS 'SECURITY DEFINER helper so the public_read_* policies on achievements/results/assessments can check the linked athlete''s profile_visibility without depending on athletes RLS granting that access to the caller.';

DROP POLICY IF EXISTS "public_read_athletes" ON public.athletes;
CREATE POLICY "public_read_athletes"
    ON public.athletes FOR SELECT
    USING (profile_visibility = 'public');

DROP POLICY IF EXISTS "public_read_achievements" ON public.achievements;
CREATE POLICY "public_read_achievements"
    ON public.achievements FOR SELECT
    USING (public.is_athlete_profile_public(athlete_id));

DROP POLICY IF EXISTS "public_read_results" ON public.results;
CREATE POLICY "public_read_results"
    ON public.results FOR SELECT
    USING (public.is_athlete_profile_public(athlete_id));

DROP POLICY IF EXISTS "public_read_assessments" ON public.assessments;
CREATE POLICY "public_read_assessments"
    ON public.assessments FOR SELECT
    USING (public.is_athlete_profile_public(athlete_id));

-- ---------------------------------------------------------------------------
-- PART 6 — abuse_reports
-- ---------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type
        WHERE typname = 'abuse_report_category' AND typnamespace = 'public'::regnamespace
    ) THEN
        CREATE TYPE public.abuse_report_category AS ENUM (
            'abordagem_inadequada',
            'perfil_falso',
            'conteudo_inadequado',
            'outro'
        );
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.abuse_reports (
    id                      uuid                          PRIMARY KEY DEFAULT gen_random_uuid(),
    reported_athlete_slug   text,
    reporter_email          text,
    category                public.abuse_report_category NOT NULL,
    description             text                          NOT NULL,
    created_at              timestamptz                   NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.abuse_reports IS 'Public report/denuncia channel (FR-0.9). reported_athlete_slug/reporter_email are both nullable by design.';

CREATE INDEX IF NOT EXISTS idx_abuse_reports_created_at  ON public.abuse_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_abuse_reports_category    ON public.abuse_reports(category);

ALTER TABLE public.abuse_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_insert_abuse_reports" ON public.abuse_reports;
CREATE POLICY "anyone_insert_abuse_reports"
    ON public.abuse_reports FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "admin_read_abuse_reports" ON public.abuse_reports;
CREATE POLICY "admin_read_abuse_reports"
    ON public.abuse_reports FOR SELECT
    USING (auth.is_admin());

COMMIT;

-- =============================================================================
-- AUDITORIA (rodar e revisar manualmente após o COMMIT acima)
-- =============================================================================
-- Confira se algum papel privilegiado inesperado foi puxado pelo backfill de
-- user_roles (usuários que se auto-cadastraram como admin_nacional/
-- confederacao/federacao/clube/tecnico via user_metadata ANTES da correção de
-- privilege-escalation). Qualquer linha com role != 'atleta' aqui merece
-- revisão manual — confirme se cada usuário realmente deveria ter esse papel;
-- se não, corrija com um UPDATE manual (fora deste script) via service_role.
SELECT role, count(*) AS total
FROM public.user_roles
GROUP BY role
ORDER BY role;
