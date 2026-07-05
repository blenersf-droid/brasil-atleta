-- =============================================================================
-- RLS Assertions — Theme (f): LGPD & Proteção de Menores (migration 00007)
-- =============================================================================
-- Covers the manual QA validation of 00007 end-to-end: profile_visibility
-- defaulting/enforcement on `athletes` (PART 2/4), `guardian_consents`
-- immutability and ownership (PART 3), public (anon) read gating by
-- profile_visibility across athletes/achievements/results/assessments
-- (PART 5), and the public `abuse_reports` channel (PART 6).
--
-- Uses its own fixtures (own auth.users a6.../athletes b6...), distinct from
-- fixtures.sql's stable adult rows (b1000000-...-000000000001/2, which
-- 05_public_read.sql depends on staying 'public') — this file needs a MINOR
-- athlete (restricted by default) plus a dedicated adult athlete of its own,
-- and toggles visibility back and forth, so it must not touch shared state.
--
-- Sections are ordered by data dependency, not by the scenario numbering used
-- to spec this file; each block's _test.record name states what it proves.
-- Scenario map (spec -> section):
--   1. minor INSERT forces restricted despite payload asking 'public'  -> PART A
--   2. minor UPDATE straight to 'public' without consent is blocked    -> PART A
--   3. guardian_consents (public_profile) unlocks the UPDATE           -> PART B
--   4. authenticated cannot INSERT consent for another user's athlete -> PART B
--   5. guardian_consents immutable (owner AND admin, UPDATE + DELETE) -> PART B
--   6. anon reads restricted=0 rows / public=visible, 4 tables        -> PART D
--   7. athlete reads own data despite restricted visibility           -> PART E
--   8. abuse_reports: anon INSERT ok, SELECT denied to non-admin      -> PART F
--   9. adult INSERT defaults to 'public' and toggles freely           -> PART C
--  10. authenticated cannot spoof user_id on athletes INSERT          -> PART G
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Fixtures: 3 dedicated auth.users for this file.
--   a6...001 - owner of the minor athlete (PARTS A/B/D/E)
--   a6...002 - owner of a second minor athlete, used only as the "other
--              user's athlete" spoof target in PART B (scenario 4) and as
--              the attacker identity in PART G (scenario 10)
--   a6...003 - owner of the dedicated adult athlete (PARTS C/D)
-- ---------------------------------------------------------------------------
INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
    ('a6000000-0000-0000-0000-000000000001', 'fixture.minor1@test.dev', '{"full_name":"Fixture Minor One"}'),
    ('a6000000-0000-0000-0000-000000000002', 'fixture.minor2@test.dev', '{"full_name":"Fixture Minor Two"}'),
    ('a6000000-0000-0000-0000-000000000003', 'fixture.adult6@test.dev', '{"full_name":"Fixture Adult Six"}');

-- =============================================================================
-- PART A — Minor athlete: forced 'restricted' default + blocked self-upgrade
-- (scenarios 1 & 2)
-- =============================================================================

-- 1. INSERT de atleta menor forca profile_visibility='restricted' mesmo com
--    payload pedindo 'public' (BEFORE INSERT trigger ignora o valor enviado).
DO $$
DECLARE
    v_visibility public.athlete_profile_visibility;
