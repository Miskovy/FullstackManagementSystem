-- Execute this script in your Supabase SQL Editor

-- ==========================================
-- 1. Enable Required Extensions
-- ==========================================
create extension if not exists "uuid-ossp";
-- Note: 'pg_cron' needs to be enabled via the Supabase Dashboard -> Database -> Extensions
-- create extension if not exists "pg_cron";

-- ==========================================
-- 2. Profiles (Role-based access)
-- ==========================================
create type user_role as enum ('admin', 'member');

create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  role user_role default 'member' not null,
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Auto-create profile on auth.users insert
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  is_first_user boolean;
begin
  select count(*) = 0 from public.profiles into is_first_user;
  
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id, 
    coalesce(new.email, ''), 
    new.raw_user_meta_data->>'full_name',
    case when is_first_user then 'admin'::public.user_role else 'member'::public.user_role end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========================================
-- 3. Schedules
-- ==========================================
create type schedule_type as enum ('daily', 'weekly', 'monthly');

create table public.schedules (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  recurrence_type schedule_type not null,
  -- config: JSON containing specific days or dates
  -- e.g. weekly: { "days": [1, 3, 5] } (Mon, Wed, Fri)
  -- e.g. monthly: { "dates": [1, 15] }
  config jsonb not null default '{}'::jsonb,
  trigger_time time not null, -- e.g., '09:00:00'
  priority text default 'medium' not null,
  default_assignee_id uuid references public.profiles(id) on delete set null,
  is_paused boolean default false not null,
  created_by uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 4. Assignments
-- ==========================================
create type assignment_status as enum ('pending', 'in_progress', 'completed', 'overdue');

create table public.assignments (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  priority text default 'medium' not null check (priority in ('low', 'medium', 'high', 'urgent')),
  status assignment_status default 'pending' not null,
  due_date timestamp with time zone,
  assignee_id uuid references public.profiles(id) on delete set null,
  schedule_id uuid references public.schedules(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Update updated_at trigger
create or replace function update_modified_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;   
end;
$$ language 'plpgsql';

create trigger update_assignments_modtime
before update on public.assignments
for each row execute procedure update_modified_column();

-- ==========================================
-- 5. Tags & Assignment Tags
-- ==========================================
create table public.tags (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  color text default '#3b82f6' not null -- Tailwind blue-500
);

create table public.assignment_tags (
  assignment_id uuid references public.assignments(id) on delete cascade not null,
  tag_id uuid references public.tags(id) on delete cascade not null,
  primary key (assignment_id, tag_id)
);

-- ==========================================
-- 6. Assignment History
-- ==========================================
create table public.assignment_history (
  id uuid default uuid_generate_v4() primary key,
  assignment_id uuid references public.assignments(id) on delete cascade not null,
  changed_by uuid references public.profiles(id) on delete set null,
  changes jsonb not null, -- Stores what changed e.g., { "status": { "old": "pending", "new": "completed" } }
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 7. Row Level Security (RLS)
-- ==========================================
alter table public.profiles enable row level security;
alter table public.schedules enable row level security;
alter table public.assignments enable row level security;
alter table public.tags enable row level security;
alter table public.assignment_tags enable row level security;
alter table public.assignment_history enable row level security;

-- Profiles: Anyone can read profiles. Users can update their own profile. Admins can update any.
create policy "Anyone can read profiles" on public.profiles for select using (true);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);

-- Assignments: Admins see all. Members see all (team transparency) but only Admins and Assignee can delete.
create policy "All users can view assignments" on public.assignments for select using (auth.role() = 'authenticated');
create policy "All users can create assignments" on public.assignments for insert with check (auth.role() = 'authenticated');
create policy "Users can update assignments" on public.assignments for update using (auth.role() = 'authenticated');
create policy "Only Admins can delete assignments" on public.assignments for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Schedules: All users see, Create/Update/Delete follows standard authenticated policy
create policy "Schedules selectable by authenticated" on public.schedules for select using (auth.role() = 'authenticated');
create policy "Schedules manipulatable by authenticated" on public.schedules for all using (auth.role() = 'authenticated');

-- Tags: Read by all, manipulated by all
create policy "Tags accessible by authenticated" on public.tags for all using (auth.role() = 'authenticated');
create policy "Assignment Tags accessible by authenticated" on public.assignment_tags for all using (auth.role() = 'authenticated');

-- History: Read-only for authenticated, insert via trigger or API only
create policy "History readable by authenticated" on public.assignment_history for select using (auth.role() = 'authenticated');


-- ==========================================
-- 8. Cron Processing Logic (RPC for pg_cron)
-- ==========================================
-- This function processes active schedules and generates assignments.
-- It can be called by pg_cron or an Edge Function webhook.
create or replace function public.process_schedules()
returns void as $$
declare
  sch RECORD;
  current_dow integer;
  current_dom integer;
  now_utc timestamp with time zone = timezone('utc'::text, now());
begin
  -- extract day of week (0-6, Sunday=0 in postgres extract dow)
  current_dow := extract(dow from now_utc);
  -- extract day of month (1-31)
  current_dom := extract(day from now_utc);

  for sch in 
    select * from public.schedules 
    where is_paused = false
  loop
    -- Check if it should trigger now based on type and config
    -- For simplicity, this assumes a daily process or hourly process checking the trigger_time.
    -- In a real production environment with timezones, you would compare 'trigger_time' against the user's local timezone.
    -- Here we assume utc processing.

    if sch.recurrence_type = 'daily' then
        perform public.create_assignment_from_schedule(sch.id);
    end if;

    if sch.recurrence_type = 'weekly' then
        if sch.config->'days' @> to_jsonb(current_dow) then
            -- Note: need to ensure we don't create multiple per day.
            -- This can be handled by checking if an assignment for this schedule was created today.
            perform public.create_assignment_from_schedule(sch.id);
        end if;
    end if;

    if sch.recurrence_type = 'monthly' then
        if sch.config->'dates' @> to_jsonb(current_dom) then
            perform public.create_assignment_from_schedule(sch.id);
        end if;
    end if;
  end loop;
end;
$$ language plpgsql;

create or replace function public.create_assignment_from_schedule(sch_id uuid)
returns void as $$
declare
  sch public.schedules%ROWTYPE;
  already_created boolean;
begin
  select * into sch from public.schedules where id = sch_id;
  
  -- Check if already generated today (UTC)
  select exists (
    select 1 from public.assignments 
    where schedule_id = sch.id 
    and date_trunc('day', created_at) = date_trunc('day', timezone('utc'::text, now()))
  ) into already_created;

  if not already_created then
    insert into public.assignments (
      title, description, priority, assignee_id, schedule_id, created_by, due_date
    ) values (
      sch.title, sch.description, sch.priority, sch.default_assignee_id, sch.id, sch.created_by, timezone('utc'::text, now()) + interval '1 day'
    );
  end if;
end;
$$ language plpgsql;


-- Instructions for pg_cron:
-- Run this block in the Supabase SQL editor to schedule the processing every hour.
/*
select cron.schedule(
  'process-schedules-hourly',
  '0 * * * *', -- every hour at minute 0
  $$select public.process_schedules();$$
);
*/

-- ==========================================
-- 9. Templates
-- ==========================================
create table public.templates (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  priority text default 'medium' not null check (priority in ('low', 'medium', 'high', 'urgent')),
  created_by uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.templates enable row level security;
create policy "Templates readable by authenticated" on public.templates for select using (auth.role() = 'authenticated');
create policy "Templates modifiable by creator or admin" on public.templates for all using (
  auth.uid() = created_by or 
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ==========================================
-- 10. Webhooks (HTTP Request via pg_net or fetch)
-- ==========================================
-- Note: It is recommended to use Supabase Dashboard -> Database -> Webhooks to configure HTTP hooks,
-- but the below trigger creates a generic log or an HTTP request if pg_net is enabled.

/* 
create extension if not exists "pg_net";

create or replace function public.trigger_assignment_webhook()
returns trigger as $$
begin
  perform net.http_post(
      url:='https://YOUR_NEXTJS_APP.vercel.app/api/webhooks/assignment',
      body:=json_build_object('record', row_to_json(new))::jsonb
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger assignment_webhook_trigger
after insert on public.assignments
for each row execute procedure public.trigger_assignment_webhook();
*/

