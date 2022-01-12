--! Previous: sha1:4334332a89a98b5aa7a742edc5ca2fc470ab6d7d
--! Hash: sha1:73547e0f581f2e0947c2daa8c76b969306c9b51d

-- Enter migration here
create or replace function first_date_of_year("year" int) returns timestamp with time zone as $$
  select date_trunc('year', make_date("year", 1, 1));
$$ language sql stable;

create or replace function last_date_of_year("year" int) returns timestamp with time zone as $$
  select date_trunc('year', make_date("year" + 1, 1, 1)) - interval '1 second';
$$ language sql stable;

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
      count(case when type = 'DOUBLE_PLAY' then 1 end)::int as gidp
    from get_plate_appearances()
    group by player_id, season
  ) s
  where s.games > 0
  order by s.games desc, s.plate_appearances desc;

create or replace function game_box_score(g game)
returns setof traditional_stat_line as $$
  select
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
      player_id,
      1 as games,
      count(*)::int as plate_appearances,
      count(case when type not in ('WALK', 'SACRIFICE_FLY') then 1 end)::int as at_bats,
      count(case when type in ('SINGLE', 'DOUBLE', 'TRIPLE', 'HOMERUN') then 1 end)::int as hits,
      count(case when type = 'SINGLE' then 1 end)::int as singles,
      count(case when type = 'DOUBLE' then 1 end)::int as doubles,
      count(case when type = 'TRIPLE' then 1 end)::int as triples,
      count(case when type = 'HOMERUN' then 1 end)::int as homeruns,
      count(case when type = 'WALK' then 1 end)::int as walks,
      count(case when type = 'OUT' and contact = 'NONE' then 1 end) as strikeouts,
      count(case when type = 'SACRIFICE_FLY' then 1 end) as sac_flies,
      count(case when type = 'DOUBLE_PLAY' then 1 end) as gidp,
      (select count (*) from get_runs_scored(game_id => g.id, runner_id => player_id)) as runs,
      (select count (*) from get_runs_scored(game_id => g.id, batter_id => player_id) where batted_in = TRUE) as rbi
    from get_plate_appearances(game_id => g.id)
    group by player_id
  ) s;
$$ language sql stable;
