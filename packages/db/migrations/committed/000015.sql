--! Previous: sha1:b71a35add02d98084eb9ffe5c0e6bdff5cc4f1cf
--! Hash: sha1:db3f1072b1bb44db9a8d0555f1ef12047e73ec37

--! split: 1-current.sql
drop type if exists early_game_end_reason cascade;
create type early_game_end_reason as enum (
  'MERCY_RULE',
  'TIME_EXPIRED',
  'OTHER'
);

create table if not exists early_game_end (
  id uuid primary key default gen_random_uuid(),
  reason early_game_end_reason not null,
  game_id uuid not null references game (id)
);
alter table early_game_end enable row level security;
drop policy if exists select_all on early_game_end;
drop policy if exists insert_with_group_permission on early_game_end;
create policy select_all on early_game_end for select using (true);
create policy insert_with_group_permission on early_game_end for insert to :DATABASE_USER
  with check (can_user_save_game_data(game_id));
grant select on early_game_end to :DATABASE_VISITOR, :DATABASE_USER, :DATABASE_ADMIN;
grant insert on early_game_end to :DATABASE_USER;

alter table game_event add column if not exists early_game_end_id uuid references early_game_end (id);
