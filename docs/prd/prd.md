# Brasil Atleta - Product Requirements Document (PRD)

**Version:** 1.0.0
**Date:** 2026-03-26
**Status:** Draft
**Origin:** Projeto academico FGV/FIFA/CIES - Gestao de Esportes (2026)
**Authors:** Enzo Zucheran, Klaus Moraes, Matheus Torres, Haroldo Neto
**Orientadora:** Prof. Monica Maeda Valentim

---

## 1. Visao Geral do Produto

### 1.1 Missao

Construir a plataforma nacional de integracao, mapeamento e monitoramento de atletas de modalidades olimpicas e paralimpicas, centralizando dados desde o esporte escolar ate o alto rendimento, reduzindo desigualdades regionais e fortalecendo a governanca esportiva brasileira.

### 1.2 Problema

O sistema esportivo brasileiro sofre de:

1. **Fragmentacao informacional** — Dados dispersos entre clubes, federacoes, confederacoes e programas governamentais sem integracao
2. **Ausencia de acompanhamento longitudinal** — Nenhum sistema nacional unificado rastreia atletas ao longo das etapas de formacao
3. **Desigualdade regional** — Sudeste concentra ~65% dos medalhistas olimpicos; Norte e Centro-Oeste juntos < 6%
4. **Perda de talentos** — Atletas de regioes sub-atendidas nao sao identificados nem acompanhados
5. **Decisoes sem evidencia** — Politicas publicas esportivas formuladas sem dados consolidados

### 1.3 Solucao

Plataforma digital (web + mobile) que:
- Centraliza cadastro de atletas, tecnicos e entidades esportivas
- Acompanha trajetorias desde a base escolar ate o alto rendimento
- Oferece dashboards analiticos, scouting e mapa nacional de talentos
- Integra esporte olimpico E paralimpico com metricas adaptadas
- Subsidia decisoes estrategicas com inteligencia esportiva baseada em dados

---

## 2. User Personas

### P1: Gestor Nacional (COB/CPB)
- **Quem:** Diretores e coordenadores do Comite Olimpico/Paralimpico do Brasil
- **Necessidade:** Visao agregada nacional, indicadores estrategicos, mapa de talentos, planejamento de politicas
- **Acesso:** Dashboard executivo, dados agregados por regiao/modalidade/nivel

### P2: Confederacao/Federacao
- **Quem:** Gestores tecnicos de confederacoes nacionais e federacoes estaduais
- **Necessidade:** Acompanhar atletas de sua modalidade, rankings, scouting, progressao por categoria
- **Acesso:** Dados de atletas da modalidade, filtros regionais, comparativos

### P3: Clube/Centro de Treinamento
- **Quem:** Diretores e coordenadores de clubes formadores
- **Necessidade:** Gestao de seus atletas, registro de desempenho, conexao com federacoes
- **Acesso:** Dados de atletas proprios, cadastro de resultados, metricas de time

### P4: Tecnico/Preparador Fisico
- **Quem:** Profissionais que acompanham atletas diariamente
- **Necessidade:** Registro de treinos, testes fisicos, acompanhamento de carga, prevencao de lesoes
- **Acesso:** Perfis de atletas sob sua orientacao, ferramentas de analise

### P5: Atleta
- **Quem:** Atletas desde a base escolar ate o alto rendimento
- **Necessidade:** Visibilidade, acompanhamento de sua propria evolucao, portfolo esportivo
- **Acesso:** Perfil pessoal, historico, metricas de desempenho (somente leitura)

### P6: Gestor Publico
- **Quem:** Secretarias de esporte municipais/estaduais, Ministerio do Esporte
- **Necessidade:** Dados para formulacao de politicas publicas, alocacao de recursos
- **Acesso:** Indicadores regionais agregados, relatorios de impacto

---

## 3. Requisitos Funcionais

### FR-01: Sistema de Cadastro Multi-Nivel

| ID | Requisito | Prioridade |
|----|-----------|-----------|
| FR-01.1 | Cadastro de atletas com dados pessoais, modalidade, entidade formadora, nivel competitivo | P0 |
| FR-01.2 | Cadastro de tecnicos/preparadores com formacao, certificacoes, historico de atuacao | P0 |
| FR-01.3 | Cadastro de entidades (clubes, federacoes, confederacoes, escolas) com hierarquia institucional | P0 |
| FR-01.4 | Vinculacao de atletas a entidades, modalidades e tecnicos | P0 |
| FR-01.5 | Perfis especificos para atletas paralimpicos (classificacao funcional, tipologia de deficiencia) | P1 |
| FR-01.6 | Upload de registros audiovisuais de desempenho (videos, fotos) | P2 |

### FR-02: Historico Competitivo e Resultados

