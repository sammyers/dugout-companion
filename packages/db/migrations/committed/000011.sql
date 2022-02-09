--! Previous: sha1:dc74aa7670ad7321553b7257ff1e81af9ab433c1
--! Hash: sha1:4cdd307da1310324e94fc0122ccbef0a2a7f28f2

create or replace function get_runs_scored(
  group_id uuid = null,
  game_id uuid = null,
  batter_id uuid = null,
  runner_id uuid = null,
  before_date timestamp with time zone = null,
  after_date timestamp with time zone = null
) returns table (
  batter_id uuid,
  runner_id uuid,
  batted_in boolean
) as $$
  select
    player_at_bat as batter_id,
    runner_id,
    batted_in
  from public.scored_runner
    left join game_event_record on game_event_record.id = scored_runner.game_event_record_id
    left join game_state on game_event_record.game_state_before_id = game_state.id
    left join game on game_event_record.game_id = game.id
  where ($1 is null or game.group_id = $1)
  and ($2 is null or game_state.game_id = $2)
  and ($3 is null or player_at_bat = $3)
  and ($4 is null or runner_id = $4)
  and ($5 is null or game.time_started <= $5)
  and ($6 is null or game.time_started >= $6);
$$ language sql stable;

create or replace view modern_season_stats as
  select
    s.*,
    (select count (*) from get_runs_scored(
      group_id => group_id,
      runner_id => player_id,
      after_date => first_date_of_year(season),
      before_date => last_date_of_year(season)
    ))::int as runs,
    (select count (*) from get_runs_scored(
      group_id => group_id,
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

  drop function if exists player_traditional_stats;
