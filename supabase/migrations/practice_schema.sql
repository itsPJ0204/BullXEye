-- Create practice_sessions table
create table if not exists practice_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  distance int not null,
  arrows_per_end int not null,
  total_score int not null,
  total_arrows int not null,
  session_data jsonb not null, -- Stores the full array of ends/shots
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table practice_sessions enable row level security;

-- Policies
create policy "Users can view own practice sessions." on practice_sessions
  for select using (auth.uid() = user_id);

create policy "Users can insert own practice sessions." on practice_sessions
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own practice sessions." on practice_sessions
  for delete using (auth.uid() = user_id);
