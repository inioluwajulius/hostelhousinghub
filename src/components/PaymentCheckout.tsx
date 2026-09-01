import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, CheckCircle2, AlertTriangle, Loader } from "lucide-react";
import { paymentWebhookAPI, notificationsAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface PaymentCheckoutProps {
  bookingId: string;
  amount: number;
  propertyName: string;
  checkInDate: string;
  checkOutDate: string;
  onPaymentSuccess?: () => void;
}

export default function PaymentCheckout({
  bookingId,
  amount,
  propertyName,
  checkInDate,
  checkOutDate,
  onPaymentSuccess,
}: PaymentCheckoutProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "failed">("idle");
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    loadPaymentStatus();
  }, [bookingId]);

  const loadPaymentStatus = async () => {
    try {
      setLoading(true);
      const [status, history] = await Promise.all([
        paymentWebhookAPI.getPaymentStatus(bookingId),
        paymentWebhookAPI.getPaymentHistory(bookingId),
      ]);

      setPaymentReference(status.reference);
      if (status.isPaid) {
        setPaymentStatus("success");
      }
      setPaymentHistory(history);
    } catch (err) {
      console.error("Error loading payment status:", err);
    } finally {
      setLoading(false);
    }
  };

  const initializePayment = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to make a payment",
        variant: "destructive",
      });
      return;
    }

    setPaymentStatus("processing");
    setErrorMessage("");

    try {
      // Generate unique reference
      const reference = `booking-${bookingId}-${Date.now()}`;
      setPaymentReference(reference);

      // Record payment attempt
      await paymentWebhookAPI.recordPaymentAttempt(bookingId, reference, amount);

      // Initialize Paystack payment
      const paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

      if (!paystackPublicKey) {
        throw new Error("Paystack public key not configured");
      }

      // Load Paystack script if not already loaded
      if ((window as any).PaystackPop === undefined) {
        const script = document.createElement("script");
        script.src = "https://js.paystack.co/v1/inline.js";
        script.async = true;
        document.body.appendChild(script);

        // Wait for script to load
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      // Initialize Paystack popup
      const handler = (window as any).PaystackPop.setup({
        key: paystackPublicKey,
        email: user.email,
        amount: amount * 100, // Amount in kobo (Paystack requirement)
        ref: reference,
        currency: "NGN",
        onClose: () => {
          setPaymentStatus("idle");
          toast({
            title: "Cancelled",
            description: "Payment was cancelled",
          });
        },
        onSuccess: async (response: any) => {
          try {
            // Verify payment on backend
            const verified = await verifyPayment(response.reference);

            if (verified) {
              setPaymentStatus("success");
              toast({
                title: "Success",
                description: "Payment completed successfully!",
              });

              // Reload payment status
              setTimeout(() => loadPaymentStatus(), 1000);

              // Call success callback
              if (onPaymentSuccess) {
                onPaymentSuccess();
              }
            } else {
              setPaymentStatus("failed");
              setErrorMessage("Payment verification failed. Please contact support.");
            }
          } catch (err: any) {
            setPaymentStatus("failed");
            setErrorMessage(err.message || "Payment verification failed");
          }
        },
      });

      handler.openIframe();
    } catch (err: any) {
      setPaymentStatus("failed");
      setErrorMessage(err.message || "Failed to initialize payment");
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const verifyPayment = async (reference: string): Promise<boolean> => {
    try {
      // Call the verify-payment Supabase function
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/paystack-verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ reference, bookingId }),
      });

      if (!response.ok) {
        throw new Error("Payment verification failed");
      }

      const data = await response.json();
      if (!data || typeof data !== 'object') {
        throw new Error("Invalid payment verification response");
      }
      return data.status === "success";
    } catch (err) {
      console.error("Payment verification error:", err);
      throw err;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading payment details...</p>
        </CardContent>
      </Card>
    );
  }

  const nights =
    Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24)) || 1;

  return (
    <div className="space-y-4">
      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Property</span>
              <span className="font-medium">{propertyName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Check-in</span>
              <span className="font-medium">{formatDate(checkInDate)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Check-out</span>
              <span className="font-medium">{formatDate(checkOutDate)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-medium">{nights} night(s)</span>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total Amount</span>
              <span className="text-2xl font-bold text-primary">₦{amount.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Status Badge */}
          <div className="flex justify-center pt-2">
            {paymentStatus === "success" ? (
              <Badge className="bg-green-600 gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Paid
              </Badge>
            ) : paymentStatus === "failed" ? (
              <Badge className="bg-red-600 gap-2">
                <AlertTriangle className="h-4 w-4" />
                Payment Failed
              </Badge>
            ) : (
              <Badge variant="outline">Pending</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {errorMessage && (
        <Alert className="border-red-600 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Payment Status Card */}
      {paymentStatus === "success" ? (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-green-900">Payment Confirmed</h3>
                <p className="text-sm text-green-800 mt-1">Your booking is now confirmed. Check your email for details.</p>
                <p className="text-xs text-green-700 mt-2">Reference: {paymentReference}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : paymentStatus === "processing" ? (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Loader className="h-6 w-6 text-blue-600 flex-shrink-0 animate-spin mt-1" />
              <div>
                <h3 className="font-semibold text-blue-900">Processing Payment</h3>
                <p className="text-sm text-blue-800 mt-1">Please complete the Paystack payment popup...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={initializePayment} size="lg" className="w-full gap-2">
          <CreditCard className="h-5 w-5" />
          Pay ₦{amount.toLocaleString()} with Paystack
        </Button>
      )}

      {/* Payment History */}
      {paymentHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {paymentHistory.map((attempt) => (
              <div key={attempt.id} className="flex items-center justify-between p-2 border rounded text-sm">
                <div>
                  <p className="font-medium">{attempt.reference}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(attempt.attempted_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">₦{attempt.amount.toLocaleString()}</span>
                  {attempt.status === "SUCCESS" ? (
                    <Badge className="bg-green-600">Successful</Badge>
                  ) : (
                    <Badge variant="destructive">Failed</Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Security Info */}
      <Alert className="bg-blue-50 border-blue-200">
        <AlertTriangle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          Your payment is processed securely through Paystack. We never store your card details.
        </AlertDescription>
      </Alert>
    </div>
  );
}
