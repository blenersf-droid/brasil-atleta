# Brasil Atleta — Product Requirements Document (PRD) v3

**Version:** 3.0.0
**Date:** 2026-07-05
**Status:** Active
**Supersedes:** `prd.md` (v1.0.0 — plataforma institucional) e `prd-v2-fase1.md` (v2.0.0 — pivot "Portfólio Esportivo")
**Origem:** Consolidação estratégica pós-análise de mercado. Este documento é a fonte única de verdade do produto a partir de 2026-07-05.

---

## 1. Sumário Executivo e Posicionamento

### 1.1 O que é o Brasil Atleta

**Brasil Atleta é a infraestrutura de dados verificados de atletas do Brasil.**

Esse é o posicionamento que vendemos ao mercado B2B (federações, clubes, agentes/scouts): não "acesso a uma rede social de atletas", mas **dado confiável sobre atletas**, estruturado em níveis de confiança auditáveis, alimentado por quem tem autoridade para confirmá-lo (o próprio atleta, sua entidade formadora, a federação).

Para o atleta, a experiência de produto continua sendo a de um **"LinkedIn para Atletas"**: um perfil esportivo self-service, visual, compartilhável, que funciona como portfólio de carreira. Essa metáfora orienta a UX do atleta — não o discurso comercial. O que sustenta o negócio é a camada de verificação por trás do perfil, não o perfil em si.

### 1.2 Visão de longo prazo

Base de dados nacional multiesporte — não limitada a uma modalidade, não limitada a uma região. A estratégia de entrada, no entanto, é deliberadamente estreita: **densidade antes de amplitude**. Preferimos dominar 2-3 modalidades em 1-2 estados (dados quase completos, verificação real, relacionamento sólido com a federação) a espalhar cadastros rasos por todo o país. Amplitude geográfica e de modalidades vem depois, quando o modelo de verificação e o modelo comercial já estiverem provados (Fase 4).

### 1.3 Modelo comercial em uma frase

Freemium: o atleta usa a plataforma de graça, para sempre, com controle total do próprio perfil. Quem paga são as entidades que precisam desse dado verificado para tomar decisão — federações primeiro (gestão + geração de dado oficial), depois clubes (busca de talento) e agentes/scouts (busca individual). Patrocinadores ficam para uma fase futura, fora do roadmap ativo.

### 1.4 Por que este documento existe

O PRD v1 (institucional, acadêmico) e o PRD v2 (pivot comercial "Portfólio Esportivo") descreviam produtos e modelos de negócio diferentes, com pontos de contradição entre si e com o que já foi construído (stories 11.1–11.5). Este PRD v3 resolve essas contradições, incorpora evidência de mercado coletada desde então e passa a reger sozinho o roadmap do produto. Ver Seção 3 para o detalhamento das mudanças e Seção 10 para a reconciliação com os epics já planejados.

---

## 2. Contexto de Mercado

Evidência coletada para validar (ou revisar) as hipóteses deste PRD. Fontes indicadas entre parênteses.

### 2.1 Demanda B2B por dado de scouting já existe e já é paga

- Footlink está presente em ~95% dos clubes da Série A, cobra em torno de **R$1.500 por licença/usuário**, e clubes grandes chegam a manter 20-30 licenças simultâneas (footlink.app, baguete.com.br).
- O Flamengo assina **três ferramentas de scouting diferentes ao mesmo tempo** — sinal de que o orçamento para esse tipo de dado existe e é disputado por múltiplos fornecedores.
- No mercado internacional, o Wyscout cobra entre US$400 e US$1.600/ano nos planos de entrada — o preço de "dado de scouting" é um benchmark validado, não uma hipótese.

### 2.2 O atleta não paga em escala no Brasil

- O maior caso de monetização direta do atleta encontrado tem ~400 assinantes (Peneira Fácil, R$147/ano) — um volume irrelevante para sustentar um negócio.
- Apps com tração real entre atletas (Footbao, ~120 mil downloads; CUJU, ~160 mil downloads) são **gratuitos** para o atleta.
- Conclusão prática: cobrar do atleta trava a aquisição do lado que gera a densidade de dados. O freemium não é só filosofia de produto, é a única estrutura de preço compatível com o comportamento observado do usuário-atleta no Brasil.

### 2.3 "Atleta grátis, entidade paga" é o modelo dos sobreviventes globais

Tonsser, Fieldoo, Eyeball e Athlete Network — os players internacionais que sobreviveram no espaço de perfil/scouting de atleta — operam nesse modelo. O padrão do setor, além disso, é consolidação por aquisição, não crescimento orgânico indefinido: a Hudl comprou a Wyscout em 2019 e a InStat em 2022; a IMG comprou a SportsRecruits em 2025. Isso reforça que dado de scouting estruturado é um ativo que grandes players compram — não necessariamente que precisamos "vencer" sozinhos no longo prazo, mas que construir esse ativo tem valor reconhecido pelo mercado.

### 2.4 A concorrência brasileira está concentrada no futebol — e o resto está descoberto, mas não validado

