-- Create a table for public profiles
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  role text check (role in ('coach', 'archer')),
  bow_category text,
  academy_id uuid, -- will verify reference later
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a table for academies
create table academies (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  location text not null,
  code text not null unique,
  coach_id uuid references profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add foreign key reference to profiles for academy_id now that academies exists
alter table profiles add constraint profiles_academy_id_fkey foreign key (academy_id) references academies(id);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;
alter table academies enable row level security;

-- Policies for profiles
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Policies for academies
create policy "Academies are viewable by everyone." on academies
  for select using (true);

create policy "Coaches can insert their own academy." on academies
  for insert with check (auth.uid() = coach_id);

create policy "Coaches can update their own academy." on academies
  for update using (auth.uid() = coach_id);

-- Function to handle new user signup (optional, if you want automatic profile creation via trigger)
-- For now, we will handle profile creation in the client logic to ensure we capture the extra fields (bow category) immediately.
