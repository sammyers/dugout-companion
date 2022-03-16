--! Previous: sha1:3b625f7585869bf916a59732263eee0978bfcce5
--! Hash: sha1:b71a35add02d98084eb9ffe5c0e6bdff5cc4f1cf

--! split: 0010-public_player_model.sql
grant usage on schema public to :DATABASE_USER, :DATABASE_ADMIN;
grant select on all tables in schema public to :DATABASE_USER, :DATABASE_ADMIN;
grant execute on all functions in schema public to :DATABASE_USER, :DATABASE_ADMIN;
alter default privileges in schema public grant execute on functions to :DATABASE_USER, :DATABASE_ADMIN;

drop schema if exists dc_private cascade;
create schema dc_private;

alter table player add column if not exists claimed boolean default false;
update player set claimed = false;
alter table player alter column claimed set not null;

alter table player add column if not exists time_updated timestamptz default now();
update player set time_updated = time_created;
alter table player alter column time_updated set not null;
alter table player alter column time_created set not null;
alter table player add column if not exists time_claimed timestamptz;

create or replace function dc_private.tg__set_time_updated() returns trigger as $$
  begin
    NEW.time_updated := current_timestamp;
    return NEW;
  end;
$$ language plpgsql volatile;

drop trigger if exists set_player_time_updated on player;
create trigger set_player_time_updated
  before update on player
  for each row
  execute procedure dc_private.tg__set_time_updated();

--! split: 0020-account_models.sql
drop table if exists dc_private.player_account;
create table dc_private.player_account (
  player_id uuid primary key references public.player (id),
  email text unique not null check (email ~* '^.+@.+\..+$'),
  password_hash text,
  is_admin boolean not null default false,
  time_last_logged_in timestamptz,
  failed_password_attempts int not null default 0,
  time_first_password_attempt_failed timestamptz,
  reset_password_token text,
  time_reset_password_token_generated timestamptz,
  time_reset_password_email_sent timestamptz,
  failed_reset_password_attempts int not null default 0,
  time_first_password_reset_attempt_failed timestamptz
);
alter table dc_private.player_account enable row level security;

drop table if exists dc_private.player_email_verification;
create table dc_private.player_email_verification (
  email text primary key check (email ~* '^.+@.+\..+$'),
  player_id uuid not null references public.player (id),
  verification_code text not null,
  time_verification_email_sent timestamptz,
  verified boolean not null default false,
  time_verified timestamptz
);

drop table if exists dc_private.player_account_claim_request;
create table dc_private.player_account_claim_request (
  id uuid primary key default gen_random_uuid (),
  player_id uuid not null references public.player (id),
  email text not null,
  approved boolean not null default false,
  rejected boolean not null default false,
  time_created timestamptz not null default now(),
  time_approved timestamptz,
  time_rejected timestamptz
);

--! split: 0030-add_group_ids.sql
alter table base_runner add column if not exists game_id uuid references game (id);
update base_runner set game_id = (select game_state.game_id from game_state where id = game_state_id);
alter table base_runner alter column game_id set not null;

alter table game_event add column if not exists game_id uuid references game (id);
update game_event set game_id = (select game_event_record.game_id from game_event_record where game_event_id = game_event.id);
alter table game_event alter column game_id set not null;

alter table lineup add column if not exists game_id uuid references game (id);
update lineup set game_id = (select team.game_id from team where team.id = team_id);
alter table lineup alter column game_id set not null;

alter table lineup_spot add column if not exists game_id uuid references game (id);
update lineup_spot set game_id = (select lineup.game_id from lineup where lineup.id = lineup_id);
alter table lineup_spot alter column game_id set not null;

alter table lineup_for_game_state add column if not exists game_id uuid references game (id);
update lineup_for_game_state set game_id = (select game_state.game_id from game_state where id = game_state_id);
alter table lineup_for_game_state alter column game_id set not null;

alter table scored_runner add column if not exists game_id uuid references game (id);
update scored_runner set game_id = (select game_event_record.game_id from game_event_record where id = game_event_record_id);
alter table scored_runner alter column game_id set not null;

