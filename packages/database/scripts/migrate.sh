#!/usr/bin/env bash
# One-command migration runner for packages/database.
#
# Applies every *.sql file in packages/database/supabase/migrations, in
# filename order, against the Supabase project configured by environment
# variables. Every migration in this package uses
# `create table/index/function if not exists` and `create or replace
# function`, so re-running an already-applied migration is a no-op, not an
# error — safe to re-run.
#
# Requires ONE of:
#   - the Supabase CLI, initialized (`supabase init`, which generates
#     supabase/config.toml) and linked to a project
#     (`supabase link --project-ref <ref>`) -> runs `supabase db push`
#   - DATABASE_URL: a direct Postgres connection string to the Supabase
#     project (Supabase dashboard > Project Settings > Database > Connection
#     string) -> runs each migration through `psql`
#
# This script never provisions accounts or infrastructure, and never talks to
# anything other than the connection you explicitly give it. Per
# .claude/rules/security.md and .claude/rules/backend.md, do not point this
# at a production project without Gaurav's explicit approval for the change
# being applied.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRATIONS_DIR="$ROOT/supabase/migrations"

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "No migrations directory found at $MIGRATIONS_DIR" >&2
  exit 1
fi

if command -v supabase >/dev/null 2>&1 && [ -f "$ROOT/supabase/config.toml" ]; then
  echo "Supabase CLI + supabase/config.toml found. Running: supabase db push"
  (cd "$ROOT" && supabase db push)
  exit 0
fi

if [ -n "${DATABASE_URL:-}" ]; then
  if ! command -v psql >/dev/null 2>&1; then
    echo "DATABASE_URL is set but psql is not installed. Install the Postgres client (e.g. 'brew install libpq'), or install the Supabase CLI instead." >&2
    exit 1
  fi
  echo "Using psql against DATABASE_URL..."
  for f in "$MIGRATIONS_DIR"/*.sql; do
    echo "Applying $(basename "$f")..."
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
  done
  echo "All migrations applied."
  exit 0
fi

cat >&2 <<'EOF'
No way to apply migrations found. Provide one of:

  1. The Supabase CLI, initialized and linked to a project:
       supabase login
       supabase init            # inside packages/database (generates supabase/config.toml)
       supabase link --project-ref <your-project-ref>
     then re-run this script (or run `supabase db push` directly).

  2. A DATABASE_URL environment variable pointing at the target Postgres
     instance (Supabase dashboard > Project Settings > Database > Connection
     string, "URI" format), then re-run this script.

See docs/30-engineering/DEVELOPER_COMMANDS.md for where to obtain a Supabase
project and these credentials.
EOF
exit 1
