--! Previous: sha1:29fb07e2bc76309db755f59da4d72bb8626f109e
--! Hash: sha1:69bbf5672aa501e93308a1899b26a7f0dfcdb264

--! split: 1-current.sql
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

--! split: 2-current.sql
alter table legacy_meetup_field_raw add column if not exists dc_id uuid;
update legacy_meetup_field_raw set dc_id = gen_random_uuid() where dc_id is null;
alter table legacy_meetup_field_raw alter column dc_id set not null;

alter table field add column if not exists address text not null;

insert into field (id, name, address)
select
  dc_id,
  concat(
    legacy_meetup_field_raw.name,
    case when sub_field is not null then concat(' (', sub_field, ')') else '' end
  ),
  legacy_meetup_field_raw.address
from legacy_meetup_field_raw
  left join field on field.id = legacy_meetup_field_raw.dc_id
  where field.id is null;

alter table legacy_meetup_game_raw add column if not exists dc_id uuid;
update legacy_meetup_game_raw set dc_id = gen_random_uuid() where dc_id is null;
alter table legacy_meetup_game_raw alter column dc_id set not null;

alter table game add column if not exists manual_entry boolean default false;
update game set manual_entry = false where manual_entry is null;
alter table game alter column manual_entry set not null;

alter table game add column if not exists legacy_meetup boolean default false;
update game set legacy_meetup = false where legacy_meetup is null;
alter table game alter column legacy_meetup set not null;

update game set solo_mode = false where solo_mode is null;
alter table game alter column solo_mode set not null;

drop table if exists game_aux_meetup_info;
create table game_aux_meetup_info (
  game_id uuid primary key references player (id),
  image_gallery_url text,
  meetup_event_id text,
  advanced boolean not null default false
);
alter table game_aux_meetup_info enable row level security;
drop policy if exists select_all on game_aux_meetup_info;
create policy select_all on game_aux_meetup_info for select using (true);
grant select on game_aux_meetup_info to :DATABASE_VISITOR, :DATABASE_USER, :DATABASE_ADMIN;

insert into game (
  id,
  group_id,
  name,
  field_id,
  time_started,
  time_ended,
  score,
  game_length,
  solo_mode,
  manual_entry,
  legacy_meetup
)
select
  dc_id,
  (select "group".id from "group" where name = 'SF Meetup'),
  legacy_meetup_game_raw.name,
  (select dc_id from legacy_meetup_field_raw where legacy_meetup_field_raw.id = legacy_meetup_game_raw.field_id),
  concat(legacy_meetup_game_raw.date, ' ', legacy_meetup_game_raw.time_started)::timestamptz at time zone 'US/Pacific',
	concat(legacy_meetup_game_raw.date, ' ', legacy_meetup_game_raw.time_ended)::timestamptz at time zone 'US/Pacific',
  '{-1,-1}',
  0,
  false,
  true,
  true
from legacy_meetup_game_raw
  left join game on game.id = legacy_meetup_game_raw.dc_id
  where game.id is null and legacy_meetup_game_raw.id not in (920, 921, 922, 923);

update team set solo_mode_opponent = false where solo_mode_opponent is null;
alter table team alter column solo_mode_opponent set default false;
alter table team alter column solo_mode_opponent set not null;

do $$
declare
  game_row game%ROWTYPE;
  legacy_game_row legacy_meetup_game_raw%ROWTYPE;
  winning_team_num_outs int;
  losing_team_num_outs int;
  winning_team_score int;
  losing_team_score int;
  winning_team_id uuid;
  losing_team_id uuid;
  winning_team_lineup_id uuid;
  losing_team_lineup_id uuid;
