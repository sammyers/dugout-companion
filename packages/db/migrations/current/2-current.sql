alter table legacy_meetup_field_raw add column if not exists dc_id uuid;
update legacy_meetup_field_raw set dc_id = gen_random_uuid() where dc_id is null;
alter table legacy_meetup_field_raw alter column dc_id set not null;

alter table field add column if not exists address text not null;

insert into field (id, name, address)
select
  dc_id,
  concat(
    legacy_meetup_field_raw.name,
    case when sub_field is not null then concat(' (', sub_field, ')') else '' end
  ),
  legacy_meetup_field_raw.address
from legacy_meetup_field_raw
  left join field on field.id = legacy_meetup_field_raw.dc_id
  where field.id is null;

alter table legacy_meetup_game_raw add column if not exists dc_id uuid;
update legacy_meetup_game_raw set dc_id = gen_random_uuid() where dc_id is null;
alter table legacy_meetup_game_raw alter column dc_id set not null;

alter table game add column if not exists manual_entry boolean default false;
update game set manual_entry = false where manual_entry is null;
alter table game alter column manual_entry set not null;

alter table game add column if not exists legacy_meetup boolean default false;
update game set legacy_meetup = false where legacy_meetup is null;
alter table game alter column legacy_meetup set not null;

update game set solo_mode = false where solo_mode is null;
alter table game alter column solo_mode set not null;

drop table if exists game_aux_meetup_info;
create table game_aux_meetup_info (
  game_id uuid primary key references player (id),
  image_gallery_url text,
  meetup_event_id text,
  advanced boolean not null default false
);
alter table game_aux_meetup_info enable row level security;
drop policy if exists select_all on game_aux_meetup_info;
create policy select_all on game_aux_meetup_info for select using (true);
grant select on game_aux_meetup_info to :DATABASE_VISITOR, :DATABASE_USER, :DATABASE_ADMIN;

insert into game (
  id,
  group_id,
  name,
  field_id,
  time_started,
  time_ended,
  score,
  game_length,
  solo_mode,
  manual_entry,
  legacy_meetup
)
select
  dc_id,
  (select "group".id from "group" where name = 'SF Meetup'),
  legacy_meetup_game_raw.name,
  (select dc_id from legacy_meetup_field_raw where legacy_meetup_field_raw.id = legacy_meetup_game_raw.field_id),
  concat(legacy_meetup_game_raw.date, ' ', legacy_meetup_game_raw.time_started)::timestamptz at time zone 'US/Pacific',
	concat(legacy_meetup_game_raw.date, ' ', legacy_meetup_game_raw.time_ended)::timestamptz at time zone 'US/Pacific',
  '{-1,-1}',
  0,
  false,
  true,
  true
from legacy_meetup_game_raw
  left join game on game.id = legacy_meetup_game_raw.dc_id
  where game.id is null and legacy_meetup_game_raw.id not in (920, 921, 922, 923);

update team set solo_mode_opponent = false where solo_mode_opponent is null;
alter table team alter column solo_mode_opponent set default false;
alter table team alter column solo_mode_opponent set not null;

do $$
declare
  game_row game%ROWTYPE;
  legacy_game_row legacy_meetup_game_raw%ROWTYPE;
  winning_team_num_outs int;
  losing_team_num_outs int;
  winning_team_score int;
  losing_team_score int;
  winning_team_id uuid;
  losing_team_id uuid;
  winning_team_lineup_id uuid;
  losing_team_lineup_id uuid;
begin
  for game_row in select game.* from game where game.game_length = 0
  loop
    select legacy_meetup_game_raw.* into legacy_game_row from legacy_meetup_game_raw where dc_id = game_row.id;

    select sum(at_bats - hits + sac_flies) into winning_team_num_outs
    from legacy_meetup_stat_line_raw
      where team_id = legacy_game_row.winning_team_id and game_id = legacy_game_row.id;

    select sum(at_bats - hits + sac_flies) into losing_team_num_outs
    from legacy_meetup_stat_line_raw
      where team_id = legacy_game_row.losing_team_id and game_id = legacy_game_row.id;

    select sum(runs) into winning_team_score
    from legacy_meetup_stat_line_raw
      where team_id = legacy_game_row.winning_team_id and game_id = legacy_game_row.id;

    select sum(runs) into losing_team_score
    from legacy_meetup_stat_line_raw
      where team_id = legacy_game_row.losing_team_id and game_id = legacy_game_row.id;

    -- Away team won
    if winning_team_num_outs = losing_team_num_outs then
      update game set score = array[winning_team_score, losing_team_score] where game.id = game_row.id;
    -- Home team won
    else
      update game set score = array[losing_team_score, winning_team_score] where game.id = game_row.id;
    end if;

    if (select count(*) from team where game_id = game_row.id) = 0 then
      -- Create winning team
      insert into team (game_id, role, name, winner)
      values (
        game_row.id,
        (case when winning_team_num_outs = losing_team_num_outs then 'AWAY' else 'HOME' end)::team_role,
        (select name from legacy_meetup_team_raw where id = legacy_game_row.winning_team_id),
        true
      )
      returning team.id into winning_team_id;

      -- Create losing team
      insert into team (game_id, role, name, winner)
      values (
        game_row.id,
        (case when winning_team_num_outs = losing_team_num_outs then 'HOME' else 'AWAY' end)::team_role,
        (select name from legacy_meetup_team_raw where id = legacy_game_row.losing_team_id),
        false
      )
      returning team.id into losing_team_id;
    else
      select id into winning_team_id from team where game_id = game_row.id and winner = true;
      select id into losing_team_id from team where game_id = game_row.id and winner = false;
    end if;

    -- Create lineups
    if (select count(*) from lineup where game_id = game_row.id) = 0 then
      insert into lineup (team_id, game_id) values (winning_team_id, game_row.id)
      returning lineup.id into winning_team_lineup_id;

      insert into lineup (team_id, game_id) values (losing_team_id, game_row.id)
      returning lineup.id into losing_team_lineup_id;
    else
      select id into winning_team_lineup_id from lineup where game_id = game_row.id and team_id = winning_team_id;
      select id into losing_team_lineup_id from lineup where game_id = game_row.id and team_id = losing_team_id;
    end if;

    -- Create lineup spots
    if (select count(*) from lineup_spot where game_id = game_row.id) = 0 then
      insert into lineup_spot (lineup_id, player_id, game_id, batting_order)
      select
        (
          case when legacy_meetup_stat_line_raw.team_id = legacy_game_row.winning_team_id
          then winning_team_lineup_id
          else losing_team_lineup_id
          end
        ),
        (select player.id from player where legacy_player_id = legacy_meetup_stat_line_raw.player_id),
        game_row.id,
        row_number() over (partition by team_id order by legacy_meetup_stat_line_raw.id) - 1
      from legacy_meetup_stat_line_raw
        where game_id = legacy_game_row.id
      on conflict (lineup_id, player_id) do nothing;
    end if;

    update game set game_length = ceil(
      greatest(winning_team_num_outs, losing_team_num_outs)::float / (
        -- Some of these old games have everyone on one team which throws off the calculation
        case when winning_team_score is not null and losing_team_score is not null then 3.0 else 6.0 end
      ))
      where id = game_row.id;
  end loop;
end;
$$;
