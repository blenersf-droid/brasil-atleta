-- =============================================================================
-- Brasil Atleta — Seed Data
-- Description: Sample entity hierarchy (COB > Confederacoes > Federacoes)
--
-- FR-0.6 note: this file used to also CREATE TABLE + INSERT into `modalities`
-- and `brazilian_ufs`. Those tables are NOT part of any migration (00001/00002)
-- and are NOT queried anywhere in packages/web/src (grep confirmed zero
-- `.from("modalities")` / `.from("brazilian_ufs")` calls). The app instead uses
-- hardcoded frontend constants (MODALITIES in
-- packages/web/src/lib/constants/modalities.ts, BRAZILIAN_STATES in
-- packages/web/src/lib/constants/states.ts) whose codes/labels do not even
-- match the removed seed rows one-to-one. Defining schema (CREATE TABLE) in a
-- seed file is also not aligned with the migration-based schema convention
-- used elsewhere in this repo. Decision: removed both reference tables from
-- the seed instead of promoting them to a migration (option b) — they were
-- dead weight, not real dependencies of the app. The `entities` table below
-- IS consumed by the app (e.g. packages/web/src/app/(dashboard)/meu-perfil/
-- page.tsx reads from `entities`), so this sample hierarchy is kept as-is.
-- =============================================================================

-- =============================================================================
-- SAMPLE ENTITY HIERARCHY
-- COB (Comite Olimpico do Brasil) > Confederacoes > Federacoes (amostra)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Level 0: Comite Olimpico do Brasil (COB) — national committee
-- ---------------------------------------------------------------------------
INSERT INTO entities (id, name, type, parent_entity_id, state, city, modalities, level)
VALUES
    ('00000000-0000-0000-0000-000000000001',
     'Comite Olimpico do Brasil (COB)',
     'committee',
     NULL,
     NULL,
     'Brasilia',
     ARRAY['ATL','NAT','JUD','VEL','GIN','BOX','TEN','FUT','BAS','VOL','HAL',
           'CAN','ESG','TIR','HIP','PEN','TAE','LPE','BDM','RUG','SUR','ESC',
           'SKA','TRM','CIC','TRA','MAR','GAR','POL','HAN','HOC','SOF','BEI',
           'GOL','CUR','BIA','TIE','LAC','SQU','CRI','FLAG','FLA','LUT',
           'REI','MAG','SIN','SAL','GTR','GIR'],
     'national'),

    ('00000000-0000-0000-0000-000000000002',
     'Comite Paralimpico Brasileiro (CPB)',
     'committee',
     NULL,
     NULL,
     'Sao Paulo',
     ARRAY['ATL','NAT','JUD','TIR','TAE','TRA','CAN','CIC','HAL','ROW'],
     'national');

-- ---------------------------------------------------------------------------
-- Level 1: Confederacoes Nacionais (sample — major Olympic sports)
-- ---------------------------------------------------------------------------
INSERT INTO entities (id, name, type, parent_entity_id, state, city, modalities, level)
VALUES
    ('00000000-0000-0000-0001-000000000001',
     'Confederacao Brasileira de Atletismo (CBAt)',
     'confederation',
     '00000000-0000-0000-0000-000000000001',
     NULL, 'Sao Paulo', ARRAY['ATL'], 'national'),

    ('00000000-0000-0000-0001-000000000002',
     'Confederacao Brasileira de Desportos Aquaticos (CBDA)',
     'confederation',
     '00000000-0000-0000-0000-000000000001',
     NULL, 'Rio de Janeiro', ARRAY['NAT','POL','SIN','SAL','MAG'], 'national'),

    ('00000000-0000-0000-0001-000000000003',
     'Confederacao Brasileira de Judo (CBJ)',
     'confederation',
     '00000000-0000-0000-0000-000000000001',
     NULL, 'Sao Paulo', ARRAY['JUD'], 'national'),

    ('00000000-0000-0000-0001-000000000004',
     'Confederacao Brasileira de Futebol (CBF)',
     'confederation',
     '00000000-0000-0000-0000-000000000001',
     NULL, 'Rio de Janeiro', ARRAY['FUT'], 'national'),

    ('00000000-0000-0000-0001-000000000005',
     'Confederacao Brasileira de Basketball (CBB)',
     'confederation',
     '00000000-0000-0000-0000-000000000001',
     NULL, 'Sao Paulo', ARRAY['BAS'], 'national'),

    ('00000000-0000-0000-0001-000000000006',
     'Confederacao Brasileira de Voleibol (CBV)',
     'confederation',
     '00000000-0000-0000-0000-000000000001',
     NULL, 'Sao Paulo', ARRAY['VOL'], 'national'),

    ('00000000-0000-0000-0001-000000000007',
     'Confederacao Brasileira de Natacao (CBNT)',
     'confederation',
     '00000000-0000-0000-0000-000000000002',
     NULL, 'Sao Paulo', ARRAY['NAT'], 'national'),

    ('00000000-0000-0000-0001-000000000008',
     'Confederacao Brasileira de Ginastica (CBG)',
     'confederation',
     '00000000-0000-0000-0000-000000000001',
     NULL, 'Sao Paulo', ARRAY['GAR','GIR','GTR'], 'national'),

    ('00000000-0000-0000-0001-000000000009',
     'Confederacao Brasileira de Handebol (CBHB)',
     'confederation',
     '00000000-0000-0000-0000-000000000001',
     NULL, 'Sao Paulo', ARRAY['HAN'], 'national'),

    ('00000000-0000-0000-0001-000000000010',
     'Confederacao Brasileira de Boxe (CBBoxe)',
     'confederation',
     '00000000-0000-0000-0000-000000000001',
     NULL, 'Sao Paulo', ARRAY['BOX'], 'national'),

    ('00000000-0000-0000-0001-000000000011',
     'Confederacao Brasileira de Tenis (CBT)',
     'confederation',
     '00000000-0000-0000-0000-000000000001',
     NULL, 'Sao Paulo', ARRAY['TEN'], 'national'),

    ('00000000-0000-0000-0001-000000000012',
     'Confederacao Brasileira de Canoagem (CBCa)',
     'confederation',
     '00000000-0000-0000-0000-000000000001',
     NULL, 'Sao Paulo', ARRAY['CAN'], 'national'),

    ('00000000-0000-0000-0001-000000000013',
     'Confederacao Brasileira de Taekwondo (CBTKD)',
     'confederation',
     '00000000-0000-0000-0000-000000000001',
     NULL, 'Sao Paulo', ARRAY['TAE'], 'national'),

    ('00000000-0000-0000-0001-000000000014',
     'Confederacao Brasileira de Surfe (CBS)',
     'confederation',
     '00000000-0000-0000-0000-000000000001',
     NULL, 'Rio de Janeiro', ARRAY['SUR'], 'national'),

    ('00000000-0000-0000-0001-000000000015',
     'Confederacao Brasileira de Ciclismo (CBC)',
     'confederation',
     '00000000-0000-0000-0000-000000000001',
     NULL, 'Sao Paulo', ARRAY['CIC'], 'national');

