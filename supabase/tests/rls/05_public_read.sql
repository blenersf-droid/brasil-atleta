-- =============================================================================
-- RLS Assertions — Theme (e): Public (anon) Read Access
-- =============================================================================
-- `athletes` (public_read_athletes, 00005) and `achievements`
-- (public_read_achievements, 00004) are deliberately readable with NO
-- authentication at all (public athlete profile page / portfolio), while
-- everything else stays authenticated-or-admin-only. This file proves `anon`
-- can read those two tables and cannot write to them (or read
-- authenticated-only tables like user_roles).
--
-- Depends on fixtures.sql's stable rows (athlete b1000000-...-000000000001,
-- achievement d1000000-...-000000000001) still existing — do not consume
-- them from a lifecycle test in another file.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. anon le athletes (perfil publico)
-- ---------------------------------------------------------------------------
DO $$
DECLARE v_found boolean;
BEGIN
    PERFORM _test.clear_jwt();
    SET ROLE anon;
    SELECT EXISTS(
        SELECT 1 FROM public.athletes WHERE id = 'b1000000-0000-0000-0000-000000000001'
    ) INTO v_found;
    RESET ROLE;

    PERFORM _test.record(
        'anon le athletes (perfil publico)',
        v_found,
        format('linha do fixture visivel para anon=%s', v_found)
    );
END $$;

-- ---------------------------------------------------------------------------
-- 2. anon le achievements
-- ---------------------------------------------------------------------------
DO $$
DECLARE v_found boolean;
BEGIN
    PERFORM _test.clear_jwt();
    SET ROLE anon;
    SELECT EXISTS(
        SELECT 1 FROM public.achievements WHERE id = 'd1000000-0000-0000-0000-000000000001'
    ) INTO v_found;
    RESET ROLE;

    PERFORM _test.record(
        'anon le achievements',
        v_found,
        format('linha do fixture visivel para anon=%s', v_found)
    );
END $$;

-- ---------------------------------------------------------------------------
-- 3. anon NAO consegue INSERT em athletes (nenhuma policy de INSERT para anon)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
    PERFORM _test.clear_jwt();
    SET ROLE anon;
    BEGIN
        INSERT INTO public.athletes (id, full_name) VALUES ('a5000000-0000-0000-0000-000000000001', 'Anon Intruder');
        RESET ROLE;
        PERFORM _test.record('anon NAO pode INSERT em athletes', false, 'INSERT nao foi bloqueado pela RLS');
    EXCEPTION WHEN OTHERS THEN
        RESET ROLE;
        PERFORM _test.record('anon NAO pode INSERT em athletes', true, SQLERRM);
    END;
END $$;

-- ---------------------------------------------------------------------------
-- 4. anon NAO consegue UPDATE em athletes (0 linhas, sem erro)
-- ---------------------------------------------------------------------------
DO $$
DECLARE v_count integer;
BEGIN
    PERFORM _test.clear_jwt();
    SET ROLE anon;
    UPDATE public.athletes SET full_name = 'Hackeado' WHERE id = 'b1000000-0000-0000-0000-000000000001';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RESET ROLE;

    PERFORM _test.record(
        'anon NAO pode UPDATE athletes',
        v_count = 0,
        format('linhas afetadas=%s (esperado 0)', v_count)
    );
END $$;

-- ---------------------------------------------------------------------------
-- 5. anon NAO le user_roles (tabela restrita a authenticated, propria linha)
-- ---------------------------------------------------------------------------
DO $$
DECLARE v_count integer;
BEGIN
    PERFORM _test.clear_jwt();
    SET ROLE anon;
    SELECT count(*) INTO v_count FROM public.user_roles;
    RESET ROLE;

    PERFORM _test.record(
        'anon NAO le nenhuma linha de user_roles',
        v_count = 0,
        format('linhas visiveis=%s (esperado 0)', v_count)
    );
END $$;