Existem 10+ players de scouting/portfólio esportivo no Brasil (Footlink, Footbao, CUJU, Dreamstock, AtletasNow, E-Scout, entre outros), e nenhum deles tem tração relevante fora do futebol. Esse espaço está aberto, mas isso não significa que a demanda ali exista no mesmo grau — é uma hipótese que precisa ser validada com as federações antes de apostarmos o roadmap nela (ver Seção 9, riscos).

### 2.5 Existe um vácuo institucional que o produto pode ocupar

- O COB criou o Sysconf de graça porque a maioria das confederações não tinha sistema próprio — mas apenas 19 aderiram até outubro de 2022 (gov.br/esporte). Ou seja: a dor é real, mas a solução institucional atual não resolveu.
- A Lei 14.597/2023 cria cadastro **de organizações** esportivas, não de atletas — não compete com o que propomos, e pode até ser complementar.
- A CBJ (judô) tem apenas ~5 mil judocas cadastrados de uma base estimada em ~2 milhões de praticantes — gap entre praticantes e cadastro oficial é enorme.
- O SNIIE (sistema nacional de informações do esporte) ainda está em construção — não é uma ameaça de curto prazo.

### 2.6 Existe mercado cinza em torno da falta de visibilidade legítima

Grupos pagos de WhatsApp prometendo peneiras, e fraudes de "falsa peneira" (valores entre R$60 e R$7.000 cobrados de famílias — Operação Cartão Vermelho), mostram que existe demanda desesperada por visibilidade e caminho até um clube, que hoje é explorada por golpistas. Um produto legítimo de portfólio verificado tem, aqui, um argumento social forte, além do comercial.

### 2.7 Capital de risco está migrando para longe do nosso segmento — e está tudo bem

O mercado de sports tech no Brasil foi de US$584 milhões (2023) com projeção de US$1,9 bilhão (2030), mas o capital de risco global migrou de "athlete solutions" (31% → 18% de alocação) para "fan solutions" (75%). **Este plano não depende de captação de VC** — a decisão estratégica (D5) é buscar receita própria cedo, com entidades pagantes já na Fase 2, justamente porque não podemos assumir que haverá capital externo disponível no timing que precisaríamos.

---

## 3. O que Muda do v1/v2 para o v3

O PRD v1 era um projeto acadêmico institucional (COB/CPB, gestão pública, todas as modalidades, sem modelo de negócio). O PRD v2 pivotou para um produto comercial B2C/B2B centrado no atleta, mas guardava contradições internas e não incorporava evidência de mercado. A tabela abaixo resolve os pontos de tensão.

| Dimensão | PRD v1 | PRD v2 | PRD v3 (decisão final) |
|---|---|---|---|
| Posicionamento | Plataforma nacional de governança esportiva | "LinkedIn para Atletas" / portfólio esportivo | Infraestrutura de dados verificados de atletas — "LinkedIn" é a metáfora de UX do atleta, não o discurso comercial (D1) |
| Papel do atleta | Somente leitura (perfil alimentado por entidades) | Self-service total (cadastra os próprios dados) | Mantido: self-service total, sempre grátis (D2) |
| Quem paga | Não definido (projeto sem modelo de negócio) | "Entidades pagam" — mencionado como Fase 3 no corpo do documento, mas a Story 11.5 (landing page) já promete "Em breve" para federações/clubes já na fase seguinte, uma contradição interna | Entidades começam a pagar na **Fase 2**, não na Fase 3 (D5). Resolve a contradição v2 a favor do texto da Story 11.5 |
| Ordem de quem paga | N/A | Não priorizado ("clubes, federações, scouts" citados sem ordem) | Ordem explícita: (1) federações/confederações, (2) clubes, (3) agentes/scouts. Patrocinadores adiados (D2) |
| Cabeça de praia | Todas as modalidades olímpicas/paralímpicas, escopo nacional imediato | 5 modalidades foco incluindo futebol (FUT, ATL, NAT, JUD, JJB), sem recorte geográfico | 2-3 modalidades **fora do futebol**, em 1-2 estados, entrando pela federação estadual. Futebol adiado explicitamente para a Fase 4 (D3) |
| Diferenciação competitiva | Integração nacional institucional | Perfil bonito e compartilhável | Nível de confiança do dado (N0/N1/N2) como fosso competitivo — o que nenhum concorrente de portfólio hoje oferece (D4) |
| Módulo de federação | Integração institucional genérica ("COB/CPB parceiros") | Ausente | Módulo de gestão pago que também é o motor de geração do dado oficial (N2) — engrenagem explícita entre produto e monetização (D4) |
| LGPD e menores | Restrição genérica (CON-02: consentimento de responsável) e NFR de conformidade geral | Não tratado como requisito de produto específico | Requisito de produto de Fase 0/1, com fluxo de consentimento, visibilidade restrita por padrão, contato sempre intermediado e canal de denúncia (D6) |
| Métricas primárias | Adoção/cobertura nacional, taxa de progressão entre níveis competitivos | "5K cadastros em 6 meses" como meta central | Densidade por modalidade/UF, % de perfis verificados, ativação, retenção M1 e pipeline B2B/MRR. Cadastros brutos viram métrica secundária (D8) |
| Personas centrais | Gestor Nacional (COB/CPB), Gestor Público, Confederação/Federação, Clube, Técnico, Atleta | Atleta (única persona ativa; demais mencionadas apenas como "Fase 3") | Atleta (+ responsável de menor), Federação/Confederação, Clube, Agente/Scout. COB/CPB e Gestor Público explicitamente aposentados/adiados do roadmap ativo (Seção 4) |
| Fundação técnica | N/A | Não tratada como pré-requisito formal | Fase 0 explícita: corrigir escalação de privilégio em `user_type`, formalizar migration de `achievements`, gerar tipos do Supabase, testes mínimos, cobertura do middleware, consentimento LGPD — gate obrigatório antes do go-to-market (D7) |

