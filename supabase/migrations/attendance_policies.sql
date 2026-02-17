-- Policies to allow Coaches to manage attendance history

-- 1. Allow Coaches to DELETE from attendance_sessions (their own)
drop policy if exists "Coaches can delete own sessions." on attendance_sessions;
create policy "Coaches can delete own sessions." on attendance_sessions 
    for delete using (auth.uid() = created_by);

-- 2. Allow Coaches to DELETE from attendance_records (for their sessions)
-- We need a policy using to allow deletion if the session belongs to the coach
drop policy if exists "Coaches can delete records from their sessions." on attendance_records;
create policy "Coaches can delete records from their sessions." on attendance_records 
    for delete using (
        exists (
            select 1 from attendance_sessions
            where attendance_sessions.id = attendance_records.session_id
            and attendance_sessions.created_by = auth.uid()
        )
    );

-- 3. Allow Coaches to INSERT into attendance_records (Manual Add)
-- This might need a broader check.
drop policy if exists "Coaches can manually add attendees." on attendance_records;
create policy "Coaches can manually add attendees." on attendance_records 
    for insert with check (
        exists (
            select 1 from attendance_sessions as s
            where s.id = session_id -- session_id refers to the new record's session_id
            and s.created_by = auth.uid()
        )
    );

-- 4. Allow Archers to DELETE their own practice sessions
drop policy if exists "Users can delete own practice sessions." on practice_sessions;
create policy "Users can delete own practice sessions." on practice_sessions
    for delete using (auth.uid() = user_id);
