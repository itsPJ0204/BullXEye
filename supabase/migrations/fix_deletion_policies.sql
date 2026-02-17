-- Allow coaches to delete their own academies
CREATE POLICY "Coaches can delete their own academies"
ON academies
FOR DELETE
USING (auth.uid() = coach_id);

-- Allow members to leave (delete their own row)
CREATE POLICY "Users can delete their own academy membership"
ON academy_members
FOR DELETE
USING (auth.uid() = user_id);
