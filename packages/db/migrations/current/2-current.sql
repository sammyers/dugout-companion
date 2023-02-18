drop type if exists plate_appearance_with_context cascade;

create type plate_appearance_with_context as (
  game_id uuid,
  batter_id uuid,
  type plate_appearance_type,
  contact contact_quality,
  hit_to fielding_position,
  runs_scored int,
  inning int,
  half_inning half_inning,
  game_state_before_id uuid,
  game_event_record_id uuid
);

