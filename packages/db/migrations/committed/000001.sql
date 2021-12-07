--! Previous: -
--! Hash: sha1:b5292247442b8668d22f2a3da0c901929e226c74

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

drop table if exists "group" cascade;
create table "group" (
  id uuid primary key default gen_random_uuid (),
  name text unique not null,
  notes text
);
grant select, insert on "group" to :DATABASE_VISITOR;

drop table if exists player cascade;
create table player (
  id uuid primary key default gen_random_uuid (),
  group_id uuid references "group" (id) not null,
  legacy_player_id int,
  first_name text not null,
  last_name text,
  unique (first_name, last_name),
  nickname text,
  image_url text,
  time_created timestamp with time zone default now()
);
grant select, insert on player to :DATABASE_VISITOR;

create or replace function player_full_name(p player)
returns text as $$
  select
    case when p.last_name is null
      then p.first_name
      else p.first_name || ' ' || p.last_name
    end; 
$$ language sql stable;
comment on function player_full_name(player) is E'@sortable';

drop table if exists field cascade;
create table field (
  id uuid primary key default gen_random_uuid (),
  name text not null,
  notes text
);
grant select, insert (name, notes) on field to :DATABASE_VISITOR;

drop table if exists game cascade;
create table game (
  id uuid primary key default gen_random_uuid (),
  group_id uuid references "group" (id) not null,
  name text unique,
  field_id uuid references field (id),
  score int[] not null,
  game_length int not null default 9,
  time_started timestamp with time zone not null,
  time_ended timestamp with time zone not null,
  time_saved timestamp with time zone not null default now()
);
grant select, insert on game to :DATABASE_VISITOR;

drop table if exists team cascade;
create table team (
  id uuid primary key default gen_random_uuid (),
  game_id uuid references game (id) not null,
  role team_role not null,
  name text,
  captain_id uuid references player (id),
  winner boolean,
  unique (game_id, role)
);
grant select, insert (game_id, role, name, captain_id, winner) on team to :DATABASE_VISITOR;

drop table if exists lineup cascade;
create table lineup (
  id uuid primary key default gen_random_uuid (),
  team_id uuid references team (id) not null
);
grant select, insert (id, team_id) on lineup to :DATABASE_VISITOR;

drop table if exists lineup_spot cascade;
create table lineup_spot (
  lineup_id uuid references lineup (id),
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
  id uuid primary key default gen_random_uuid (),
  type plate_appearance_type not null,
  contact contact_quality,
  fielded_by fielding_position,
  runs_scored_on_sac_fly int,
  routine_play boolean not null default FALSE
);
grant select, insert (type, contact, fielded_by, runs_scored_on_sac_fly) on plate_appearance to :DATABASE_VISITOR;

drop table if exists basepath_movement cascade;
create table basepath_movement (
  plate_appearance_id uuid references plate_appearance (id),
  runner_id uuid references player (id),
  primary key (plate_appearance_id, runner_id),
  end_base base_type,
  was_safe boolean not null
);
grant select, insert on basepath_movement to :DATABASE_VISITOR;

drop table if exists out_on_play_runner cascade;
create table out_on_play_runner (
  plate_appearance_id uuid references plate_appearance (id),
  runner_id uuid references player (id),
  primary key (plate_appearance_id, runner_id)
);
grant select, insert on out_on_play_runner to :DATABASE_VISITOR;

drop table if exists stolen_base_attempt cascade;
create table stolen_base_attempt (
  id uuid primary key default gen_random_uuid (),
  runner_id uuid references player (id) not null,
  success boolean not null
);
grant select, insert (runner_id, success) on stolen_base_attempt to :DATABASE_VISITOR;

drop table if exists lineup_change cascade;
create table lineup_change (
  id uuid primary key default gen_random_uuid (),
  lineup_before_id uuid references lineup (id) not null,
  lineup_after_id uuid references lineup(id) not null
);
grant select, insert (lineup_before_id, lineup_after_id) on lineup_change to :DATABASE_VISITOR;

drop table if exists game_event cascade;
create table game_event (
  id uuid primary key default gen_random_uuid (),
  plate_appearance_id uuid references plate_appearance (id),
  stolen_base_attempt_id uuid references stolen_base_attempt (id),
  lineup_change_id uuid references lineup_change (id)
);
comment on table game_event is E'@omit many';
grant select, insert (plate_appearance_id, stolen_base_attempt_id, lineup_change_id) on game_event to :DATABASE_VISITOR;

drop table if exists game_state cascade;
create table game_state (
  id uuid primary key default gen_random_uuid (),
  game_id uuid references game (id) not null,
  game_state_index int not null,
  player_at_bat uuid references player (id) not null,
  inning int not null,
  half_inning half_inning not null,
  outs int not null check (outs between 0 and 3),
  score int[] not null
);
grant select, insert on game_state to :DATABASE_VISITOR;

drop table if exists base_runner cascade;
create table base_runner (
  game_state_id uuid references game_state (id) not null,
  runner_id uuid references player (id) not null,
  primary key (game_state_id, runner_id),
  base base_type not null
);
grant select, insert on base_runner to :DATABASE_VISITOR;

drop table if exists lineup_for_game_state cascade;
create table lineup_for_game_state (
  game_state_id uuid references game_state (id) not null,
  lineup_id uuid references lineup (id) not null,
  primary key (game_state_id, lineup_id)
);
grant select, insert on lineup_for_game_state to :DATABASE_VISITOR;
create or replace function "game_state_lineups"(g game_state)
returns setof lineup as $$
  select lineup.*
  from lineup
  inner join lineup_for_game_state
  on (lineup_for_game_state.lineup_id = lineup.id)
  where lineup_for_game_state.game_state_id = g.id;
