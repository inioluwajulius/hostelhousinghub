ALTER TABLE public.roommate_requests
  ADD COLUMN IF NOT EXISTS sleep_schedule text NOT NULL DEFAULT 'FLEXIBLE',
  ADD COLUMN IF NOT EXISTS cleanliness text NOT NULL DEFAULT 'MEDIUM',
  ADD COLUMN IF NOT EXISTS smoking_ok boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS study_level text;
GRANT SELECT ON public.roommate_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roommate_requests TO authenticated;
GRANT ALL ON public.roommate_requests TO service_role;
DROP POLICY IF EXISTS "Users can view own requests" ON public.roommate_requests;
CREATE POLICY "Users can view own requests" ON public.roommate_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);