---

## 4. Personas

### 4.1 Atleta (persona central — sempre grátis)

Praticante de qualquer nível — da base ao alto rendimento — nas modalidades priorizadas em cada fase (Seção 7). Quer visibilidade, controle do próprio portfólio e ser encontrado por quem decide (clube, federação, agente). Usa a plataforma como usaria uma rede profissional: cadastra, atualiza, compartilha. Nunca paga, nunca vê anúncio de "torne-se premium" — o produto do atleta é 100% completo no plano gratuito.

**Atleta menor de 18 anos + Responsável legal.** Sub-persona com regras próprias (ver D6, Seção 6.3): o cadastro de um menor exige consentimento verificável do responsável; o perfil nasce com visibilidade restrita; a publicação pública do perfil depende de opt-in explícito do responsável; qualquer contato de uma entidade com o atleta menor passa obrigatoriamente pela plataforma, nunca é direto.

**Ator de apoio (não pagante): Técnico/Preparador físico.** Deixa de ser uma persona de acesso separado como no v1 e passa a ser um ator dentro do fluxo de verificação: quando vinculado a um atleta por um clube ou federação, pode confirmar dados autodeclarados, elevando-os de N0 para N1 (Seção 6.2).

### 4.2 Federação Estadual / Confederação (persona pagante — prioridade 1)

Gestora técnica de uma modalidade em um estado (ou nacionalmente, no caso de confederação). Hoje, a maioria não tem sistema próprio de gestão de atletas, filiações e resultados oficiais (Seção 2.5). Precisa de um módulo de gestão — cadastro de atletas filiados, controle de filiações, cadastro de competições e resultados oficiais. É o ator cuja atividade gera o dado de nível N2 (oficial), o que torna essa persona estratégica além do valor de sua própria assinatura: sem ela, a busca paga de clubes e agentes perde grande parte do valor.

### 4.3 Clube (persona pagante — prioridade 2)

Clube formador ou de competição que busca talentos e/ou organiza os próprios atletas vinculados. Precisa de busca de talentos com filtros (modalidade, estado, nível, dado verificado) e de uma forma simples de gerenciar sua própria base de atletas vinculados.

### 4.4 Agente / Scout (persona pagante — prioridade 3)

Profissional independente de intermediação/scouting, sem vínculo institucional fixo com clube ou federação. Precisa de uma ferramenta de busca individual, mais leve que o plano de clube, para identificar talentos por conta própria.

### 4.5 Patrocinador (fase futura — fora do roadmap ativo)

Marca ou empresa interessada em associar-se a atletas verificados. Reconhecido como direção de longo prazo (mencionado no v2 como futuro), mas explicitamente fora do roadmap ativo (Fases 0-4 descritas neste documento). Não há requisito funcional definido para essa persona neste PRD.

### 4.6 Personas Aposentadas / Adiadas do v1

O PRD v1 tratava como personas centrais o **Gestor Nacional (COB/CPB)** e o **Gestor Público** (secretarias de esporte, Ministério do Esporte), com necessidades de dashboards agregados nacionais e subsídio a políticas públicas. Essas personas são **explicitamente aposentadas do roadmap ativo** neste PRD v3:

- O COB/CPB aparece apenas como referência de mercado (o caso Sysconf, Seção 2.5), não como cliente-alvo do produto nesta fase.
- O Gestor Público não tem necessidade atendida em nenhuma fase do roadmap ativo (Seção 6).
- Isso não é um julgamento de valor sobre a relevância institucional desses atores — é uma decisão de foco: o produto vende dado verificado para quem toma decisão operacional (federação estadual, clube, agente), não para quem formula política pública. Uma reentrada institucional pode ser reavaliada após a Fase 4, mas não faz parte deste plano.

---

## 5. Modelo de Negócio e Pricing

### 5.1 Estrutura Freemium

- **Atleta:** grátis, para sempre, self-service completo (cadastro, edição, mídia, compartilhamento). Nenhuma funcionalidade do atleta é paga.
- **Entidades pagantes**, em ordem de prioridade de desenvolvimento e go-to-market:
  1. **Federações estaduais / confederações** — módulo de gestão (cadastro de atletas, filiações, competições e resultados oficiais).
  2. **Clubes** — busca de talentos e gestão da própria base de atletas vinculados.
  3. **Agentes/scouts** — plano individual de busca.
- **Patrocinadores** — fase futura, fora do roadmap ativo (Seção 4.5).

### 5.2 Por que a receita começa na Fase 2, não na Fase 3

