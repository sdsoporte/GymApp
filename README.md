# GymApp / Recomp Tracker

App de registro de entrenamientos para rutina de recomposición corporal.

## Stack

- **Frontend:** React + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Hono + tRPC
- **Base de datos:** PostgreSQL + Drizzle ORM
- **Infraestructura:** Docker en `nodo-a`, Traefik, Prometheus, Grafana

## E2E QA

Los tests E2E corren contra una base de datos y assets locales aislados.

```bash
# Instalar navegador de Playwright (una sola vez)
pnpm --filter @gymapp/web e2e:install

# Levantar el stack de E2E y ejecutar la suite
pnpm --filter @gymapp/web e2e

# Modo UI para desarrollo
pnpm --filter @gymapp/web e2e:ui
```

Requisitos: Docker, `E2E=true` y `TEST_DATABASE_URL` apuntando al puerto `5433` con una DB que termine en `_e2e`. El guard rechaza cualquier DB de producción o `DATABASE_URL` como fallback.

## Documentación

- [Plan de desarrollo v2](docs/Plan%20de%20desarrollo%20%E2%80%94%20GymApp%20v2.md)
- [Arquitectura de nodo-a](docs/ARCHITECTURE.md)
