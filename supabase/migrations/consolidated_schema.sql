-- Consolidated Schema to fix missing tables
-- Run this in Supabase SQL Editor

-- 1. Create Profiles (if not exists)
-- 1. Create Profiles (if not exists) and ensure columns exist
create table if not exists profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  role text check (role in ('coach', 'archer')),
  bow_category text,
  academy_id uuid, 
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure columns exist if table already existed but was incomplete
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'academy_id') then
    alter table profiles add column academy_id uuid;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'role') then
    alter table profiles add column role text check (role in ('coach', 'archer'));
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'bow_category') then
    alter table profiles add column bow_category text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'full_name') then
    alter table profiles add column full_name text;
  end if;
end $$;

-- 2. Create Academies
create table if not exists academies (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  location text not null,
  code text not null unique,
  coach_id uuid references profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Add FK to profiles (safe to run even if exists, though might error if constraint name duplicate, usually fine to ignore in dev recovery)
do $$
begin
  if not exists (select 1 from information_schema.table_constraints where constraint_name = 'profiles_academy_id_fkey') then
    alter table profiles add constraint profiles_academy_id_fkey foreign key (academy_id) references academies(id);
  end if;
end $$;

-- 4. Enable RLS for Profiles/Academies
alter table profiles enable row level security;
alter table academies enable row level security;

-- Policies (Drop first to avoid duplication errors if re-running)
drop policy if exists "Public profiles are viewable by everyone." on profiles;
create policy "Public profiles are viewable by everyone." on profiles for select using (true);

drop policy if exists "Users can insert their own profile." on profiles;
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile." on profiles;
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

drop policy if exists "Academies are viewable by everyone." on academies;
create policy "Academies are viewable by everyone." on academies for select using (true);

drop policy if exists "Coaches can insert their own academy." on academies;
create policy "Coaches can insert their own academy." on academies for insert with check (auth.uid() = coach_id);

drop policy if exists "Coaches can update their own academy." on academies;
create policy "Coaches can update their own academy." on academies for update using (auth.uid() = coach_id);


-- 5. Academy Members
create table if not exists academy_members (
  academy_id uuid references academies(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  role text check (role in ('coach', 'archer')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (academy_id, user_id)
);

alter table academy_members enable row level security;

-- Helper function
create or replace function get_user_academy_ids(uid uuid)
returns setof uuid as $$
  select academy_id from academy_members where user_id = uid;
$$ language sql security definer stable;

drop policy if exists "Members can view their academy members." on academy_members;
create policy "Members can view their academy members." on academy_members
  for select using (
    auth.uid() = user_id 
    or
    academy_id in ( select get_user_academy_ids(auth.uid()) )
  );

drop policy if exists "Users can join academies." on academy_members;
create policy "Users can join academies." on academy_members for insert with check (auth.uid() = user_id);

drop policy if exists "Coaches can update members." on academy_members;
create policy "Coaches can update members." on academy_members
  for update using (
    exists (
      select 1 from academy_members as am
      where am.academy_id = academy_members.academy_id
      and am.user_id = auth.uid()
      and am.role = 'coach'
    )
  );


-- 6. Attendance System
create table if not exists attendance_sessions (
  id uuid default gen_random_uuid() primary key,
  academy_id uuid references academies(id) on delete cascade not null,
  created_by uuid references profiles(id) not null,
  code text not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists attendance_records (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references attendance_sessions(id) on delete cascade not null,
  student_id uuid references profiles(id) not null,
  status text default 'present',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(session_id, student_id)
);

alter table attendance_sessions enable row level security;
alter table attendance_records enable row level security;

drop policy if exists "Coaches can view own sessions." on attendance_sessions;
create policy "Coaches can view own sessions." on attendance_sessions for select using (auth.uid() = created_by);

drop policy if exists "Students can view active sessions." on attendance_sessions;
create policy "Students can view active sessions." on attendance_sessions
  for select using (
     is_active = true 
     and 
     academy_id in (
       select academy_id from academy_members where user_id = auth.uid()
     )
  );

drop policy if exists "Coaches can create sessions." on attendance_sessions;
create policy "Coaches can create sessions." on attendance_sessions for insert with check (auth.uid() = created_by);

drop policy if exists "Coaches can update own sessions." on attendance_sessions;
create policy "Coaches can update own sessions." on attendance_sessions for update using (auth.uid() = created_by);

drop policy if exists "Students can view own records." on attendance_records;
create policy "Students can view own records." on attendance_records for select using (auth.uid() = student_id);

drop policy if exists "Coaches can view records for their sessions." on attendance_records;
create policy "Coaches can view records for their sessions." on attendance_records for select using (
    exists (
      select 1 from attendance_sessions 
      where attendance_sessions.id = attendance_records.session_id 
      and attendance_sessions.created_by = auth.uid()
    )
  );

drop policy if exists "Students can mark attendance." on attendance_records;
create policy "Students can mark attendance." on attendance_records for insert with check (auth.uid() = student_id);
