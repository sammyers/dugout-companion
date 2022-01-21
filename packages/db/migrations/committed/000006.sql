--! Previous: sha1:73547e0f581f2e0947c2daa8c76b969306c9b51d
--! Hash: sha1:1e0819a711ae08c75f7e7cb0261fd9e187e4cc5d

create or replace function get_team_for_player(player_id uuid, game_id uuid) returns uuid as $$
  select  team.id from lineup_spot
    left join lineup on lineup.id = lineup_spot.lineup_id
    left join team on team.id = lineup.team_id
  where player_id = get_team_for_player.player_id and game_id = get_team_for_player.game_id
  limit 1;
$$ language sql stable;

create or replace view game_batting_lines as
  select
    s.*,
    (select count (*) from get_runs_scored(game_id => s.game_id, runner_id => s.player_id))::int as runs,
    (select count (*) from get_runs_scored(game_id => s.game_id, batter_id => s.player_id) where batted_in = TRUE)::int as rbi,
    s.doubles + s.triples + s.homeruns as xbh,
    get_avg(s.hits, s.at_bats) as batting_average,
    get_obp(s.hits, s.walks, s.plate_appearances) as on_base_pct,
    get_slg(
      get_tb(s.singles, s.doubles, s.triples, s.homeruns),
      s.at_bats
    ) as slugging_pct,
    get_ops(
      s.hits,
      get_tb(s.singles, s.doubles, s.triples, s.homeruns),
      s.walks,
      s.at_bats,
      s.plate_appearances
    ) as ops
  from (
    select
      player_id,
      game_id,
      extract(year from game_start_time)::int as season,
      get_team_for_player(player_id, game_id) as team_id,
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
    from get_plate_appearances()
    group by player_id, game_id, season
  ) s;
comment on view game_batting_lines is E'@primaryKey player_id,game_id\n@foreignKey (player_id) references player (id)\n@foreignKey (game_id) references game (id)';
grant select on game_batting_lines to :DATABASE_VISITOR;

drop materialized view if exists legacy_game_batting_lines;
create materialized view legacy_game_batting_lines as
  select
    s.*,
    s.doubles + s.triples + s.homeruns as xbh,
    public.get_avg(s.hits, s.at_bats) as batting_average,
    public.get_obp(s.hits, s.walks, s.at_bats + s.walks + s.sac_flies) as on_base_pct,
    public.get_slg(s.hits + s.doubles + 2 * s.triples + 3 * s.homeruns, s.at_bats) as slugging_pct,
    public.get_ops(s.hits, s.hits + s.doubles + 2 * s.triples + 3 * s.homeruns, s.walks, s.at_bats, s.at_bats + s.walks + s.sac_flies) as ops
  from
    (select
      (select id from player where legacy_player_id = player_id) as player_id,
      player_id as legacy_player_id,
      legacy_stat_line.game_id as legacy_game_id,
      season,
      sb_stats_team as legacy_team_id,
      sb_stats_ab + sb_stats_bb + sb_stats_sac as plate_appearances,
      sb_stats_ab as at_bats,
      sb_stats_1b + sb_stats_2b + sb_stats_3b + sb_stats_hr as hits,
      sb_stats_1b as singles,
      sb_stats_2b as doubles,
      sb_stats_3b as triples,
      sb_stats_hr as homeruns,
      sb_stats_bb as walks,
      sb_stats_so as strikeouts,
      sb_stats_sac as sac_flies,
      (select 0) as gidp,
      sb_stats_runs as runs,
      sb_stats_rbi as rbi
    from legacy_stat_line
      left join legacy_game on legacy_game.game_id = legacy_stat_line.game_id
    ) s;
grant select on legacy_season_stats to :DATABASE_VISITOR;
comment on materialized view legacy_game_batting_lines is E'@primaryKey legacy_player_id,legacy_game_id\n@foreignKey (player_id) references player (id)\n@foreignKey (legacy_player_id) references legacy_player (player_id)\n@foreignKey (legacy_game_id) references legacy_game (game_id)';
grant select on legacy_game_batting_lines to :DATABASE_VISITOR;

drop materialized view legacy_season_stats cascade;
create materialized view legacy_season_stats as select
	s.*,
  s.doubles + s.triples + s.homeruns as xbh,
	public.get_avg(s.hits, s.at_bats) as batting_average,
	public.get_obp(s.hits, s.walks, s.at_bats + s.walks + s.sac_flies) as on_base_pct,
	public.get_slg(s.hits + s.doubles + 2 * s.triples + 3 * s.homeruns, s.at_bats) as slugging_pct,
	public.get_ops(s.hits, s.hits + s.doubles + 2 * s.triples + 3 * s.homeruns, s.walks, s.at_bats, s.at_bats + s.walks + s.sac_flies) as ops
from
	(select
    (select id as group_id from "group" where name = 'SF Meetup'),
    (select id from player where legacy_player_id = player_id) as player_id,
		player_id as legacy_player_id,
		season,
		count(*)::int as games,
    (sum(sb_stats_ab) + sum(sb_stats_bb) + sum(sb_stats_sac))::int as plate_appearances,
		sum(sb_stats_ab)::int as at_bats,
		(sum(sb_stats_1b) + sum(sb_stats_2b) + sum(sb_stats_3b) + sum(sb_stats_hr))::int as hits,
		sum(sb_stats_1b)::int as singles,
		sum(sb_stats_2b)::int as doubles,
		sum(sb_stats_3b)::int as triples,
		sum(sb_stats_hr)::int as homeruns,
		sum(sb_stats_bb)::int as walks,
		sum(sb_stats_so)::int as strikeouts,
		sum(sb_stats_sac)::int as sac_flies,
    (select 0) as gidp,
    sum(sb_stats_runs)::int as runs,
    sum(sb_stats_rbi)::int as rbi
from legacy_stat_line
  left join legacy_game on legacy_game.game_id = legacy_stat_line.game_id
group by player_id, season) s;
grant select on legacy_season_stats to :DATABASE_VISITOR;
comment on materialized view legacy_season_stats is E'@foreignKey (player_id) references player (id)\n@foreignKey (legacy_player_id) references legacy_player (player_id)\n@foreignKey (group_id) references group (id)';