begin
  for game_row in select game.* from game where game.game_length = 0
  loop
    select legacy_meetup_game_raw.* into legacy_game_row from legacy_meetup_game_raw where dc_id = game_row.id;

    select sum(at_bats - hits + sac_flies) into winning_team_num_outs
    from legacy_meetup_stat_line_raw
      where team_id = legacy_game_row.winning_team_id and game_id = legacy_game_row.id;

    select sum(at_bats - hits + sac_flies) into losing_team_num_outs
    from legacy_meetup_stat_line_raw
      where team_id = legacy_game_row.losing_team_id and game_id = legacy_game_row.id;

    select sum(runs) into winning_team_score
    from legacy_meetup_stat_line_raw
      where team_id = legacy_game_row.winning_team_id and game_id = legacy_game_row.id;

    select sum(runs) into losing_team_score
    from legacy_meetup_stat_line_raw
      where team_id = legacy_game_row.losing_team_id and game_id = legacy_game_row.id;

    -- Away team won
    if winning_team_num_outs = losing_team_num_outs then
      update game set score = array[winning_team_score, losing_team_score] where game.id = game_row.id;
    -- Home team won
    else
      update game set score = array[losing_team_score, winning_team_score] where game.id = game_row.id;
    end if;

    if (select count(*) from team where game_id = game_row.id) = 0 then
      -- Create winning team
      insert into team (game_id, role, name, winner)
      values (
        game_row.id,
        (case when winning_team_num_outs = losing_team_num_outs then 'AWAY' else 'HOME' end)::team_role,
        (select name from legacy_meetup_team_raw where id = legacy_game_row.winning_team_id),
        true
      )
      returning team.id into winning_team_id;

      -- Create losing team
      insert into team (game_id, role, name, winner)
      values (
        game_row.id,
        (case when winning_team_num_outs = losing_team_num_outs then 'HOME' else 'AWAY' end)::team_role,
        (select name from legacy_meetup_team_raw where id = legacy_game_row.losing_team_id),
        false
      )
      returning team.id into losing_team_id;
    else
      select id into winning_team_id from team where game_id = game_row.id and winner = true;
      select id into losing_team_id from team where game_id = game_row.id and winner = false;
    end if;

    -- Create lineups
    if (select count(*) from lineup where game_id = game_row.id) = 0 then
      insert into lineup (team_id, game_id) values (winning_team_id, game_row.id)
      returning lineup.id into winning_team_lineup_id;

      insert into lineup (team_id, game_id) values (losing_team_id, game_row.id)
      returning lineup.id into losing_team_lineup_id;
    else
      select id into winning_team_lineup_id from lineup where game_id = game_row.id and team_id = winning_team_id;
      select id into losing_team_lineup_id from lineup where game_id = game_row.id and team_id = losing_team_id;
    end if;

    -- Create lineup spots
    if (select count(*) from lineup_spot where game_id = game_row.id) = 0 then
      insert into lineup_spot (lineup_id, player_id, game_id, batting_order)
      select
        (
          case when legacy_meetup_stat_line_raw.team_id = legacy_game_row.winning_team_id
          then winning_team_lineup_id
          else losing_team_lineup_id
          end
        ),
        (select player.id from player where legacy_player_id = legacy_meetup_stat_line_raw.player_id),
        game_row.id,
        row_number() over (partition by team_id order by legacy_meetup_stat_line_raw.id) - 1
      from legacy_meetup_stat_line_raw
        where game_id = legacy_game_row.id
      on conflict (lineup_id, player_id) do nothing;
    end if;

    update game set game_length = ceil(
      greatest(winning_team_num_outs, losing_team_num_outs)::float / (
        -- Some of these old games have everyone on one team which throws off the calculation
        case when winning_team_score is not null and losing_team_score is not null then 3.0 else 6.0 end
      ))
      where id = game_row.id;
  end loop;
end;
$$;

create or replace function game_season(g game) returns int as $$
  select extract(year from g.time_started);
$$ language sql stable;

--! split: 3-current.sql
create table if not exists manual_entry_batting_line (
  game_id uuid references game (id) not null,
  team_id uuid references team (id) not null,
  player_id uuid references player (id) not null,
  primary key (game_id, team_id, player_id),
  plate_appearances int not null,
  at_bats int not null,
  hits int not null,
  singles int not null,
  doubles int not null,
  triples int not null,
  homeruns int not null,
  walks int not null,
  strikeouts int not null,
  sac_flies int not null,
  gidp int not null,
  runs int not null,
  rbi int not null,
  stolen_bases int not null
);
alter table manual_entry_batting_line enable row level security;
drop policy if exists select_all on manual_entry_batting_line;
drop policy if exists insert_with_group_permission on manual_entry_batting_line;
create policy select_all on manual_entry_batting_line for select using (true);
create policy insert_with_group_permission on manual_entry_batting_line for insert to :DATABASE_USER
  with check (can_user_save_game_data(game_id));
grant select on manual_entry_batting_line to :DATABASE_VISITOR, :DATABASE_USER, :DATABASE_ADMIN;
grant insert on manual_entry_batting_line to :DATABASE_USER;