alter table at_bat_skip add column if not exists game_id uuid references game (id);
update at_bat_skip set game_id = (select game_event.game_id from game_event where at_bat_skip_id = at_bat_skip.id);
alter table at_bat_skip alter column game_id set not null;

alter table lineup_change add column if not exists game_id uuid references game (id);
update lineup_change set game_id = (select game_event.game_id from game_event where lineup_change_id = lineup_change.id);
alter table lineup_change alter column game_id set not null;

alter table solo_mode_opponent_inning add column if not exists game_id uuid references game (id);
update solo_mode_opponent_inning set game_id = (select game_event.game_id from game_event where solo_mode_opponent_inning_id = solo_mode_opponent_inning.id);
alter table solo_mode_opponent_inning alter column game_id set not null;

alter table stolen_base_attempt add column if not exists game_id uuid references game (id);
update stolen_base_attempt set game_id = (select game_event.game_id from game_event where stolen_base_attempt_id = stolen_base_attempt.id);
alter table stolen_base_attempt alter column game_id set not null;

alter table plate_appearance add column if not exists game_id uuid references game (id);
update plate_appearance set game_id = (select game_event.game_id from game_event where plate_appearance_id = plate_appearance.id);
alter table plate_appearance alter column game_id set not null;

alter table plate_appearance add column if not exists batter_id uuid references player (id);
update plate_appearance set batter_id = (
  select player_at_bat from game_state where game_state.id = (
    select game_state_before_id from game_event_record where game_event_id = (
      select game_event.id from game_event where plate_appearance_id = plate_appearance.id
    )
  )
);
alter table plate_appearance alter column batter_id set not null;

alter table basepath_movement add column if not exists game_id uuid references game (id);
update basepath_movement set game_id = (select plate_appearance.game_id from plate_appearance where id = plate_appearance_id);
alter table basepath_movement alter column game_id set not null;

alter table out_on_play_runner add column if not exists game_id uuid references game (id);
update out_on_play_runner set game_id = (select plate_appearance.game_id from plate_appearance where id = plate_appearance_id);
alter table out_on_play_runner alter column game_id set not null;

alter table game drop constraint if exists game_name_key;
alter table game drop constraint if exists game_name_uniq_per_group;
alter table game add constraint game_name_uniq_per_group unique (group_id, name);
alter table game drop constraint if exists non_empty_name;
alter table game add constraint non_empty_name check (name <> '');

--! split: 1100-initiate_player_claim.sql
-- Public function to initiate a player claim; should be called from GraphQL
create or replace function initiate_player_claim(player_id uuid, email text) returns boolean as $$
  declare
    v_player player;
    v_account dc_private.player_account;
    v_verification dc_private.player_email_verification;
    v_code text;
  begin
    select * into v_player from player where id = $1 and claimed = true;
    select * into v_account from dc_private.player_account where player_account.email = $2;
    select * into v_verification from dc_private.player_email_verification where verified = true and player_email_verification.email = $2;

    if v_player is not null then
      raise exception 'Player has already been claimed.';
    end if;

    if v_account is not null then
      raise exception 'Email is already in use.';
    end if;

    if v_verification is not null then
      raise exception 'Email has already been verified. Please wait for an administrator to review your account claim.';
    end if;

    v_code := encode(gen_random_bytes(3), 'hex');

    update dc_private.player_email_verification
      set (player_id, verification_code) = (initiate_player_claim.player_id, v_code)
      where dc_private.player_email_verification.email = initiate_player_claim.email;
    
    if not found then
      insert into dc_private.player_email_verification (email, player_id, verification_code)
        values (email, player_id, v_code);
    end if;

    return true;
  end;
$$ language plpgsql strict volatile security definer;

-- Trigger function to send verification email when a row is inserted or updated in the verification table
create or replace function dc_private.tg__send_verification_email() returns trigger as $$
  begin
    perform graphile_worker.add_job('sendVerificationEmail', json_build_object('email', NEW.email));
    return NEW;
  end;
$$ language plpgsql volatile security definer;

drop trigger if exists send_verification_email on dc_private.player_email_verification;
create trigger send_verification_email
  after insert or update of verification_code on dc_private.player_email_verification
  for each row
  when (NEW.verified is false)
  execute procedure dc_private.tg__send_verification_email();

