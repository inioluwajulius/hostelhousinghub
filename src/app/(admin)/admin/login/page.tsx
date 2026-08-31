"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
;
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Eye, EyeOff, Lock } from "lucide-react";
import { toast } from "sonner";

const AdminLoginPage = () => {
  const router = useRouter();
  const { user, userRoles, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user && userRoles.includes("admin")) {
      router.push("/admin");
    }
  }, [user, userRoles, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setSubmitting(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message);
      setSubmitting(false);
      return;
    }

    // Check if user has admin role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);

    const isAdmin = roles?.some((r) => r.role === "admin");

    if (!isAdmin) {
      await supabase.auth.signOut();
      toast.error("Access denied. This portal is for administrators only.");
      setSubmitting(false);
      return;
    }

    toast.success("Welcome back, Admin");
    router.push("/admin");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c1222] relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }} />
      </div>

      {/* Glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-5">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Admin Portal</h1>
          <p className="text-gray-500 text-sm mt-2">Hostel & Housing Hub — Management Console</p>
        </div>

        {/* Login card */}
        <div className="bg-[#141c2e] border border-white/5 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5">
            <Lock className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Secure Login</span>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <Label htmlFor="admin-email" className="text-gray-300 text-sm">Email Address</Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="mt-1.5 bg-[#0c1222] border-white/10 text-white placeholder:text-gray-600 focus:border-primary focus:ring-primary/20"
              />
            </div>
            <div>
              <Label htmlFor="admin-password" className="text-gray-300 text-sm">Password</Label>
              <div className="relative mt-1.5">
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-[#0c1222] border-white/10 text-white placeholder:text-gray-600 focus:border-primary focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-11 font-semibold text-sm"
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Sign In to Admin
                </span>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-xs mt-8">
          This is a restricted area. Unauthorized access attempts are logged.
        </p>
      </div>
    </div>
  );
};

export default AdminLoginPage;
