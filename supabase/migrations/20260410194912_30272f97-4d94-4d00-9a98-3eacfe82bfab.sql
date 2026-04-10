
-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Allow system to insert notifications (for triggers)
CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Storage policies for property-photos bucket
CREATE POLICY "Anyone can view property photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-photos');

CREATE POLICY "Hosts can upload property photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'property-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Hosts can update own property photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'property-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Hosts can delete own property photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'property-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Notification trigger: new booking created (notify host)
CREATE OR REPLACE FUNCTION public.notify_new_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prop_title TEXT;
  host_uuid UUID;
BEGIN
  SELECT title, host_id INTO prop_title, host_uuid
  FROM public.properties WHERE id = NEW.property_id;
  
  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  VALUES (host_uuid, 'new_booking', 'New Booking Request',
    'A student has requested to book ' || COALESCE(prop_title, 'your property'),
    jsonb_build_object('booking_id', NEW.id, 'property_id', NEW.property_id));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_booking_created
AFTER INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_booking();

-- Notification trigger: booking status changed (notify student)
CREATE OR REPLACE FUNCTION public.notify_booking_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prop_title TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT title INTO prop_title FROM public.properties WHERE id = NEW.property_id;
    
    INSERT INTO public.notifications (user_id, type, title, message, metadata)
    VALUES (NEW.student_id, 'booking_update', 'Booking ' || NEW.status,
      'Your booking for ' || COALESCE(prop_title, 'a property') || ' has been ' || LOWER(NEW.status::text),
      jsonb_build_object('booking_id', NEW.id, 'status', NEW.status));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_booking_status_change
AFTER UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.notify_booking_status_change();

-- Notification trigger: new message (notify receiver)
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_name TEXT;
BEGIN
  SELECT full_name INTO sender_name FROM public.profiles WHERE user_id = NEW.sender_id LIMIT 1;
  
  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  VALUES (NEW.receiver_id, 'new_message', 'New Message',
    'You have a new message from ' || COALESCE(sender_name, 'someone'),
    jsonb_build_object('sender_id', NEW.sender_id, 'message_id', NEW.id));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_message_created
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_message();

-- Notification trigger: inspection status change (notify student)
CREATE OR REPLACE FUNCTION public.notify_inspection_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prop_title TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT title INTO prop_title FROM public.properties WHERE id = NEW.property_id;
    
    INSERT INTO public.notifications (user_id, type, title, message, metadata)
    VALUES (NEW.student_id, 'inspection_update', 'Inspection ' || NEW.status,
      'Your inspection for ' || COALESCE(prop_title, 'a property') || ' has been ' || LOWER(NEW.status::text),
      jsonb_build_object('inspection_id', NEW.id, 'status', NEW.status));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_inspection_status_change
AFTER UPDATE ON public.inspections
FOR EACH ROW
EXECUTE FUNCTION public.notify_inspection_status_change();
