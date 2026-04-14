
-- Roommate requests table
CREATE TABLE public.roommate_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  university_id UUID REFERENCES public.universities(id),
  budget_min NUMERIC DEFAULT 0,
  budget_max NUMERIC DEFAULT 500000,
  gender_preference TEXT DEFAULT 'ANY',
  room_type_preference TEXT DEFAULT 'ANY',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.roommate_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active roommate requests" ON public.roommate_requests
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can create own requests" ON public.roommate_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own requests" ON public.roommate_requests
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own requests" ON public.roommate_requests
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
