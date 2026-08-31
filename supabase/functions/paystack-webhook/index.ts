import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const paystackSecret = Deno.env.get("PAYSTACK_SECRET_KEY");

if (!supabaseUrl || !supabaseKey || !paystackSecret) {
  throw new Error("Missing required environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface PaystackWebhookEvent {
  event: string;
  data: {
    reference: string;
    amount: number;
    status: string;
    customer: {
      email: string;
      customer_code: string;
    };
    [key: string]: any;
  };
}

async function handleWebhook(req: Request): Promise<Response> {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Get the raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify signature using HMAC
    const encoder = new TextEncoder();
    const data = encoder.encode(body + paystackSecret);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    if (hashHex !== signature) {
      console.warn("Invalid webhook signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload: PaystackWebhookEvent = JSON.parse(body);

    // Handle different webhook events
    if (payload.event === "charge.success") {
      await handleChargeSuccess(payload.data);
    } else if (payload.event === "charge.failed") {
      await handleChargeFailed(payload.data);
    } else if (payload.event === "charge.dispute.create") {
      await handleDispute(payload.data);
    }

    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

async function handleChargeSuccess(data: PaystackWebhookEvent["data"]): Promise<void> {
  const { reference, amount, customer } = data;

  console.log(`Processing successful payment: ${reference}`);

  // Find booking by payment reference
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, student_id, host_id, property_id")
    .eq("payment_reference", reference)
    .single();

  if (bookingError || !booking) {
    console.warn(`Booking not found for reference: ${reference}`);
    return;
  }

  // Update booking status
  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "CONFIRMED",
      paid_at: new Date().toISOString(),
    })
    .eq("id", booking.id);

  if (updateError) {
    console.error("Failed to update booking:", updateError);
    return;
  }

  // Create notification for student
  const { error: studentNotifError } = await supabase.from("notifications").insert({
    user_id: booking.student_id,
    type: "payment",
    message: "Payment confirmed! Your booking is now active.",
    booking_id: booking.id,
    is_read: false,
    created_at: new Date().toISOString(),
  });
  if (studentNotifError) {
    console.error("Failed to create student notification:", studentNotifError);
  }

  // Create notification for host
  const { error: hostNotifError } = await supabase.from("notifications").insert({
    user_id: booking.host_id,
    type: "booking",
    message: `New payment received for booking. Amount: ₦${(amount / 100).toLocaleString()}`,
    booking_id: booking.id,
    is_read: false,
    created_at: new Date().toISOString(),
  });
  if (hostNotifError) {
    console.error("Failed to create host notification:", hostNotifError);
  }

  // Record payment attempt
  const { error: paymentAttemptError } = await supabase.from("payment_attempts").insert({
    booking_id: booking.id,
    reference,
    amount: amount / 100,
    status: "SUCCESS",
    attempted_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  });
  if (paymentAttemptError) {
    console.error("Failed to record payment attempt:", paymentAttemptError);
  }
}

async function handleChargeFailed(data: PaystackWebhookEvent["data"]): Promise<void> {
  const { reference } = data;

  console.log(`Processing failed payment: ${reference}`);

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, student_id")
    .eq("payment_reference", reference)
    .single();

  if (bookingError || !booking) {
    console.warn(`Booking not found for reference: ${reference}`);
    return;
  }

  // Update booking status to CANCELLED
  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "CANCELLED",
    })
    .eq("id", booking.id);

  if (updateError) {
    console.error("Failed to update booking:", updateError);
    return;
  }

  // Notify student
  const { error: studentNotifError } = await supabase.from("notifications").insert({
    user_id: booking.student_id,
    type: "payment",
    message: "Payment failed. Please try again or contact support.",
    booking_id: booking.id,
    is_read: false,
    created_at: new Date().toISOString(),
  });
  if (studentNotifError) {
    console.error("Failed to create failure notification:", studentNotifError);
  }

  // Record failed attempt
  const { error: failedAttemptError } = await supabase.from("payment_attempts").insert({
    booking_id: booking.id,
    reference,
    amount: data.amount / 100,
    status: "FAILED",
    attempted_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  });
  if (failedAttemptError) {
    console.error("Failed to record failed payment attempt:", failedAttemptError);
  }
}

async function handleDispute(data: PaystackWebhookEvent["data"]): Promise<void> {
  console.log(`Dispute created for payment:`, data);

  const { reference } = data;

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, host_id")
    .eq("payment_reference", reference)
    .single();

  if (!booking) return;

  // Notify host about dispute
  await supabase.from("notifications").insert({
    user_id: booking.host_id,
    type: "payment",
    message: "A payment dispute has been raised for one of your bookings. Review it immediately.",
    booking_id: booking.id,
    is_read: false,
    created_at: new Date().toISOString(),
  });
}

serve(handleWebhook);