A tese de monetização depende do dado oficial (N2) gerado pelo módulo de federação (Seção 6.2). Adiar a receita para a Fase 3, como o texto do PRD v2 sugeria em um trecho (mas contradizia em outro, na landing page da Story 11.5), atrasaria desnecessariamente a validação comercial. A decisão é: buscar 2-3 entidades-piloto pagantes já na Fase 2, com **founder deals** — preço simbólico, em troca de um compromisso formal de feedback estruturado. Isso antecipa o aprendizado comercial e começa a construir a prova de tração que o produto precisa, sem depender de capital de risco (Seção 2.7).

### 5.3 Âncora de mercado

O Footlink cobra em torno de **R$1.500 por licença/usuário** no mercado de futebol profissional (Seção 2.1). Esse é o teto de referência do que o mercado já paga por dado de scouting no Brasil — nosso pricing inicial mira uma fração desse valor, coerente com um produto em validação e com um mercado (fora do futebol) ainda não testado.

### 5.4 Hipóteses de Pricing (a validar — não são preços fechados)

| Persona | Faixa de preço (hipótese) | O que inclui |
|---|---|---|
| Federação/Confederação | R$300–800/mês | Gestão + cadastro ilimitado de atletas filiados |
| Clube | R$150–400/mês por licença | Busca de talentos + gestão da própria base |
| Agente/Scout | R$100–250/mês | Plano individual de busca |

Essas faixas são hipóteses de trabalho para orientar as conversas com os pilotos da Fase 2 — não uma tabela de preços publicada. O pricing final deve ser calibrado com o aprendizado dos founder deals antes de qualquer self-checkout público (que só chega na Fase 3, Seção 6.4).

---

## 6. Produto: Pilares e Requisitos por Fase

### 6.1 Pilares do Produto

1. **Portfólio self-service do atleta** — já entregue nas stories 11.1–11.5 (Seção 10), é a base sobre a qual tudo o resto é construído.
2. **Verificação em camadas** — o fosso competitivo do produto (D4, Seção 6.2).
3. **Módulo de federações** — motor comercial e motor de geração do dado oficial, ao mesmo tempo (D2, D4).
4. **Confiança e proteção de menores** — requisito de produto, não checklist jurídico à parte (D6, Seção 6.3).

### 6.2 Níveis de Confiança do Dado (Verificação como Produto)

O diferencial competitivo do Brasil Atleta diante de qualquer app de portfólio esportivo existente é que **nem todo dado tem o mesmo peso**. Cada informação no perfil (resultado, teste, conquista) carrega um nível de confiança visível:

| Nível | Nome | Como se obtém | Exibição no perfil |
|---|---|---|---|
| **N0** | Autodeclarado | O próprio atleta insere o dado (competição, resultado, teste, conquista) | Badge neutro "Autodeclarado" |
| **N1** | Confirmado | Um clube ou técnico vinculado ao atleta confirma um dado autodeclarado | Badge "Confirmado por [entidade/técnico]" |
| **N2** | Oficial | Resultado importado ou validado por uma federação/confederação a partir de uma competição oficial | Selo "Oficial" |

Quando um perfil atinge um critério mínimo de dado verificado (referência operacional: ao menos um item em N1 ou superior — mesmo limiar usado no gate de saída da Fase 1, Seção 8), ele recebe o selo **"Perfil Verificado"**, exibido publicamente.

**A engrenagem comercial:** o módulo de federação (Seção 5.1, persona 4.2) é oferecido a preço acessível (faixas da Seção 5.4; simbólico nos founder deals da Fase 2) para resolver um problema real de gestão que a federação já tem hoje (Seção 2.5). Ao usá-lo, a federação gera dado oficial (N2) como subproduto natural da sua operação. Esse dado oficial é o que torna a busca paga de clubes e agentes valiosa — sem ele, o produto seria só mais um portfólio autodeclarado, commoditizado. Este é o motivo pelo qual o módulo de federação (Fase 2) precede a busca avançada monetizável (Fase 3): a busca só vale o preço se o dado por trás dela for confiável.

### 6.3 LGPD e Proteção de Menores (Requisito de Produto, não Pendência Jurídica)

Tratado aqui como requisito de produto de Fase 0/1 — não como item de conformidade a ser resolvido depois. Base legal: **LGPD, art. 14** (tratamento de dados de crianças e adolescentes exige consentimento específico e em destaque de ao menos um dos pais ou responsável legal).

Requisitos:
- Consentimento **verificável** do responsável legal no onboarding de qualquer atleta menor de 18 anos — não uma caixa de marcação simples, mas um fluxo que capture e associe a identidade do responsável ao consentimento.
- Perfil de atleta menor nasce com **visibilidade restrita por padrão**. Torná-lo público exige **opt-in explícito do responsável**, separado do consentimento de cadastro.
- Contato de qualquer entidade (federação, clube, agente) com um atleta menor é **sempre intermediado pela plataforma** — nunca direto. Isso não é apenas proteção: reforça o valor do plano pago da entidade, que passa a depender do produto também para a comunicação, não só para a descoberta.
- **Canal de denúncia** acessível a partir do perfil e do fluxo de contato, para reportar abordagem inadequada.
- **Minimização de dados**: coletar apenas o necessário para a finalidade do produto, especialmente no caso de menores.

