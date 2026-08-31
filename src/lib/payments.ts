import { supabase } from "@/integrations/supabase/client";

export const paymentsAPI = {
  async initializePayment(bookingId: string, email: string, amount: number) {
    try {
      const { data, error } = await supabase.functions.invoke("paystack-initialize", {
        body: {
          booking_id: bookingId,
          email,
          amount,
        },
      });

      if (error) throw error;

      return {
        authorization_url: data.authorization_url,
        access_code: data.access_code,
        reference: data.reference,
      };
    } catch (err) {
      console.error("Payment initialization failed:", err);
      throw err;
    }
  },

  async verifyPayment(reference: string) {
    try {
      const { data, error } = await supabase.functions.invoke("paystack-verify", {
        body: {
          reference,
        },
      });

      if (error) throw error;

      return {
        success: true,
        bookingId: data.booking_id,
        amount: data.amount,
      };
    } catch (err) {
      console.error("Payment verification failed:", err);
      throw err;
    }
  },

  async handlePaymentCallback(reference: string) {
    try {
      const result = await this.verifyPayment(reference);
      return result;
    } catch (err) {
      console.error("Payment callback error:", err);
      throw err;
    }
  },

  // Utility function to check booking payment status
  async getBookingPaymentStatus(bookingId: string) {
    const { data, error } = await supabase
      .from("bookings")
      .select("payment_status, paystack_ref")
      .eq("id", bookingId)
      .single();

    if (error) throw error;
    return data;
  },

  // Generate payment reference format
  generateReference(bookingId: string): string {
    return `BK-${bookingId}-${Date.now()}`;
  },

  // Format amount for display
  formatAmount(amount: number): string {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  },
};