create table if not exists manual_entry_pitching_line (
  game_id uuid references game (id) not null,
  team_id uuid references team (id) not null,
  player_id uuid references player (id) not null,
  primary key (game_id, team_id, player_id),
  innings_pitched int not null,
  won boolean not null,
  lost boolean not null,
  "save" boolean not null,
  complete_game boolean not null,
  quality_start boolean not null,
  runs_allowed int not null,
  strikeouts int not null,
  walks int not null
);
alter table manual_entry_pitching_line enable row level security;
drop policy if exists select_all on manual_entry_pitching_line;
drop policy if exists insert_with_group_permission on manual_entry_pitching_line;
create policy select_all on manual_entry_pitching_line for select using (true);
create policy insert_with_group_permission on manual_entry_pitching_line for insert to :DATABASE_USER
  with check (can_user_save_game_data(game_id));
grant select on manual_entry_pitching_line to :DATABASE_VISITOR, :DATABASE_USER, :DATABASE_ADMIN;
grant insert on manual_entry_pitching_line to :DATABASE_USER;

create table if not exists manual_entry_line_score_cell (
  game_id uuid references game (id) not null,
  inning int not null,
  half_inning half_inning not null,
  primary key (game_id, inning, half_inning),
  runs int not null
);
alter table manual_entry_line_score_cell enable row level security;
drop policy if exists select_all on manual_entry_line_score_cell;
drop policy if exists insert_with_group_permission on manual_entry_line_score_cell;
create policy select_all on manual_entry_line_score_cell for select using (true);
create policy insert_with_group_permission on manual_entry_line_score_cell for insert to :DATABASE_USER
  with check (can_user_save_game_data(game_id));
grant select on manual_entry_line_score_cell to :DATABASE_VISITOR, :DATABASE_USER, :DATABASE_ADMIN;
grant insert on manual_entry_line_score_cell to :DATABASE_USER;

insert into manual_entry_batting_line (
  game_id,
  team_id,
  player_id,
  plate_appearances,
  at_bats,
  hits,
  singles,
  doubles,
  triples,
  homeruns,
  walks,
  strikeouts,
  sac_flies,
  gidp,
  runs,
  rbi,
  stolen_bases
)
select
  legacy_meetup_game_raw.dc_id,
  (
    select team.id from team
    where game_id = legacy_meetup_game_raw.dc_id
    and team.name = (
      select legacy_meetup_team_raw.name from legacy_meetup_team_raw
      where legacy_meetup_team_raw.id = legacy_meetup_stat_line_raw.team_id
    )
  ),
  (select id from player where legacy_player_id = player_id),
  at_bats + walks + sac_flies,
  at_bats,
  hits,
  singles,
  doubles,
  triples,
  homeruns,
  walks,
  strikeouts,
  sac_flies,
  0,
  runs,
  rbi,
  stolen_bases
from legacy_meetup_stat_line_raw
left join legacy_meetup_game_raw on legacy_meetup_game_raw.id = legacy_meetup_stat_line_raw.game_id
where game_id not in (920, 921, 922, 923)
on conflict do nothing;

insert into manual_entry_pitching_line (
  game_id,
  team_id,
  player_id,
  innings_pitched,
  won,
  lost,
  "save",
  complete_game,
  quality_start,
  runs_allowed,
  strikeouts,
  walks
)
select
  legacy_meetup_game_raw.dc_id,
  (
    select team.id from team
    where game_id = legacy_meetup_game_raw.dc_id
    and team.name = (
      select legacy_meetup_team_raw.name from legacy_meetup_team_raw
      where legacy_meetup_team_raw.id = legacy_meetup_stat_line_raw.team_id
    )
  ),
  (select id from player where legacy_player_id = player_id),
  innings_pitched,
  pitcher_won,
  pitcher_lost,
  pitcher_save,
  pitcher_complete_game,
  pitcher_quality_start,
  runs_allowed,
  pitcher_strikeouts,
  pitcher_walks
from legacy_meetup_stat_line_raw
left join legacy_meetup_game_raw on legacy_meetup_game_raw.id = legacy_meetup_stat_line_raw.game_id
where pitched = true and game_id not in (920, 921, 922, 923)
on conflict do nothing;

--! split: 4-current.sql
drop view if exists game_batting_lines;