**Minimização de dados (FR-0.10) — revisão 2026-07-05.** Revisão do fluxo de cadastro (onboarding) confirmou que os dados coletados são, em geral, efetivamente usados pelo produto. Único ponto fora do padrão: o campo `current_entity` (texto livre, nome do clube/entidade digitado pelo atleta no onboarding) é coletado na UI mas deliberadamente **não é persistido** no banco (não existe lookup para `entity_id` real) — recomendação para Fase 1: implementar um lookup/autocomplete de entidade existente ou remover o campo do formulário, já que hoje ele coleta um dado que não é usado. O consentimento do responsável legal para atletas menores (`guardian_consents`) é registrado de forma imutável (sem UPDATE/DELETE para `authenticated`), com a identidade do responsável (nome, e-mail, grau de parentesco) associada a cada consentimento — atendendo ao requisito de consentimento verificável do art. 14 da LGPD.

### 6.4 Requisitos Funcionais por Fase

O roadmap é estruturado em 5 fases, cada uma com um **gate de saída** — um critério objetivo que precisa ser atingido antes de avançar para a fase seguinte.

#### Fase 0 — Fundação e Confiança (pré-go-to-market)

Objetivo: eliminar dívida técnica crítica e colocar no ar o fluxo de consentimento LGPD antes de qualquer esforço comercial. Esta fase não entrega valor novo ao usuário final — entrega a base sem a qual nenhuma fase seguinte é segura ou sustentável.

| ID | Requisito | Observação |
|---|---|---|
| FR-0.1 | Corrigir a escalação de privilégio no cadastro: o campo `user_type` não pode ser autoescolhido pelo cliente com RLS confiando cegamente no JWT | Falha crítica de segurança já diagnosticada |
| FR-0.2 | Migration formal para a tabela `achievements` | Hoje usada pela UI (Story 11.4) sem migration correspondente no schema versionado |
| FR-0.3 | Gerar e manter sincronizados os tipos TypeScript a partir do schema real do Supabase | Elimina divergência silenciosa entre schema e tipos |
| FR-0.4 | Suíte mínima de testes automatizados cobrindo RLS, fluxos de autenticação e o CRUD self-service do atleta | Zero testes hoje é um risco para qualquer mudança futura |
| FR-0.5 | Middleware de proteção cobrindo todas as rotas autenticadas, não apenas `/dashboard*` | Gap de proteção já diagnosticado |
| FR-0.6 | Seed de dados de referência (modalidades, UFs) funcionando de ponta a ponta | Seed hoje está quebrado |
| FR-0.7 | Fluxo de consentimento verificável do responsável legal no onboarding de atleta menor de 18 | Base legal: LGPD art. 14 (D6) |
| FR-0.8 | Perfil de atleta menor criado com visibilidade restrita por padrão | D6 |
| FR-0.9 | Canal de denúncia acessível no produto | D6 |
| FR-0.10 | Revisão de minimização de dados coletados no cadastro | D6 |

**Gate de saída da Fase 0:** zero críticos de segurança abertos **e** fluxo de consentimento de menores no ar em produção.

#### Fase 1 — Portfólio Verificável

Objetivo: completar o pivot iniciado no v2 (stories 11.1–11.5, já entregues — ver Seção 10) e introduzir a primeira camada de verificação (N1). Base de tudo que vem depois.

| ID | Requisito | Observação |
|---|---|---|
| FR-1.1 | Onboarding com messaging alinhado ao novo posicionamento (D1): "portfólio verificável", não apenas "seja descoberto" | Ajuste sobre o onboarding entregue na Story 11.1 |
| FR-1.2 | QR code real gerado para o perfil público | Pendência explícita deixada em aberto na Story 11.2 (AC10 implementado apenas como link de compartilhamento) |
| FR-1.3 | Upload de mídia (fotos e vídeos de desempenho) no perfil do atleta | Presente como requisito desde o v1 (FR-01.6), nunca implementado |
| FR-1.4 | Selo de nível de confiança (N0/N1/N2) visível em cada dado do perfil | Ver Seção 6.2 |
| FR-1.5 | Fluxo de confirmação N1: um clube ou técnico vinculado ao atleta confirma um dado autodeclarado | Ver Seção 6.2 |
| FR-1.6 | Vinculação formal atleta–entidade (clube/técnico), pré-requisito técnico para a confirmação N1 | — |
| FR-1.7 | Selo "Perfil Verificado" exibido no perfil público quando o critério mínimo de verificação é atingido | Ver Seção 6.2 |
| FR-1.8 | Publicação do perfil de atleta menor como público depende de opt-in explícito do responsável, separado do consentimento de cadastro | D6 |
| FR-1.9 | Contato de qualquer entidade com atleta menor sempre intermediado pela plataforma | D6 |

**Gate de saída da Fase 1:** X atletas ativos nas modalidades-piloto do estado-piloto (X a definir por modalidade — referência de trabalho: 500 atletas por modalidade no estado-piloto) **e** ao menos 30% dos perfis com pelo menos um item em nível N1 ou superior.

#### Fase 2 — Federações e Primeira Receita