-- ---------------------------------------------------------------------------
-- Level 2: Sample Federacoes Estaduais (SP, RJ, MG for ATL and NAT)
-- ---------------------------------------------------------------------------
INSERT INTO entities (id, name, type, parent_entity_id, state, city, modalities, level)
VALUES
    -- Atletismo
    ('00000000-0000-0000-0002-000000000001',
     'Federacao Paulista de Atletismo (FPA)',
     'federation',
     '00000000-0000-0000-0001-000000000001',
     'SP', 'Sao Paulo', ARRAY['ATL'], 'state'),

    ('00000000-0000-0000-0002-000000000002',
     'Federacao de Atletismo do Estado do Rio de Janeiro (FAERJ)',
     'federation',
     '00000000-0000-0000-0001-000000000001',
     'RJ', 'Rio de Janeiro', ARRAY['ATL'], 'state'),

    ('00000000-0000-0000-0002-000000000003',
     'Federacao Mineira de Atletismo (FMA)',
     'federation',
     '00000000-0000-0000-0001-000000000001',
     'MG', 'Belo Horizonte', ARRAY['ATL'], 'state'),

    ('00000000-0000-0000-0002-000000000004',
     'Federacao Gaucha de Atletismo (FGA)',
     'federation',
     '00000000-0000-0000-0001-000000000001',
     'RS', 'Porto Alegre', ARRAY['ATL'], 'state'),

    ('00000000-0000-0000-0002-000000000005',
     'Federacao de Atletismo do Parana (FAP)',
     'federation',
     '00000000-0000-0000-0001-000000000001',
     'PR', 'Curitiba', ARRAY['ATL'], 'state'),

    -- Natacao
    ('00000000-0000-0000-0002-000000000006',
     'Federacao Aquatica Paulista (FAP-NAT)',
     'federation',
     '00000000-0000-0000-0001-000000000002',
     'SP', 'Sao Paulo', ARRAY['NAT','POL','SIN','SAL'], 'state'),

    ('00000000-0000-0000-0002-000000000007',
     'Federacao de Desportos Aquaticos do Rio de Janeiro (FDARJ)',
     'federation',
     '00000000-0000-0000-0001-000000000002',
     'RJ', 'Rio de Janeiro', ARRAY['NAT','POL'], 'state'),

    ('00000000-0000-0000-0002-000000000008',
     'Federacao Aquatica Mineira (FAM)',
     'federation',
     '00000000-0000-0000-0001-000000000002',
     'MG', 'Belo Horizonte', ARRAY['NAT'], 'state'),

    -- Judo
    ('00000000-0000-0000-0002-000000000009',
     'Federacao Paulista de Judo (FPJ)',
     'federation',
     '00000000-0000-0000-0001-000000000003',
     'SP', 'Sao Paulo', ARRAY['JUD'], 'state'),

    ('00000000-0000-0000-0002-000000000010',
     'Federacao de Judo do Estado do Rio de Janeiro (FJERJ)',
     'federation',
     '00000000-0000-0000-0001-000000000003',
     'RJ', 'Rio de Janeiro', ARRAY['JUD'], 'state'),

    -- Voleibol
    ('00000000-0000-0000-0002-000000000011',
     'Federacao Paulista de Volleyball (FPVB)',
     'federation',
     '00000000-0000-0000-0001-000000000006',
     'SP', 'Sao Paulo', ARRAY['VOL'], 'state'),

    ('00000000-0000-0000-0002-000000000012',
     'Federacao de Voleibol do Estado do Rio de Janeiro (FVERJ)',
     'federation',
     '00000000-0000-0000-0001-000000000006',
     'RJ', 'Rio de Janeiro', ARRAY['VOL'], 'state');

-- =============================================================================
-- END OF SEED
-- =============================================================================
