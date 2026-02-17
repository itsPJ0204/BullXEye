-- Drop existing policies to be safe
drop policy if exists "Public profiles are viewable by everyone." on profiles;
drop policy if exists "Users can insert their own profile." on profiles;
drop policy if exists "Users can update own profile." on profiles;

drop policy if exists "Academies are viewable by everyone." on academies;
drop policy if exists "Coaches can insert their own academy." on academies;
drop policy if exists "Coaches can update their own academy." on academies;

-- Profiles Policies
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

-- Insert: Allow users to insert their own profile (Trigger handles this usually, but good fallback)
create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

-- Update: Allow users to update their own profile
-- CRITICAL FIX: Ensure 'using' clause covers the row to be updated
create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Academies Policies
create policy "Academies are viewable by everyone." on academies
  for select using (true);

-- Insert: Coach can insert academy linked to them
create policy "Coaches can insert their own academy." on academies
  for insert with check (auth.uid() = coach_id);

-- Update: Coach can update their own academy
create policy "Coaches can update their own academy." on academies
  for update using (auth.uid() = coach_id);  