| ID | Requisito | Prioridade |
|----|-----------|-----------|
| FR-02.1 | Registro de competicoes com classificacao por grau (Base escolar, Estadual, Nacional, Alto rendimento) | P0 |
| FR-02.2 | Registro de resultados oficiais por competicao (posicao, marca, tempo, pontuacao) | P0 |
| FR-02.3 | Historico cronologico de participacoes e resultados | P0 |
| FR-02.4 | Classificacao de eventos por codigo tecnico da modalidade (ATL, NAT, JUD, VEL, etc.) | P1 |

### FR-03: Metricas de Performance e Testes

| ID | Requisito | Prioridade |
|----|-----------|-----------|
| FR-03.1 | Registro de testes fisicos e tecnicos padronizados por modalidade | P0 |
| FR-03.2 | Indicadores-chave de performance (KPIs) com nucleo comum + camadas especificas por esporte | P0 |
| FR-03.3 | Series historicas de evolucao individual com graficos temporais | P1 |
| FR-03.4 | Comparacao longitudinal entre atletas de mesmo contexto competitivo | P1 |
| FR-03.5 | Metricas adaptadas para esporte paralimpico | P1 |

### FR-04: Dashboard de Scouting

| ID | Requisito | Prioridade |
|----|-----------|-----------|
| FR-04.1 | Dashboards interativos com filtros por faixa etaria, estado, entidade, modalidade | P0 |
| FR-04.2 | Rankings internos de desempenho por modalidade e categoria | P0 |
| FR-04.3 | Alertas automatizados para deteccao de progressoes acima da media | P1 |
| FR-04.4 | Ferramentas de busca avancada de atletas com multiplos criterios | P1 |
| FR-04.5 | Recomendacoes automatizadas de perfis esportivos | P2 |

### FR-05: Mapa Nacional de Talentos

| ID | Requisito | Prioridade |
|----|-----------|-----------|
| FR-05.1 | Mapa interativo do Brasil com distribuicao de atletas por estado/municipio | P0 |
| FR-05.2 | Filtros por modalidade, categoria etaria, nivel competitivo | P0 |
| FR-05.3 | Identificacao de polos de desenvolvimento esportivo | P1 |
| FR-05.4 | Deteccao de vazios estruturais de formacao esportiva | P1 |
| FR-05.5 | Cruzamento dados geograficos + progressao esportiva | P1 |

### FR-06: Funil Esportivo Nacional

| ID | Requisito | Prioridade |
|----|-----------|-----------|
| FR-06.1 | Visualizacao do funil: Base escolar > Estadual > Nacional > Alto rendimento | P0 |
| FR-06.2 | Taxas de retencao/conversao entre niveis do funil | P1 |
| FR-06.3 | Densidade regional de atletas por modalidade | P1 |
| FR-06.4 | Progressao por faixa etaria | P1 |

### FR-07: Analytics e IA

| ID | Requisito | Prioridade |
|----|-----------|-----------|
| FR-07.1 | Modelos preditivos para projecao de progressao atletica | P2 |
| FR-07.2 | Identificacao de talentos de alto potencial via algoritmos | P2 |
| FR-07.3 | Mitigacao de riscos de evasao esportiva via alertas preditivos | P2 |

### FR-08: Governanca de Acesso

| ID | Requisito | Prioridade |
|----|-----------|-----------|
| FR-08.1 | Controle de acesso por camadas: entidade ve seus atletas; niveis superiores veem dados agregados | P0 |
| FR-08.2 | Roles hierarquicos: Admin Nacional, Confederacao, Federacao, Clube, Tecnico, Atleta | P0 |
| FR-08.3 | Audit trail de acessos e modificacoes de dados | P1 |

---

## 4. Requisitos Nao-Funcionais

| ID | Requisito | Especificacao |
|----|-----------|--------------|
| NFR-01 | Performance | Dashboards carregam em < 3s; API response < 500ms |
| NFR-02 | Escalabilidade | Suportar 100K+ atletas cadastrados, 10K+ usuarios simultaneos |
| NFR-03 | Disponibilidade | 99.5% uptime SLA |
| NFR-04 | Seguranca | Autenticacao multi-fator, criptografia em transito e repouso |
| NFR-05 | LGPD | Conformidade total com Lei 13.709/2018 — consentimento, termos de uso, cookies, privacidade |
| NFR-06 | Acessibilidade | WCAG 2.1 AA — inclusao de atletas paralimpicos como usuarios |
| NFR-07 | Responsividade | Web responsivo + app mobile (iOS/Android) |
| NFR-08 | i18n | Portugues (principal), Ingles (secundario para interacao com COI) |
| NFR-09 | Backup | Backup diario automatizado com retencao de 30 dias |
| NFR-10 | Auditabilidade | Logs completos de acesso e modificacao de dados sensiveis |

---

## 5. Estrutura de Dados — Modelo Conceitual

### 5.1 Entidades Principais