create or replace view game_batting_stats as
  select
    s1.game_id,
    s5.team_id,
    s1.player_id,
    s1.plate_appearances,
    s1.at_bats,
    s1.hits,
    s1.singles,
    s1.doubles,
    s1.triples,
    s1.homeruns,
    s1.walks,
    s1.strikeouts,
    s1.sac_flies,
    s1.gidp,
    coalesce(s2.runs, 0)::int as runs,
    coalesce(s3.rbi, 0)::int as rbi,
    coalesce(s4.stolen_bases, 0)::int as stolen_bases
  from (
    select
      plate_appearance.game_id,
      game_state.player_at_bat as player_id,
      count(*)::int as plate_appearances,
      count(case when type not in ('WALK', 'SACRIFICE_FLY') then 1 end)::int as at_bats,
      count(case when type in ('SINGLE', 'DOUBLE', 'TRIPLE', 'HOMERUN') then 1 end)::int as hits,
      count(case when type = 'SINGLE' then 1 end)::int as singles,
      count(case when type = 'DOUBLE' then 1 end)::int as doubles,
      count(case when type = 'TRIPLE' then 1 end)::int as triples,
      count(case when type = 'HOMERUN' then 1 end)::int as homeruns,
      count(case when type = 'WALK' then 1 end)::int as walks,
      count(case when type = 'OUT' and contact = 'NONE' then 1 end)::int as strikeouts,
      count(case when type = 'SACRIFICE_FLY' then 1 end)::int as sac_flies,
      count(case when type = 'DOUBLE_PLAY' then 1 end)::int as gidp
    from plate_appearance
      left join game_event on game_event.plate_appearance_id = plate_appearance.id
      left join game_event_record on game_event_record.game_event_id = game_event.id
      left join game_state on game_state.id = game_event_record.game_state_before_id
    group by plate_appearance.game_id, game_state.player_at_bat
  ) s1
    left join (
      select game_id, runner_id, count(*) as runs
      from scored_runner
      group by game_id, runner_id
    ) s2
      on (s2.game_id, s2.runner_id) = (s1.game_id, s1.player_id)
    left join (
      select scored_runner.game_id, game_state.player_at_bat as batter_id, count(*) as rbi
      from scored_runner
        left join game_event_record on game_event_record.id = scored_runner.game_event_record_id
        left join game_state on game_state.id = game_event_record.game_state_before_id
      where batted_in = true
      group by scored_runner.game_id, game_state.player_at_bat
    ) s3
      on (s3.game_id, s3.batter_id) = (s1.game_id, s1.player_id)
    left join (
      select game_id, runner_id, count(*) as stolen_bases
      from stolen_base_attempt
      where success = true
      group by game_id, runner_id
    ) s4
      on (s4.game_id, s4.runner_id) = (s1.game_id, s1.player_id)
    left join (
      select distinct lineup_spot.game_id, lineup.team_id, lineup_spot.player_id
      from lineup_spot
        left join lineup on lineup.id = lineup_spot.lineup_id
    ) s5
      on (s5.game_id, s5.player_id) = (s1.game_id, s1.player_id)
  union
  select * from manual_entry_batting_line;
comment on column game_batting_stats.plate_appearances is E'@notNull';
comment on column game_batting_stats.at_bats is E'@notNull';
comment on column game_batting_stats.hits is E'@notNull';
comment on column game_batting_stats.singles is E'@notNull';
comment on column game_batting_stats.doubles is E'@notNull';
comment on column game_batting_stats.triples is E'@notNull';
comment on column game_batting_stats.homeruns is E'@notNull';
comment on column game_batting_stats.walks is E'@notNull';
comment on column game_batting_stats.strikeouts is E'@notNull';
comment on column game_batting_stats.sac_flies is E'@notNull';
comment on column game_batting_stats.gidp is E'@notNull';
comment on column game_batting_stats.runs is E'@notNull';
comment on column game_batting_stats.rbi is E'@notNull';
comment on column game_batting_stats.stolen_bases is E'@notNull';
comment on view game_batting_stats is E'@primaryKey game_id,team_id,player_id\n@foreignKey (game_id) references game (id)\n@foreignKey (team_id) references team (id)\n@foreignKey (player_id) references player (id)';
grant select on game_batting_stats to :DATABASE_VISITOR, :DATABASE_USER, :DATABASE_ADMIN;

