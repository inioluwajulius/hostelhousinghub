
-- Create enums
CREATE TYPE public.app_role AS ENUM ('student', 'host', 'admin');
CREATE TYPE public.property_type AS ENUM ('HOSTEL', 'APARTMENT', 'SELF_CONTAIN', 'MINI_FLAT', 'SHARED_ROOM');
CREATE TYPE public.gender_restriction AS ENUM ('ANY', 'MALE_ONLY', 'FEMALE_ONLY');
CREATE TYPE public.room_type AS ENUM ('SELF_CONTAIN', 'SHARED_2', 'SHARED_4', 'SHARED_6', 'MINI_FLAT');
CREATE TYPE public.booking_type AS ENUM ('SESSION', 'MONTHLY', 'SHORT_TERM');
CREATE TYPE public.booking_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');
CREATE TYPE public.payment_status AS ENUM ('UNPAID', 'PAID', 'REFUNDED');
CREATE TYPE public.property_status AS ENUM ('PENDING', 'APPROVED', 'SUSPENDED');
CREATE TYPE public.review_type AS ENUM ('STUDENT_TO_PROPERTY', 'STUDENT_TO_HOST', 'HOST_TO_STUDENT');
CREATE TYPE public.inspection_status AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');
CREATE TYPE public.report_status AS ENUM ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED');

-- Universities table
CREATE TABLE public.universities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Universities are viewable by everyone" ON public.universities FOR SELECT USING (true);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  university_id UUID REFERENCES public.universities(id),
  matric_number TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_student_verified BOOLEAN NOT NULL DEFAULT false,
  profile_photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Properties table
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  university_id UUID REFERENCES public.universities(id),
  title TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  distance_to_gate_meters INTEGER,
  property_type public.property_type NOT NULL DEFAULT 'HOSTEL',
  gender_restriction public.gender_restriction NOT NULL DEFAULT 'ANY',
  total_rooms INTEGER NOT NULL DEFAULT 0,
  amenities TEXT[] DEFAULT '{}',
  house_rules TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  status public.property_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Properties are viewable by everyone" ON public.properties FOR SELECT USING (true);
CREATE POLICY "Hosts can insert own properties" ON public.properties FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Hosts can update own properties" ON public.properties FOR UPDATE USING (auth.uid() = host_id);
CREATE POLICY "Hosts can delete own properties" ON public.properties FOR DELETE USING (auth.uid() = host_id);

-- Rooms table
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  room_type public.room_type NOT NULL DEFAULT 'SELF_CONTAIN',
  price_per_session DECIMAL(12,2) NOT NULL DEFAULT 0,
  price_per_month DECIMAL(12,2),
  max_occupants INTEGER NOT NULL DEFAULT 1,
  available_count INTEGER NOT NULL DEFAULT 0,
  total_count INTEGER NOT NULL DEFAULT 0,
  photos TEXT[] DEFAULT '{}',
  is_furnished BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rooms are viewable by everyone" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Hosts can manage rooms of own properties" ON public.rooms FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND host_id = auth.uid())
);
CREATE POLICY "Hosts can update rooms of own properties" ON public.rooms FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND host_id = auth.uid())
);
CREATE POLICY "Hosts can delete rooms of own properties" ON public.rooms FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND host_id = auth.uid())
);

-- Bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.rooms(id),
  property_id UUID NOT NULL REFERENCES public.properties(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  booking_type public.booking_type NOT NULL DEFAULT 'SESSION',
  status public.booking_status NOT NULL DEFAULT 'PENDING',
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  service_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_status public.payment_status NOT NULL DEFAULT 'UNPAID',
  paystack_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Hosts can view bookings for own properties" ON public.bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND host_id = auth.uid())
);
CREATE POLICY "Students can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can update own bookings" ON public.bookings FOR UPDATE USING (auth.uid() = student_id);
CREATE POLICY "Hosts can update bookings for own properties" ON public.bookings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND host_id = auth.uid())
);

-- Reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id),
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewee_id UUID REFERENCES auth.users(id),
  property_id UUID REFERENCES public.properties(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  review_type public.review_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id),
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can mark messages as read" ON public.messages FOR UPDATE USING (auth.uid() = receiver_id);

-- Inspections table
CREATE TABLE public.inspections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status public.inspection_status NOT NULL DEFAULT 'PENDING',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view own inspections" ON public.inspections FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Hosts can view inspections for own properties" ON public.inspections FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND host_id = auth.uid())
);
CREATE POLICY "Students can create inspections" ON public.inspections FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can update own inspections" ON public.inspections FOR UPDATE USING (auth.uid() = student_id);
CREATE POLICY "Hosts can update inspections for own properties" ON public.inspections FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND host_id = auth.uid())
);

-- Saved listings table
CREATE TABLE public.saved_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, property_id)
);
ALTER TABLE public.saved_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own saved listings" ON public.saved_listings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save listings" ON public.saved_listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave listings" ON public.saved_listings FOR DELETE USING (auth.uid() = user_id);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Reports table
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id),
  reason TEXT NOT NULL,
  description TEXT,
  status public.report_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reports" ON public.reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Users can create reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-assign role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student'));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_properties_university ON public.properties(university_id);
CREATE INDEX idx_properties_host ON public.properties(host_id);
CREATE INDEX idx_properties_type ON public.properties(property_type);
CREATE INDEX idx_rooms_property ON public.rooms(property_id);
CREATE INDEX idx_bookings_student ON public.bookings(student_id);
CREATE INDEX idx_bookings_property ON public.bookings(property_id);
CREATE INDEX idx_reviews_property ON public.reviews(property_id);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_saved_listings_user ON public.saved_listings(user_id);

-- Storage bucket for property photos
INSERT INTO storage.buckets (id, name, public) VALUES ('property-photos', 'property-photos', true);
CREATE POLICY "Property photos are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'property-photos');
CREATE POLICY "Authenticated users can upload property photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'property-photos' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own property photos" ON storage.objects FOR UPDATE USING (bucket_id = 'property-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own property photos" ON storage.objects FOR DELETE USING (bucket_id = 'property-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