Objetivo: colocar no ar o módulo de gestão para federações (o motor de geração de dado N2, Seção 6.2), oferecer busca básica para entidades, e fechar os primeiros contratos pagos.

| ID | Requisito | Observação |
|---|---|---|
| FR-2.1 | Módulo de gestão para federação estadual/confederação: cadastro de atletas filiados e controle de filiações | Ver persona 4.2 |
| FR-2.2 | Cadastro de competições e resultados oficiais pela federação | Gera insumo para N2 |
| FR-2.3 | Importação/validação de resultado oficial, elevando o dado correspondente no perfil do atleta a N2 | Ver Seção 6.2 |
| FR-2.4 | Busca básica de talentos para clubes (filtros por modalidade, estado, nível competitivo, nível de verificação) | — |
| FR-2.5 | Gestão da própria base de atletas vinculados pelo clube | Ver persona 4.3 |
| FR-2.6 | Onboarding comercial e contrato simplificado para as 2-3 entidades-piloto pagantes (founder deals) | Ver Seção 5.2 |
| FR-2.7 | Dashboard básico da federação com indicadores de filiados e competições cadastradas | — |
| FR-2.8 | Contato clube→atleta adulto habilitado diretamente pela plataforma; contato com atleta menor permanece sempre intermediado (FR-1.9) | — |

**Gate de saída da Fase 2:** ao menos 2 entidades pagantes **e** densidade mínima na modalidade-piloto do estado-piloto (referência de trabalho: ≥60% dos atletas federados da modalidade presentes na base).

#### Fase 3 — Scouting e Rede

Objetivo: aprofundar o valor comercial para clubes e agentes, e introduzir elementos de rede que aumentam a retenção do atleta.

| ID | Requisito | Observação |
|---|---|---|
| FR-3.1 | Busca avançada com múltiplos critérios combinados | — |
| FR-3.2 | Dashboards analíticos para clubes e agentes | — |
| FR-3.3 | Alertas de talento (progressão de desempenho, novos perfis compatíveis com critérios salvos) | — |
| FR-3.4 | Elementos de rede: seguir atletas/entidades, feed de atualizações | — |
| FR-3.5 | Planos públicos por tier com self-checkout, sem intervenção manual de vendas | Substitui o modelo de founder deal manual da Fase 2 |
| FR-3.6 | Plano individual de busca para agentes/scouts | Ver persona 4.4 |

**Gate de saída da Fase 3:** não definido neste PRD. Deve ser estabelecido ao final da Fase 2, com base no aprendizado comercial dos founder deals (ver Seção 8 e Seção 9 para o ponto em aberto).

#### Fase 4 — Escala

Objetivo: expandir densidade para novas modalidades e estados, entrar no futebol de base com o diferencial de verificação já provado, e levar o produto a mobile.

| ID | Requisito | Observação |
|---|---|---|
| FR-4.1 | Expansão para novas modalidades e estados | Repete o modelo de densidade validado na cabeça de praia (Seção 7) |
| FR-4.2 | Entrada no futebol de base | Deliberadamente adiado até aqui — mercado já ocupado por Footlink/CUJU/Footbao/Dreamstock (Seção 2.4); a entrada tardia é justificada pelo diferencial de verificação, que nenhum desses concorrentes oferece hoje |
| FR-4.3 | Aplicativo mobile | — |
| FR-4.4 | Patrocinadores como novo tipo de entidade pagante | Ver persona 4.5 — sem requisitos funcionais detalhados neste PRD |

**Gate de saída da Fase 4:** não definido neste PRD (fase de escala contínua, sem um único critério de saída binário).

---

## 7. Go-to-Market

### 7.1 Cabeça de Praia: Fora do Futebol, 1-2 Estados

A entrada de mercado é deliberadamente estreita: **2-3 modalidades fora do futebol, em 1-2 estados**, entrando pela federação estadual que ainda não tem sistema próprio de gestão. O futebol é adiado para a Fase 4 (Seção 6.4, FR-4.2) — é o mercado mais competido e mais caro de entrar, e nosso diferencial (verificação) só faz sentido depois de provado em um contexto mais simples.

**Hipóteses iniciais de modalidade (a validar com entrevistas antes do fim da Fase 1):**
- Atletismo
- Judô
- Vôlei

### 7.2 Critérios de Escolha da Modalidade/Estado-Piloto

Uma modalidade e estado só entram como cabeça de praia se, em combinação:
1. A federação estadual **não tem sistema próprio** de gestão de atletas/filiações.
2. Existe **calendário ativo de competições** na modalidade, no estado.
3. Há um **dirigente acessível** na federação, disposto a conversar e pilotar.
4. A base de atletas da modalidade no estado é de **ao menos alguns milhares** de praticantes.

### 7.3 Sequência de Entrada

1. Validar as hipóteses de modalidade (atletismo, judô, vôlei) com entrevistas diretas às federações estaduais antes do fim da Fase 1 (ver risco em Seção 9).
2. Escolher 1-2 estados e 2-3 modalidades que atendam aos 4 critérios acima.
3. Entrar pela federação (módulo de gestão gratuito/barato, Fase 2) — não pelo atleta isoladamente. A federação traz densidade de forma mais eficiente do que a aquisição atleta a atleta.
4. Usar a densidade e o dado oficial gerados nessas modalidades-piloto como prova de conceito para expandir a outras modalidades/estados na Fase 4.

