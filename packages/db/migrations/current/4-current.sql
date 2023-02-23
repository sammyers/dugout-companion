create or replace view game_batting_stats as
  select
    s1.game_id,
    s5.team_id,
    s1.player_id,
    s1.plate_appearances,
    s1.at_bats,
    s1.hits,
    s1.singles,
    s1.doubles,
    s1.triples,
    s1.homeruns,
    s1.walks,
    s1.strikeouts,
    s1.sac_flies,
    s1.gidp,
    coalesce(s2.runs, 0)::int as runs,
    coalesce(s3.rbi, 0)::int as rbi,
    coalesce(s4.stolen_bases, 0)::int as stolen_bases
  from (
    select
      plate_appearance.game_id,
      game_state.player_at_bat as player_id,
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
    from plate_appearance
      left join game_event on game_event.plate_appearance_id = plate_appearance.id
      left join game_event_record on game_event_record.game_event_id = game_event.id
      left join game_state on game_state.id = game_event_record.game_state_before_id
    group by plate_appearance.game_id, game_state.player_at_bat
  ) s1
    left join (
      select game_id, runner_id, count(*) as runs
      from scored_runner
      group by game_id, runner_id
    ) s2
      on (s2.game_id, s2.runner_id) = (s1.game_id, s1.player_id)
    left join (
      select scored_runner.game_id, game_state.player_at_bat as batter_id, count(*) as rbi
      from scored_runner
        left join game_event_record on game_event_record.id = scored_runner.game_event_record_id
        left join game_state on game_state.id = game_event_record.game_state_before_id
      where batted_in = true
      group by scored_runner.game_id, game_state.player_at_bat
    ) s3
      on (s3.game_id, s3.batter_id) = (s1.game_id, s1.player_id)
    left join (
      select game_id, runner_id, count(*) as stolen_bases
      from stolen_base_attempt
      where success = true
      group by game_id, runner_id
    ) s4
      on (s4.game_id, s4.runner_id) = (s1.game_id, s1.player_id)
    left join (
      select distinct lineup_spot.game_id, lineup.team_id, lineup_spot.player_id
      from lineup_spot
        left join lineup on lineup.id = lineup_spot.lineup_id
    ) s5
      on (s5.game_id, s5.player_id) = (s1.game_id, s1.player_id)
  union
  select * from manual_entry_batting_line;

create or replace view season_batting_stats as
  select
    game.group_id,
    stats.player_id,
    extract(year from game.time_started)::int as season,
    count(*)::int as games,
    sum(stats.plate_appearances)::int as plate_appearances,
    sum(stats.at_bats)::int as at_bats,
    sum(stats.hits)::int as hits,
    sum(stats.singles)::int as singles,
    sum(stats.doubles)::int as doubles,
    sum(stats.triples)::int as triples,
    sum(stats.homeruns)::int as homeruns,
    sum(stats.walks)::int as walks,
    sum(stats.strikeouts)::int as strikeouts,
    sum(stats.sac_flies)::int as sac_flies,
    sum(stats.gidp)::int as gidp,
    sum(stats.runs)::int as runs,
    sum(stats.rbi)::int as rbi,
    sum(stats.stolen_bases)::int as stolen_bases
  from game_batting_stats as stats
    left join game on game.id = stats.game_id
  group by game.group_id, stats.player_id, extract(year from game.time_started);

create or replace view career_batting_stats as
  select
    stats.group_id,
    stats.player_id,
    count(*)::int as seasons,
    sum(stats.games)::int as games,
    sum(stats.plate_appearances)::int as plate_appearances,
    sum(stats.at_bats)::int as at_bats,
    sum(stats.hits)::int as hits,
    sum(stats.singles)::int as singles,
    sum(stats.doubles)::int as doubles,
    sum(stats.triples)::int as triples,
    sum(stats.homeruns)::int as homeruns,
    sum(stats.walks)::int as walks,
    sum(stats.strikeouts)::int as strikeouts,
    sum(stats.sac_flies)::int as sac_flies,
    sum(stats.gidp)::int as gidp,
    sum(stats.runs)::int as runs,
    sum(stats.rbi)::int as rbi,
    sum(stats.stolen_bases)::int as stolen_bases
  from season_batting_stats as stats
  group by stats.group_id, stats.player_id;