drop view modern_season_stats;
create view modern_season_stats as
  select
    s.*,
    (select count (*) from get_runs_scored(
      runner_id => player_id,
      after_date => first_date_of_year(season),
      before_date => last_date_of_year(season)
    ))::int as runs,
    (select count (*) from get_runs_scored(
      batter_id => player_id,
      after_date => first_date_of_year(season),
      before_date => last_date_of_year(season)
    ) where batted_in = TRUE)::int as rbi,
    s.doubles + s.triples + s.homeruns as xbh,
    get_avg(s.hits, s.at_bats) as batting_average,
    get_obp(s.hits, s.walks, s.plate_appearances) as on_base_pct,
    get_slg(
      get_tb(s.singles, s.doubles, s.triples, s.homeruns),
      s.at_bats
    ) as slugging_pct,
    get_ops(
      s.hits,
      get_tb(s.singles, s.doubles, s.triples, s.homeruns),
      s.walks,
      s.at_bats,
      s.plate_appearances
    ) as ops
  from (
    select
      (select group_id from player where id = player_id),
      player_id,
      (select legacy_player_id from player where id = player_id),
      extract(year from game_start_time)::int as season,
      count(distinct game_id)::int as games,
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
    from get_plate_appearances()
    group by player_id, season
  ) s
  where s.games > 0
  order by s.games desc, s.plate_appearances desc;

create view season_stats as
  select * from legacy_season_stats
    union
  (select * from modern_season_stats
    where modern_season_stats.season > 2021
    or modern_season_stats.group_id != (select id from "group" where name = 'SF Meetup')
  );
comment on view season_stats is E'@foreignKey (player_id) references player (id)\n@foreignKey (legacy_player_id) references legacy_player (player_id)\n@foreignKey (group_id) references group (id)';
grant select on season_stats to :DATABASE_VISITOR;

create view season_stats_qualified_batters as
  select * from season_stats
  where at_bats >= (
    select total_games from season
      where season.group_id = season_stats.group_id
      and season.year = season_stats.season
  ) * 2;
comment on view season_stats_qualified_batters is E'@foreignKey (player_id) references player (id)\n@foreignKey (legacy_player_id) references legacy_player (player_id)\n@foreignKey (group_id) references group (id)';
grant select on season_stats_qualified_batters to :DATABASE_VISITOR;

create view season_stats_all_time_qualified_batters as
  select * from season_stats where at_bats >= 200;
comment on view season_stats_all_time_qualified_batters is E'@foreignKey (player_id) references player (id)\n@foreignKey (legacy_player_id) references legacy_player (player_id)\n@foreignKey (group_id) references group (id)';
grant select on season_stats_all_time_qualified_batters to :DATABASE_VISITOR;

create or replace function group_all_seasons(g "group") returns setof int as $$
  select distinct season from season_stats where group_id = g.id order by season desc;
$$ language sql stable;

drop view if exists career_stats;
create view career_stats as
  select
    s.*,
    get_avg(s.hits, s.at_bats) as batting_average,
    get_obp(s.hits, s.walks, s.plate_appearances) as on_base_pct,
    get_slg(
      get_tb(s.singles, s.doubles, s.triples, s.homeruns),
      s.at_bats
    ) as slugging_pct,
    get_ops(
      s.hits,
      get_tb(s.singles, s.doubles, s.triples, s.homeruns),
      s.walks,
      s.at_bats,
      s.plate_appearances
    ) as ops
  from (
    select
      group_id,
      player_id,
      legacy_player_id,
      count(*)::int as seasons,
      sum(games)::int as games,
      sum(plate_appearances)::int as plate_appearances,
      sum(at_bats)::int as at_bats,
      sum(hits)::int as hits,
      sum(singles)::int as singles,
      sum(doubles)::int as doubles,
      sum(triples)::int as triples,
      sum(homeruns)::int as homeruns,
      sum(walks)::int as walks,
      sum(strikeouts)::int as strikeouts,
      sum(sac_flies)::int as sac_flies,
      sum(gidp)::int as gidp,
      sum(runs)::int as runs,
      sum(rbi)::int as rbi,
      sum(xbh)::int as xbh
    from season_stats
    group by group_id, player_id, legacy_player_id
  ) s;
comment on view career_stats is E'@foreignKey (player_id) references player (id)\n@foreignKey (legacy_player_id) references legacy_player (player_id)\n@foreignKey (group_id) references group (id)';
grant select on career_stats to :DATABASE_VISITOR;

drop view if exists career_stats_qualified_batters;
create view career_stats_qualified_batters as
  select * from career_stats where at_bats >= 400;
comment on view career_stats_qualified_batters is E'@foreignKey (player_id) references player (id)\n@foreignKey (legacy_player_id) references legacy_player (player_id)\n@foreignKey (group_id) references group (id)';
grant select on career_stats_qualified_batters to :DATABASE_VISITOR;

create or replace function player_debut(p player) returns date as $$
  select MIN(game_date) from (
    select game_date from legacy_game_batting_lines left join legacy_game on legacy_game_id = game_id where player_id = p.id
    union
    select date(time_started) as game_date from game_batting_lines left join game on game_batting_lines.game_id = game.id where player_id = p.id
  ) s;
$$ language sql stable;