---

## 8. Métricas e Gates

### 8.1 Por que a métrica primária muda

O PRD v2 usava "5K cadastros em 6 meses" como meta central. Essa métrica mede aquisição bruta, não o que sustenta o modelo de negócio: densidade real por contexto, confiabilidade do dado e conversão comercial. A partir deste PRD, cadastro bruto é **métrica secundária** — útil como sinal de saúde geral, mas não como meta.

### 8.2 Métricas Primárias (por fase)

| Métrica | O que mede | Onde se aplica |
|---|---|---|
| Densidade (atletas ativos por modalidade/UF) | Se a base é útil de verdade num contexto específico, não só grande no total | Todas as fases, com ênfase na Fase 1 |
| % de perfis com dado verificado (N1+/N2) | Se o produto está entregando o diferencial competitivo (Seção 6.2) | Fase 1 em diante |
| Ativação (perfil ≥70% completo em 7 dias) | Se o onboarding está gerando valor rápido para o atleta | Fase 1 em diante |
| Retenção M1 | Se o atleta volta ao produto depois do primeiro mês | Fase 1 em diante |
| Pipeline B2B (entidades em conversa / em piloto / pagantes) e MRR | Se o motor comercial está avançando | Fase 2 em diante |

### 8.3 Métrica Secundária

- Cadastros brutos (total de contas criadas) — acompanhada, mas nunca reportada como meta isolada.

### 8.4 Consolidado de Gates por Fase

| Fase | Objetivo central | Gate de saída |
|---|---|---|
| Fase 0 | Fundação e confiança | Zero críticos de segurança abertos **e** consentimento LGPD de menores no ar |
| Fase 1 | Portfólio verificável | X atletas ativos por modalidade-piloto (referência: 500/modalidade/estado) **e** ≥30% dos perfis com ao menos 1 item verificado (N1+) |
| Fase 2 | Federações e primeira receita | ≥2 entidades pagantes **e** ≥60% de densidade de atletas federados da modalidade-piloto no estado |
| Fase 3 | Scouting e rede | Não definido neste PRD — a estabelecer ao final da Fase 2 |
| Fase 4 | Escala | Não definido neste PRD — fase de expansão contínua |

---

## 9. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| A demanda fora do futebol (atletismo, judô, vôlei) é uma hipótese, não um fato validado | Apostar o roadmap de GTM (Fase 1-2) em uma modalidade sem demanda real de federação atrasaria a primeira receita | Realizar entrevistas diretas com dirigentes de federações estaduais nessas modalidades antes do encerramento da Fase 1, e usar os 4 critérios da Seção 7.2 como filtro objetivo antes de comprometer recursos |
| Dependência de um dirigente de federação específico (relacionamento pessoal, risco de turnover político) | Perder o piloto inteiro se o dirigente sair do cargo ou mudar de prioridade | Formalizar o relacionamento em contrato (mesmo que founder deal simbólico), e cultivar mais de um contato dentro de cada federação-piloto, não depender de uma única pessoa |
| Dados de menores de idade envolvem risco reputacional e legal elevado (imagem e dados de crianças/adolescentes) | Falha no fluxo de consentimento ou na intermediação de contato pode gerar exposição jurídica (LGPD art. 14) e dano à confiança do produto | Tratar o fluxo de consentimento, a visibilidade restrita por padrão e a intermediação de contato como requisitos de Fase 0/1, não como pendência a ser resolvida depois (Seção 6.3); auditoria periódica desse fluxo |
| Concorrentes de futebol (Footlink, CUJU, Footbao, Dreamstock) podem replicar a camada de verificação assim que virem tração fora do futebol | Perder o diferencial competitivo antes de consolidar a posição | Construir a relação com a federação (fonte do dado N2) como ativo defensável — é mais difícil de replicar rapidamente do que uma feature de produto |
| Founder deals da Fase 2 não se renovam em condições comerciais reais | A primeira receita seria simbólica e não sustentável, mascarando um problema real de disposição a pagar | Usar explicitamente o período de founder deal para testar as faixas de pricing da Seção 5.4 e coletar feedback estruturado antes de qualquer expansão comercial |
| Débito técnico da Fase 0 não é resolvido completamente antes do início do GTM comercial | Escalação de privilégio ou dado sem migration formal (Seção 6.4, Fase 0) pode comprometer a confiança que o produto vende como diferencial (D4) | Tratar o gate de saída da Fase 0 como bloqueante — nenhum esforço comercial (Fase 2) inicia antes de zero críticos abertos |

---

## 10. Reconciliação com Epics Existentes

O `epic-overview.md` original foi escrito sob o PRD v1 (visão institucional). A tabela abaixo reconcilia cada epic com o roadmap deste PRD v3.

