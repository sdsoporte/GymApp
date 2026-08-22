# GymApp nodo-a deploy runbook

## PR 1a baseline

Target host: `nodo-a` (production VPS).
Repository: `https://github.com/sdsoporte/GymApp.git`
Domain: `https://api-gymapp.elautomata.com`

## Preconditions

- Docker + Docker Compose plugin installed on nodo-a.
- Traefik network `proxy-net` and internal service network `devaai_services-prod` exist.
- `DATABASE_URL` is exported in the host environment and references the production Postgres.
- `METRICS_ENABLED=true` is exported if Prometheus should scrape `/metrics`.

## Deploy steps

1. Pull code and install dependencies:

   ```bash
   cd /data/devaai/gymapp/app
   git pull origin main
   pnpm install --frozen-lockfile
   ```

2. Validate TypeScript:

   ```bash
   pnpm -F @gymapp/api exec tsc --noEmit -p tsconfig.json
   pnpm -F @gymapp/db exec tsc --noEmit -p tsconfig.json
   pnpm -F @gymapp/shared exec tsc --noEmit -p tsconfig.json
   pnpm -F @gymapp/web exec tsc --noEmit -p tsconfig.json
   ```

3. Prepare the exercise dataset:

   See [dataset-runbook.md](./dataset-runbook.md) for details. On nodo-a the
   dataset should already be mirrored at `/data/devaai/gymapp/mirror/`:

   ```bash
   export MIRROR_URL="https://mirror.nodo-a.example/exercises-7455efae41b330c265e7cd4b78dfa848e7ce5ebd.tar.gz"
   ./scripts/download-exercises.sh /data/devaai/gymapp/app/assets/exercises
   ```

4. Apply database migrations:

   ```bash
   DATABASE_URL="$DATABASE_URL" pnpm -F @gymapp/db migrate
   ```

5. Seed the exercise catalog:

   ```bash
   DATABASE_URL="$DATABASE_URL" pnpm -F @gymapp/db seed
   ```

6. Prepare the backups directory:

   ```bash
   sudo mkdir -p /data/devaai/gymapp/backups
   sudo chown -R "$(whoami):$(whoami)" /data/devaai/gymapp/backups
   export BACKUP_DIR="/data/devaai/gymapp/backups"
   export BACKUP_DAYS="7"
   ```

7. Validate compose configuration:

   ```bash
   docker compose -f docker-compose.prod.yml config -q
   ```

8. Build and start services:

   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

9. Trigger a first backup to verify database connectivity:

   ```bash
   docker compose -f docker-compose.prod.yml exec backup /backup.sh
   ls -l /data/devaai/gymapp/backups/gymapp-*.dump
   ```

## Smoke tests

```bash
# Public health endpoints must return 200
curl -sf https://api-gymapp.elautomata.com/health
curl -sf https://api-gymapp.elautomata.com/health/db

# /metrics must NOT be reachable on the public port
curl -sf https://api-gymapp.elautomata.com/metrics || test $? -eq 22

# Sample exercise media must be served by the assets container
curl -sfI https://assets-gymapp.elautomata.com/exercises/videos/0001-2gPfomN.gif

# Backup smoke tests
ls -l /data/devaai/gymapp/backups/gymapp-*.dump
cat /data/devaai/gymapp/backups/last_status   # Expected: 0

# Exercise count in production must match the dataset
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql "$DATABASE_URL" -c 'select count(*) from exercises'
# Expected: 1324

# Internal Prometheus target must be up (scraped over docker network)
# Verify in Prometheus UI that job `gymapp` target `api:3001/metrics` is UP.
```

## Rollback

If smoke tests fail:

```bash
docker compose -f docker-compose.prod.yml down
git reset --hard <previous-merge-sha>
docker compose -f docker-compose.prod.yml up -d --build
```

## Notes

- The API exposes two listeners:
  - Public app on `PORT=3000` (routed by Traefik).
  - Internal metrics on `METRICS_PORT=3001` (not routed by Traefik; Prometheus scrapes it on the `devaai_services-prod` network).
- `/metrics` returns 404 unless `METRICS_ENABLED=true`.
- Migrations are applied with `drizzle-kit migrate` using the production `DATABASE_URL`.
