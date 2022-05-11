--! Previous: sha1:bb8a9b9e756cc378a17156ec75959f38969563b0
--! Hash: sha1:f3e729fa9e901a56959b9869cf1e299d38da39f5

--! split: 1-current.sql
-- alter foreign table foreign_db_player add column if not exists player_nickname varchar(125);
-- alter foreign table foreign_db_player add column if not exists player_self_nickname varchar(250);
-- alter foreign table foreign_db_player add column if not exists player_gender int;
-- alter foreign table foreign_db_player add column if not exists player_bats int;
-- alter foreign table foreign_db_player add column if not exists player_throws int;
-- alter foreign table foreign_db_player add column if not exists player_position_1 int;
-- alter foreign table foreign_db_player add column if not exists player_position_2 int;
-- alter foreign table foreign_db_player add column if not exists player_position_3 int;
-- alter foreign table foreign_db_player add column if not exists player_added timestamp;
-- alter foreign table foreign_db_player add column if not exists player_fav_team varchar(125);
-- alter foreign table foreign_db_player add column if not exists player_hometown varchar(200);
-- alter foreign table foreign_db_player add column if not exists player_schools varchar(200);
-- alter foreign table foreign_db_player add column if not exists player_skill int;
-- alter foreign table foreign_db_player add column if not exists group_id int;
-- alter foreign table foreign_db_player add column if not exists player_debut date;

-- alter foreign table foreign_db_field add column if not exists field_rating int;

-- alter foreign table foreign_db_game add column if not exists field_id int;
-- alter foreign table foreign_db_game add column if not exists game_pic_gallery varchar(260);
-- alter foreign table foreign_db_game add column if not exists event_id varchar(20);
-- alter foreign table foreign_db_game add column if not exists game_date_insert date;
-- alter foreign table foreign_db_game add column if not exists game_date_update date;
-- alter foreign table foreign_db_game add column if not exists game_adv int;
-- alter foreign table foreign_db_game add column if not exists game_cnt int;

-- alter foreign table foreign_db_stat_line add column if not exists sb_stats_s int;
-- alter foreign table foreign_db_stat_line add column if not exists sb_stats_p int;
-- alter foreign table foreign_db_stat_line add column if not exists sb_stats_p_innings varchar(2);
-- alter foreign table foreign_db_stat_line add column if not exists sb_stats_p_er varchar(2);
-- alter foreign table foreign_db_stat_line add column if not exists sb_stats_p_tr varchar(2);
-- alter foreign table foreign_db_stat_line add column if not exists sb_stats_p_hits varchar(2);
-- alter foreign table foreign_db_stat_line add column if not exists sb_stats_p_hr varchar(2);
-- alter foreign table foreign_db_stat_line add column if not exists sb_stats_p_w int;
-- alter foreign table foreign_db_stat_line add column if not exists sb_stats_p_l int;
-- alter foreign table foreign_db_stat_line add column if not exists sb_stats_p_k varchar(2);
-- alter foreign table foreign_db_stat_line add column if not exists sb_stats_p_bb varchar(2);
-- alter foreign table foreign_db_stat_line add column if not exists sb_stats_p_sv int;
-- alter foreign table foreign_db_stat_line add column if not exists sb_stats_p_cg int;
-- alter foreign table foreign_db_stat_line add column if not exists sb_stats_p_qs int;

drop type if exists gender cascade;
create type gender as enum (
  'MALE',
  'FEMALE'
);

drop type if exists handedness cascade;
create type handedness as enum (
  'LEFT',
  'RIGHT',
  'BOTH'
);

drop table if exists legacy_meetup_player_raw cascade;
create table legacy_meetup_player_raw (
  id int primary key,
  name text unique not null,
  gender gender not null,
  nickname text,
  self_nickname text,
  bats handedness not null,
  throws handedness not null,
  image_url text,
  meetup_member_id text,
  skill_level integer,
  preferred_position_first fielding_position not null,
  preferred_position_second fielding_position not null,
  preferred_position_third fielding_position not null,
  favorite_team text,
  hometown text,
  school text,
  time_added timestamp not null,
  date_debuted date
);

drop table if exists legacy_meetup_field_raw cascade;
create table legacy_meetup_field_raw (
  id int primary key,
  name text not null,
  sub_field text,
  unique (name, sub_field),
  address text not null,
  rating int not null
);

drop table if exists legacy_meetup_team_raw cascade;
create table legacy_meetup_team_raw (
 id int primary key,
 name text unique not null
);

drop table if exists legacy_meetup_game_raw cascade;
create table legacy_meetup_game_raw (
  id int primary key,
  name text unique not null,
  season int not null,
  "date" date not null,
  time_started time not null,
  time_ended time not null,
  winning_team_id int not null references legacy_meetup_team_raw (id),
  losing_team_id int not null references legacy_meetup_team_raw (id),
  field_id int not null references legacy_meetup_field_raw (id),
  image_gallery_url text,
  meetup_event_id text,
  date_inserted date,
  date_updated date,
  advanced boolean not null
);

