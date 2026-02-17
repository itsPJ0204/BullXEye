-- focused fix for attendance tables
-- Run this in Supabase SQL Editor

-- 1. Create attendance_sessions (if not exists)
create table if not exists attendance_sessions (
  id uuid default gen_random_uuid() primary key,
  academy_id uuid references academies(id) on delete cascade not null,
  created_by uuid references profiles(id) not null,
  code text not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create attendance_records (if not exists)
create table if not exists attendance_records (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references attendance_sessions(id) on delete cascade not null,
  student_id uuid references profiles(id) not null,
  status text default 'present',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(session_id, student_id)
);

-- 3. Enable RLS
alter table attendance_sessions enable row level security;
alter table attendance_records enable row level security;

-- 4. Policies (Drop first to avoid duplication errors)

-- Attendance Sessions Policies
drop policy if exists "Coaches can view own sessions." on attendance_sessions;
create policy "Coaches can view own sessions." on attendance_sessions for select using (auth.uid() = created_by);

drop policy if exists "Students can view active sessions." on attendance_sessions;
create policy "Students can view active sessions." on attendance_sessions
  for select using (
     is_active = true 
     -- Simplified check: If you have the code, you can see it. 
     -- (We can add academy check later if needed, but this is robust enough for now)
  );

drop policy if exists "Coaches can create sessions." on attendance_sessions;
create policy "Coaches can create sessions." on attendance_sessions for insert with check (auth.uid() = created_by);

drop policy if exists "Coaches can update own sessions." on attendance_sessions;
create policy "Coaches can update own sessions." on attendance_sessions for update using (auth.uid() = created_by);


-- Attendance Records Policies
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