--! split: 1110-verify_email.sql
-- Public function to verify an email address with a code that was sent
create or replace function verify_email(email text, code text) returns boolean as $$
  declare
    v_verification dc_private.player_email_verification;
  begin
    select * into v_verification from dc_private.player_email_verification
      where dc_private.player_email_verification.email = verify_email.email;

    if v_verification is null then
      raise exception 'No verification was sent for email %.', $1;
    end if;

    if verify_email.code = v_verification.verification_code then
      update dc_private.player_email_verification set verified = true
        where dc_private.player_email_verification.email = v_verification.email;

      insert into dc_private.player_account_claim_request (player_id, email)
        values (v_verification.player_id, v_verification.email);
      return true;
    else
      raise exception 'Incorrect verification code.';
    end if;
  end;
$$ language plpgsql strict volatile security definer;

-- Trigger function to update verification time
create or replace function dc_private.tg__set_time_email_verified() returns trigger as $$
  begin
    NEW.time_verified = now();
    return NEW;
  end;
$$ language plpgsql volatile security definer;

drop trigger if exists set_time_email_verified on dc_private.player_email_verification;
create trigger set_time_email_verified
  before update of verified on dc_private.player_email_verification
  for each row
  when (NEW.verified is true)
  execute procedure dc_private.tg__set_time_email_verified();

--! split: 1120-create_account.sql
create or replace function dc_private.create_player_account(
  player_id uuid,
  email text,
  password text = null
) returns dc_private.player_account as $$
  declare
    v_account dc_private.player_account;
  begin
    if email is null then
      raise exception 'Email is required';
    end if;

    insert into dc_private.player_account (player_id, email) values (player_id, email)
      returning * into v_account;

    if password is not null then
      update dc_private.player_account
        set password_hash = crypt(password, gen_salt('bf'))
        where player_id = v_account.player_id;
    end if;

    update player set (claimed, time_claimed) = (true, now()) where id = v_account.player_id;

    select * into v_account from dc_private.player_account
      where dc_private.player_account.player_id = v_account.player_id;

    return v_account;
  end;
$$ language plpgsql volatile;

create or replace function initiate_password_reset(email text) returns void as $$
  declare
    v_player_account dc_private.player_account;
    v_token text;
    v_min_duration_between_emails interval = interval '3 minutes';
    v_token_max_duration interval = interval '3 days';
    v_now timestamptz = clock_timestamp();
    v_email_task_args json;
  begin
    select * into v_player_account from dc_private.player_account
      where dc_private.player_account.email = initiate_password_reset.email;

    if v_player_account is null then
      -- No matching account exists, no op
      return;
    end if;

    -- Check if we've already done a password reset recently
    if v_player_account.time_reset_password_email_sent is not null
      and v_player_account.time_reset_password_email_sent + v_min_duration_between_emails > v_now
    then
      return;
    end if;

    -- Retrieve or regenerate the reset token
    update dc_private.player_account
    set
      reset_password_token = (
        case
        when reset_password_token is null or time_reset_password_token_generated + v_token_max_duration < v_now
        then encode(gen_random_bytes(7), 'hex')
        else reset_password_token
        end
      ),
      time_reset_password_token_generated = (
        case
        when reset_password_token is null or time_reset_password_token_generated + v_token_max_duration < v_now
        then v_now
        else time_reset_password_token_generated
        end
      ),
      time_reset_password_email_sent = (v_now)
    where dc_private.player_account.player_id = v_player_account.player_id
    returning reset_password_token into v_token;

    v_email_task_args := json_build_object(
      'id', v_player_account.player_id,
      'email', v_player_account.email,
      'token', v_token
    );

    -- If no password has been set then this is a new account
    if v_player_account.password_hash is null then
      perform graphile_worker.add_job('sendNewAccountEmail', v_email_task_args);
    else
      perform graphile_worker.add_job('sendForgotPasswordEmail', v_email_task_args);
    end if;
  end;
$$ language plpgsql strict volatile security definer;