drop table if exists legacy_meetup_stat_line_raw cascade;
create table legacy_meetup_stat_line_raw (
  id int primary key,
  player_id int not null references legacy_meetup_player_raw (id),
  game_id int not null references legacy_meetup_game_raw (id),
  team_id int not null references legacy_meetup_team_raw (id),
  at_bats int not null,
  runs int not null,
  hits int not null,
  singles int not null,
  doubles int not null,
  triples int not null,
  homeruns int not null,
  rbi int not null,
  walks int not null,
  strikeouts int not null,
  sac_flies int not null,
  stolen_bases int not null,
  pitched boolean not null,
  pitcher_won boolean not null,
  pitcher_lost boolean not null,
  pitcher_save boolean not null,
  pitcher_complete_game boolean not null,
  pitcher_quality_start boolean not null,
  innings_pitched int not null,
  runs_allowed int not null,
  earned_runs_allowed int not null,
  hits_allowed int not null,
  homeruns_allowed int not null,
  pitcher_strikeouts int not null,
  pitcher_walks int not null
);

-- create or replace function get_player_position_from_int(value int) returns fielding_position as $$
--   select (case
--     when value = 1 then 'PITCHER'
--     when value = 2 then 'CATCHER'
--     when value = 3 then 'FIRST_BASE'
--     when value = 4 then 'SECOND_BASE'
--     when value = 5 then 'THIRD_BASE'
--     when value = 6 then 'SHORTSTOP'
--     when value = 7 then 'LEFT_FIELD'
--     when value = 8 then 'CENTER_FIELD'
--     when value = 9 then 'RIGHT_FIELD'
--     when value = 10 then 'LEFT_CENTER'
--     when value = 11 then 'RIGHT_CENTER'
--   end)::fielding_position;
-- $$ language sql stable;

-- -- Lol this is terrible
-- create or replace function dedupe_player_name(player_id int) returns text as $$
--   select case
--     when player_id = 45 then 'Tim Newman'
--     when player_id = 91 then 'Alex 1'
--     when player_id = 92 then 'David 1'
--     when player_id = 104 then 'Ben 1'
--     when player_id = 107 then 'Robert 1'
--     when player_id = 119 then 'Tim 1'
--     when player_id = 133 then 'Chris 1'
--     when player_id = 145 then 'Alex 2'
--     when player_id = 149 then 'Josh 1'
--     when player_id = 165 then 'Chris 2'
--     when player_id = 191 then 'Chris 3'
--     when player_id = 231 then 'Sam 1'
--     when player_id = 284 then 'David 2'
--     when player_id = 304 then 'Ryan 1'
--     when player_id = 332 then 'Josh 2'
--     when player_id = 348 then 'Robert 2'
--     when player_id = 362 then 'Tim 2'
--     when player_id = 367 then 'Mark 1'
--     when player_id = 381 then 'Josh 3'
--     when player_id = 390 then 'David 3'
--     when player_id = 399 then 'Vanessa 1'
--     when player_id = 408 then 'Alex M 1'
--     when player_id = 452 then 'Ryan 2'
--     when player_id = 485 then 'Mark 2'
--     when player_id = 490 then 'Alex M 2'
--     when player_id = 531 then 'Ryan 3'
--     when player_id = 542 then 'Vanessa 2'
--     when player_id = 547 then 'David 4'
--     when player_id = 560 then 'Sam 2'
--     when player_id = 578 then 'Alex 3'
--   else null end;
-- $$ language sql stable;

-- insert into legacy_meetup_player_raw (
--   id,
--   name,
--   gender,
--   nickname,
--   self_nickname,
--   bats,
--   throws,
--   image_url,
--   meetup_member_id,
--   skill_level,
--   preferred_position_first,
--   preferred_position_second,
--   preferred_position_third,
--   favorite_team,
--   hometown,
--   school,
--   time_added,
--   date_debuted
-- ) select
--   player_id,
--   coalesce(dedupe_player_name(player_id), player_name),
--   (case when player_gender = 1 then 'MALE' else 'FEMALE' end)::gender,
--   nullif(player_nickname, ''),
--   nullif(player_self_nickname, ''),
--   (case when player_bats = 1 then 'RIGHT' when player_bats = 2 then 'LEFT' else 'BOTH' end)::handedness,
--   (case when player_throws = 1 then 'RIGHT' when player_throws = 2 then 'LEFT' else 'BOTH' end)::handedness,
--   nullif(player_image, ''),
--   member_id,
--   player_skill,
--   get_player_position_from_int(player_position_1),
--   get_player_position_from_int(player_position_2),
--   get_player_position_from_int(player_position_3),
--   nullif(player_fav_team, ''),
--   nullif(player_hometown, ''),
--   nullif(player_schools, ''),
--   player_added,
--   case when player_debut is not null then to_date(player_debut, 'YYYY-MM-DD') else null end
-- from foreign_db_player
-- where group_id = 10;

