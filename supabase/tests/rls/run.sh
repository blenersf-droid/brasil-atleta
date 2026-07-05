#!/usr/bin/env bash
# =============================================================================
# Brasil Atleta — RLS Test Harness Runner
# =============================================================================
# Spins up a disposable postgis/postgis:16-3.4 container, applies the auth
# stub, every migration in supabase/migrations/ (by glob, in order — so a
# future 00007+ is picked up automatically with no changes here), seed.sql,
# fixtures.sql, and every assertion file in this directory, then prints a
# PASS/FAIL summary and exits non-zero if anything failed.
#
# Usage:
#   bash supabase/tests/rls/run.sh          (from anywhere; path is resolved
#                                             relative to this script, not cwd)
#   npm run test:rls                        (from packages/web)
#
# Requires: Docker Desktop running. Container is ALWAYS removed on exit
# (success, failure, or Ctrl-C) via the trap below.
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
MIGRATIONS_DIR="$REPO_ROOT/supabase/migrations"
SEED_FILE="$REPO_ROOT/supabase/seed.sql"

IMAGE="postgis/postgis:16-3.4"
CONTAINER_NAME="ba_rls_test_$$"
READY_TIMEOUT_SECS=60

# Expected total assertion count across every 0x_*.sql file below — a mismatch
# means a file errored out before recording all of its assertions (only
# possible if ON_ERROR_STOP kicked in on a setup file, or a genuine bug in an
# assertion file's SQL), which is itself a failure condition even if every
# assertion that DID record came back PASS.
EXPECTED_TOTAL=69

RED=$'\033[0;31m'
GREEN=$'\033[0;32m'
YELLOW=$'\033[0;33m'
NC=$'\033[0m'

cleanup() {
    local exit_code=$?
    echo ""
    echo "Removendo container ${CONTAINER_NAME}..."
    docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
    exit $exit_code
}
trap cleanup EXIT

echo "=== Brasil Atleta — RLS Test Harness ==="
echo "Imagem: $IMAGE"
echo "Container: $CONTAINER_NAME"
echo ""

echo "--- Subindo container Postgres/PostGIS descartavel ---"
docker run -d --name "$CONTAINER_NAME" -e POSTGRES_PASSWORD=postgres "$IMAGE" >/dev/null

echo "--- Aguardando Postgres ficar pronto ---"
# The postgis/postgis image runs a *two-phase* startup: a temporary server
# accepts connections while /docker-entrypoint-initdb.d/*.sh (which loads the
# postgis extension into the default `postgres` database) runs, then that
# temp server shuts down and the real, long-running server starts. A plain
# `pg_isready` check can succeed during the FIRST phase, racing our own
# `CREATE EXTENSION IF NOT EXISTS "postgis"` (00001 migration) against the
# image's own extension setup and intermittently failing with "duplicate key
# value violates unique constraint pg_extension_name_index". Waiting for the
# "ready to accept connections" log line to appear a SECOND time (the real
# server) avoids that race entirely.
ready=0
for i in $(seq 1 "$READY_TIMEOUT_SECS"); do
    ready_count=$(docker logs "$CONTAINER_NAME" 2>&1 | grep -c "database system is ready to accept connections" || true)
    if [ "$ready_count" -ge 2 ]; then
        ready=1
        break
    fi
    sleep 1
done
if [ "$ready" -ne 1 ]; then
    echo "${RED}Postgres nao ficou pronto apos ${READY_TIMEOUT_SECS}s.${NC}"
    docker logs "$CONTAINER_NAME" 2>&1 | tail -40
    exit 1
fi
echo "Postgres pronto."
echo ""

# run_setup_file: aborta o script inteiro (set -e) se der erro — usado para
# tudo que precisa ter sucesso incondicional (stub, migrations, seed, fixtures).
run_setup_file() {
    local file="$1"
    local label="$2"
    echo "--- ${label} ---"
    docker exec -i "$CONTAINER_NAME" psql -U postgres -v ON_ERROR_STOP=1 -q < "$file"
}

# run_assertion_file: NAO usa ON_ERROR_STOP — cada DO block ja captura seus
# proprios erros esperados internamente (ver README.md); isso garante que um
# eventual bug isolado em um bloco nao interrompa a coleta dos demais.
run_assertion_file() {
    local file="$1"
    local label="$2"
    echo "--- ${label} ---"
    docker exec -i "$CONTAINER_NAME" psql -U postgres -q < "$file" 2>&1
}

run_setup_file "$SCRIPT_DIR/00_auth_stub.sql" "00_auth_stub.sql (schema auth + roles + helpers _test)"

echo "--- Aplicando migrations (supabase/migrations/*.sql, em ordem) ---"
shopt -s nullglob
migration_files=("$MIGRATIONS_DIR"/*.sql)
shopt -u nullglob
if [ ${#migration_files[@]} -eq 0 ]; then
    echo "${RED}Nenhuma migration encontrada em ${MIGRATIONS_DIR}${NC}"
    exit 1
fi
for f in "${migration_files[@]}"; do
    echo "  -> $(basename "$f")"
    docker exec -i "$CONTAINER_NAME" psql -U postgres -v ON_ERROR_STOP=1 -q < "$f"
done
echo ""

run_setup_file "$SEED_FILE" "seed.sql"
run_setup_file "$SCRIPT_DIR/fixtures.sql" "fixtures.sql"
echo ""

echo "=== Executando asserções RLS ==="
assertion_files=("$SCRIPT_DIR"/0[1-9]_*.sql)
for f in "${assertion_files[@]}"; do
    run_assertion_file "$f" "$(basename "$f")"
    echo ""
done

echo "=== Resumo ==="
docker exec -i "$CONTAINER_NAME" psql -U postgres -At -F ' | ' -c \
    "SELECT CASE WHEN passed THEN 'PASS' ELSE 'FAIL' END, name, COALESCE(detail, '') FROM _test.results ORDER BY id;"
echo ""

TOTAL=$(docker exec -i "$CONTAINER_NAME" psql -U postgres -At -c "SELECT count(*) FROM _test.results;")
FAILS=$(docker exec -i "$CONTAINER_NAME" psql -U postgres -At -c "SELECT count(*) FROM _test.results WHERE NOT passed;")

echo "Total de asserções: ${TOTAL} (esperado ${EXPECTED_TOTAL})"
echo "Falhas: ${FAILS}"
echo ""

if [ "$FAILS" -ne 0 ]; then
    echo "${RED}RESULTADO: FAIL (${FAILS} asserção(ões) falharam)${NC}"
    exit 1
fi

if [ "$TOTAL" -ne "$EXPECTED_TOTAL" ]; then
    echo "${YELLOW}RESULTADO: FAIL (esperado ${EXPECTED_TOTAL} asserções, mas apenas ${TOTAL} foram registradas — algum arquivo pode ter abortado antes do fim)${NC}"
    exit 1
fi

echo "${GREEN}RESULTADO: PASS (todas as ${TOTAL} asserções passaram)${NC}"
exit 0
