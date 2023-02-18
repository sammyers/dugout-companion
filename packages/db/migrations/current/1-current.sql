drop type if exists tag_type cascade;
create type tag_type as enum (
  'SEASON',
  'TOURNAMENT',
  'FIELD',
  'TIME_OF_DAY'
);

drop table if exists tag cascade;
create table tag (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  type tag_type
);

drop table if exists game_tag cascade;
create table game_tag (
  game_id uuid references game (id),
  tag_id uuid references tag (id)
);
