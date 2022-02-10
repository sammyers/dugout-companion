--! Previous: sha1:4cdd307da1310324e94fc0122ccbef0a2a7f28f2
--! Hash: sha1:1b03cfe1b8c43dcf68f76ae454e521d0dba71051

alter table "group" add column if not exists url_slug text unique;
update "group" set url_slug = lower(replace(name, ' ', ''));
alter table "group" alter column url_slug set not null;

drop function if exists get_runs_scored(uuid, uuid, uuid, timestamp with time zone, timestamp with time zone) cascade;

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