| Epic (overview original) | Objetivo original (v1) | Status no PRD v3 |
|---|---|---|
| Epic 1 — Infraestrutura e Setup | Setup do monorepo, Supabase, Design System, schema, RLS, seed | Mantido como fundação técnica já entregue; os itens pendentes (RLS de escalação de privilégio, seed quebrado) são absorvidos pela **Fase 0** (FR-0.1, FR-0.6) |
| Epic 2 — Autenticação e Gestão de Usuários | Roles hierárquicos (Admin Nacional, Confederação, Federação, Clube, Técnico, Atleta), MFA, LGPD | Parcialmente absorvido: os roles hierárquicos amplos do v1 são substituídos pelo modelo de personas B2B deste PRD (Federação, Clube, Agente, Atleta — Seção 4); a cobertura de middleware e o fluxo LGPD/menores são absorvidos pela **Fase 0/1** (FR-0.5, FR-0.7 a FR-0.10, FR-1.8, FR-1.9). MFA não é requisito ativo neste PRD |
| Epic 3 — Cadastro de Entidades Core | CRUD de atletas, técnicos, entidades, vinculação, perfis paralímpicos, upload de mídia, busca avançada | Parcialmente absorvido: CRUD de atleta e self-service já entregues (Stories 11.1-11.4, base da **Fase 1**); vinculação atleta-entidade e CRUD de entidades absorvidos pelo módulo de federações/clubes da **Fase 2** (FR-2.1, FR-2.5); upload de mídia absorvido em FR-1.3; busca avançada absorvida na **Fase 3** (FR-3.1). Perfis paralímpicos **não priorizados** no roadmap ativo — não descartados, mas sem fase definida |
| Epic 4 — Competições e Resultados | CRUD de competições/resultados, códigos técnicos, timeline, import em lote | Parcialmente absorvido: CRUD self-service de competições/resultados já entregue (Story 11.1); import em lote (CSV/Excel) absorvido pelo módulo de federação na **Fase 2** (FR-2.2, FR-2.3), agora como caminho de geração de dado N2, não como feature isolada |
| Epic 5 — Dashboard de Scouting | Dashboards de KPIs, rankings, filtros, alertas | Absorvido na **Fase 3** (FR-3.2, FR-3.3) |
| Epic 6 — Mapa Nacional de Talentos | Mapa geoespacial com PostGIS/Mapbox, heatmap, drill-down | **Não priorizado** no roadmap ativo. Pode ser reavaliado como recurso de analytics em fase futura (pós-Fase 4), mas não está no plano atual |
| Epic 7 — Testes Físicos e Métricas de Performance | Testes padronizados, KPIs core, métricas por modalidade, métricas paralímpicas | Parcialmente absorvido: registro de avaliações/testes já faz parte do self-service (Story 11.1); KPIs avançados e comparativos entre atletas **não são prioridade atual** — candidato a reavaliação na Fase 3 |
| Epic 8 — Funil Esportivo Nacional | Visualização do funil Base→Estadual→Nacional→Elite, taxas de conversão, dashboard executivo COB/CPB | **Aposentado do escopo ativo** — era uma métrica de visão institucional (v1), incompatível com o foco comercial B2B deste PRD. O COB/CPB não é persona ativa (Seção 4.6) |
| Epic 9 — Analytics com IA | Modelos preditivos, detecção automática de talentos, alertas de evasão | **Adiado**, fora do roadmap ativo (Fases 0-4). Pode ser reavaliado em fase futura além da Fase 4 |
| Epic 10 — Mobile e Integrações | App mobile, APIs de integração com federações, notificações push | Absorvido: app mobile na **Fase 4** (FR-4.3); integração com federações antecipada e reformulada como o próprio **módulo de gestão de federação** da Fase 2 (FR-2.1 a FR-2.3), não como API externa de terceiros |

### 10.1 Stories 11.1–11.5 como Base da Fase 1

As stories 11.1 a 11.5 (todas com status `Done`) formam a base técnica sobre a qual a Fase 1 deste PRD é construída:

- **Story 11.1** (self-service CRUD de competições/resultados/avaliações) — entregue, mantida.
- **Story 11.2** (perfil público compartilhável) — entregue, mas com uma pendência explícita: o QR code real (AC10) foi substituído por link de compartilhamento na entrega; vira requisito explícito FR-1.2 neste PRD.
- **Story 11.3** (completude de perfil com significado) — entregue, mantida.
- **Story 11.4** (conquistas e títulos, tabela `achievements`) — entregue funcionalmente, mas **sem migration formal registrada** — vira requisito explícito FR-0.2 (Fase 0) para fechar essa lacuna antes de qualquer expansão de schema relacionada.
- **Story 11.5** (landing page B2C) — entregue, mas com messaging alinhado ao v2 ("seja descoberto"); precisa de ajuste de mensagem para refletir o novo posicionamento (D1, FR-1.1) e a nova ordem de GTM para entidades (a seção "Para clubes e federações" da landing deve evoluir para refletir a prioridade de federações primeiro, não clubes).

Nenhuma dessas stories precisa ser refeita do zero — a Fase 1 deste PRD estende o que já existe.

---

*PRD — Brasil Atleta v3.0.0*
*Consolida e substitui `prd.md` (v1.0.0) e `prd-v2-fase1.md` (v2.0.0). Decisões estratégicas fechadas em 2026-07-05.*
