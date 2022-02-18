--! Previous: sha1:1b03cfe1b8c43dcf68f76ae454e521d0dba71051
--! Hash: sha1:3b625f7585869bf916a59732263eee0978bfcce5

create table if not exists at_bat_skip (
  id uuid primary key default gen_random_uuid(),
  batter_id uuid references player (id) not null
);
grant select, insert (batter_id) on at_bat_skip to :DATABASE_VISITOR;

alter table game_event add column if not exists at_bat_skip_id uuid references at_bat_skip (id);
grant select, insert (plate_appearance_id, stolen_base_attempt_id, lineup_change_id, solo_mode_opponent_inning_id, at_bat_skip_id) on game_event to :DATABASE_VISITOR;

alter table "group" add column if not exists allow_skipping_at_bats boolean default false;
alter table "group" add column if not exists allow_steals boolean default false;
