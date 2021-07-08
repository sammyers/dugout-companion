--! Previous: -
--! Hash: sha1:d4f1b306fc530a87bdc3d6c1629b69440ec59a5a

-- Enter migration here
alter default privileges revoke all on sequences from public;

alter default privileges revoke all on functions from public;

revoke all on schema public from public;

grant all on schema public to :DATABASE_OWNER;

grant usage on schema public to :DATABASE_VISITOR;

alter default privileges in schema public grant usage,
select
  on sequences to :DATABASE_VISITOR;

alter default privileges in schema public grant execute on functions to :DATABASE_VISITOR;

drop type if exists base_type cascade;
create type base_type as enum (
  'FIRST',
  'SECOND',
  'THIRD'
);

drop type if exists fielding_position cascade;
create type fielding_position as enum (
  'PITCHER',
  'CATCHER',
  'FIRST_BASE',
  'SECOND_BASE',
  'THIRD_BASE',
  'SHORTSTOP',
  'LEFT_FIELD',
  'CENTER_FIELD',
  'LEFT_CENTER',
  'RIGHT_CENTER',
  'RIGHT_FIELD'
);

drop type if exists plate_appearance_type cascade;
create type plate_appearance_type as enum (
  'OUT',
  'WALK',
  'SINGLE',
  'DOUBLE',
  'TRIPLE',
  'HOMERUN',
  'SACRIFICE_FLY',
  'FIELDERS_CHOICE',
  'DOUBLE_PLAY'
);

drop type if exists contact_quality cascade;
create type contact_quality as enum (
  'NONE',
  'GROUNDER',
  'LINE_DRIVE',
  'POPUP',
  'LAZY_FLY',
  'LONG_FLY'
);

drop type if exists team_role cascade;
create type team_role as enum (
  'AWAY',
  'HOME'
);

drop type if exists half_inning cascade;
create type half_inning as enum (
  'TOP',
  'BOTTOM'
);

drop table if exists player cascade;
create table player (
  id uuid primary key default gen_random_uuid (),
  first_name text not null,
  last_name text,
  unique (first_name, last_name),
  created_at timestamp default now()
);
grant select, insert (id, first_name, last_name) on player to :DATABASE_VISITOR;

insert into player (first_name, last_name) values
  ('Sam', 'Myers'),
  ('Steven', 'Chan'),
  ('Cameron', 'Walls'),
  ('Carlos', 'Ortega'),
  ('Yukhi', 'Yamashita'),
  ('James', 'Lockwood'),
  ('Matthew', 'Chinn'),
  ('Jason', 'Tong'),
  ('Andrew', 'Silva'),
  ('Quincy', 'Zhao'),
  ('Dale', 'Zelmon'),
  ('Wynn', 'Padula'),
  ('Leland', 'Bailey'),
  ('Michael', 'Cross'),
  ('Brendan', 'Wilson'),
  ('Dan', 'Keating'),
  ('Max', 'Bruk'),
  ('Hector', 'Franco'),
  ('Mike', 'Basta');

drop table if exists game cascade;
create table game (
  id serial primary key,
  name text unique,
  location text,
  score int[] not null,
  game_length int not null default 9,
  date_played date default now()
);
grant select, insert (name, location, score, game_length, date_played) on game to :DATABASE_VISITOR;

drop table if exists team cascade;
create table team (
  id serial primary key,
  game_id int references game (id) not null,
  role team_role not null,
  name text,
  winner boolean,
  unique (game_id, role)
);
grant select, insert (game_id, role, name, winner) on team to :DATABASE_VISITOR;

drop table if exists lineup cascade;
create table lineup (
  id serial primary key,
  team_id int references team (id) not null,
  original_client_id int
);
grant select, insert (team_id, original_client_id) on lineup to :DATABASE_VISITOR;

drop table if exists lineup_spot cascade;
create table lineup_spot (
  lineup_id int references lineup (id),
  player_id uuid references player (id),
  primary key (lineup_id, player_id),
  batting_order int not null,
  position fielding_position,
  unique (lineup_id, batting_order),
  unique (lineup_id, position)
);
grant select, insert on lineup_spot to :DATABASE_VISITOR;

