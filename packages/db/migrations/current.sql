-- Enter migration here
drop schema if exists dc_public cascade;

alter default privileges revoke all on sequences from public;

alter default privileges revoke all on functions from public;

revoke all on schema public from public;

grant all on schema public to :DATABASE_OWNER;

grant usage on schema public to :DATABASE_VISITOR;

alter default privileges in schema public grant usage,
select
  on sequences to :DATABASE_VISITOR;

alter default privileges in schema public grant execute on functions to :DATABASE_VISITOR;

drop table if exists player;

create table player (
  id uuid primary key default gen_random_uuid (),
  first_name text not null,
  last_name text,
  created_at timestamp default now()
);

grant select, insert on player to :DATABASE_VISITOR;

drop type if exists base_type cascade;

create type base_type as ENUM (
  'FIRST',
  'SECOND',
  'THIRD'
);

drop table if exists game_state;

create table game_state (
  id serial primary key,
  base base_type not null
);

grant select, insert on game_state to :DATABASE_VISITOR;

