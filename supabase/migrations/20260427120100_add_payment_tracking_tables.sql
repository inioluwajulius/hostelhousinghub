-- Add payment_reference and paid_at columns to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS payment_reference TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Create payment_attempts table for tracking payment attempts
CREATE TABLE public.payment_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  reference TEXT NOT NULL UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
  response JSONB,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payment attempts" ON public.payment_attempts FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = payment_attempts.booking_id 
    AND (
      bookings.student_id = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM public.properties 
        WHERE properties.id = bookings.property_id 
        AND properties.host_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Service role can insert payment attempts" ON public.payment_attempts FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update payment attempts" ON public.payment_attempts FOR UPDATE USING (true);

-- Create indexes for performance
CREATE INDEX idx_payment_attempts_booking_id ON public.payment_attempts(booking_id);
CREATE INDEX idx_payment_attempts_reference ON public.payment_attempts(reference);
CREATE INDEX idx_payment_attempts_status ON public.payment_attempts(status);
CREATE INDEX idx_bookings_payment_reference ON public.bookings(payment_reference);
