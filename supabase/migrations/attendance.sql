-- Create attendance_sessions table
create table attendance_sessions (
  id uuid default gen_random_uuid() primary key,
  academy_id uuid references academies(id) on delete cascade not null,
  created_by uuid references profiles(id) not null, -- coach id
  code text not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create attendance_records table
create table attendance_records (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references attendance_sessions(id) on delete cascade not null,
  student_id uuid references profiles(id) not null,
  status text default 'present',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(session_id, student_id)
);

-- Enable RLS
alter table attendance_sessions enable row level security;
alter table attendance_records enable row level security;

-- RLS Policies for attendance_sessions

-- 1. Coaches can view their own created sessions
create policy "Coaches can view own sessions." on attendance_sessions
  for select using (auth.uid() = created_by);

-- 2. Students can view active sessions for their academies (to validate code)
-- Relying on existing function get_user_academy_ids used in academy_members.sql if available, 
-- otherwise we can use formatted direct query.
-- Assuming get_user_academy_ids exists from previous context or we redefine/inline it.
create policy "Students can view active sessions." on attendance_sessions
  for select using (
    is_active = true 
    and 
    academy_id in (
      select academy_id from academy_members where user_id = auth.uid()
    )
  );

-- 3. Coaches can insert new sessions
create policy "Coaches can create sessions." on attendance_sessions
  for insert with check (auth.uid() = created_by);

-- 4. Coaches can update (end) their sessions
create policy "Coaches can update own sessions." on attendance_sessions
  for update using (auth.uid() = created_by);


-- RLS Policies for attendance_records

-- 1. Students can view their own records
create policy "Students can view own records." on attendance_records
  for select using (auth.uid() = student_id);

-- 2. Coaches can view records for their sessions
create policy "Coaches can view records for their sessions." on attendance_records
  for select using (
    exists (
      select 1 from attendance_sessions 
      where attendance_sessions.id = attendance_records.session_id 
      and attendance_sessions.created_by = auth.uid()
    )
  );

-- 3. Students can insert their own record (Mark Attendance)
create policy "Students can mark attendance." on attendance_records
  for insert with check (auth.uid() = student_id);
