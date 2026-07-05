-- =============================================================================
-- RLS Assertions — Theme (c): Self-Service Writes (migration 00006)
-- =============================================================================
-- 00006 added the first INSERT/UPDATE/DELETE policies for `authenticated` on
-- results/assessments (previously SELECT-only) and competitions (previously
-- admin-only), all scoped via public.get_own_athlete_id() /
-- created_by_athlete_id. Same PASS semantics as 02_recursion_self_service.sql:
-- spoofed INSERT -> exception (WITH CHECK failure), write to another
-- athlete's row -> 0 rows affected (USING filters it out), no error.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Setup: a result/assessment/competition owned by athlete2, to prove athlete1
-- cannot mutate rows they don't own.
-- ---------------------------------------------------------------------------
INSERT INTO public.results (id, athlete_id, competition_id, position, mark) VALUES
    ('11100000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 3, '10.50');

INSERT INTO public.assessments (id, athlete_id, assessment_date, protocol) VALUES
    ('22200000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', '2024-01-15', 'Athlete2 Protocol');

INSERT INTO public.competitions (id, name, created_by_athlete_id, status) VALUES
    ('33300000-0000-0000-0000-000000000002', 'Athlete2 Competition', 'b1000000-0000-0000-0000-000000000002', 'completed');

-- =============================================================================
-- results
-- =============================================================================

DO $$
BEGIN
    PERFORM _test.set_jwt('a1000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    BEGIN
        INSERT INTO public.results (id, athlete_id, competition_id, position, mark)
        VALUES ('11100000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 1, '9.90');
        RESET ROLE;
        PERFORM _test.record('athlete INSERT em result proprio', true, 'insert concluido sem erro');
    EXCEPTION WHEN OTHERS THEN
        RESET ROLE;
        PERFORM _test.record('athlete INSERT em result proprio', false, SQLERRM);
    END;
END $$;

DO $$
BEGIN
    PERFORM _test.set_jwt('a1000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    BEGIN
        INSERT INTO public.results (id, athlete_id, competition_id, position, mark)
        VALUES ('11100000-0000-0000-0000-000000000098', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 2, '9.80');
        RESET ROLE;
        PERFORM _test.record('athlete NAO pode INSERT result de outro atleta (spoof)', false, 'INSERT nao foi bloqueado pela RLS');
    EXCEPTION WHEN OTHERS THEN
        RESET ROLE;
        PERFORM _test.record('athlete NAO pode INSERT result de outro atleta (spoof)', true, SQLERRM);
    END;
END $$;

DO $$
DECLARE v_count integer;
BEGIN
    PERFORM _test.set_jwt('a1000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    UPDATE public.results SET position = 1, mark = '9.85' WHERE id = '11100000-0000-0000-0000-000000000001';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RESET ROLE;
    PERFORM _test.record('athlete UPDATE no proprio result', v_count = 1, format('linhas afetadas=%s', v_count));
END $$;

DO $$
DECLARE v_count integer;
BEGIN
    PERFORM _test.set_jwt('a1000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    UPDATE public.results SET mark = 'Hackeado' WHERE id = '11100000-0000-0000-0000-000000000002';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RESET ROLE;
    PERFORM _test.record('athlete NAO pode UPDATE result de outro atleta', v_count = 0, format('linhas afetadas=%s (esperado 0)', v_count));
END $$;

DO $$
DECLARE v_count integer;
BEGIN
    PERFORM _test.set_jwt('a1000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    DELETE FROM public.results WHERE id = '11100000-0000-0000-0000-000000000002';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RESET ROLE;
    PERFORM _test.record('athlete NAO pode DELETE result de outro atleta', v_count = 0, format('linhas afetadas=%s (esperado 0)', v_count));
END $$;

DO $$
DECLARE v_count integer;
BEGIN
    PERFORM _test.set_jwt('a1000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    DELETE FROM public.results WHERE id = '11100000-0000-0000-0000-000000000001';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RESET ROLE;
    PERFORM _test.record('athlete DELETE no proprio result', v_count = 1, format('linhas afetadas=%s', v_count));
END $$;

-- =============================================================================
-- assessments
-- =============================================================================

DO $$
BEGIN
    PERFORM _test.set_jwt('a1000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    BEGIN
        INSERT INTO public.assessments (id, athlete_id, assessment_date, protocol)
        VALUES ('22200000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', '2024-01-20', 'Athlete1 Protocol');
        RESET ROLE;
        PERFORM _test.record('athlete INSERT em assessment propria', true, 'insert concluido sem erro');
    EXCEPTION WHEN OTHERS THEN
        RESET ROLE;
        PERFORM _test.record('athlete INSERT em assessment propria', false, SQLERRM);
    END;
END $$;

DO $$
BEGIN
    PERFORM _test.set_jwt('a1000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    BEGIN
        INSERT INTO public.assessments (id, athlete_id, assessment_date, protocol)
        VALUES ('22200000-0000-0000-0000-000000000098', 'b1000000-0000-0000-0000-000000000002', '2024-01-20', 'Spoofed Protocol');
        RESET ROLE;
        PERFORM _test.record('athlete NAO pode INSERT assessment de outro atleta (spoof)', false, 'INSERT nao foi bloqueado pela RLS');
    EXCEPTION WHEN OTHERS THEN
        RESET ROLE;
        PERFORM _test.record('athlete NAO pode INSERT assessment de outro atleta (spoof)', true, SQLERRM);
    END;
END $$;

DO $$
DECLARE v_count integer;
BEGIN
    PERFORM _test.set_jwt('a1000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    UPDATE public.assessments SET protocol = 'Athlete1 Protocol (editado)' WHERE id = '22200000-0000-0000-0000-000000000001';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RESET ROLE;
    PERFORM _test.record('athlete UPDATE na propria assessment', v_count = 1, format('linhas afetadas=%s', v_count));
END $$;

DO $$
DECLARE v_count integer;
BEGIN
    PERFORM _test.set_jwt('a1000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    UPDATE public.assessments SET protocol = 'Hackeado' WHERE id = '22200000-0000-0000-0000-000000000002';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RESET ROLE;
    PERFORM _test.record('athlete NAO pode UPDATE assessment de outro atleta', v_count = 0, format('linhas afetadas=%s (esperado 0)', v_count));
END $$;

DO $$
DECLARE v_count integer;
BEGIN
    PERFORM _test.set_jwt('a1000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    DELETE FROM public.assessments WHERE id = '22200000-0000-0000-0000-000000000002';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RESET ROLE;
    PERFORM _test.record('athlete NAO pode DELETE assessment de outro atleta', v_count = 0, format('linhas afetadas=%s (esperado 0)', v_count));
END $$;

DO $$
DECLARE v_count integer;
BEGIN
    PERFORM _test.set_jwt('a1000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    DELETE FROM public.assessments WHERE id = '22200000-0000-0000-0000-000000000001';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RESET ROLE;
    PERFORM _test.record('athlete DELETE na propria assessment', v_count = 1, format('linhas afetadas=%s', v_count));
END $$;

-- =============================================================================
-- competitions
-- =============================================================================

DO $$
BEGIN
    PERFORM _test.set_jwt('a1000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    BEGIN
        INSERT INTO public.competitions (id, name, created_by_athlete_id, status)
        VALUES ('33300000-0000-0000-0000-000000000001', 'Athlete1 Competition', 'b1000000-0000-0000-0000-000000000001', 'completed');
        RESET ROLE;
        PERFORM _test.record('athlete INSERT em competition propria (created_by_athlete_id proprio)', true, 'insert concluido sem erro');
    EXCEPTION WHEN OTHERS THEN
        RESET ROLE;
        PERFORM _test.record('athlete INSERT em competition propria (created_by_athlete_id proprio)', false, SQLERRM);
    END;
END $$;

DO $$
BEGIN
    PERFORM _test.set_jwt('a1000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    BEGIN
        INSERT INTO public.competitions (id, name, created_by_athlete_id, status)
        VALUES ('33300000-0000-0000-0000-000000000099', 'Spoofed Competition', 'b1000000-0000-0000-0000-000000000002', 'completed');
        RESET ROLE;
        PERFORM _test.record('athlete NAO pode INSERT competition com created_by_athlete_id de outro atleta (spoof)', false, 'INSERT nao foi bloqueado pela RLS');
    EXCEPTION WHEN OTHERS THEN
        RESET ROLE;
        PERFORM _test.record('athlete NAO pode INSERT competition com created_by_athlete_id de outro atleta (spoof)', true, SQLERRM);
    END;
END $$;

DO $$
DECLARE v_count integer;
BEGIN
    PERFORM _test.set_jwt('a1000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    UPDATE public.competitions SET name = 'Athlete1 Competition (editada)' WHERE id = '33300000-0000-0000-0000-000000000001';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RESET ROLE;
    PERFORM _test.record('athlete UPDATE na propria competition', v_count = 1, format('linhas afetadas=%s', v_count));
END $$;

DO $$
DECLARE v_count integer;
BEGIN
    PERFORM _test.set_jwt('a1000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    UPDATE public.competitions SET name = 'Hackeada' WHERE id = '33300000-0000-0000-0000-000000000002';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RESET ROLE;
    PERFORM _test.record('athlete NAO pode UPDATE competition alheia', v_count = 0, format('linhas afetadas=%s (esperado 0)', v_count));
END $$;
