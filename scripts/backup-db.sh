#!/usr/bin/env bash
# Logical backup of the Biashara Yangu database (data + schema).
#
# Usage:
#   SUPABASE_DB_URL='postgresql://postgres:<password>@db.<project>.supabase.co:5432/postgres' \
#     ./scripts/backup-db.sh [output-dir]
#
# Get the connection string in Supabase: Project Settings > Database > Connection string (URI).
# Requires the PostgreSQL client tools (pg_dump). Output is a compressed custom-format dump
# that `pg_restore` can restore (see docs/BACKUP_AND_RECOVERY.md).
# The dump contains customer data: store it encrypted and never commit it.
set -euo pipefail

: "${SUPABASE_DB_URL:?Set SUPABASE_DB_URL to the database connection string}"
OUT_DIR="${1:-./backups}"
mkdir -p "$OUT_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILE="$OUT_DIR/biashara-yangu-$STAMP.dump"

pg_dump "$SUPABASE_DB_URL" \
  --format=custom --compress=9 \
  --no-owner --no-privileges \
  --schema=public --schema=private \
  --file="$FILE"

# Quick integrity check: the dump must be readable and list its tables
pg_restore --list "$FILE" > /dev/null
echo "Backup written and verified: $FILE ($(du -h "$FILE" | cut -f1))"
