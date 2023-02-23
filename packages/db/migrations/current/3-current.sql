create or replace function get_team_for_player(player_id uuid, game_id uuid) returns uuid as $$
  select lineup.team_id
  from lineup_spot left join lineup on lineup.id = lineup_spot.lineup_id
  where
    lineup_spot.player_id = get_team_for_player.player_id
    and lineup_spot.game_id = get_team_for_player.game_id
  limit 1;
$$ language sql stable;

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
  half_inning int not null,
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
