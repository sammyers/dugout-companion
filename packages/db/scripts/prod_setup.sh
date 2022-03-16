#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
    CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;
    CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
    CREATE EXTENSION IF NOT EXISTS mysql_fdw WITH SCHEMA public;

    CREATE SERVER legacy_stats_mysql FOREIGN DATA WRAPPER mysql_fdw OPTIONS (host '$LEGACY_DB_HOST', port '3306');
    CREATE USER MAPPING FOR PUBLIC SERVER legacy_stats_mysql OPTIONS (username '$LEGACY_DB_USER', password '$LEGACY_DB_PASS');
    
    CREATE ROLE $DATABASE_AUTHENTICATOR WITH LOGIN PASSWORD '$DATABASE_AUTHENTICATOR_PASSWORD' NOINHERIT;
    CREATE ROLE $DATABASE_VISITOR;
    CREATE ROLE $DATABASE_USER;
    CREATE ROLE $DATABASE_ADMIN;
    GRANT $DATABASE_VISITOR TO $DATABASE_AUTHENTICATOR;
    GRANT $DATABASE_USER TO $DATABASE_AUTHENTICATOR;
    GRANT $DATABASE_ADMIN TO $DATABASE_AUTHENTICATOR;
EOSQL
