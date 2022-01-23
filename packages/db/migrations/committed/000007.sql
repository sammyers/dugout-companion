--! Previous: sha1:1e0819a711ae08c75f7e7cb0261fd9e187e4cc5d
--! Hash: sha1:475d52c0ca87236ba87f5371a15af5c63ac96487

-- Enter migration here
drop table if exists redux_dump;
create table redux_dump (
  id uuid primary key default gen_random_uuid (),
  store_data jsonb not null,
  time_created timestamp with time zone default now()
);
grant select, insert on redux_dump to :DATABASE_VISITOR;
