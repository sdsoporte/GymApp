# GymApp nodo-a deploy runbook

## PR 1a baseline

Target host: `nodo-a` (production VPS).
Repository: `https://github.com/sdsoporte/GymApp.git`
Domain: `https://api.gymapp.elautomata.com`

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

3. Apply database migrations:

   ```bash
   DATABASE_URL="$DATABASE_URL" pnpm -F @gymapp/db migrate
   ```

4. Validate compose configuration:

   ```bash
   docker compose -f docker-compose.prod.yml config -q
   ```

5. Build and start services:

   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

## Smoke tests

```bash
# Public health endpoints must return 200
curl -sf https://api.gymapp.elautomata.com/health
curl -sf https://api.gymapp.elautomata.com/health/db

# /metrics must NOT be reachable on the public port
curl -sf https://api.gymapp.elautomata.com/metrics || test $? -eq 22

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
