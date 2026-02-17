-- Drop valid or invalid FK for academy_id
ALTER TABLE profiles
DROP CONSTRAINT if exists profiles_academy_id_fkey;

-- Re-add with ON DELETE SET NULL
ALTER TABLE profiles
ADD CONSTRAINT profiles_academy_id_fkey
FOREIGN KEY (academy_id)
REFERENCES academies(id)
ON DELETE SET NULL;
