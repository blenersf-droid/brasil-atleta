-- =============================================================================
-- RLS Assertions — Theme (d): athletes.slug Generation (migrations 00005/00006)
-- =============================================================================
-- Exercises the BEFORE INSERT/UPDATE trigger (public.set_athlete_slug, 00006)
-- and its underlying public.generate_athlete_slug() (00005) — a SQL port of
-- generateSlug() in packages/web/src/lib/utils/slug.ts. This is a trigger,
-- not an RLS policy, so these run as `postgres` (no role switching needed);
-- `athletes.user_id` is nullable, so throwaway rows here don't need their own
-- auth.users fixture.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Auto-generation: accents stripped, spaces -> single hyphen, lowercased.
--    generate_athlete_slug('João da Silva Ação') = 'joao-da-silva-acao'
-- ---------------------------------------------------------------------------
INSERT INTO public.athletes (id, full_name)
VALUES ('a4000000-0000-0000-0000-000000000001', 'João da Silva Ação');

DO $$
DECLARE v_slug text;
BEGIN
    SELECT slug INTO v_slug FROM public.athletes WHERE id = 'a4000000-0000-0000-0000-000000000001';
    PERFORM _test.record(
        'slug e auto-gerado a partir de full_name (acentos/espacos normalizados)',
        v_slug = 'joao-da-silva-acao',
        format('slug gerado: %s (esperado joao-da-silva-acao)', COALESCE(v_slug, 'NULL'))
    );
END $$;

-- ---------------------------------------------------------------------------
-- 2. Colisao: mesmo full_name -> sufixo numerico "-2"
-- ---------------------------------------------------------------------------
INSERT INTO public.athletes (id, full_name)
VALUES ('a4000000-0000-0000-0000-000000000002', 'João da Silva Ação');

DO $$
DECLARE v_slug text;
BEGIN
    SELECT slug INTO v_slug FROM public.athletes WHERE id = 'a4000000-0000-0000-0000-000000000002';
    PERFORM _test.record(
        'colisao de slug recebe sufixo numerico (-2)',
        v_slug = 'joao-da-silva-acao-2',
        format('slug gerado: %s (esperado joao-da-silva-acao-2)', COALESCE(v_slug, 'NULL'))
    );
END $$;

-- ---------------------------------------------------------------------------
-- 3. Slug explicito informado no INSERT e preservado (trigger so roda quando
--    NEW.slug IS NULL)
-- ---------------------------------------------------------------------------
INSERT INTO public.athletes (id, full_name, slug)
VALUES ('a4000000-0000-0000-0000-000000000003', 'Explicit Slug Athlete', 'meu-slug-customizado');

DO $$
DECLARE v_slug text;
BEGIN
    SELECT slug INTO v_slug FROM public.athletes WHERE id = 'a4000000-0000-0000-0000-000000000003';
    PERFORM _test.record(
        'slug explicito informado no INSERT e preservado',
        v_slug = 'meu-slug-customizado',
        format('slug final: %s (esperado meu-slug-customizado)', COALESCE(v_slug, 'NULL'))
    );
END $$;

-- ---------------------------------------------------------------------------
-- 4. Slug anulado em UPDATE e regenerado automaticamente (nao fica NULL)
-- ---------------------------------------------------------------------------
INSERT INTO public.athletes (id, full_name)
VALUES ('a4000000-0000-0000-0000-000000000004', 'Regenera Slug Athlete');

UPDATE public.athletes SET slug = NULL WHERE id = 'a4000000-0000-0000-0000-000000000004';

DO $$
DECLARE v_slug text;
BEGIN
    SELECT slug INTO v_slug FROM public.athletes WHERE id = 'a4000000-0000-0000-0000-000000000004';
    PERFORM _test.record(
        'slug anulado em UPDATE e regenerado automaticamente',
        v_slug = 'regenera-slug-athlete',
        format('slug final: %s (esperado regenera-slug-athlete, nao NULL)', COALESCE(v_slug, 'NULL'))
    );
END $$;