BEGIN
    PERFORM _test.set_jwt('a6000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    BEGIN
        INSERT INTO public.athletes (id, user_id, full_name, birth_date, profile_visibility)
        VALUES ('b6000000-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000001', 'Fixture Minor Athlete One', '2015-06-15', 'public');
        RESET ROLE;

        SELECT profile_visibility INTO v_visibility
        FROM public.athletes WHERE id = 'b6000000-0000-0000-0000-000000000001';

        PERFORM _test.record(
            'INSERT de atleta menor forca profile_visibility=restricted mesmo pedindo public',
            v_visibility = 'restricted',
            format('profile_visibility final=%s (esperado restricted)', v_visibility)
        );
    EXCEPTION WHEN OTHERS THEN
        RESET ROLE;
        PERFORM _test.record('INSERT de atleta menor forca profile_visibility=restricted mesmo pedindo public', false, SQLERRM);
    END;
END $$;

-- 2. Menor: UPDATE direto para 'public' sem consentimento -> bloqueado
--    (trigger enforce_athlete_profile_visibility lanca excecao, nao 0 linhas).
DO $$
BEGIN
    PERFORM _test.set_jwt('a6000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    BEGIN
        UPDATE public.athletes SET profile_visibility = 'public'
        WHERE id = 'b6000000-0000-0000-0000-000000000001';
        RESET ROLE;
        PERFORM _test.record('menor NAO pode UPDATE profile_visibility=public sem consentimento (trigger bloqueia)', false, 'UPDATE nao foi bloqueado pelo trigger');
    EXCEPTION WHEN OTHERS THEN
        RESET ROLE;
        PERFORM _test.record('menor NAO pode UPDATE profile_visibility=public sem consentimento (trigger bloqueia)', true, SQLERRM);
    END;
END $$;

-- =============================================================================
-- PART B — guardian_consents: unlocks visibility, ownership, immutability
-- (scenarios 3, 4 & 5)
-- =============================================================================

-- Setup: segundo atleta menor, dono diferente (a6...002) — usado apenas como
-- alvo do teste de spoof (cenario 4). Insert simples como postgres (bypassa
-- RLS); o trigger BEFORE INSERT roda de qualquer forma e computa 'restricted'.
INSERT INTO public.athletes (id, user_id, full_name, birth_date) VALUES
    ('b6000000-0000-0000-0000-000000000002', 'a6000000-0000-0000-0000-000000000002', 'Fixture Minor Athlete Two', '2016-09-01');

-- 3a. Atleta insere guardian_consent (public_profile) para o proprio atleta menor.
DO $$
BEGIN
    PERFORM _test.set_jwt('a6000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    BEGIN
        INSERT INTO public.guardian_consents (id, athlete_id, guardian_full_name, guardian_email, guardian_relationship, consent_type)
        VALUES ('44400000-0000-0000-0000-000000000001', 'b6000000-0000-0000-0000-000000000001', 'Maria Responsavel', 'maria.responsavel@test.dev', 'mae', 'public_profile');
        RESET ROLE;
        PERFORM _test.record('atleta insere guardian_consent (public_profile) para o proprio atleta menor', true, 'insert concluido sem erro');
    EXCEPTION WHEN OTHERS THEN
        RESET ROLE;
        PERFORM _test.record('atleta insere guardian_consent (public_profile) para o proprio atleta menor', false, SQLERRM);
    END;
END $$;

-- 3b. Com o consentimento registrado, UPDATE para 'public' agora funciona.
DO $$
DECLARE v_count integer;
BEGIN
    PERFORM _test.set_jwt('a6000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    UPDATE public.athletes SET profile_visibility = 'public'
    WHERE id = 'b6000000-0000-0000-0000-000000000001';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RESET ROLE;

    PERFORM _test.record(
        'apos guardian_consent public_profile, UPDATE para public funciona',
        v_count = 1,
        format('linhas afetadas=%s (esperado 1)', v_count)
    );
END $$;

-- 4. authenticated NAO consegue INSERT de consent para atleta de OUTRO usuario (spoof).
DO $$
BEGIN
    PERFORM _test.set_jwt('a6000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    BEGIN
        INSERT INTO public.guardian_consents (id, athlete_id, guardian_full_name, guardian_email, guardian_relationship, consent_type)
        VALUES ('44400000-0000-0000-0000-000000000099', 'b6000000-0000-0000-0000-000000000002', 'Spoofer', 'spoofer@test.dev', 'tutor', 'public_profile');
        RESET ROLE;
        PERFORM _test.record('authenticated NAO pode INSERT guardian_consent para atleta de outro usuario (spoof)', false, 'INSERT nao foi bloqueado pela RLS');
    EXCEPTION WHEN OTHERS THEN
        RESET ROLE;
        PERFORM _test.record('authenticated NAO pode INSERT guardian_consent para atleta de outro usuario (spoof)', true, SQLERRM);
    END;
END $$;

-- 5a. guardian_consents imutavel: dono NAO consegue UPDATE (0 linhas, sem erro
--     — nenhuma policy de UPDATE existe para authenticated).
DO $$
DECLARE v_count integer;
BEGIN
    PERFORM _test.set_jwt('a6000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    UPDATE public.guardian_consents SET guardian_full_name = 'Hackeado'
    WHERE id = '44400000-0000-0000-0000-000000000001';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RESET ROLE;

    PERFORM _test.record(
        'guardian_consents imutavel: dono NAO pode UPDATE',
        v_count = 0,
        format('linhas afetadas=%s (esperado 0)', v_count)
    );
END $$;

-- 5b. guardian_consents imutavel: dono NAO consegue DELETE (0 linhas, sem erro).
DO $$
DECLARE v_count integer;
BEGIN
    PERFORM _test.set_jwt('a6000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    DELETE FROM public.guardian_consents WHERE id = '44400000-0000-0000-0000-000000000001';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RESET ROLE;

    PERFORM _test.record(
        'guardian_consents imutavel: dono NAO pode DELETE',
        v_count = 0,
        format('linhas afetadas=%s (esperado 0)', v_count)
    );
END $$;

-- Setup: simula a1000000...001 (na verdade a6...001) elevado a admin_nacional
-- em user_roles, como postgres (superuser, bypassa RLS de user_roles) — prova
-- que a imutabilidade de guardian_consents nao depende de o chamador NAO ser
-- admin: nao existe policy de UPDATE/DELETE para NINGUEM alem de service_role.
UPDATE public.user_roles SET role = 'admin_nacional' WHERE user_id = 'a6000000-0000-0000-0000-000000000001';

-- 5c. guardian_consents imutavel: nem admin consegue UPDATE.
DO $$
DECLARE v_count integer;
BEGIN
    PERFORM _test.set_jwt('a6000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    UPDATE public.guardian_consents SET guardian_full_name = 'Hackeado pelo admin'
    WHERE id = '44400000-0000-0000-0000-000000000001';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RESET ROLE;

    PERFORM _test.record(
        'guardian_consents imutavel: nem admin_nacional pode UPDATE',
        v_count = 0,
        format('linhas afetadas=%s (esperado 0)', v_count)
    );
END $$;

-- 5d. guardian_consents imutavel: nem admin consegue DELETE.
DO $$
DECLARE v_count integer;
BEGIN
    PERFORM _test.set_jwt('a6000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    DELETE FROM public.guardian_consents WHERE id = '44400000-0000-0000-0000-000000000001';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RESET ROLE;

    PERFORM _test.record(
        'guardian_consents imutavel: nem admin_nacional pode DELETE',
        v_count = 0,
        format('linhas afetadas=%s (esperado 0)', v_count)
    );
END $$;

-- Cleanup: restaura o role original — nao ha arquivo apos este no glob
-- 0[1-9]_*.sql, mas mantemos o estado limpo por principio.
UPDATE public.user_roles SET role = 'atleta' WHERE user_id = 'a6000000-0000-0000-0000-000000000001';

-- Reset: a asserçao 3b acima (de proposito) tornou b6...001 'public' para
-- provar que o consentimento destrava o UPDATE. Revertemos para 'restricted'
-- aqui para que a PART D exercite um perfil de fato restrito — o trigger so
-- exige consentimento para IR para 'public'; voltar para 'restricted' e
-- sempre livre, inclusive para menor (enforce_athlete_profile_visibility so
-- valida quando NEW.profile_visibility = 'public').
UPDATE public.athletes SET profile_visibility = 'restricted' WHERE id = 'b6000000-0000-0000-0000-000000000001';

-- =============================================================================
-- PART C — Adulto: default 'public' e alternancia livre (scenario 9)
-- =============================================================================

-- 9a. INSERT de atleta adulto -> profile_visibility='public' por default
--     (trigger nao depende de payload, so da idade calculada a partir de birth_date).
DO $$
DECLARE v_visibility public.athlete_profile_visibility;
BEGIN
    PERFORM _test.set_jwt('a6000000-0000-0000-0000-000000000003');
    SET ROLE authenticated;
    BEGIN
        INSERT INTO public.athletes (id, user_id, full_name, birth_date)
        VALUES ('b6000000-0000-0000-0000-000000000003', 'a6000000-0000-0000-0000-000000000003', 'Fixture Adult Athlete Six', '1990-05-20');
        RESET ROLE;

        SELECT profile_visibility INTO v_visibility
        FROM public.athletes WHERE id = 'b6000000-0000-0000-0000-000000000003';

        PERFORM _test.record(
            'INSERT de atleta adulto tem profile_visibility=public por default',
            v_visibility = 'public',
            format('profile_visibility final=%s (esperado public)', v_visibility)
        );
    EXCEPTION WHEN OTHERS THEN
        RESET ROLE;
        PERFORM _test.record('INSERT de atleta adulto tem profile_visibility=public por default', false, SQLERRM);
    END;
END $$;

-- 9b. Adulto alterna para 'restricted' livremente (sem exigencia de consentimento).
DO $$
DECLARE v_count integer;
BEGIN
    PERFORM _test.set_jwt('a6000000-0000-0000-0000-000000000003');
    SET ROLE authenticated;
    UPDATE public.athletes SET profile_visibility = 'restricted'
    WHERE id = 'b6000000-0000-0000-0000-000000000003';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RESET ROLE;

    PERFORM _test.record(
        'adulto alterna profile_visibility para restricted livremente',
        v_count = 1,
        format('linhas afetadas=%s (esperado 1)', v_count)
    );
END $$;

-- 9c. Adulto alterna de volta para 'public' livremente (deixa o fixture
--     'public' para o setup de leitura publica na PART D).
DO $$
DECLARE v_count integer;
BEGIN
    PERFORM _test.set_jwt('a6000000-0000-0000-0000-000000000003');
    SET ROLE authenticated;
    UPDATE public.athletes SET profile_visibility = 'public'
    WHERE id = 'b6000000-0000-0000-0000-000000000003';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RESET ROLE;

    PERFORM _test.record(
        'adulto alterna profile_visibility de volta para public livremente',
        v_count = 1,
        format('linhas afetadas=%s (esperado 1)', v_count)
    );
END $$;

-- =============================================================================
-- PART D — Leitura publica (anon) gated por profile_visibility, 4 tabelas
-- (scenario 6)
-- =============================================================================

-- Setup: 1 achievement/result/assessment para o atleta menor (b6...001,
-- restricted) e para o atleta adulto (b6...003, public). Inserts simples
-- como postgres (bypassa RLS) — sao apenas dados para os testes de leitura
-- de anon abaixo, nao o objeto do teste em si.
INSERT INTO public.achievements (id, athlete_id, title, date, type) VALUES
    ('d6000000-0000-0000-0000-000000000001', 'b6000000-0000-0000-0000-000000000001', 'Minor Achievement', '2024-01-01', 'bronze'),
    ('d6000000-0000-0000-0000-000000000003', 'b6000000-0000-0000-0000-000000000003', 'Adult Achievement', '2024-01-01', 'gold');

INSERT INTO public.results (id, athlete_id, competition_id, position, mark) VALUES
    ('66600000-0000-0000-0000-000000000001', 'b6000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 5, '12.00'),
    ('66600000-0000-0000-0000-000000000003', 'b6000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 1, '9.95');

INSERT INTO public.assessments (id, athlete_id, assessment_date, protocol) VALUES
    ('77700000-0000-0000-0000-000000000001', 'b6000000-0000-0000-0000-000000000001', '2024-01-01', 'Minor Protocol'),
    ('77700000-0000-0000-0000-000000000003', 'b6000000-0000-0000-0000-000000000003', '2024-01-01', 'Adult Protocol');

-- 6a-6d. anon NAO le NENHUMA linha de perfil restricted (atleta menor).
DO $$
DECLARE v_count integer;
BEGIN
    PERFORM _test.clear_jwt();
    SET ROLE anon;
    SELECT count(*) INTO v_count FROM public.athletes WHERE id = 'b6000000-0000-0000-0000-000000000001';
    RESET ROLE;
    PERFORM _test.record('anon NAO le athletes de perfil restricted (menor)', v_count = 0, format('linhas visiveis=%s (esperado 0)', v_count));
END $$;

DO $$
DECLARE v_count integer;
BEGIN
    PERFORM _test.clear_jwt();
    SET ROLE anon;
    SELECT count(*) INTO v_count FROM public.achievements WHERE athlete_id = 'b6000000-0000-0000-0000-000000000001';
    RESET ROLE;
    PERFORM _test.record('anon NAO le achievements de perfil restricted (menor)', v_count = 0, format('linhas visiveis=%s (esperado 0)', v_count));
END $$;

DO $$
DECLARE v_count integer;
BEGIN
    PERFORM _test.clear_jwt();
    SET ROLE anon;
    SELECT count(*) INTO v_count FROM public.results WHERE athlete_id = 'b6000000-0000-0000-0000-000000000001';
    RESET ROLE;
    PERFORM _test.record('anon NAO le results de perfil restricted (menor)', v_count = 0, format('linhas visiveis=%s (esperado 0)', v_count));
END $$;

DO $$
DECLARE v_count integer;
BEGIN
    PERFORM _test.clear_jwt();
    SET ROLE anon;
    SELECT count(*) INTO v_count FROM public.assessments WHERE athlete_id = 'b6000000-0000-0000-0000-000000000001';
    RESET ROLE;
    PERFORM _test.record('anon NAO le assessments de perfil restricted (menor)', v_count = 0, format('linhas visiveis=%s (esperado 0)', v_count));
END $$;

-- 6e-6h. anon LE normalmente as linhas de perfil public (atleta adulto).
DO $$
DECLARE v_count integer;
BEGIN
    PERFORM _test.clear_jwt();
    SET ROLE anon;
    SELECT count(*) INTO v_count FROM public.athletes WHERE id = 'b6000000-0000-0000-0000-000000000003';
    RESET ROLE;
    PERFORM _test.record('anon le athletes de perfil public (adulto)', v_count = 1, format('linhas visiveis=%s (esperado 1)', v_count));
END $$;

DO $$
DECLARE v_count integer;
BEGIN
    PERFORM _test.clear_jwt();
    SET ROLE anon;
    SELECT count(*) INTO v_count FROM public.achievements WHERE athlete_id = 'b6000000-0000-0000-0000-000000000003';
    RESET ROLE;
    PERFORM _test.record('anon le achievements de perfil public (adulto)', v_count = 1, format('linhas visiveis=%s (esperado 1)', v_count));
END $$;

DO $$
DECLARE v_count integer;
BEGIN
    PERFORM _test.clear_jwt();
    SET ROLE anon;
    SELECT count(*) INTO v_count FROM public.results WHERE athlete_id = 'b6000000-0000-0000-0000-000000000003';
    RESET ROLE;
    PERFORM _test.record('anon le results de perfil public (adulto)', v_count = 1, format('linhas visiveis=%s (esperado 1)', v_count));
END $$;

DO $$
DECLARE v_count integer;
BEGIN
    PERFORM _test.clear_jwt();
    SET ROLE anon;
    SELECT count(*) INTO v_count FROM public.assessments WHERE athlete_id = 'b6000000-0000-0000-0000-000000000003';
    RESET ROLE;
    PERFORM _test.record('anon le assessments de perfil public (adulto)', v_count = 1, format('linhas visiveis=%s (esperado 1)', v_count));
END $$;

-- =============================================================================
-- PART E — Atleta autenticado le os proprios dados mesmo com perfil
-- restricted (scenario 7)
-- =============================================================================

DO $$
DECLARE v_count integer;
BEGIN
    PERFORM _test.set_jwt('a6000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    SELECT count(*) INTO v_count FROM public.athletes WHERE id = 'b6000000-0000-0000-0000-000000000001';
    RESET ROLE;
    PERFORM _test.record('atleta menor le a propria linha em athletes mesmo restricted', v_count = 1, format('linhas visiveis=%s (esperado 1)', v_count));
END $$;

DO $$
DECLARE v_count integer;
BEGIN
    PERFORM _test.set_jwt('a6000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    SELECT count(*) INTO v_count FROM public.achievements WHERE athlete_id = 'b6000000-0000-0000-0000-000000000001';
    RESET ROLE;
    PERFORM _test.record('atleta menor le a propria achievement mesmo restricted', v_count = 1, format('linhas visiveis=%s (esperado 1)', v_count));
END $$;

DO $$
DECLARE v_count integer;
BEGIN
    PERFORM _test.set_jwt('a6000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    SELECT count(*) INTO v_count FROM public.results WHERE athlete_id = 'b6000000-0000-0000-0000-000000000001';
    RESET ROLE;
    PERFORM _test.record('atleta menor le o proprio result mesmo restricted', v_count = 1, format('linhas visiveis=%s (esperado 1)', v_count));
END $$;

DO $$
DECLARE v_count integer;
BEGIN
    PERFORM _test.set_jwt('a6000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    SELECT count(*) INTO v_count FROM public.assessments WHERE athlete_id = 'b6000000-0000-0000-0000-000000000001';
    RESET ROLE;
    PERFORM _test.record('atleta menor le a propria assessment mesmo restricted', v_count = 1, format('linhas visiveis=%s (esperado 1)', v_count));
END $$;

-- =============================================================================
-- PART F — abuse_reports: canal publico de denuncia (scenario 8)
-- =============================================================================

-- 8a. anon consegue INSERT em abuse_reports (canal acessivel sem login).
DO $$
BEGIN
    PERFORM _test.clear_jwt();
    SET ROLE anon;
    BEGIN
        INSERT INTO public.abuse_reports (reported_athlete_slug, reporter_email, category, description)
        VALUES ('perfil-suspeito', 'denunciante@test.dev', 'perfil_falso', 'Perfil parece ser falso.');
        RESET ROLE;
        PERFORM _test.record('anon consegue INSERT em abuse_reports', true, 'insert concluido sem erro');
    EXCEPTION WHEN OTHERS THEN
        RESET ROLE;
        PERFORM _test.record('anon consegue INSERT em abuse_reports', false, SQLERRM);
    END;
END $$;

-- 8b. anon NAO le nenhuma linha de abuse_reports (nem a que acabou de inserir).
DO $$
DECLARE v_count integer;
BEGIN
    PERFORM _test.clear_jwt();
    SET ROLE anon;
    SELECT count(*) INTO v_count FROM public.abuse_reports;
    RESET ROLE;
    PERFORM _test.record('anon NAO le nenhuma linha de abuse_reports', v_count = 0, format('linhas visiveis=%s (esperado 0)', v_count));
END $$;

-- 8c. authenticated NAO-admin tambem nao le nenhuma linha de abuse_reports.
DO $$
DECLARE v_count integer;
BEGIN
    PERFORM _test.set_jwt('a6000000-0000-0000-0000-000000000001');
    SET ROLE authenticated;
    SELECT count(*) INTO v_count FROM public.abuse_reports;
    RESET ROLE;
    PERFORM _test.record('authenticated nao-admin NAO le nenhuma linha de abuse_reports', v_count = 0, format('linhas visiveis=%s (esperado 0)', v_count));
END $$;

-- =============================================================================
-- PART G — Spoof: authenticated NAO consegue INSERT em athletes com user_id
-- de outro usuario (scenario 10)
-- =============================================================================

DO $$
BEGIN
    PERFORM _test.set_jwt('a6000000-0000-0000-0000-000000000002');
    SET ROLE authenticated;
    BEGIN
        INSERT INTO public.athletes (id, user_id, full_name)
        VALUES ('b6000000-0000-0000-0000-000000000099', 'a6000000-0000-0000-0000-000000000003', 'Spoofed Athlete');
        RESET ROLE;
        PERFORM _test.record('authenticated NAO pode INSERT athletes com user_id de outro usuario (spoof)', false, 'INSERT nao foi bloqueado pela RLS');
    EXCEPTION WHEN OTHERS THEN
        RESET ROLE;
        PERFORM _test.record('authenticated NAO pode INSERT athletes com user_id de outro usuario (spoof)', true, SQLERRM);
    END;
END $$;
