-- Enter migration here
drop function get_plate_appearances cascade;
create or replace function get_plate_appearances(
  player_id uuid = null,
  game_id uuid = null,
  season int = null,
  before_date timestamp with time zone = null,
  after_date timestamp with time zone = null
) returns table (
  game_id uuid,
  game_start_time timestamp with time zone,
  player_id uuid,
  type plate_appearance_type,
  contact contact_quality,
  hit_to fielding_position,
  runs_scored int,
  inning int,
  half_inning half_inning,
  game_state_before_id uuid,
  game_event_record_id uuid
) as $$
  select
    game.id as game_id,
    game.time_started as game_start_time,
    game_state.player_at_bat as player_id,
    plate_appearance.type,
    plate_appearance.contact,
    plate_appearance.fielded_by,
    (select count(*) from scored_runner where game_event_record_id = game_event_record.id),
    game_state.inning,
    game_state.half_inning,
    game_state_before_id,
    game_event_record.id as game_event_record_id
  from plate_appearance
    left join game_event on game_event.plate_appearance_id = plate_appearance.id
    left join game_event_record on game_event_record.game_event_id = game_event.id
    left join game_state on game_event_record.game_state_before_id = game_state.id
    left join game on game_event_record.game_id = game.id
  where ($1 is null or game_state.player_at_bat = $1)
  and ($2 is null or game_event_record.game_id = $2)
  and ($3 is null or extract(year from game.time_started) = $3)
  and ($4 is null or game.time_started <= $4)
  and ($5 is null or game.time_started >= $5);
$$ language sql stable;

drop type if exists line_score_cell cascade;
create type line_score_cell as (inning int, half_inning half_inning, runs int, hits int);
create or replace function game_line_score(g game)
returns setof line_score_cell as $$
  select
    inning,
    half_inning,
    sum(runs_scored) as runs,
    count(case when type in ('SINGLE', 'DOUBLE', 'TRIPLE', 'HOMERUN') then 1 end) as hits
  from get_plate_appearances(game_id => g.id)
  group by inning, half_inning;
$$ language sql stable;

create or replace function get_runs_scored(
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
  where ($1 is null or game_state.game_id = $1)
  and ($2 is null or player_at_bat = $2)
  and ($3 is null or runner_id = $3)
  and ($4 is null or game.time_started <= $4)
  and ($5 is null or game.time_started >= $5);
$$ language sql stable;

drop type if exists traditional_stat_line cascade;
create type traditional_stat_line as (
  player_id uuid,
  games int,
  plate_appearances int,
  at_bats int,
  hits int,
  singles int,
  doubles int,
  triples int,
  homeruns int,
  walks int,
  strikeouts int,
  sac_flies int,
  gidp int,
  runs int,
  rbi int,
  xbh int,
  batting_average double precision,
  on_base_pct double precision,
  slugging_pct double precision,
  ops double precision
);

create or replace function get_tb(
  singles int,
  doubles int,
  triples int,
  homeruns int
)
returns int as $$
  select singles + 2 * doubles + 3 * triples + 4 * homeruns;
$$ language sql stable;

create or replace function get_avg(hits int, at_bats int)
returns double precision as $$
  select case when at_bats > 0
    then cast(hits as double precision) / cast(at_bats as double precision)
    else 0.0
    end;
$$ language sql stable;

create or replace function get_slg(total_bases int, at_bats int)
returns double precision as $$
  select case when at_bats > 0
    then cast(total_bases as double precision) / cast(at_bats as double precision)
    else 0.0
    end;
$$ language sql stable;

create or replace function get_obp(
  hits int,
  walks int,
  plate_appearances int
) returns double precision as $$
  select case when plate_appearances > 0
    then cast(hits + walks as double precision) / cast(plate_appearances as double precision)
    else 0.0
    end;
$$ language sql stable;

create or replace function get_ops(
  hits int,
  total_bases int,
  walks int,
  at_bats int,
  plate_appearances int
) returns double precision as $$
  select get_slg(total_bases, at_bats) + get_obp(hits, walks, plate_appearances);
$$ language sql stable;

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
      (select count (*) from get_runs_scored(game_id => g.id, batter_id => player_id)) as rbi
    from get_plate_appearances(game_id => g.id)
    group by player_id
  ) s;
$$ language sql stable;

drop view if exists season_stats;
create view season_stats as select
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
      count(case when type = 'OUT' and contact = 'NONE' then 1 end) as strikeouts,
      count(case when type = 'SACRIFICE_FLY' then 1 end) as sac_flies,
      count(case when type = 'DOUBLE_PLAY' then 1 end) as gidp,
      (select count (*) from get_runs_scored(runner_id => player_id)) as runs,
      (select count (*) from get_runs_scored(batter_id => player_id)) as rbi
    from get_plate_appearances()
    group by player_id, season
  ) s
  where s.games > 0
  order by s.games desc, s.plate_appearances desc;
grant select on season_stats to :DATABASE_VISITOR;
comment on view season_stats is E'@foreignKey (player_id) references player (id)';

create or replace function player_traditional_stats(
  p player,
  before_date timestamp with time zone = null,
  after_date timestamp with time zone = null
)
returns traditional_stat_line as $$
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
      p.id,
      count(distinct game_id),
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
      (select count (*) from get_runs_scored(
        runner_id => p.id,
        before_date => before_date,
        after_date => after_date
      )) as runs,
      (select count (*) from get_runs_scored(
        batter_id => p.id,
        before_date => before_date,
        after_date => after_date
      )) as rbi
    from get_plate_appearances(
      player_id => p.id,
      before_date => before_date,
      after_date => after_date
    )
  ) s;
$$ language sql stable;

create or replace function player_games_played(
  p player,
  before_date timestamp with time zone = null,
  after_date timestamp with time zone = null
)
returns int as $$
  select
    count(distinct game_id)
  from game_state
    left join game on game.id = game_state.game_id
  where player_at_bat = p.id
  and (before_date is null or game.time_started <= before_date)
  and (after_date is null or game.time_started >= after_date);
$$ language sql stable;

create or replace function player_games_played_this_year(p player)
returns int as $$
  select
    count(distinct game_id)
  from game_state
    left join game on game.id = game_state.game_id
  where player_at_bat = p.id
  and extract(year from game.time_started) = extract(year from now());
$$ language sql stable;
comment on function player_games_played_this_year(player) is E'sortable';
