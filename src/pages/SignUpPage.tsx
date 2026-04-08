import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, GraduationCap, Building2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const SignUpPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"student" | "host">("student");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created! Check your email to verify.");
      navigate("/login");
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
            Find Safe Housing Near Campus
          </h1>
          <p className="text-primary-foreground/80 text-lg">
            Join thousands of students and hosts on Nigeria's trusted student housing marketplace.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <Link to="/" className="lg:hidden inline-flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Home className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-foreground">Hostel & Housing Hub</span>
            </Link>
            <h2 className="font-display text-3xl font-bold text-foreground">Create Account</h2>
            <p className="text-muted-foreground mt-2">Join as a student or property host</p>
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

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Creating account..." : `Sign up as ${role === "student" ? "Student" : "Host"}`}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
