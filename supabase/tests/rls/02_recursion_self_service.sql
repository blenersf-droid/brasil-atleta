-- =============================================================================
-- RLS Assertions — Theme (b): Recursion Regression (migration 00005)
-- =============================================================================
-- With 2+ athletes present (see fixtures.sql), 00005 fixed two infinite-
-- recursion bugs ("infinite recursion detected in policy for relation
-- athletes/coaches") that used to fire whenever an athlete self-INSERTed into
-- achievements/media. This file proves the fix holds: athletes can fully
-- manage (INSERT/UPDATE/DELETE) their OWN achievements/media without any SQL
-- error, while attempts on another athlete's rows are rejected (spoofed
-- INSERT -> exception; UPDATE/DELETE of a row filtered out by USING -> 0
-- rows, no error — see 01_roles_escalation.sql for why).
--
-- Uses its own row ids (e2.../f2...), distinct from fixtures.sql's stable
-- achievement (d1000000-...-000000000001), which 05_public_read.sql depends
-- on still existing.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Setup: an achievement and a media row owned by athlete2 (fixture), used to
-- prove athlete1 cannot mutate rows they don't own.
-- ---------------------------------------------------------------------------
INSERT INTO public.achievements (id, athlete_id, title, date, type) VALUES
    ('e2000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'Athlete2 Achievement', '2024-02-01', 'silver');

INSERT INTO public.media (id, athlete_id, type, url, title) VALUES
    ('f2000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'photo', 'https://example.test/athlete2.jpg', 'Athlete2 Media');

-- =============================================================================
-- achievements
-- =============================================================================

-- 1. athlete1 insere achievement propria — sem erro de recursao (00005)
DO $$
BEGIN
    PERFORM _test.set_jwt('a1000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    BEGIN
        INSERT INTO public.achievements (id, athlete_id, title, date, type)
        VALUES ('e2000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Athlete1 Achievement', '2024-03-01', 'gold');
        RESET ROLE;
        PERFORM _test.record('athlete INSERT em achievement propria (sem recursao)', true, 'insert concluido sem erro');
    EXCEPTION WHEN OTHERS THEN
        RESET ROLE;
        PERFORM _test.record('athlete INSERT em achievement propria (sem recursao)', false, SQLERRM);
    END;
END $$;

-- 2. athlete1 NAO insere achievement em nome de outro atleta (spoof -> erro)
DO $$
BEGIN
    PERFORM _test.set_jwt('a1000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    BEGIN
        INSERT INTO public.achievements (id, athlete_id, title, date, type)
        VALUES ('e2000000-0000-0000-0000-000000000099', 'b1000000-0000-0000-0000-000000000002', 'Spoofed Achievement', '2024-03-01', 'gold');
        RESET ROLE;
        PERFORM _test.record('athlete NAO pode INSERT achievement de outro atleta (spoof)', false, 'INSERT nao foi bloqueado pela RLS');
    EXCEPTION WHEN OTHERS THEN
        RESET ROLE;
        PERFORM _test.record('athlete NAO pode INSERT achievement de outro atleta (spoof)', true, SQLERRM);
    END;
END $$;

-- 3. athlete1 atualiza a propria achievement
DO $$
DECLARE v_count integer;
BEGIN
    PERFORM _test.set_jwt('a1000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    UPDATE public.achievements SET title = 'Athlete1 Achievement (editada)'
    WHERE id = 'e2000000-0000-0000-0000-000000000001';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RESET ROLE;

    PERFORM _test.record(
        'athlete UPDATE na propria achievement',
        v_count = 1,
        format('linhas afetadas=%s (esperado 1)', v_count)
    );
END $$;

-- 4. athlete1 NAO atualiza achievement de outro atleta (0 linhas, sem erro)
DO $$
DECLARE v_count integer;
BEGIN
    PERFORM _test.set_jwt('a1000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    UPDATE public.achievements SET title = 'Hackeada'
    WHERE id = 'e2000000-0000-0000-0000-000000000002';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RESET ROLE;

    PERFORM _test.record(
        'athlete NAO pode UPDATE achievement de outro atleta',
        v_count = 0,
        format('linhas afetadas=%s (esperado 0)', v_count)
    );
END $$;

-- 5. athlete1 deleta a propria achievement (limpeza + prova de DELETE proprio)
DO $$
DECLARE v_count integer;
BEGIN
    PERFORM _test.set_jwt('a1000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    DELETE FROM public.achievements WHERE id = 'e2000000-0000-0000-0000-000000000001';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RESET ROLE;

    PERFORM _test.record(
        'athlete DELETE na propria achievement',
        v_count = 1,
        format('linhas afetadas=%s (esperado 1)', v_count)
    );
END $$;

-- 6. athlete1 NAO deleta achievement de outro atleta (0 linhas, sem erro)
DO $$
DECLARE v_count integer;
BEGIN
    PERFORM _test.set_jwt('a1000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    DELETE FROM public.achievements WHERE id = 'e2000000-0000-0000-0000-000000000002';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RESET ROLE;

    PERFORM _test.record(
        'athlete NAO pode DELETE achievement de outro atleta',
        v_count = 0,
        format('linhas afetadas=%s (esperado 0)', v_count)
    );
END $$;

-- =============================================================================
-- media (same recursion regression path — see 00005 header comment)
-- =============================================================================

-- 7. athlete1 insere media propria — sem erro de recursao
DO $$
BEGIN
    PERFORM _test.set_jwt('a1000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    BEGIN
        INSERT INTO public.media (id, athlete_id, type, url, title)
        VALUES ('f2000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'video', 'https://example.test/athlete1.mp4', 'Athlete1 Media');
        RESET ROLE;
        PERFORM _test.record('athlete INSERT em media propria (sem recursao)', true, 'insert concluido sem erro');
    EXCEPTION WHEN OTHERS THEN
        RESET ROLE;
        PERFORM _test.record('athlete INSERT em media propria (sem recursao)', false, SQLERRM);
    END;
END $$;

-- 8. athlete1 NAO insere media em nome de outro atleta (spoof -> erro)
DO $$
BEGIN
    PERFORM _test.set_jwt('a1000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    BEGIN
        INSERT INTO public.media (id, athlete_id, type, url, title)
        VALUES ('f2000000-0000-0000-0000-000000000099', 'b1000000-0000-0000-0000-000000000002', 'photo', 'https://example.test/spoof.jpg', 'Spoofed Media');
        RESET ROLE;
        PERFORM _test.record('athlete NAO pode INSERT media de outro atleta (spoof)', false, 'INSERT nao foi bloqueado pela RLS');
    EXCEPTION WHEN OTHERS THEN
        RESET ROLE;
        PERFORM _test.record('athlete NAO pode INSERT media de outro atleta (spoof)', true, SQLERRM);
    END;
END $$;

-- 9. athlete1 NAO atualiza media de outro atleta (0 linhas, sem erro)
DO $$
DECLARE v_count integer;
BEGIN
    PERFORM _test.set_jwt('a1000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    UPDATE public.media SET title = 'Hackeada'
    WHERE id = 'f2000000-0000-0000-0000-000000000002';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RESET ROLE;

    PERFORM _test.record(
        'athlete NAO pode UPDATE media de outro atleta',
        v_count = 0,
        format('linhas afetadas=%s (esperado 0)', v_count)
    );
END $$;

-- 10. athlete1 deleta a propria media (limpeza + prova de DELETE proprio)
DO $$
DECLARE v_count integer;
BEGIN
    PERFORM _test.set_jwt('a1000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    DELETE FROM public.media WHERE id = 'f2000000-0000-0000-0000-000000000001';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RESET ROLE;

    PERFORM _test.record(
        'athlete DELETE na propria media',
        v_count = 1,
        format('linhas afetadas=%s (esperado 1)', v_count)
    );
END $$;
