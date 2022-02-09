--! Previous: sha1:881da6ad321793f8ba1f71647fa14d419761795b
--! Hash: sha1:dc74aa7670ad7321553b7257ff1e81af9ab433c1

create table if not exists player_group_membership (
  player_id uuid references player (id) not null,
  group_id uuid references "group" (id) not null,
  primary key (player_id, group_id)
);
grant select, insert on player_group_membership to :DATABASE_VISITOR;

alter table player add column if not exists group_id uuid;
insert into player_group_membership (player_id, group_id)
select id, group_id from player where group_id is not null;

create or replace view modern_season_stats as
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
      group_id,
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
    from (
      select game.group_id, pa.* from
      (select * from get_plate_appearances()) pa
      left join game on pa.game_id = game.id
    ) pa
    group by group_id, player_id, season
  ) s
  where s.games > 0
  order by s.games desc, s.plate_appearances desc;

alter table player drop column group_id;
alter table player drop constraint if exists player_name_unique;
alter table player add constraint player_name_unique unique (first_name, last_name);

create or replace function group_players(g "group")
returns setof player as $$
  select player.*
  from player
  inner join player_group_membership
  on (player_group_membership.player_id = player.id)
  where player_group_membership.group_id = g.id;
$$ language sql stable;
