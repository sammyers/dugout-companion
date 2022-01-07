--! Previous: sha1:7b35ccd76c19c00648c5a805b2246a84d74c3a75
--! Hash: sha1:4334332a89a98b5aa7a742edc5ca2fc470ab6d7d

-- Enter migration here
drop view if exists season cascade;
create view season as
  select * from legacy_season
    union
  select
    s.group_id,
    s.year,
    count(s.*)::int as total_games
  from (select *, extract(year from time_started)::int as year from game) s
  where s.year > 2021 or s.group_id != (select id from "group" where name = 'SF Meetup')
  group by s.group_id, s.year;
comment on view season is E'@primaryKey group_id,year';
grant select on season to :DATABASE_VISITOR;

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