-- drop function get_player_position_from_int;
-- drop function dedupe_player_name;

-- insert into legacy_meetup_field_raw (
--   id,
--   name,
--   address,
--   sub_field,
--   rating
-- ) select
--   field_id,
--   field_name,
--   field_address,
--   field_number,
--   field_rating
-- from foreign_db_field;

-- insert into legacy_meetup_team_raw (id, name)
-- select * from foreign_db_team;

-- create or replace function dedupe_game_name(game_id int) returns text as $$
--   select case
--     when game_id = 8 then 'Thanksgiving Tourney 2'
--     when game_id = 26 then 'Thanksgiving Tourney 1'
--     when game_id = 170 then 'Saturday Game 78 #1'
--     when game_id = 171 then 'Saturday Game 78 #2'
--     when game_id = 172 then 'Saturday Game 79 #1'
--     when game_id = 173 then 'Saturday Game 79 #2'
--     when game_id = 176 then 'Saturday Game 81 #1'
--     when game_id = 177 then 'Saturday Game 81 #2'
--     when game_id = 263 then 'Game 110'
--     when game_id = 264 then 'Game 110 #2'
--     when game_id = 526 then 'Memorial Day 2018 Game 4'
--     when game_id = 527 then 'Memorial Day 2018 Game 3'
--     when game_id = 530 then 'Memorial Day 2018 Game 1'
--     when game_id = 531 then 'Memorial Day 2018 Game 2'
--     else null end;
-- $$ language sql stable;

-- insert into legacy_meetup_game_raw (
--   id,
--   name,
--   season,
--   "date",
--   time_started,
--   time_ended,
--   winning_team_id,
--   losing_team_id,
--   field_id,
--   image_gallery_url,
--   meetup_event_id,
--   date_inserted,
--   date_updated,
--   advanced
-- ) select
--   game_id,
--   coalesce(dedupe_game_name(game_id), game_title),
--   season,
--   game_date,
--   game_start_time,
--   game_end_time,
--   game_team_id_1,
--   game_team_id_2,
--   field_id,
--   game_pic_gallery,
--   nullif(event_id, ''),
--   game_date_insert,
--   game_date_update,
--   game_adv::boolean
-- from foreign_db_game
-- where game_cnt = 1
-- and (
--   select count(*) from foreign_db_stat_line where foreign_db_stat_line.game_id = foreign_db_game.game_id
-- ) > 0;

-- drop function dedupe_game_name;

-- insert into legacy_meetup_stat_line_raw (
--   id,
--   player_id,
--   game_id,
--   team_id,
--   at_bats,
--   runs,
--   hits,
--   singles,
--   doubles,
--   triples,
--   homeruns,
--   rbi,
--   walks,
--   strikeouts,
--   sac_flies,
--   stolen_bases,
--   pitched,
--   pitcher_won,
--   pitcher_lost,
--   pitcher_save,
--   pitcher_complete_game,
--   pitcher_quality_start,
--   innings_pitched,
--   runs_allowed,
--   earned_runs_allowed,
--   hits_allowed,
--   homeruns_allowed,
--   pitcher_strikeouts,
--   pitcher_walks
-- ) select
--   sb_stats_id,
--   player_id,
--   game_id,
--   sb_stats_team,
--   sb_stats_ab,
--   sb_stats_runs,
--   sb_stats_hits,
--   sb_stats_1b,
--   sb_stats_2b,
--   sb_stats_3b,
--   sb_stats_hr,
--   sb_stats_rbi,
--   sb_stats_bb,
--   sb_stats_so,
--   sb_stats_sac,
--   sb_stats_s,
--   sb_stats_p::boolean,
--   sb_stats_p_w::boolean,
--   sb_stats_p_l::boolean,
--   sb_stats_p_sv::boolean,
--   sb_stats_p_cg::boolean,
--   sb_stats_p_qs::boolean,
--   coalesce(nullif(sb_stats_p_innings, ''), '0')::int,
--   coalesce(nullif(sb_stats_p_tr, ''), '0')::int,
--   coalesce(nullif(sb_stats_p_er, ''), '0')::int,
--   coalesce(nullif(sb_stats_p_hits, ''), '0')::int,
--   coalesce(nullif(sb_stats_p_hr, ''), '0')::int,
--   coalesce(nullif(sb_stats_p_k, ''), '0')::int,
--   coalesce(nullif(sb_stats_p_bb, ''), '0')::int
-- from foreign_db_stat_line
-- where player_id <> 17;