$$ language sql stable;

drop table if exists game_event_record cascade;
create table game_event_record (
  id uuid primary key default gen_random_uuid (),
  game_id uuid references game (id) not null,
  event_index int not null,
  unique (game_id, event_index),
  game_state_before_id uuid constraint game_event_record_game_state_before_fk references game_state (id) not null,
  game_state_after_id uuid constraint game_event_record_game_state_after_fk references game_state (id) not null,
  game_event_id uuid references game_event (id) not null,
  notes text
);
grant select,
  insert (game_id, event_index, game_state_before_id, game_state_after_id, game_event_id)
  on game_event_record to :DATABASE_VISITOR;
comment on constraint game_event_record_game_state_before_fk on game_event_record is E'@fieldName gameStateBefore';
comment on constraint game_event_record_game_state_after_fk on game_event_record is E'@fieldName gameStateAfter';

drop table if exists scored_runner cascade;
create table scored_runner (
  game_event_record_id uuid references game_event_record (id) not null,
  runner_id uuid references player (id) not null,
  primary key (game_event_record_id, runner_id),
  batted_in boolean not null
);
grant select, insert on scored_runner to :DATABASE_VISITOR;

create or replace function team_final_lineup(t team)
returns lineup as $$
  select lineup.* from lineup
    left join lineup_for_game_state on lineup.id = lineup_for_game_state.lineup_id
  where game_state_id = (
    select id from game_state where game_id = t.game_id
    order by game_state_index desc limit 1
  )
  and team_id = t.id;
$$ language sql stable;

drop foreign table if exists legacy_player;
create foreign table legacy_player (
  player_id int not null,
  player_name varchar(240) not null,
  player_image varchar(255),
  member_id varchar(25)
)
server legacy_stats_mysql options (dbname ':LEGACY_DB_NAME', table_name 'player');
grant select on legacy_player to :DATABASE_VISITOR;
comment on foreign table legacy_player is E'@primaryKey player_id';
comment on table player is E'@foreignKey (legacy_player_id) references legacy_player (player_id)';

drop foreign table if exists legacy_field;
create foreign table legacy_field (
  field_id int not null,
  field_name varchar(120) not null,
  field_address varchar(260) not null,
  field_number varchar(100)
)
server legacy_stats_mysql options (dbname ':LEGACY_DB_NAME', table_name 'field');
grant select on legacy_field to :DATABASE_VISITOR;
comment on foreign table legacy_field is E'@primaryKey field_id';

drop foreign table if exists legacy_game;
create foreign table legacy_game (
  game_id int not null,
  game_title varchar(236) not null,
  game_date date not null,
  game_start_time time not null,
  game_end_time time not null,
  game_team_id_1 int not null,
  game_team_id_2 int not null,
  season int not null
)
server legacy_stats_mysql options (dbname ':LEGACY_DB_NAME', table_name 'game');
grant select on legacy_game to :DATABASE_VISITOR;
comment on foreign table legacy_game is E'@primaryKey game_id';

drop foreign table if exists legacy_team;
create foreign table legacy_team (
  team_id int not null,
  team_name varchar(128) not null
)
server legacy_stats_mysql options (dbname ':LEGACY_DB_NAME', table_name 'team');
grant select on legacy_team to :DATABASE_VISITOR;
comment on foreign table legacy_team is E'@primaryKey team_id';

drop foreign table if exists legacy_stat_line;
create foreign table legacy_stat_line (
  sb_stats_id int not null,
  player_id int not null,
  game_id int not null,
  sb_stats_team int not null,
  sb_stats_AB int not null,
  sb_stats_runs int not null,
  sb_stats_hits int not null,
  sb_stats_1B int not null,
  sb_stats_2B int not null,
  sb_stats_3B int not null,
  sb_stats_HR int not null,
  sb_stats_RBI int not null,
  sb_stats_bb int not null,
  sb_stats_so int not null,
  sb_stats_sac int not null
)
server legacy_stats_mysql options (dbname ':LEGACY_DB_NAME', table_name 'softball_stats');
grant select on legacy_stat_line to :DATABASE_VISITOR;
comment on foreign table legacy_stat_line is E'@foreignKey (player_id) references legacy_player (player_id)\n@foreignKey (game_id) references legacy_game (game_id)\n@foreignKey (sb_stats_team) references legacy_team (team_id)';
-- comment on column legacy_stat_line.sb_stats_team is E'@name team_id';
comment on column legacy_stat_line.sb_stats_AB is E'@name at_bats';
comment on column legacy_stat_line.sb_stats_runs is E'@name runs';
comment on column legacy_stat_line.sb_stats_hits is E'@name hits';
comment on column legacy_stat_line.sb_stats_1B is E'@name singles';
comment on column legacy_stat_line.sb_stats_2B is E'@name doubles';
comment on column legacy_stat_line.sb_stats_3B is E'@name triples';
comment on column legacy_stat_line.sb_stats_HR is E'@name homeruns';
comment on column legacy_stat_line.sb_stats_RBI is E'@name rbi';
comment on column legacy_stat_line.sb_stats_bb is E'@name walks';
comment on column legacy_stat_line.sb_stats_so is E'@name strikeouts';
comment on column legacy_stat_line.sb_stats_sac is E'@name sac_flies';
