# RLS Test Harness — Brasil Atleta

Suite reprodutível de testes de Row Level Security (RLS) contra um Postgres/PostGIS
descartável (Docker), sem depender de nenhum projeto Supabase remoto.

## Pré-requisitos

- Docker Desktop instalado e **rodando**.
- Bash (o script foi escrito para Git Bash no Windows, mas roda em qualquer bash POSIX).

## Como rodar

Da raiz do repo (ou de qualquer diretório — o caminho é resolvido a partir do
próprio script, não do `cwd`):

```bash
bash supabase/tests/rls/run.sh
```

Ou, a partir de `packages/web`:

```bash
npm run test:rls
```

O script:

1. Sobe um container `postgis/postgis:16-3.4` novo (nome único por execução).
2. Aplica `00_auth_stub.sql` (schema `auth` mínimo + roles `anon`/`authenticated`/
   `service_role` + helpers `_test.*`).
3. Aplica **todas** as migrations em `supabase/migrations/*.sql`, em ordem, via
   glob — qualquer migration nova (`00007`, `00008`, ...) entra automaticamente,
   sem precisar tocar neste harness.
4. Aplica `supabase/seed.sql`.
5. Aplica `fixtures.sql` (dataset mínimo compartilhado — 2 auth users, 2 athletes,
   1 competition, 1 achievement).
6. Executa cada arquivo `0[1-9]_*.sql` (as asserções, uma por tema), imprimindo
   `PASS`/`FAIL` de cada uma em tempo real.
7. Imprime um resumo final e sai com código ≠ 0 se qualquer asserção falhou.
8. **Sempre** remove o container ao final (sucesso, falha ou Ctrl-C), via `trap`.

Cerca de 40s numa máquina comum (a maior parte é o pull/start do container na
primeira vez; execuções seguintes são mais rápidas pois a imagem já está em cache).

## Estrutura

| Arquivo | Papel |
|---|---|
| `00_auth_stub.sql` | Schema `auth` (users/uid()/jwt()), roles Postgres, schema `_test` (helpers de asserção) |
| `fixtures.sql` | Dataset mínimo compartilhado por todos os temas |
| `01_roles_escalation.sql` | Tema (a): trigger de role em signup, anti-escalação em `user_roles` |
| `02_recursion_self_service.sql` | Tema (b): regressão de recursão infinita (00005) em `achievements`/`media` |
| `03_self_service_writes.sql` | Tema (c): self-service (00006) em `results`/`assessments`/`competitions` |
| `04_slug_generation.sql` | Tema (d): geração/colisão/preservação de `athletes.slug` |
| `05_public_read.sql` | Tema (e): leitura pública (anon) vs. escrita bloqueada |
| `06_lgpd_minors.sql` | Tema (f): LGPD e proteção de menores (00007) — `profile_visibility`, `guardian_consents`, leitura pública gated e `abuse_reports` |
| `run.sh` | Orquestrador (Docker + ordem de aplicação + relatório) |

## Como o PASS/FAIL funciona

Cada asserção é um bloco `DO $$ ... $$` que chama `_test.record(nome, condição,
detalhe)` (definido em `00_auth_stub.sql`). Essa função grava o resultado em
`_test.results` e já emite `RAISE NOTICE`/`RAISE WARNING` com o prefixo
`PASS:`/`FAIL:`, visível ao vivo na saída do `docker exec`. Ao final, `run.sh`
consulta `_test.results` para o resumo e o código de saída.

**Semântica importante ao escrever uma nova asserção** — RLS trata INSERT
diferente de UPDATE/DELETE quando nenhuma policy aplicável existe (ou a
`WITH CHECK`/`USING` reprova a linha):

- **INSERT**: se a linha reprova o `WITH CHECK` (ou não há policy de INSERT
  aplicável), Postgres **sempre lança um erro** — não há "linha" pré-existente
  para simplesmente filtrar. Use `BEGIN ... EXCEPTION WHEN OTHERS THEN ...`
  para capturar e registrar isso como sucesso esperado.
- **UPDATE/DELETE**: se a `USING` filtra a linha-alvo (por falta de policy ou
  por ela pertencer a outro usuário), o comando **não lança erro** — apenas
  afeta 0 linhas, silenciosamente. Use `GET DIAGNOSTICS v_count = ROW_COUNT;`
  e afirme `v_count = 0`, não uma exceção.

Todo `SET ROLE`/`_test.set_jwt(...)` deve ser feito **fora** do bloco
`BEGIN ... EXCEPTION` interno (antes dele), e `RESET ROLE` deve rodar depois —
caso contrário, o rollback-to-savepoint do `EXCEPTION` desfaz também a troca de
role/JWT (ver comentários em `00_auth_stub.sql`/`01_roles_escalation.sql`).

## Como adicionar uma nova asserção

1. Escolha o arquivo temático existente (ou crie um novo `0N_tema.sql` — o glob
   `0[1-9]_*.sql` do `run.sh` pega qualquer arquivo nesse padrão automaticamente).
2. Se precisar de dados novos que **outros** arquivos não devem herdar/mutar, crie
   seus próprios ids dentro do próprio arquivo (não reaproveite os ids de
   `fixtures.sql`, a menos que a intenção seja realmente compartilhar estado).
3. Escreva um bloco `DO $$ ... END $$;` terminando em exatamente uma chamada a
   `_test.record('descrição do teste', condição_booleana, 'detalhe opcional')`.
4. Depois de adicionar/remover asserções, atualize `EXPECTED_TOTAL` em `run.sh`
   (contagem total de chamadas a `_test.record` em todos os arquivos `0[1-9]_*.sql`)
   — é uma checagem de sanidade para detectar arquivos que abortaram no meio.
5. Rode `bash supabase/tests/rls/run.sh` e confirme `PASS` antes de considerar
   pronto.

## Nota sobre o `postgis/postgis` container e a corrida de inicialização

A imagem `postgis/postgis` faz um startup em duas fases: um servidor temporário
sobe primeiro para rodar os scripts de `/docker-entrypoint-initdb.d/` (que
carregam a extensão PostGIS no banco `postgres`), depois esse servidor
temporário derruba e o servidor real (de longa duração) sobe. Um `pg_isready`
simples pode responder com sucesso **durante a primeira fase**, antes desses
scripts terminarem — o que causa uma corrida real com o
`CREATE EXTENSION IF NOT EXISTS "postgis"` da migration 00001 (erro
intermitente `duplicate key value violates unique constraint
"pg_extension_name_index"`). Por isso `run.sh` espera a linha de log
`database system is ready to accept connections` aparecer **duas vezes** (uma
por fase) antes de prosseguir, em vez de usar só `pg_isready`.
