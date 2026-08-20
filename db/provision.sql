-- Idempotent provisioning script for the GymApp PostgreSQL role and database.
-- Run manually on nodo-a against postgres-prod as a superuser, e.g.:
--   psql -v pw='' -f db/provision.sql postgres://postgres@localhost/postgres
-- The password is supplied via the :pw variable and is NOT committed.
-- Note: psql does NOT expand :'pw' inside dollar-quoted strings, so the
-- role is created via format() + \gexec instead of a DO block.

SELECT format('CREATE ROLE gymapp LOGIN PASSWORD %L', :'pw')
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'gymapp')\gexec

SELECT 'CREATE DATABASE gymapp OWNER gymapp LC_COLLATE \'C.UTF-8\' LC_CTYPE \'C.UTF-8\' TEMPLATE template0'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'gymapp')\gexec

\c gymapp

GRANT ALL PRIVILEGES ON SCHEMA public TO gymapp;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO gymapp;
