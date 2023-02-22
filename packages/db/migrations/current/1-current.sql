drop table if exists player_aux_meetup_info;
create table player_aux_meetup_info (
  player_id uuid primary key references player (id),
  gender gender not null,
  bats handedness not null,
  throws handedness not null,
  preferred_position_first fielding_position not null,
  preferred_position_second fielding_position not null,
  preferred_position_third fielding_position not null,
  meetup_member_id text not null,
  admin_nickname text,
  self_nickname text,
  skill_level integer,
  favorite_team text,
  hometown text,
  school text,
  date_debuted date
);
alter table player_aux_meetup_info enable row level security;
drop policy if exists select_all on player_aux_meetup_info;
create policy select_all on player_aux_meetup_info for select using (true);
grant select on player_aux_meetup_info to :DATABASE_VISITOR, :DATABASE_USER, :DATABASE_ADMIN;

alter table legacy_meetup_player_raw add column if not exists dc_id uuid;
update legacy_meetup_player_raw set dc_id = coalesce(
  (select player.id from player where legacy_player_id = legacy_meetup_player_raw.id),
  gen_random_uuid()
)
  where dc_id is null;
alter table legacy_meetup_player_raw alter column dc_id set not null;

insert into player (id, legacy_player_id, first_name, time_created)
select dc_id, legacy_meetup_player_raw.id, name, time_added from public.legacy_meetup_player_raw
  left join player on player.id = dc_id
  where player.id is null;

alter table player add column if not exists active boolean default true;
update player set active = (case when starts_with(first_name, 'Z-') then false else true end)
  where active is null;
alter table player alter column active set not null;

update player set (first_name, last_name) = (
  split_part(first_name, ' ', 1),
  substring(first_name, length(split_part(first_name, ' ', 1)) + 2)
)
  where last_name is null;

update player set first_name = substring(first_name, 3, length(first_name) - 2) where starts_with(first_name, 'Z-');
update player set time_created = (select time_added from legacy_meetup_player_raw where dc_id = player.id)
  where legacy_player_id is not null;

insert into player_aux_meetup_info (
  player_id,
  gender,
  bats,
  throws,
  preferred_position_first,
  preferred_position_second,
  preferred_position_third,
  meetup_member_id,
  admin_nickname,
  self_nickname,
  skill_level,
  favorite_team,
  hometown,
  school,
  date_debuted
)
select
  dc_id,
  legacy_meetup_player_raw.gender,
  legacy_meetup_player_raw.bats,
  legacy_meetup_player_raw.throws,
  legacy_meetup_player_raw.preferred_position_first,
  legacy_meetup_player_raw.preferred_position_second,
  legacy_meetup_player_raw.preferred_position_third,
  legacy_meetup_player_raw.meetup_member_id,
  nickname,
  legacy_meetup_player_raw.self_nickname,
  legacy_meetup_player_raw.skill_level,
  legacy_meetup_player_raw.favorite_team,
  legacy_meetup_player_raw.hometown,
  legacy_meetup_player_raw.school,
  legacy_meetup_player_raw.date_debuted
from legacy_meetup_player_raw
  left join player_aux_meetup_info on player_id = dc_id
  where player_id is null;

insert into player_group_membership (player_id, group_id)
select id, (select id from "group" where name = 'SF Meetup')
from player
  left join player_group_membership on player.id = player_group_membership.player_id
  where player_id is null;
