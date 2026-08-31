"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
;
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const BookingCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    const reference = searchParams.get("reference") || searchParams.get("trxref");
    if (reference) verifyPayment(reference);
    else setStatus("failed");
  }, [searchParams]);

  const verifyPayment = async (reference: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setStatus("failed"); return; }

      const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/paystack-verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ reference }),
        }
      );

      const data = await res.json();
      if (data.success) {
        setStatus("success");
        setBookingId(data.booking_id);
      } else {
        setStatus("failed");
      }
    } catch {
      setStatus("failed");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md space-y-6">
          {status === "verifying" && (
            <>
              <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto" />
              <h1 className="font-display text-2xl font-bold">Verifying Payment...</h1>
              <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle className="w-16 h-16 text-primary mx-auto" />
              <h1 className="font-display text-2xl font-bold text-foreground">Payment Successful!</h1>
              <p className="text-muted-foreground">Your booking has been confirmed. You'll receive a notification shortly.</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => router.push("/dashboard")}>View Dashboard</Button>
                <Button variant="outline" onClick={() => router.push("/search")}>Browse More</Button>
              </div>
            </>
          )}
          {status === "failed" && (
            <>
              <XCircle className="w-16 h-16 text-destructive mx-auto" />
              <h1 className="font-display text-2xl font-bold text-foreground">Payment Failed</h1>
              <p className="text-muted-foreground">We couldn't verify your payment. Please try again or contact support.</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => router.push(-1)}>Go Back</Button>
                <Button variant="outline" onClick={() => router.push("/search")}>Browse Listings</Button>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BookingCallbackPage;
