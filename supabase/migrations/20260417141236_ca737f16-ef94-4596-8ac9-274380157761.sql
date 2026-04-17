-- Trigger to notify student on verification status change
CREATE OR REPLACE FUNCTION public.notify_student_verification_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Approved: is_student_verified flipped from false to true
  IF (OLD.is_student_verified IS DISTINCT FROM NEW.is_student_verified) AND NEW.is_student_verified = true THEN
    INSERT INTO public.notifications (user_id, type, title, message, metadata)
    VALUES (
      NEW.user_id,
      'verification_update',
      'Student ID Verified ✓',
      'Your student ID has been approved. You are now a verified student.',
      jsonb_build_object('verified', true)
    );
  END IF;

  -- Rejected: previously had a student_id_url, admin cleared it
  IF (OLD.student_id_url IS NOT NULL AND NEW.student_id_url IS NULL) THEN
    INSERT INTO public.notifications (user_id, type, title, message, metadata)
    VALUES (
      NEW.user_id,
      'verification_update',
      'Student ID Rejected',
      'Your student ID could not be verified. Please upload a clearer photo of your ID card.',
      jsonb_build_object('verified', false, 'action', 'reupload')
    );
  END IF;

  -- Verification revoked: was verified, now not (and not just a fresh upload)
  IF (OLD.is_student_verified = true AND NEW.is_student_verified = false AND OLD.student_id_url IS NOT DISTINCT FROM NEW.student_id_url) THEN
    INSERT INTO public.notifications (user_id, type, title, message, metadata)
    VALUES (
      NEW.user_id,
      'verification_update',
      'Verification Revoked',
      'Your verified student status has been revoked by an admin. Please contact support if you believe this is a mistake.',
      jsonb_build_object('verified', false, 'action', 'revoked')
    );
  END IF;

  -- Host verification approved
  IF (OLD.is_verified IS DISTINCT FROM NEW.is_verified) AND NEW.is_verified = true THEN
    INSERT INTO public.notifications (user_id, type, title, message, metadata)
    VALUES (
      NEW.user_id,
      'verification_update',
      'Host Account Verified ✓',
      'Your host account has been verified. Your listings will now show a verified badge.',
      jsonb_build_object('verified', true, 'role', 'host')
    );
  END IF;

  -- Host verification revoked
  IF (OLD.is_verified = true AND NEW.is_verified = false) THEN
    INSERT INTO public.notifications (user_id, type, title, message, metadata)
    VALUES (
      NEW.user_id,
      'verification_update',
      'Host Verification Revoked',
      'Your host verification has been revoked by an admin. Please contact support for more information.',
      jsonb_build_object('verified', false, 'role', 'host', 'action', 'revoked')
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_verification_change ON public.profiles;
CREATE TRIGGER on_profile_verification_change
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_student_verification_change();