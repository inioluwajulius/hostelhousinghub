"use client";

import { useState } from "react";
import Link from 'next/link';
;
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { passwordResetAPI } from "@/lib/api";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("Please enter your email"); return; }
    setLoading(true);
    try {
      await passwordResetAPI.requestPasswordReset(email);
      setSent(true);
      toast.success("Password reset link sent to your email");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-8">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Home className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-foreground">Hostel & Housing Hub</span>
        </Link>

        {sent ? (
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-bold text-foreground">Check your email</h2>
            <p className="text-muted-foreground">We sent a password reset link to <strong>{email}</strong></p>
            <p className="text-sm text-muted-foreground">The link will expire in 24 hours.</p>
            <Link href="/login" className="inline-flex items-center gap-1 text-primary text-sm hover:underline">
              <ArrowLeft className="w-4 h-4" /> Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">Forgot Password</h2>
              <p className="text-muted-foreground mt-2">Enter your email and we'll send a reset link</p>
            </div>
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
            <Link href="/login" className="inline-flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground">
              <ArrowLeft className="w-4 h-4" /> Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
