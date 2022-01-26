--! Previous: sha1:475d52c0ca87236ba87f5371a15af5c63ac96487
--! Hash: sha1:8b9dd547d600938cc184e6e2e4e320f2962f8227

create or replace view unified_games as
  select
    group_id,
    id as game_id,
    null as legacy_game_id,
    extract(year from time_started)::int as season
  from game
    where extract(year from time_started) > 2021
  union
  select
    (select id from "group" where name = 'SF Meetup') as group_id,
    null as game_id,
    game_id as legacy_game_id,
    season
  from legacy_game
    where (select count(*) from legacy_stat_line where legacy_stat_line.game_id = legacy_game.game_id) > 0;
comment on view unified_games is E'@foreignKey (group_id) references group (id)\n@foreignKey (game_id) references game (id)\n@foreignKey (legacy_game_id) references legacy_game (game_id)';
grant select on unified_games to :DATABASE_VISITOR;

create or replace function legacy_game_score(g legacy_game) returns int[] as $$
  with game_totals as (
    select
      sb_stats_team as team_id,
      sum(sb_stats_runs)::int as runs
    from legacy_stat_line
      where game_id = g.game_id
      group by sb_stats_team
  )
  select array[
    (select runs from game_totals where team_id = game_team_id_1),
    (select runs from game_totals where team_id = game_team_id_2)
  ]
  from legacy_game
    where game_id = g.game_id;
$$ language sql stable;

create or replace function legacy_game_batting_lines_stat_line_id(b legacy_game_batting_lines) returns int as $$
  select sb_stats_id from legacy_stat_line
    where player_id = b.legacy_player_id
    and game_id = b.legacy_game_id
    and sb_stats_team = b.legacy_team_id;
$$ language sql stable;

comment on materialized view legacy_game is E'@primaryKey game_id\n@foreignKey (game_team_id_1) references legacy_team (team_id)\n@foreignKey (game_team_id_2) references legacy_team (team_id)';