create or replace view season_batting_stats as
  select
    s.*,
    get_avg(s.hits, s.at_bats) as avg,
    get_obp(s.hits, s.walks, s.plate_appearances) as obp,
    get_slg(
      get_tb(s.singles, s.doubles, s.triples, s.homeruns),
      s.at_bats
    ) as slg,
    get_ops(
      s.hits,
      get_tb(s.singles, s.doubles, s.triples, s.homeruns),
      s.walks,
      s.at_bats,
      s.plate_appearances
    ) as ops
  from (
    select
      game.group_id,
      stats.player_id,
      extract(year from game.time_started)::int as season,
      count(*)::int as games,
      sum(stats.plate_appearances)::int as plate_appearances,
      sum(stats.at_bats)::int as at_bats,
      sum(stats.hits)::int as hits,
      sum(stats.singles)::int as singles,
      sum(stats.doubles)::int as doubles,
      sum(stats.triples)::int as triples,
      sum(stats.homeruns)::int as homeruns,
      sum(stats.walks)::int as walks,
      sum(stats.strikeouts)::int as strikeouts,
      sum(stats.sac_flies)::int as sac_flies,
      sum(stats.gidp)::int as gidp,
      sum(stats.runs)::int as runs,
      sum(stats.rbi)::int as rbi,
      sum(stats.stolen_bases)::int as stolen_bases
    from game_batting_stats as stats
      left join game on game.id = stats.game_id
    group by game.group_id, stats.player_id, extract(year from game.time_started)
  ) s;
comment on column season_batting_stats.plate_appearances is E'@notNull';
comment on column season_batting_stats.at_bats is E'@notNull';
comment on column season_batting_stats.hits is E'@notNull';
comment on column season_batting_stats.singles is E'@notNull';
comment on column season_batting_stats.doubles is E'@notNull';
comment on column season_batting_stats.triples is E'@notNull';
comment on column season_batting_stats.homeruns is E'@notNull';
comment on column season_batting_stats.walks is E'@notNull';
comment on column season_batting_stats.strikeouts is E'@notNull';
comment on column season_batting_stats.sac_flies is E'@notNull';
comment on column season_batting_stats.gidp is E'@notNull';
comment on column season_batting_stats.runs is E'@notNull';
comment on column season_batting_stats.rbi is E'@notNull';
comment on column season_batting_stats.stolen_bases is E'@notNull';
comment on column season_batting_stats.avg is E'@notNull';
comment on column season_batting_stats.obp is E'@notNull';
comment on column season_batting_stats.slg is E'@notNull';
comment on column season_batting_stats.ops is E'@notNull';
comment on view season_batting_stats is E'@primaryKey group_id,player_id\n@foreignKey (group_id) references "group" (id)\n@foreignKey (player_id) references player (id)';
grant select on season_batting_stats to :DATABASE_VISITOR, :DATABASE_USER, :DATABASE_ADMIN;

drop view if exists career_batting_stats;
create or replace view career_batting_stats as
  select
    s.*,
    get_avg(s.hits, s.at_bats) as avg,
    get_obp(s.hits, s.walks, s.plate_appearances) as obp,
    get_slg(
      get_tb(s.singles, s.doubles, s.triples, s.homeruns),
      s.at_bats
    ) as slg,
    get_ops(
      s.hits,
      get_tb(s.singles, s.doubles, s.triples, s.homeruns),
      s.walks,
      s.at_bats,
      s.plate_appearances
    ) as ops
  from (
    select
      stats.group_id,
      stats.player_id,
      count(*)::int as seasons,
      sum(stats.games)::int as games,
      sum(stats.plate_appearances)::int as plate_appearances,
      sum(stats.at_bats)::int as at_bats,
      sum(stats.hits)::int as hits,
      sum(stats.singles)::int as singles,
      sum(stats.doubles)::int as doubles,
      sum(stats.triples)::int as triples,
      sum(stats.homeruns)::int as homeruns,
      sum(stats.walks)::int as walks,
      sum(stats.strikeouts)::int as strikeouts,
      sum(stats.sac_flies)::int as sac_flies,
      sum(stats.gidp)::int as gidp,
      sum(stats.runs)::int as runs,
      sum(stats.rbi)::int as rbi,
      sum(stats.stolen_bases)::int as stolen_bases
    from season_batting_stats as stats
    group by stats.group_id, stats.player_id
  ) s;