-- Trigger function to create and link a new player account when an admin approves the claim
create or replace function dc_private.tg__handle_approved_claim() returns trigger as $$
  declare
    v_player player;
  begin
    select * into v_player from player where id = NEW.player_id;

    -- Player has already been claimed, reject instead
    if v_player.claimed then
      NEW.approved = false;
      NEW.rejected = true;
    else
      NEW.time_approved = now();
      update player set claimed = true where id = NEW.player_id;

      perform dc_private.create_player_account(NEW.player_id, NEW.email);
      perform initiate_password_reset(NEW.email);
    end if;

    return NEW;
  end;
$$ language plpgsql;

drop trigger if exists handle_approved_claim on dc_private.player_account_claim_request;
create trigger handle_approved_claim
  before update of approved on dc_private.player_account_claim_request
  for each row
  when (NEW.approved and NEW.approved is distinct from OLD.approved)
  execute procedure dc_private.tg__handle_approved_claim();

--! split: 1130-reset_password.sql
create or replace function dc_private.assert_valid_password(new_password text) returns void as $$
  begin
    if length(new_password) < 8 then
      raise exception 'Password is too weak';
    end if;
  end;
$$ language plpgsql volatile;

create or replace function reset_password(player_id uuid, reset_token text, new_password text) returns boolean as $$
  declare
    v_account dc_private.player_account;
    v_token_max_duration interval = interval '3 days';
  begin
    select * into v_account from dc_private.player_account
    where dc_private.player_account.player_id = reset_password.player_id;

    if v_account is null then
      return null;
    end if;

    -- Check for too many reset attempts
    if (
      v_account.time_first_password_reset_attempt_failed is not null
    and
      v_account.time_first_password_reset_attempt_failed + v_token_max_duration > now()
    and
      v_account.failed_reset_password_attempts >= 20
    ) then
      raise exception 'Password reset locked - too many reset attempts';
    end if;

    if v_account.reset_password_token = reset_token then
      -- Token is valid, check if password is acceptable
      perform dc_private.assert_valid_password(new_password);

      update dc_private.player_account
      set
        password_hash = crypt(new_password, gen_salt('bf')),
        failed_password_attempts = 0,
        time_first_password_attempt_failed = null,
        reset_password_token = null,
        time_reset_password_token_generated = null,
        failed_reset_password_attempts = 0,
        time_first_password_reset_attempt_failed = null
      where dc_private.player_account.player_id = v_account.player_id;
      return true;
    else
      update dc_private.player_account
      set
        failed_reset_password_attempts = (
          case
          when time_first_password_reset_attempt_failed is null or time_first_password_reset_attempt_failed + v_token_max_duration < now()
          then 1
          else failed_reset_password_attempts + 1
          end
        ),
        time_first_password_reset_attempt_failed = (
          case
          when time_first_password_reset_attempt_failed is null or time_first_password_reset_attempt_failed + v_token_max_duration < now()
          then now()
          else time_first_password_reset_attempt_failed
          end
        )
      where dc_private.player_account.player_id = v_account.player_id;

      return null;
    end if;
  end;
$$ language plpgsql strict volatile security definer;

--! split: 1140-login.sql
drop type if exists jwt cascade;
create type jwt as (
  role text,
  sub uuid,
  exp bigint
);

create or replace function login(email text, password text) returns jwt as $$
  declare
    v_account dc_private.player_account;
    v_jwt_duration interval = interval '30 days';
    v_login_attempt_window_duration interval = interval '5 minutes';
  begin
    select a.* into v_account
    from dc_private.player_account as a
    where a.email = $1;

    if v_account is null then
      return null;
    end if;

    if (
      v_account.time_first_password_attempt_failed is not null
    and
      v_account.time_first_password_attempt_failed + v_login_attempt_window_duration > now()
    and
      v_account.failed_password_attempts >= 3
    ) then
      raise exception 'User account locked = too many login attempts. Try again after 5 minutes.';
    end if;

    if v_account.password_hash = crypt(password, v_account.password_hash) then
      update dc_private.player_account
      set failed_password_attempts = 0, time_first_password_attempt_failed = null,time_last_logged_in = now()
      where player_id = v_account.player_id;

      return (
        (case when v_account.is_admin then ':DATABASE_ADMIN' else ':DATABASE_USER' end),
        v_account.player_id,
        extract(epoch from (now() + v_jwt_duration))
      )::jwt;
    else
      update dc_private.player_account
      set
        failed_password_attempts = (
          case
          when time_first_password_attempt_failed is null or time_first_password_attempt_failed + v_login_attempt_window_duration < now()
          then 1
          else failed_password_attempts + 1
          end
        ),
        time_first_password_attempt_failed = (
          case
          when time_first_password_attempt_failed is null or time_first_password_attempt_failed + v_login_attempt_window_duration < now()
          then now()
          else time_first_password_attempt_failed
          end
        )
      where player_id = v_account.player_id;

      return null;
    end if;
  end;