```
Atleta
├── Dados Pessoais (nome, data nasc., genero, estado, municipio, foto)
├── Modalidade(s) (codigo tecnico: ATL, NAT, JUD, VEL...)
├── Nivel Competitivo (Base escolar, Estadual, Nacional, Alto rendimento)
├── Classificacao Paralimpica (tipo deficiencia, classe funcional) [opcional]
├── Entidade(s) Vinculada(s)
├── Tecnico(s) Responsavel(is)
├── Historico Competitivo[]
│   ├── Competicao (nome, data, local, grau, modalidade)
│   └── Resultado (posicao, marca, tempo, pontuacao)
├── Testes Fisicos/Tecnicos[]
│   ├── Data, Tipo, Resultado, Protocolo
│   └── Metricas especificas por modalidade
├── KPIs Performance[]
│   ├── Frequencia competitiva
│   ├── Progressao de resultados
│   ├── Estabilidade de desempenho
│   └── Evolucao relativa por categoria etaria
└── Midias[] (videos, fotos de desempenho)

Tecnico
├── Dados Pessoais
├── Formacao Academica
├── Certificacoes[]
├── Historico de Atuacao[]
├── Atletas sob Acompanhamento[]
└── Resultados Competitivos[]

Entidade Esportiva
├── Tipo (Escola, Clube, Centro de Treinamento, Federacao, Confederacao, Comite)
├── Hierarquia Institucional
├── Localizacao (estado, municipio)
├── Modalidades Atendidas[]
├── Atletas Vinculados[]
└── Profissionais Vinculados[]

Competicao
├── Nome, Data, Local
├── Grau (Base escolar, Estadual, Nacional, Alto rendimento)
├── Modalidade (codigo tecnico)
├── Entidade Organizadora
└── Resultados[]
```

### 5.2 Hierarquia Institucional

```
COB/CPB (Nacional)
└── Confederacoes (por modalidade)
    └── Federacoes Estaduais (por estado)
        └── Clubes / Centros de Treinamento / Escolas
            └── Atletas + Tecnicos
```

### 5.3 Niveis do Funil Esportivo

```
1. Base Escolar (Jogos Escolares, CBDE)
2. Estadual (Federacoes estaduais, competicoes regionais)
3. Nacional (Confederacoes, campeonatos brasileiros)
4. Alto Rendimento (Selecoes, Jogos Olimpicos/Paralimpicos)
```

---

## 6. Restricoes e Premissas

### Restricoes
- CON-01: Conformidade obrigatoria com LGPD (Lei 13.709/2018)
- CON-02: Dados de menores requerem consentimento de responsavel legal
- CON-03: Integracao com estrutura existente do COB/CPB sem substituir sistemas internos
- CON-04: Classificacao paralimpica deve seguir padroes do IPC (International Paralympic Committee)
- CON-05: Codigos tecnicos de modalidade alinhados com COI/IPC

### Premissas
- A-01: COB e CPB serao parceiros institucionais e validadores dos dados
- A-02: Confederacoes e federacoes alimentarao dados em seus niveis de competencia
- A-03: Implementacao progressiva — iniciar por competicoes escolares (Jogos da Juventude)
- A-04: Cada entidade responsavel pelos dados de seus atletas (governanca distribuida)

---

## 7. Metricas de Sucesso

### Adocao e Cobertura
- Numero de atletas cadastrados por regiao, modalidade e faixa etaria
- Proporcao de clubes/escolas/federacoes integradas
- Frequencia de atualizacao dos registros

### Identificacao de Talentos
- Atletas identificados em regioes historicamente sub-atendidas
- Taxa de progressao entre niveis competitivos
- Tempo medio entre identificacao e insercao em estrutura formal

### Desempenho Esportivo
- Evolucao dos KPIs por modalidade
- Reducao de evasao nas trajetorias esportivas
- Diversidade regional na composicao de selecoes nacionais

### Governanca
- Uso dos dados na formulacao de politicas publicas
- Eficiencia na alocacao de recursos
- Parcerias institucionais firmadas

---

## 8. Plano de Implementacao — Fases

### Fase 1: MVP — Base Escolar (3-4 meses)
- Cadastro de atletas, entidades e tecnicos
- Registro de competicoes e resultados (Jogos da Juventude)
- Dashboard basico de scouting
- Mapa nacional de talentos (versao inicial)
- Auth multi-nivel + LGPD compliance

### Fase 2: Federacoes e Confederacoes (2-3 meses)
- Integracao com federacoes estaduais
- Historico competitivo expandido
- KPIs por modalidade com codigos tecnicos
- Rankings e comparativos

### Fase 3: Analytics e Alto Rendimento (2-3 meses)
- Modelos preditivos com IA
- Funil esportivo nacional com metricas de conversao
- Dashboard executivo para COB/CPB
- Perfis paralimpicos com metricas adaptadas

### Fase 4: Ecossistema Completo (2-3 meses)
- App mobile (iOS/Android)
- Integracoes com sistemas de federacoes
- Alertas automatizados de scouting
- Modulo de prevencao de evasao

---

*PRD — Brasil Atleta v1.0.0*
*Baseado no projeto academico FGV/FIFA/CIES "Brasil Atleta: Plataforma Nacional para Integracao e Monitoramento de Atletas no Esporte Brasileiro" (2026)*
