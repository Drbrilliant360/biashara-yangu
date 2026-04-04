-- Drop the existing permissive UPDATE policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Recreate with role protection: users can update their own profile but cannot change their role
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND role = (SELECT p.role FROM public.profiles p WHERE p.user_id = auth.uid()));
