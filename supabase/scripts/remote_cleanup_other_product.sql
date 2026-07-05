-- =============================================================================
-- Brasil Atleta — Limpeza das tabelas de OUTRO PRODUTO no banco hosted
-- =============================================================================
-- Gerado em: 2026-07-05
--
-- CONTEXTO
-- O banco hosted acumulou, por um template/produto anterior, um sistema
-- financeiro/AI multi-tenant com raiz em `organizations`. Essas tabelas NÃO
-- pertencem ao Brasil Atleta, estão todas VAZIAS (0 linhas) e são totalmente
-- desacopladas do domínio (nenhuma FK cruza para athletes/entities/etc. —
-- verificado em pg_constraint). Este script as remove.
--
-- TRIGGER DE SIGNUP: o trigger `on_auth_user_created` em auth.users chama
-- `handle_new_user()`, que insere em `profiles` (deste outro produto). Ele é
-- removido aqui — senão, ao dropar `profiles`, todo signup de atleta
-- quebraria. O trigger do Brasil Atleta (`on_auth_user_created_set_role` ->
-- `handle_new_user_role`, que popula user_roles) é PRESERVADO.
--
-- PRESERVADO deliberadamente:
--   - `modalities`, `brazilian_ufs`: tabelas de referência ESPORTIVA (não são
--     "outro produto"); órfãs hoje, mas úteis potencialmente na Fase 1/2.
--   - `rls_auto_enable()`: event trigger utilitário genérico (auto-habilita
--     RLS em novas tabelas); inofensivo, mantido.
--   - postgis/pg_trgm, spatial_ref_sys, e todo o domínio Brasil Atleta.
--
-- Idempotente (IF EXISTS em tudo). Transacional. Backup do estado anterior:
-- backup_public_20260705.sql.
-- =============================================================================

BEGIN;

-- 1. Trigger do outro produto em auth.users (cria `profiles` no signup).
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Tabelas do outro produto (CASCADE resolve FKs entre elas).
DROP TABLE IF EXISTS public.transaction_edits CASCADE;
DROP TABLE IF EXISTS public.transactions      CASCADE;
DROP TABLE IF EXISTS public.distributions     CASCADE;
DROP TABLE IF EXISTS public.ai_messages       CASCADE;
DROP TABLE IF EXISTS public.ai_insights       CASCADE;
DROP TABLE IF EXISTS public.ai_conversations  CASCADE;
DROP TABLE IF EXISTS public.import_logs       CASCADE;
DROP TABLE IF EXISTS public.partners          CASCADE;
DROP TABLE IF EXISTS public.accounts          CASCADE;
DROP TABLE IF EXISTS public.categories        CASCADE;
DROP TABLE IF EXISTS public.profiles          CASCADE;
DROP TABLE IF EXISTS public.organizations     CASCADE;

-- 3. Funções órfãs do outro produto (dependem de profiles/organizations).
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.auth_org_id()     CASCADE;

-- 4. Enum do outro produto.
DROP TYPE IF EXISTS public.allocation_bucket CASCADE;

COMMIT;
