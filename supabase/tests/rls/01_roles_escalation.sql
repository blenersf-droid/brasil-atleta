-- =============================================================================
-- RLS Assertions — Theme (a): Roles & Privilege Escalation (migration 00003)
-- =============================================================================
-- Covers: new auth.users row -> `atleta` role via trigger; `authenticated`
-- cannot INSERT/UPDATE/DELETE public.user_roles (including self-elevation);
-- `authenticated` can read its own role row and never another user's.
--
-- IMPORTANT semantics this file relies on (see README.md): a missing INSERT
-- policy makes Postgres RAISE an error (WITH CHECK has nothing to satisfy),
-- while a missing UPDATE/DELETE policy silently matches 0 rows (the USING
-- clause filters the row out before WITH CHECK is ever reached) — no error.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Trigger on_auth_user_created_set_role assigns 'atleta' to a brand-new user
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    v_role public.app_role;
BEGIN
    SELECT role INTO v_role
    FROM public.user_roles
    WHERE user_id = 'a1000000-0000-0000-0000-000000000001';

    PERFORM _test.record(
        'trigger on_auth_user_created_set_role atribui role atleta a novo usuario',
        v_role = 'atleta',
        format('role encontrada: %s', COALESCE(v_role::text, 'NULL (nenhuma linha)'))
    );
END $$;

-- ---------------------------------------------------------------------------
-- 2. authenticated NAO consegue INSERT em user_roles (nenhuma policy de INSERT existe)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
    PERFORM _test.set_jwt('a1000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    BEGIN
        INSERT INTO public.user_roles (user_id, role)
        VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'atleta');

        RESET ROLE;
        PERFORM _test.record('authenticated nao pode INSERT em user_roles', false, 'INSERT nao foi bloqueado pela RLS');
    EXCEPTION WHEN OTHERS THEN
        RESET ROLE;
        PERFORM _test.record('authenticated nao pode INSERT em user_roles', true, SQLERRM);
    END;
END $$;

-- ---------------------------------------------------------------------------
-- 3. authenticated NAO consegue elevar o proprio role via UPDATE
--    (0 linhas afetadas, sem erro — nao ha policy de UPDATE aplicavel)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    v_count integer;
    v_role  public.app_role;
BEGIN
    PERFORM _test.set_jwt('a1000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    UPDATE public.user_roles SET role = 'admin_nacional'
    WHERE user_id = 'a1000000-0000-0000-0000-000000000001';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RESET ROLE;

    SELECT role INTO v_role FROM public.user_roles
    WHERE user_id = 'a1000000-0000-0000-0000-000000000001';

    PERFORM _test.record(
        'authenticated nao pode elevar o proprio role via UPDATE',
        v_count = 0 AND v_role = 'atleta',
        format('linhas afetadas=%s, role final=%s', v_count, v_role)
    );
END $$;

-- ---------------------------------------------------------------------------
-- 4. authenticated NAO consegue apagar a propria linha de user_roles via DELETE
--    (0 linhas afetadas, sem erro)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    v_count integer;
    v_still_exists boolean;
BEGIN
    PERFORM _test.set_jwt('a1000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    DELETE FROM public.user_roles WHERE user_id = 'a1000000-0000-0000-0000-000000000001';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RESET ROLE;

    SELECT EXISTS(
        SELECT 1 FROM public.user_roles WHERE user_id = 'a1000000-0000-0000-0000-000000000001'
    ) INTO v_still_exists;

    PERFORM _test.record(
        'authenticated nao pode DELETE a propria linha de user_roles',
        v_count = 0 AND v_still_exists,
        format('linhas afetadas=%s, linha ainda existe=%s', v_count, v_still_exists)
    );
END $$;

-- ---------------------------------------------------------------------------
-- 5. authenticated le a PROPRIA linha de user_roles
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    v_count integer;
BEGIN
    PERFORM _test.set_jwt('a1000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    SELECT count(*) INTO v_count FROM public.user_roles;
    RESET ROLE;

    PERFORM _test.record(
        'authenticated le a propria linha de user_roles (e somente ela)',
        v_count = 1,
        format('linhas visiveis=%s (esperado 1)', v_count)
    );
END $$;

-- ---------------------------------------------------------------------------
-- 6. authenticated NAO consegue ler a linha de user_roles de OUTRO usuario
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    v_count integer;
BEGIN
    PERFORM _test.set_jwt('a1000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    SELECT count(*) INTO v_count FROM public.user_roles
    WHERE user_id = 'a1000000-0000-0000-0000-000000000002';
    RESET ROLE;

    PERFORM _test.record(
        'authenticated nao le a linha de user_roles de outro usuario',
        v_count = 0,
        format('linhas visiveis para user_id de outro usuario=%s (esperado 0)', v_count)
    );
END $$;
