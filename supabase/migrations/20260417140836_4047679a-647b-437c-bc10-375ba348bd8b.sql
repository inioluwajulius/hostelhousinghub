-- Add student_id_url column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS student_id_url TEXT;

-- Create private bucket for verification documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-docs', 'verification-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Students can view their own verification docs
CREATE POLICY "Users view own verification docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Students can upload their own verification docs
CREATE POLICY "Users upload own verification docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verification-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Students can update/replace their own verification docs
CREATE POLICY "Users update own verification docs"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'verification-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Students can delete their own verification docs
CREATE POLICY "Users delete own verification docs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'verification-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can view all verification docs
CREATE POLICY "Admins view all verification docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-docs'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);