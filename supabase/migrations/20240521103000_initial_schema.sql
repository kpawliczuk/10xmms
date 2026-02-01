-- migration: 20240521103000_initial_schema.sql
--
-- purpose:      sets up the initial database schema for the funny_mms mvp.
-- affected:     creates tables (profiles, mms_history, daily_global_stats),
--               custom types (mms_status), functions, views, and rls policies.
-- notes:        this is the foundational schema for the application.

-- step 1: create a custom enum type for mms status
-- this ensures data integrity for the status of each mms operation.
create type public.mms_status as enum ('success', 'generation_failed', 'send_failed');

comment on type public.mms_status is 'defines the possible statuses for an mms generation and sending operation.';

-- step 2: create the 'profiles' table
-- this table stores public user data and is linked one-to-one with the 'auth.users' table.
create table public.profiles (
  id uuid not null,
  username text,
  phone_number text,
  updated_at timestamptz,

  primary key (id),
  unique (username),
  constraint id_fk foreign key (id) references auth.users(id) on delete cascade
);

comment on table public.profiles is 'stores public profile information for each user, extending auth.users.';

-- step 3: create the 'mms_history' table
-- this is the main transactional table, logging every mms generation attempt.
create table public.mms_history (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  prompt text not null,
  image_data bytea not null,
  status public.mms_status not null,
  model_info text,
  created_at timestamptz not null default now(),

  primary key (id),
  constraint user_id_fk foreign key (user_id) references auth.users(id) on delete cascade,
  constraint prompt_length_check check (char_length(prompt) <= 300)
);

comment on table public.mms_history is 'logs every mms generation attempt, including the prompt, image, and status.';

-- step 4: create the 'daily_global_stats' table
-- this helper table tracks the global daily limit of sent mms messages.
create table public.daily_global_stats (
  day date not null default (now() at time zone 'utc')::date,
  mms_sent_count integer not null default 0,

  primary key (day)
);

comment on table public.daily_global_stats is 'tracks the total number of mms messages sent across the application per day (utc).';

-- step 5: create indexes for performance
-- a composite index on mms_history is critical for efficiently checking user limits and fetching user-specific history.
create index mms_history_user_id_created_at_idx on public.mms_history (user_id, created_at);

-- step 6: enable row level security (rls) on all new tables
-- this is a critical security measure to ensure data is not exposed by default.
alter table public.profiles enable row level security;
alter table public.mms_history enable row level security;
alter table public.daily_global_stats enable row level security;

-- step 7: define row level security policies
-- policies are defined granularly for each role (anon, authenticated) and action (select, insert, update, delete).

-- policies for 'profiles' table
-- anon: should not be able to access any profiles.
-- authenticated: can only manage their own profile.
create policy "allow authenticated users to select their own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "allow authenticated users to insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "allow authenticated users to update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- policies for 'mms_history' table
-- anon: should not be able to access any mms history.
-- authenticated: can only manage their own mms history.
create policy "allow authenticated users to select their own mms history"
  on public.mms_history for select
  to authenticated
  using (auth.uid() = user_id);

create policy "allow authenticated users to insert into their own mms history"
  on public.mms_history for insert
  to authenticated
  with check (auth.uid() = user_id);

-- policies for 'daily_global_stats'
-- this table should not be accessible by clients. access should be handled by the backend using the service_role key.
-- no policies are created, effectively blocking all access from anon and authenticated roles.

-- step 8: create a trigger function to automatically create a user profile
-- this function runs after a new user is created in 'auth.users'.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'username');
  return new;
end;
$$;

comment on function public.handle_new_user() is 'automatically creates a profile for a new user.';

-- create the trigger that calls the function
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- step 9: create a function to efficiently check the user's daily mms count
-- this function is used to enforce the per-user daily limit.
create function public.count_user_mms_today(p_user_id uuid)
returns integer
language sql
stable
as $$
  select count(*)::integer
  from public.mms_history
  where
    user_id = p_user_id and
    created_at >= (now() at time zone 'utc')::date;
$$;

comment on function public.count_user_mms_today(uuid) is 'counts the number of mms messages sent by a specific user for the current day in utc.';

-- step 10: create a view for the admin panel
-- this view aggregates daily statistics for easy monitoring.
create or replace view public.admin_daily_stats_view as
  select
    (created_at at time zone 'utc')::date as day,
    count(*) as total_attempts,
    count(*) filter (where status = 'success') as success_count,
    count(*) filter (where status = 'generation_failed') as generation_failed_count,
    count(*) filter (where status = 'send_failed') as send_failed_count
  from
    public.mms_history
  group by
    day
  order by
    day desc;

comment on view public.admin_daily_stats_view is 'provides aggregated daily mms statistics for the admin panel.';