"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Eye, EyeOff, GraduationCap, Building2 } from "lucide-react";
import { toast } from "sonner";

const LoginPage = () => {
  const router = useRouter();
  const { user, userRole } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "host">("student");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user && userRole) {
      router.push(userRole === "host" ? "/host/dashboard" : "/dashboard");
    }
  }, [user, userRole, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setLoading(false);
      toast.error(error.message);
    } else if (data?.user) {
      // Check if user has the selected role
      const { data: rolesData } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
      const userRolesList = rolesData?.map(r => r.role) || [];
      
      if (!userRolesList.includes(role) && !userRolesList.includes("admin")) {
        setLoading(false);
        await supabase.auth.signOut();
        toast.error(`You don't have a ${role === 'host' ? 'Host' : 'Student'} account yet. Please sign up.`);
        return;
      }
      
      if (typeof window !== "undefined") {
        localStorage.setItem("activeRole", role);
      }
      
      // Dispatch storage event so AuthContext can re-evaluate if needed
      window.dispatchEvent(new Event("storage"));
      
      toast.success("Welcome back!");
      router.push(role === "host" ? "/host/dashboard" : "/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative items-center justify-center p-12">
        <div className="max-w-md text-primary-foreground space-y-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
              <Home className="w-6 h-6" />
            </div>
            <span className="font-display text-2xl font-bold">Hostel & Housing Hub</span>
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight">
            Welcome Back
          </h1>
          <p className="text-primary-foreground/80 text-lg">
            Sign in to manage your bookings, listings, and messages.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <Link href="/" className="lg:hidden inline-flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Home className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-foreground">Hostel & Housing Hub</span>
            </Link>
            <h2 className="font-display text-3xl font-bold text-foreground">Sign In</h2>
            <p className="text-muted-foreground mt-2">Enter your credentials to continue</p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setRole("student")}
              className={`flex-1 flex items-center gap-2 justify-center p-4 rounded-xl border-2 transition-all ${
                role === "student" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <GraduationCap className={`w-5 h-5 ${role === "student" ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`font-medium text-sm ${role === "student" ? "text-primary" : "text-muted-foreground"}`}>Student</span>
            </button>
            <button
              type="button"
              onClick={() => setRole("host")}
              className={`flex-1 flex items-center gap-2 justify-center p-4 rounded-xl border-2 transition-all ${
                role === "host" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <Building2 className={`w-5 h-5 ${role === "host" ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`font-medium text-sm ${role === "host" ? "text-primary" : "text-muted-foreground"}`}>Host</span>
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</Link>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary font-medium hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
