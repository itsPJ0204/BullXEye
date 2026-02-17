-- Create academy_members table for Many-to-Many relationship
drop table if exists academy_members cascade;

create table academy_members (
  academy_id uuid references academies(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  role text check (role in ('coach', 'archer')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (academy_id, user_id)
);

-- Enable RLS
alter table academy_members enable row level security;

-- RLS Policies for academy_members

-- View: Members can view members of their own academies
-- Helper function to check academy membership safely (avoids recursion)
create or replace function get_user_academy_ids(uid uuid)
returns setof uuid as $$
  select academy_id from academy_members where user_id = uid;
$$ language sql security definer stable;

-- View: Members can view members of their own academies
create policy "Members can view their academy members." on academy_members
  for select using (
    auth.uid() = user_id -- Can see self
    or
    academy_id in ( select get_user_academy_ids(auth.uid()) )
  );

-- Insert: 
-- 1. Coaches can add themselves when creating an academy (handled by trigger or client logic if policy allows)
-- 2. Archers can join via code (logic handled in client/backend function, but policy needs to allow self-insert if validation passes)
-- For simplicity in this direct-client-auth model:
create policy "Users can join academies." on academy_members
  for insert with check (auth.uid() = user_id);

-- Update: Coaches can update roles in their academy
create policy "Coaches can update members." on academy_members
  for update using (
    exists (
      select 1 from academy_members as am
      where am.academy_id = academy_members.academy_id
      and am.user_id = auth.uid()
      and am.role = 'coach'
    )
  );

-- Data Migration (Optional, best effort)
-- Insert existing Academy Leaders into Members
insert into academy_members (academy_id, user_id, role)
select id, coach_id, 'coach' from academies
on conflict do nothing;

-- Insert existing Archers into Members (based on profile.academy_id)
insert into academy_members (academy_id, user_id, role)
select academy_id, id, 'archer' from profiles
where academy_id is not null and role = 'archer'
on conflict do nothing;
