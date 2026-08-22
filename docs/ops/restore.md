# GymApp backup and restore runbook

## Scope

The `backup` service dumps only the **gymapp** database via the host-supplied `DATABASE_URL`. It never touches `chatai`, `krill` or other databases.

## How it works

- Container: `postgres:16-alpine` running `scripts/backup.sh` in a 24-hour loop.
- Output: `/backups/gymapp-<timestamp>.dump` on the host (`/data/devaai/gymapp/backups` on `nodo-a`).
- Retention: 7 days (`BACKUP_DAYS`), pruning only after a successful dump.
- Status: `/backups/last_status` holds the last exit code; `/backups/backup.log` has human-readable output.
- Secrets: only env variables / `.env`; none committed.

## Setup on nodo-a

```bash
sudo mkdir -p /data/devaai/gymapp/backups
sudo chown -R "$(whoami):$(whoami)" /data/devaai/gymapp/backups
export DATABASE_URL="postgresql://gymapp:SECRET@postgres:5432/gymapp"
export BACKUP_DIR="/data/devaai/gymapp/backups"
export BACKUP_DAYS="7"
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec backup /backup.sh
```

## Monitoring

A non-zero `last_status` or the absence of a fresh `gymapp-*.dump` in the last 25 hours signals failure. Example watchdog:

```bash
#!/bin/sh
DIR="/data/devaai/gymapp/backups"
NEWEST=$(find "$DIR" -maxdepth 1 -name 'gymapp-*.dump' -type f -mmin -1500 -print -quit)
if [ ! -f "$DIR/last_status" ] || [ "$(cat "$DIR/last_status")" != "0" ] || [ -z "$NEWEST" ]; then
  echo "GymApp backup missing or failed" | mail -s "backup alert" ops@example.com
fi
```

Configure the alert channel on `nodo-a` with your existing infrastructure tooling.

## Restore smoke test (non-destructive)

Creates a temporary `gymapp_restore_test` database, restores the latest dump, checks the exercise count, then drops it.

```bash
LATEST=$(ls -t /data/devaai/gymapp/backups/gymapp-*.dump | head -n 1)
export PGPASSWORD=SECRET
dropdb --if-exists -h postgres -U gymapp gymapp_restore_test
createdb -h postgres -U gymapp gymapp_restore_test
pg_restore -h postgres -U gymapp -d gymapp_restore_test "$LATEST"
psql -h postgres -U gymapp -d gymapp_restore_test -c 'SELECT count(*) FROM exercises'
dropdb -h postgres -U gymapp gymapp_restore_test
```

Expected exercise count: `1324`.

## Full restore (destructive)

Use only when the live `gymapp` database is lost.

```bash
docker compose -f docker-compose.prod.yml stop api
LATEST=$(ls -t /data/devaai/gymapp/backups/gymapp-*.dump | head -n 1)
pg_restore --clean --if-exists -d "$DATABASE_URL" "$LATEST"
docker compose -f docker-compose.prod.yml up -d api
```
