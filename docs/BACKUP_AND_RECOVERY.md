# Backup & recovery

Customer data lives in one place: the Supabase Postgres database. Code is in GitHub.
**A backup you have never restored is not a backup.** Do the restore test below at least once a quarter.

## 1. Backups (do all three)

| Layer | What | How | Owner action |
|---|---|---|---|
| Platform backups | Daily automatic backups by Supabase (retention depends on plan). Point-in-time recovery is a paid add-on. | Supabase Dashboard → Database → Backups | Confirm your plan's retention; turn on **PITR** once real customers depend on the data. |
| Your own logical dump | Independent copy you control | `scripts/backup-db.sh` (weekly, or daily once you have paying customers) | Run it from a trusted machine or a scheduled job; store dumps **encrypted** off-site (e.g. an encrypted cloud bucket). Never commit them. |
| Code & schema | Source, migrations, edge functions | GitHub (`supabase/migrations/`) | Keep the repo private; protect `main`. |

Secrets (service role key, `SNIPPE_API_KEY`, `LOVABLE_API_KEY`) are not in the database or repo. Keep them in a password manager so the project can be re-created.

## 2. Restore test (quarterly)

1. Create a **scratch** Postgres (local Postgres or a free throwaway Supabase project). Never use production.
2. `SUPABASE_DB_URL=... ./scripts/backup-db.sh`
3. `TEST_DB_URL=postgresql://.../restore_test ./scripts/verify-restore.sh backups/<file>.dump`
4. Compare the printed row counts with production (`select count(*) ...`). Note the date and result in the log below.

## 3. Disaster scenarios

| Scenario | Recovery |
|---|---|
| Someone deleted rows by mistake | Supabase PITR (if enabled) to just before the mistake, or restore the latest dump into a scratch DB and copy the rows back. The `audit_log` table shows what was deleted and when (`old_data` holds the deleted row). |
| Database corrupted / project lost | Create a new Supabase project, apply `supabase/migrations/` in order, `pg_restore` the latest dump (data only: `--data-only --disable-triggers`), redeploy edge functions, set secrets, update `VITE_SUPABASE_URL` / key, redeploy web and rebuild mobile apps. |
| Bad deploy | Roll back in Vercel (Deployments → promote previous). Database changes are forward-only: write a corrective migration. |

Targets to aim for: **RPO** (data you can lose) 24 hours; **RTO** (time to be back) 4 hours.

## 4. Restore-test log

| Date | Dump used | Result | By |
|---|---|---|---|
| _not yet run_ | | | |
