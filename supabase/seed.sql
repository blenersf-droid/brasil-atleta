-- =============================================================================
-- Brasil Atleta — Seed Data
-- Description: Olympic sport modality codes, Brazilian UFs, and sample entity hierarchy
-- =============================================================================

-- =============================================================================
-- REFERENCE TABLE: modalities
-- Olympic sport modality codes (recognized by COB / COI)
-- =============================================================================

CREATE TABLE IF NOT EXISTS modalities (
    code        text PRIMARY KEY,
    name        text NOT NULL,
    name_en     text,
    category    text,   -- 'olympic', 'paralympic', 'both'
    is_team     boolean NOT NULL DEFAULT false
);

INSERT INTO modalities (code, name, name_en, category, is_team) VALUES
-- Individual / Track & Field
('ATL',  'Atletismo',                         'Athletics',               'both',      false),
('NAT',  'Natacao',                            'Swimming',                'both',      false),
('JUD',  'Judo',                               'Judo',                    'both',      false),
('BOX',  'Boxe',                               'Boxing',                  'olympic',   false),
('TEN',  'Tenis',                              'Tennis',                  'olympic',   false),
('HAL',  'Halterofilismo',                    'Weightlifting',           'both',      false),
('LUT',  'Luta',                               'Wrestling',               'olympic',   false),
('ESG',  'Esgrima',                            'Fencing',                 'olympic',   false),
('TIR',  'Tiro Esportivo',                    'Shooting',                'olympic',   false),
('HIP',  'Hipismo',                            'Equestrian',              'olympic',   false),
('PEN',  'Pentatlo Moderno',                  'Modern Pentathlon',       'olympic',   false),
('TAE',  'Taekwondo',                          'Taekwondo',               'both',      false),
('LPE',  'Levantamento de Peso',              'Weightlifting / ParaPower','both',     false),
('BDM',  'Badminton',                          'Badminton',               'olympic',   false),
('CAR',  'Carate',                             'Karate',                  'olympic',   false),
('BRE',  'Breaking',                           'Breaking',                'olympic',   false),
('SUR',  'Surfe',                              'Surfing',                 'olympic',   false),
('ESC',  'Escalada Esportiva',                'Sport Climbing',          'olympic',   false),
('SKA',  'Skate',                              'Skateboarding',           'olympic',   false),
('TRM',  'Triatlo',                            'Triathlon',               'olympic',   false),
('MAR',  'Marcha Atletica',                   'Race Walk',               'olympic',   false),
('GAR',  'Ginastica Artistica',               'Artistic Gymnastics',     'olympic',   false),
('GIR',  'Ginastica Ritmica',                 'Rhythmic Gymnastics',     'olympic',   false),
('GTR',  'Ginastica de Trampolim',            'Trampoline Gymnastics',   'olympic',   false),
('CAN',  'Canoagem',                           'Canoe / Kayak',           'olympic',   false),
('VEL',  'Vela',                               'Sailing',                 'olympic',   false),
('CIC',  'Ciclismo',                           'Cycling',                 'olympic',   false),
('TRA',  'Tiro com Arco',                     'Archery',                 'both',      false),
('BIA',  'Biatlo',                             'Biathlon',                'olympic',   false),
('TIE',  'Tiro com Espingarda',               'Rifle Shooting',          'olympic',   false),
-- Team sports
('FUT',  'Futebol',                            'Football (Soccer)',       'olympic',   true),
('BAS',  'Basquetebol',                        'Basketball',              'olympic',   true),
('VOL',  'Voleibol',                           'Volleyball',              'olympic',   true),
('HAN',  'Handebol',                           'Handball',                'olympic',   true),
('HOC',  'Hoquei sobre Grama',                'Field Hockey',            'olympic',   true),
('RUG',  'Rugby Sevens',                       'Rugby Sevens',            'olympic',   true),
('POL',  'Polo Aquatico',                     'Water Polo',              'olympic',   true),
('SOF',  'Softball',                           'Softball',                'olympic',   true),
('BEI',  'Beisebol',                           'Baseball',                'olympic',   true),
('GOL',  'Golfe',                              'Golf',                    'olympic',   false),
('LAC',  'Lacrosse',                           'Lacrosse',                'olympic',   true),
('SQU',  'Squash',                             'Squash',                  'olympic',   false),
('CRI',  'Criquet',                            'Cricket',                 'olympic',   true),
('FLAG', 'Flag Football',                      'Flag Football',           'olympic',   true),
('FLA',  'Floorball',                          'Floorball',               'olympic',   true),
('CUR',  'Curling',                            'Curling',                 'olympic',   true),
-- Rowing / Aquatics
('REI',  'Remo',                               'Rowing',                  'olympic',   false),
('MAG',  'Maraton Aquatica',                  'Open Water Swimming',     'olympic',   false),
('SIN',  'Nado Sincronizado',                 'Artistic Swimming',       'olympic',   false),
('SAL',  'Saltos Ornamentais',                'Diving',                   'olympic',   false);

-- =============================================================================
-- REFERENCE TABLE: brazilian_ufs
-- All 27 Brazilian Federated Units (26 states + DF)
-- =============================================================================

CREATE TABLE IF NOT EXISTS brazilian_ufs (
    code        char(2)  PRIMARY KEY,
    name        text     NOT NULL,
    region      text     NOT NULL
);

INSERT INTO brazilian_ufs (code, name, region) VALUES
-- Norte
('AC', 'Acre',               'Norte'),
('AP', 'Amapa',              'Norte'),
('AM', 'Amazonas',           'Norte'),
('PA', 'Para',               'Norte'),
('RO', 'Rondonia',           'Norte'),
('RR', 'Roraima',            'Norte'),
('TO', 'Tocantins',          'Norte'),
-- Nordeste
('AL', 'Alagoas',            'Nordeste'),
('BA', 'Bahia',              'Nordeste'),
('CE', 'Ceara',              'Nordeste'),
('MA', 'Maranhao',           'Nordeste'),
('PB', 'Paraiba',            'Nordeste'),
('PE', 'Pernambuco',         'Nordeste'),
('PI', 'Piaui',              'Nordeste'),
('RN', 'Rio Grande do Norte','Nordeste'),
('SE', 'Sergipe',            'Nordeste'),
-- Centro-Oeste
('DF', 'Distrito Federal',   'Centro-Oeste'),
('GO', 'Goias',              'Centro-Oeste'),
('MT', 'Mato Grosso',        'Centro-Oeste'),
('MS', 'Mato Grosso do Sul', 'Centro-Oeste'),
-- Sudeste
('ES', 'Espirito Santo',     'Sudeste'),
('MG', 'Minas Gerais',       'Sudeste'),
('RJ', 'Rio de Janeiro',     'Sudeste'),
('SP', 'Sao Paulo',          'Sudeste'),
-- Sul
('PR', 'Parana',             'Sul'),
('RS', 'Rio Grande do Sul',  'Sul'),
('SC', 'Santa Catarina',     'Sul');

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
