#!/bin/sh
# Compose-based daily pg_dump for the gymapp database only.
# Reads DATABASE_URL from the environment; never hard-codes credentials.
# Non-destructive: on failure the partial dump is removed and retention is skipped.

set -u

BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${BACKUP_DAYS:-7}"
TIMESTAMP="$(date -u +%Y%m%d-%H%M%S)"
FILE="$BACKUP_DIR/gymapp-$TIMESTAMP.dump"
LOG="$BACKUP_DIR/backup.log"
STATUS_FILE="$BACKUP_DIR/last_status"

log() {
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $1" | tee -a "$LOG"
}

if [ "${BACKUP_DRY_RUN:-}" = "true" ]; then
  log "DRY-RUN: would pg_dump to $FILE and prune backups older than $RETENTION_DAYS days"
  echo 0 > "$STATUS_FILE"
  exit 0
fi

if [ -z "$DATABASE_URL" ]; then
  log "ERROR: DATABASE_URL is not set"
  echo 1 > "$STATUS_FILE"
  exit 1
fi

pg_dump -Fc -f "$FILE" "$DATABASE_URL" >>"$LOG" 2>&1
RC=$?

echo "$RC" > "$STATUS_FILE"

if [ "$RC" -eq 0 ]; then
  find "$BACKUP_DIR" -maxdepth 1 -name 'gymapp-*.dump' -type f -mtime +"$RETENTION_DAYS" -delete
  log "OK: $FILE"
else
  rm -f "$FILE"
  log "FAILED: pg_dump exited with $RC"
fi

exit "$RC"