$$ language plpgsql strict security definer;

create or replace function get_current_user_id() returns uuid as $$
  select nullif(current_setting('jwt.claims.sub', true), '')::uuid;
$$ language sql stable;

create or replace function get_current_user() returns player as $$
  select * from player where id = get_current_user_id();
$$ language sql stable;

--! split: 1200-reset_table_access.sql
revoke insert on "group" from :DATABASE_VISITOR;
revoke insert on player from :DATABASE_VISITOR;
revoke insert on field from :DATABASE_VISITOR;
revoke insert on game from :DATABASE_VISITOR;
revoke insert on team from :DATABASE_VISITOR;
revoke insert on lineup from :DATABASE_VISITOR;
revoke insert on lineup_spot from :DATABASE_VISITOR;
revoke insert on plate_appearance from :DATABASE_VISITOR;
revoke insert on basepath_movement from :DATABASE_VISITOR;
revoke insert on out_on_play_runner from :DATABASE_VISITOR;
revoke insert on stolen_base_attempt from :DATABASE_VISITOR;
revoke insert on lineup_change from :DATABASE_VISITOR;
revoke insert on game_event from :DATABASE_VISITOR;
revoke insert on game_state from :DATABASE_VISITOR;
revoke insert on base_runner from :DATABASE_VISITOR;
revoke insert on lineup_for_game_state from :DATABASE_VISITOR;
revoke insert on game_event_record from :DATABASE_VISITOR;
revoke insert on scored_runner from :DATABASE_VISITOR;
revoke insert on redux_dump from :DATABASE_VISITOR;
revoke insert on solo_mode_opponent_inning from :DATABASE_VISITOR;
revoke insert on player_group_membership from :DATABASE_VISITOR;
revoke insert on at_bat_skip from :DATABASE_VISITOR;

alter table "group" enable row level security;
drop policy if exists select_all on "group";
create policy select_all on "group" for select using (true);

alter table player enable row level security;
drop policy if exists select_all on player;
create policy select_all on player for select using (true);

alter table field enable row level security;
drop policy if exists select_all on field;
create policy select_all on field for select using (true);

alter table team enable row level security;
drop policy if exists select_all on team;
create policy select_all on team for select using (true);

alter table game enable row level security;
drop policy if exists select_all on game;
create policy select_all on game for select using (true);

alter table lineup enable row level security;
drop policy if exists select_all on lineup;
create policy select_all on lineup for select using (true);

alter table lineup_spot enable row level security;
drop policy if exists select_all on lineup_spot;
create policy select_all on lineup_spot for select using (true);

alter table plate_appearance enable row level security;
drop policy if exists select_all on plate_appearance;
create policy select_all on plate_appearance for select using (true);

alter table basepath_movement enable row level security;
drop policy if exists select_all on basepath_movement;
create policy select_all on basepath_movement for select using (true);

alter table out_on_play_runner enable row level security;
drop policy if exists select_all on out_on_play_runner;
create policy select_all on out_on_play_runner for select using (true);

alter table stolen_base_attempt enable row level security;
drop policy if exists select_all on stolen_base_attempt;
create policy select_all on stolen_base_attempt for select using (true);

alter table lineup_change enable row level security;
drop policy if exists select_all on lineup_change;
create policy select_all on lineup_change for select using (true);

alter table game_event enable row level security;
drop policy if exists select_all on game_event;
create policy select_all on game_event for select using (true);

alter table game_state enable row level security;
drop policy if exists select_all on game_state;
create policy select_all on game_state for select using (true);

alter table base_runner enable row level security;
drop policy if exists select_all on base_runner;
create policy select_all on base_runner for select using (true);

