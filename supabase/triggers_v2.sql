-- Drop existing trigger/function to ensure clean slate
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Improved Function
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, bow_category, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'bow_category',
    null -- Role starts as null
  );
  return new;
exception
  when others then
    -- Log error (visible in Supabase logs)
    raise warning 'Profile creation failed for user %: %', new.id, SQLERRM;
    return new;
end;
$$ language plpgsql security definer;

-- Re-create Trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
