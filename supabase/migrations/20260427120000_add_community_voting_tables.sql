-- Create property_votes table for community voting
CREATE TABLE public.property_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(property_id, user_id)
);

ALTER TABLE public.property_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "property_votes are viewable by everyone" ON public.property_votes FOR SELECT USING (true);
CREATE POLICY "Users can insert their own votes" ON public.property_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own votes" ON public.property_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own votes" ON public.property_votes FOR DELETE USING (auth.uid() = user_id);

-- Create property_flags table for community reporting
CREATE TABLE public.property_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('scam', 'unsafe', 'misrepresented', 'harassment', 'other')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'REPORTED' CHECK (status IN ('REPORTED', 'RESOLVED')),
  resolution TEXT,
  resolved_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.property_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "property_flags are viewable by everyone" ON public.property_flags FOR SELECT USING (true);
CREATE POLICY "Users can insert flags" ON public.property_flags FOR INSERT WITH CHECK (auth.uid() = reported_by);
CREATE POLICY "Admins can update flags" ON public.property_flags FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create indexes for performance
CREATE INDEX idx_property_votes_property_id ON public.property_votes(property_id);
CREATE INDEX idx_property_votes_user_id ON public.property_votes(user_id);
CREATE INDEX idx_property_flags_property_id ON public.property_flags(property_id);
CREATE INDEX idx_property_flags_status ON public.property_flags(status);