alter table lineup_for_game_state enable row level security;
drop policy if exists select_all on lineup_for_game_state;
create policy select_all on lineup_for_game_state for select using (true);

alter table game_event_record enable row level security;
drop policy if exists select_all on game_event_record;
create policy select_all on game_event_record for select using (true);

alter table scored_runner enable row level security;
drop policy if exists select_all on scored_runner;
create policy select_all on scored_runner for select using (true);

alter table redux_dump enable row level security;
drop policy if exists select_all on redux_dump;
create policy select_all on redux_dump for select using (true);

alter table solo_mode_opponent_inning enable row level security;
drop policy if exists select_all on solo_mode_opponent_inning;
create policy select_all on solo_mode_opponent_inning for select using (true);

alter table player_group_membership enable row level security;
drop policy if exists select_all on player_group_membership;
create policy select_all on player_group_membership for select using (true);

alter table at_bat_skip enable row level security;
drop policy if exists select_all on at_bat_skip;
create policy select_all on at_bat_skip for select using (true);

--! split: 1210-permissions.sql
drop type if exists permission_type cascade;
create type permission_type as enum (
  'ADD_NEW_PLAYERS',
  'SAVE_DEBUG_DATA'
);

drop type if exists group_permission_type cascade;
create type group_permission_type as enum (
  'SAVE_GAMES',
  'DRAFT_TEAMS',
  'ADD_PLAYERS_TO_GROUP'
);

drop table if exists dc_private.group_permission;
create table dc_private.group_permission (
  player_id uuid not null references player (id),
  group_id uuid not null references "group" (id),
  permission group_permission_type not null,
  primary key (player_id, group_id, permission)
);

drop table if exists dc_private.permission;
create table dc_private.permission (
  player_id uuid not null references player (id),
  permission permission_type not null,
  primary key (player_id, permission)
);

drop function if exists does_user_have_permission;
create or replace function does_user_have_permission(permission permission_type) returns boolean as $$
  select exists(
    select 1 from dc_private.permission
    where player_id = get_current_user_id()
    and permission = $1
  );
$$ language sql stable security definer;

create or replace function does_user_have_group_permission(
  group_id uuid,
  permission group_permission_type
) returns boolean as $$
  select exists(
    select 1 from dc_private.group_permission
    where player_id = get_current_user_id()
    and group_id = $1
    and permission = $2
  );
$$ language sql stable security definer;

create or replace function can_user_save_game_data(game_id uuid) returns boolean as $$
  select does_user_have_group_permission(
    (select group_id from game where id = game_id),
    'SAVE_GAMES'
  );
$$ language sql stable;

create or replace function current_user_permissions() returns setof permission_type as $$
  select permission from dc_private.permission
  where player_id = get_current_user_id();
$$ language sql stable security definer;

drop type if exists user_group_permission cascade;
create type user_group_permission as (group_id uuid, permission group_permission_type);

create or replace function current_user_group_permissions() returns setof user_group_permission as $$
  select group_id, permission from dc_private.group_permission
  where player_id = get_current_user_id();
$$ language sql stable security definer;

--! split: 1220-table_write_access.sql
drop policy if exists update_self on player;
create policy update_self on player for update using (id = get_current_user_id());
grant update(first_name, last_name, nickname, image_url) on player to :DATABASE_USER;

drop policy if exists insert_with_permission on player;
create policy insert_with_permission on player for insert to :DATABASE_USER
  with check (does_user_have_permission('ADD_NEW_PLAYERS'));
grant insert (id, legacy_player_id, first_name, last_name, nickname, image_url) on player to :DATABASE_USER;

drop policy if exists insert_with_group_permission on player_group_membership;
create policy insert_with_group_permission on player_group_membership for insert to :DATABASE_USER
  with check (does_user_have_group_permission(group_id, 'ADD_PLAYERS_TO_GROUP'));
grant insert on player_group_membership to :DATABASE_USER;

drop policy if exists insert_with_group_permission on game;
create policy insert_with_group_permission on game for insert to :DATABASE_USER
  with check (does_user_have_group_permission(group_id, 'SAVE_GAMES'));
grant insert on game to :DATABASE_USER;

