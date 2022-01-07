--! Previous: sha1:9cd342071773a157fd0b0c288cabe6180aae233d
--! Hash: sha1:7b35ccd76c19c00648c5a805b2246a84d74c3a75

drop foreign table if exists legacy_player cascade;
drop foreign table if exists foreign_db_player cascade;
create foreign table foreign_db_player (
  player_id int not null,
  player_name varchar(240) not null,
  player_image varchar(255),
  member_id varchar(25)
)
server legacy_stats_mysql options (dbname ':LEGACY_DB_NAME', table_name 'player');
drop materialized view if exists legacy_player;
create materialized view legacy_player as select * from foreign_db_player;
grant select on legacy_player to :DATABASE_VISITOR;
comment on materialized view legacy_player is E'@primaryKey player_id';
comment on table player is E'@foreignKey (legacy_player_id) references legacy_player (player_id)';

drop foreign table if exists legacy_field cascade;
drop foreign table if exists foreign_db_field cascade;
create foreign table foreign_db_field (
  field_id int not null,
  field_name varchar(120) not null,
  field_address varchar(260) not null,
  field_number varchar(100)
)
server legacy_stats_mysql options (dbname ':LEGACY_DB_NAME', table_name 'field');
drop materialized view if exists legacy_field;
create materialized view legacy_field as select * from foreign_db_field;
grant select on legacy_field to :DATABASE_VISITOR;
comment on materialized view legacy_field is E'@primaryKey field_id';

drop foreign table if exists legacy_game cascade;
drop foreign table if exists foreign_db_game cascade;
create foreign table foreign_db_game (
  game_id int not null,
  game_title varchar(236) not null,
  game_date date not null,
  game_start_time time not null,
  game_end_time time not null,
  game_team_id_1 int not null,
  game_team_id_2 int not null,
  season int not null
)
server legacy_stats_mysql options (dbname ':LEGACY_DB_NAME', table_name 'game');
drop materialized view if exists legacy_game;
create materialized view legacy_game as select * from foreign_db_game;
grant select on legacy_game to :DATABASE_VISITOR;
comment on materialized view legacy_game is E'@primaryKey game_id';

drop foreign table if exists legacy_team cascade;
drop foreign table if exists foreign_db_team cascade;
create foreign table foreign_db_team (
  team_id int not null,
  team_name varchar(128) not null
)
server legacy_stats_mysql options (dbname ':LEGACY_DB_NAME', table_name 'team');
drop materialized view if exists legacy_team;
create materialized view legacy_team as select * from foreign_db_team;
grant select on legacy_team to :DATABASE_VISITOR;
comment on materialized view legacy_team is E'@primaryKey team_id';

drop foreign table if exists legacy_stat_line cascade;
drop foreign table if exists foreign_db_stat_line cascade;
create foreign table foreign_db_stat_line (
  sb_stats_id int not null,
  player_id int not null,
  game_id int not null,
  sb_stats_team int not null,
  sb_stats_AB int not null,
  sb_stats_runs int not null,
  sb_stats_hits int not null,
  sb_stats_1B int not null,
  sb_stats_2B int not null,
  sb_stats_3B int not null,
  sb_stats_HR int not null,
  sb_stats_RBI int not null,
  sb_stats_bb int not null,
  sb_stats_so int not null,
  sb_stats_sac int not null
)
server legacy_stats_mysql options (dbname ':LEGACY_DB_NAME', table_name 'softball_stats');
drop materialized view if exists legacy_stat_line;
create materialized view legacy_stat_line as select * from foreign_db_stat_line;
grant select on legacy_stat_line to :DATABASE_VISITOR;

drop materialized view if exists legacy_season_stats;
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
		count(*) as games,
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

drop view if exists modern_season_stats cascade;
create view modern_season_stats as select
    s.*,
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
      count(distinct game_id) as games,
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
      count(case when type = 'DOUBLE_PLAY' then 1 end)::int as gidp,
      (select count (*) from get_runs_scored(runner_id => player_id))::int as runs,
      (select count (*) from get_runs_scored(batter_id => player_id))::int as rbi
    from get_plate_appearances()
    group by player_id, season
  ) s
  where s.games > 0
  order by s.games desc, s.plate_appearances desc;

drop view if exists season_stats;
create view season_stats as
  select * from legacy_season_stats
    union
  (select * from modern_season_stats
    where modern_season_stats.season > 2021
    or modern_season_stats.group_id != (select id from "group" where name = 'SF Meetup')
  );
comment on view season_stats is E'@foreignKey (player_id) references player (id)\n@foreignKey (legacy_player_id) references legacy_player (player_id)\n@foreignKey (group_id) references group (id)';
grant select on season_stats to :DATABASE_VISITOR;

drop materialized view if exists legacy_season cascade;
create materialized view legacy_season as
  select
    (select id as group_id from "group" where name = 'SF Meetup'),
    season as year,
    count(distinct legacy_stat_line.game_id) as total_games
  from legacy_stat_line
    left join legacy_game on legacy_game.game_id = legacy_stat_line.game_id
  group by season;

drop view if exists season;
create view season as
  select * from legacy_season
    union
  select
    s.group_id,
    s.year,
    count(s.*) as total_games
  from (select *, extract(year from time_started) as year from game) s
  where s.year > 2021 or s.group_id != (select id from "group" where name = 'SF Meetup')
  group by s.group_id, s.year;

drop view if exists season_stats_qualified_batters;
create view season_stats_qualified_batters as
  select * from season_stats
  where at_bats >= (
    select total_games from season
      where season.group_id = season_stats.group_id
      and season.year = season_stats.season
  ) * 2;
comment on view season_stats_qualified_batters is E'@foreignKey (player_id) references player (id)\n@foreignKey (legacy_player_id) references legacy_player (player_id)\n@foreignKey (group_id) references group (id)';
grant select on season_stats_qualified_batters to :DATABASE_VISITOR;

drop view if exists season_stats_all_time_qualified_batters;
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