comment on column career_batting_stats.plate_appearances is E'@notNull';
comment on column career_batting_stats.at_bats is E'@notNull';
comment on column career_batting_stats.hits is E'@notNull';
comment on column career_batting_stats.singles is E'@notNull';
comment on column career_batting_stats.doubles is E'@notNull';
comment on column career_batting_stats.triples is E'@notNull';
comment on column career_batting_stats.homeruns is E'@notNull';
comment on column career_batting_stats.walks is E'@notNull';
comment on column career_batting_stats.strikeouts is E'@notNull';
comment on column career_batting_stats.sac_flies is E'@notNull';
comment on column career_batting_stats.gidp is E'@notNull';
comment on column career_batting_stats.runs is E'@notNull';
comment on column career_batting_stats.rbi is E'@notNull';
comment on column career_batting_stats.stolen_bases is E'@notNull';
comment on column career_batting_stats.avg is E'@notNull';
comment on column career_batting_stats.obp is E'@notNull';
comment on column career_batting_stats.slg is E'@notNull';
comment on column career_batting_stats.ops is E'@notNull';
comment on view career_batting_stats is E'@primaryKey group_id,player_id\n@foreignKey (group_id) references "group" (id)\n@foreignKey (player_id) references player (id)';
grant select on career_batting_stats to :DATABASE_VISITOR, :DATABASE_USER, :DATABASE_ADMIN;

drop function if exists player_debut;
create or replace function player_debut(p player, group_id uuid) returns date as $$
  select date(min(game.time_started)) from game_batting_stats
    left join game on game_batting_stats.game_id = game.id
  where player_id = p.id and game.group_id = player_debut.group_id;
$$ language sql stable;

create or replace function season_batting_stats_qualified(s season_batting_stats) returns boolean as $$
  select s.plate_appearances >= (
    select count(*) from game where game.group_id = s.group_id and extract(year from game.time_started) = s.season
  ) * 2;
$$ language sql stable;

create or replace function group_all_seasons(g "group") returns setof int as $$
  select distinct extract(year from time_started)
  from game
  where group_id = g.id
  order by extract(year from time_started) desc;
$$ language sql stable;

create or replace function group_games_in_season(g "group", season int) returns int as $$
  select count(*) from game
  where group_id = g.id and extract(year from time_started) = season;
$$ language sql stable;

create or replace function team_final_lineup(t team)
returns lineup as $$
  select lineup.* from lineup
    left join lineup_for_game_state on lineup.id = lineup_for_game_state.lineup_id
    left join game_state on game_state.id = lineup_for_game_state.game_state_id
  where lineup.game_id = t.game_id and lineup.team_id = t.id
  order by game_state_index desc limit 1;
$$ language sql stable;

create or replace function game_line_score(g game)
returns setof line_score_cell as $$
  (
    select
      inning,
      half_inning,
      sum(runs_scored) as runs,
      count(case when type in ('SINGLE', 'DOUBLE', 'TRIPLE', 'HOMERUN') then 1 end) as hits
    from get_plate_appearances(game_id => g.id)
    group by inning, half_inning
  ) union (
    select
      game_state.inning,
      game_state.half_inning,
      runs_scored as runs,
      0 as hits
    from solo_mode_opponent_inning
      left join game_event on game_event.solo_mode_opponent_inning_id = solo_mode_opponent_inning.id
      left join game_event_record on game_event_record.game_event_id = game_event.id
      left join game_state on game_event_record.game_state_before_id = game_state.id
      left join game on game_event_record.game_id = game.id
      where game.id = g.id
  ) union (
    select
      inning,
      half_inning,
      runs,
      0 as hits
    from manual_entry_line_score_cell
    where game_id = g.id
  )
$$ language sql stable;

drop view if exists career_stats_qualified_batters;
drop view if exists career_stats;
drop view if exists season_stats_all_time_qualified_batters;
drop view if exists season_stats_qualified_batters;
drop view if exists season_stats;
drop view if exists modern_season_stats;
drop view if exists season;
drop view if exists unified_games;

drop function if exists legacy_game_score;
drop function if exists legacy_game_batting_lines_stat_line_id;

drop materialized view if exists legacy_game_batting_lines;
drop materialized view if exists legacy_season_stats;
drop materialized view if exists legacy_season;
drop materialized view if exists legacy_stat_line;
drop materialized view if exists legacy_team;
drop materialized view if exists legacy_game;
drop materialized view if exists legacy_field;
drop materialized view if exists legacy_player;

drop foreign table if exists foreign_db_field;
drop foreign table if exists foreign_db_game;
drop foreign table if exists foreign_db_player;
drop foreign table if exists foreign_db_stat_line;
drop foreign table if exists foreign_db_team;

comment on table legacy_meetup_field_raw is E'@omit';
comment on table legacy_meetup_game_raw is E'@omit';
comment on table legacy_meetup_player_raw is E'@omit';
comment on table legacy_meetup_stat_line_raw is E'@omit';
comment on table legacy_meetup_team_raw is E'@omit';

comment on table player is null;