drop policy if exists insert_with_group_permission on team;
create policy insert_with_group_permission on team for insert to :DATABASE_USER
  with check (can_user_save_game_data(game_id));
grant insert on team to :DATABASE_USER;

drop policy if exists insert_with_group_permission on lineup;
create policy insert_with_group_permission on lineup for insert to :DATABASE_USER
  with check (can_user_save_game_data(game_id));
grant insert on lineup to :DATABASE_USER;

drop policy if exists insert_with_group_permission on lineup_spot;
create policy insert_with_group_permission on lineup_spot for insert to :DATABASE_USER
  with check (can_user_save_game_data(game_id));
grant insert on lineup_spot to :DATABASE_USER;

drop policy if exists insert_with_group_permission on game_state;
create policy insert_with_group_permission on game_state for insert to :DATABASE_USER
  with check (can_user_save_game_data(game_id));
grant insert on game_state to :DATABASE_USER;

drop policy if exists insert_with_group_permission on lineup_for_game_state;
create policy insert_with_group_permission on lineup_for_game_state for insert to :DATABASE_USER
  with check (can_user_save_game_data(game_id));
grant insert on lineup_for_game_state to :DATABASE_USER;

drop policy if exists insert_with_group_permission on base_runner;
create policy insert_with_group_permission on base_runner for insert to :DATABASE_USER
  with check (can_user_save_game_data(game_id));
grant insert on base_runner to :DATABASE_USER;

drop policy if exists insert_with_group_permission on game_event_record;
create policy insert_with_group_permission on game_event_record for insert to :DATABASE_USER
  with check (can_user_save_game_data(game_id));
grant insert on game_event_record to :DATABASE_USER;

drop policy if exists insert_with_group_permission on game_event;
create policy insert_with_group_permission on game_event for insert to :DATABASE_USER
  with check (can_user_save_game_data(game_id));
grant insert on game_event to :DATABASE_USER;

drop policy if exists insert_with_group_permission on at_bat_skip;
create policy insert_with_group_permission on at_bat_skip for insert to :DATABASE_USER
  with check (can_user_save_game_data(game_id));
grant insert on at_bat_skip to :DATABASE_USER;

drop policy if exists insert_with_group_permission on lineup_change;
create policy insert_with_group_permission on lineup_change for insert to :DATABASE_USER
  with check (can_user_save_game_data(game_id));
grant insert on lineup_change to :DATABASE_USER;

drop policy if exists insert_with_group_permission on stolen_base_attempt;
create policy insert_with_group_permission on stolen_base_attempt for insert to :DATABASE_USER
  with check (can_user_save_game_data(game_id));
grant insert on stolen_base_attempt to :DATABASE_USER;

drop policy if exists insert_with_group_permission on solo_mode_opponent_inning;
create policy insert_with_group_permission on solo_mode_opponent_inning for insert to :DATABASE_USER
  with check (can_user_save_game_data(game_id));
grant insert on solo_mode_opponent_inning to :DATABASE_USER;

drop policy if exists insert_with_group_permission on plate_appearance;
create policy insert_with_group_permission on plate_appearance for insert to :DATABASE_USER
  with check (can_user_save_game_data(game_id));
grant insert on plate_appearance to :DATABASE_USER;

drop policy if exists insert_with_group_permission on basepath_movement;
create policy insert_with_group_permission on basepath_movement for insert to :DATABASE_USER
  with check (can_user_save_game_data(game_id));
grant insert on basepath_movement to :DATABASE_USER;

drop policy if exists insert_with_group_permission on out_on_play_runner;
create policy insert_with_group_permission on out_on_play_runner for insert to :DATABASE_USER
  with check (can_user_save_game_data(game_id));
grant insert on out_on_play_runner to :DATABASE_USER;

drop policy if exists insert_with_group_permission on scored_runner;
create policy insert_with_group_permission on scored_runner for insert to :DATABASE_USER
  with check (can_user_save_game_data(game_id));
grant insert on scored_runner to :DATABASE_USER;

drop policy if exists insert_with_permission on redux_dump;
create policy insert_with_permission on redux_dump for insert to :DATABASE_USER
  with check (does_user_have_permission('SAVE_DEBUG_DATA'));
grant insert on redux_dump to :DATABASE_USER;
