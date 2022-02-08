-- Enter migration here
alter type fielding_position add value if not exists 'MIDDLE_INFIELD';
alter type contact_quality add value if not exists 'FOUL';
alter type contact_quality add value if not exists 'DEAD_BALL';

alter table "group" add column if not exists solo_mode boolean;
alter table game add column if not exists solo_mode boolean;
alter table team add column if not exists solo_mode_opponent boolean;
grant select, insert on team to :DATABASE_VISITOR;

create table if not exists solo_mode_opponent_inning (
  id uuid primary key default gen_random_uuid (),
  runs_scored int not null
);
grant select, insert (runs_scored) on solo_mode_opponent_inning to :DATABASE_VISITOR;

alter table game_event add column if not exists solo_mode_opponent_inning_id uuid references solo_mode_opponent_inning (id);
grant select, insert (plate_appearance_id, stolen_base_attempt_id, lineup_change_id, solo_mode_opponent_inning_id) on game_event to :DATABASE_VISITOR;

alter table player drop constraint if exists player_first_name_last_name_key;
alter table player drop constraint if exists player_name_unique_in_group;
alter table player add constraint player_name_unique_in_group unique (group_id, first_name, last_name);

insert into "group" (name)
values ('Solo Mode Opponent')
on conflict (name) do nothing;

insert into player (group_id, first_name, last_name)
values (
  (select id from "group" where name = 'Solo Mode Opponent'),
  'Opponent',
  'Batter'
)
on conflict on constraint player_name_unique_in_group do nothing;

create or replace function game_line_score(g game)
returns setof line_score_cell as $$
  (select
    inning,
    half_inning,
    sum(runs_scored) as runs,
    count(case when type in ('SINGLE', 'DOUBLE', 'TRIPLE', 'HOMERUN') then 1 end) as hits
  from get_plate_appearances(game_id => g.id)
  group by inning, half_inning)
  union
  (select
    game_state.inning,
    game_state.half_inning,
    runs_scored as runs,
    0 as hits
  from solo_mode_opponent_inning
    left join game_event on game_event.solo_mode_opponent_inning_id = solo_mode_opponent_inning.id
    left join game_event_record on game_event_record.game_event_id = game_event.id
    left join game_state on game_event_record.game_state_before_id = game_state.id
    left join game on game_event_record.game_id = game.id
    where game.id = g.id)
$$ language sql stable;
