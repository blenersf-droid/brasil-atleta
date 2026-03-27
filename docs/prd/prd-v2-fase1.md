# Brasil Atleta — PRD v2.0 (Fase 1: Portfolio Esportivo)

**Version:** 2.0.0
**Date:** 2026-03-27
**Status:** Active
**Pivot:** De plataforma institucional para produto comercial B2C/B2B

---

## 1. Modelo de Negocio

### Freemium B2C/B2B
- **Atletas:** GRATUITO — cadastram e gerenciam TODOS os seus dados
- **Entidades (clubes, federacoes, scouts):** PAGO (Fase 3) — acesso a busca de talentos e analytics

### Fase 1 — Portfolio Esportivo (ATUAL)
Foco: transformar o perfil do atleta no produto hero. Single-player value.

### Modalidades Foco Inicial
1. Futebol (FUT)
2. Atletismo (ATL)
3. Natacao (NAT)
4. Judo (JUD)
5. Jiu-Jitsu (JJB) — NOVA modalidade a adicionar

> Todas as outras modalidades PERMANECEM na plataforma. O foco e apenas estrategia de go-to-market.

---

## 2. Mudancas Chave do Pivot

### Athlete Self-Service
O atleta agora pode:
- Cadastrar SUAS competicoes e resultados
- Registrar SEUS testes fisicos e capacidade fisica
- Adicionar conquistas e titulos
- Fazer upload de fotos e videos
- Gerenciar todo o seu perfil esportivo

### Perfil como Portfolio
O perfil do atleta deve ser:
- Compartilhavel via link publico (sem login necessario para ver)
- QR code geravel para levar a competicoes
- Visual premium — como um portfolio profissional
- Embed para redes sociais (Open Graph meta tags)

### UX Prioridades
1. Facil como Instagram — nao pode parecer um CRM
2. Onboarding guiado com significado ("seja descoberto")
3. Completude do perfil como motivacao (barra de progresso + dicas)
4. Sugestoes inteligentes ("Adicione seus resultados recentes")
5. Mobile-first thinking (mesmo no web)

---

## 3. Novas Features (Fase 1)

### NF-01: Perfil Publico do Atleta
- URL publica: /atleta/{slug} (nome-sobrenome ou username)
- Visivel sem login
- Foto, nome, modalidade, nivel, stats resumidos
- Historico competitivo, conquistas, testes
- Open Graph tags para compartilhamento em redes sociais
- Botao "Compartilhar perfil" + QR code

### NF-02: Athlete Self-Service CRUD
- Atleta adiciona SUAS competicoes (nome, data, local, grau, modalidade)
- Atleta adiciona SEUS resultados (posicao, marca, categoria)
- Atleta adiciona SEUS testes fisicos (protocolo, metricas)
- Atleta adiciona SUAS conquistas (titulo, competicao, data, certificado/foto)
- Interface amigavel — formularios simplificados, nao formularios de CRM

### NF-03: Completude de Perfil com Significado
- Barra de progresso visual mostrando % do perfil completo
- Dicas contextuais: "Adicione sua foto para aumentar visibilidade em 3x"
- Checklist de perfil: foto, bio, modalidade, ao menos 1 competicao, ao menos 1 resultado
- Nao e gamificacao vazia — cada dica conecta ao proposito de ser descoberto

### NF-04: Conquistas e Titulos
- Nova secao no perfil: "Conquistas"
- Atleta adiciona: titulo da conquista, competicao, data, foto/certificado
- Exibidas com badges visuais (ouro, prata, bronze, participacao)
- Timeline de conquistas no perfil publico

### NF-05: Onboarding Redesenhado
- Foco no atleta (nao em gestores)
- Messaging: "Crie seu portfolio esportivo" / "Seja descoberto por scouts e clubes"
- Tutorial guiado: passo a passo mostrando o que preencher e por que
- Ao final: preview do perfil publico mostrando como ficou

### NF-06: Landing Page B2C
- Reposicionar para o atleta como publico principal
- Hero: "Seu portfolio esportivo. Seja descoberto."
- Mostrar exemplos de perfis (mock)
- CTA: "Crie seu perfil gratis"
- Secao para entidades: "Para clubes e federacoes" (teaser da Fase 2)

---

## 4. Ajustes Tecnicos

### RLS — Atleta pode escrever
- athletes: atleta pode UPDATE seu proprio perfil
- competitions: atleta pode INSERT competicoes
- results: atleta pode INSERT seus resultados
- assessments: atleta pode INSERT suas avaliacoes
- Nova tabela: achievements (conquistas)

### Nova Modalidade
- Adicionar JJB (Jiu-Jitsu Brasileiro) ao seed de modalidades

### Perfil Publico
- Rota publica: /atleta/[slug] — sem auth required
- Gerar slug unico no cadastro (full_name slugified + ID curto)
- Open Graph meta tags dinamicas

---

## 5. Metricas de Sucesso (Fase 1)

- 5K atletas cadastrados em 6 meses
- 60%+ de perfis com pelo menos 1 competicao registrada
- 40%+ de perfis compartilhados via link/QR pelo menos 1x
- NPS > 40 entre atletas
- Foco nas 5 modalidades: FUT, ATL, NAT, JUD, JJB

---

*PRD v2.0 — Brasil Atleta (Fase 1: Portfolio Esportivo)*
*Validado pelo Advisory Board em 2026-03-27*
