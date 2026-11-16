#!/usr/bin/env bash
# Restore test: loads a backup into a THROWAWAY database and checks that key tables have data.
# Never point this at production.
#
# Usage:
#   TEST_DB_URL='postgresql://postgres:postgres@localhost:5432/restore_test' \
#     ./scripts/verify-restore.sh backups/biashara-yangu-<stamp>.dump
set -euo pipefail

: "${TEST_DB_URL:?Set TEST_DB_URL to an empty scratch database (NOT production)}"
DUMP="${1:?Pass the path to a .dump file}"

case "$TEST_DB_URL" in
  *supabase.co*) echo "Refusing: TEST_DB_URL looks like a Supabase project. Use a scratch database."; exit 1;;
esac

# Supabase-specific schemas/roles referenced by the dump
psql "$TEST_DB_URL" -v ON_ERROR_STOP=0 -q <<'SQL'
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (id uuid PRIMARY KEY);
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT NULL::uuid $$;
DO $$ BEGIN CREATE ROLE authenticated NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE anon NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE service_role NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
SQL

pg_restore --no-owner --no-privileges --exit-on-error --dbname="$TEST_DB_URL" "$DUMP" || {
  echo "pg_restore reported problems (see above). Fix before relying on this backup."; exit 1; }

echo "Row counts after restore:"
for t in shops products sales sale_items purchases expenses quotations subscriptions audit_log; do
  printf '  %-14s %s\n' "$t" "$(psql "$TEST_DB_URL" -Atc "select count(*) from public.$t" 2>/dev/null || echo 'missing')"
done
echo "Restore test finished. Compare these counts with production before trusting the backup."