drop table if exists plate_appearance cascade;
create table plate_appearance (
  id serial primary key,
  type plate_appearance_type not null,
  contact contact_quality,
  fielded_by fielding_position,
  runs_scored_on_sac_fly int
);
grant select, insert (type, contact, fielded_by, runs_scored_on_sac_fly) on plate_appearance to :DATABASE_VISITOR;

drop table if exists basepath_movement cascade;
create table basepath_movement (
  plate_appearance_id int references plate_appearance (id),
  runner_id uuid references player (id),
  primary key (plate_appearance_id, runner_id),
  end_base base_type,
  was_safe boolean not null
);
grant select, insert on basepath_movement to :DATABASE_VISITOR;

drop table if exists out_on_play_runner cascade;
create table out_on_play_runner (
  plate_appearance_id int references plate_appearance (id),
  runner_id uuid references player (id),
  primary key (plate_appearance_id, runner_id)
);
grant select, insert on out_on_play_runner to :DATABASE_VISITOR;

drop table if exists stolen_base_attempt cascade;
create table stolen_base_attempt (
  id serial primary key,
  runner_id uuid references player (id) not null,
  success boolean not null
);
grant select, insert (runner_id, success) on stolen_base_attempt to :DATABASE_VISITOR;

drop table if exists lineup_change cascade;
create table lineup_change (
  id serial primary key,
  lineup_before_id int references lineup (id) not null,
  lineup_after_id int references lineup(id) not null
);
grant select, insert (lineup_before_id, lineup_after_id) on lineup_change to :DATABASE_VISITOR;

drop table if exists game_event cascade;
create table game_event (
  id serial primary key,
  plate_appearance_id int references plate_appearance (id),
  stolen_base_attempt_id int references stolen_base_attempt (id),
  lineup_change_id int references lineup_change (id)
);
comment on table game_event is E'@omit many';
grant select, insert (plate_appearance_id, stolen_base_attempt_id, lineup_change_id) on game_event to :DATABASE_VISITOR;

drop table if exists game_state cascade;
create table game_state (
  id serial primary key,
  player_at_bat uuid references player (id) not null,
  inning int not null,
  half_inning half_inning not null,
  outs int not null check (outs between 0 and 3),
  score int[] not null
);
grant select, insert (player_at_bat, inning, half_inning, outs, score) on game_state to :DATABASE_VISITOR;

drop table if exists base_runner cascade;
create table base_runner (
  game_state_id int references game_state (id) not null,
  runner_id uuid references player (id) not null,
  primary key (game_state_id, runner_id),
  base base_type not null
);
grant select, insert on base_runner to :DATABASE_VISITOR;

drop table if exists lineup_for_game_state cascade;
create table lineup_for_game_state (
  game_state_id int references game_state (id) not null,
  lineup_id int references lineup (id) not null,
  primary key (game_state_id, lineup_id)
);
grant select, insert on lineup_for_game_state to :DATABASE_VISITOR;
create function "game_state_lineups"(g game_state)
returns setof lineup as $$
  select lineup.*
  from lineup
  inner join lineup_for_game_state
  on (lineup_for_game_state.lineup_id = lineup.id)
  where lineup_for_game_state.game_state_id = g.id;
$$ language sql stable;

drop table if exists game_event_record cascade;
create table game_event_record (
  id serial primary key,
  game_id int references game (id) not null,
  event_index int not null,
  unique (game_id, event_index),
  game_state_before_id int constraint game_event_record_game_state_before_fk references game_state (id) not null,
  game_state_after_id int constraint game_event_record_game_state_after_fk references game_state (id) not null,
  game_event_id int references game_event (id) not null
);
grant select,
  insert (game_id, event_index, game_state_before_id, game_state_after_id, game_event_id)
  on game_event_record to :DATABASE_VISITOR;
comment on constraint game_event_record_game_state_before_fk on game_event_record is E'@fieldName gameStateBefore';
comment on constraint game_event_record_game_state_after_fk on game_event_record is E'@fieldName gameStateAfter';

drop table if exists scored_runner cascade;
create table scored_runner (
  game_event_record_id int references game_event_record (id) not null,
  runner_id uuid references player (id) not null,
  primary key (game_event_record_id, runner_id),
  batted_in boolean not null
);
grant select, insert on scored_runner to :DATABASE_VISITOR;
