import { Link } from "react-router-dom";
import { Home, Menu, X, User, LogOut, MessageSquare, Users, Shield } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, userRole, userRoles, profile, signOut } = useAuth();

  const isAdmin = userRoles.includes("admin");
  const isHost = userRoles.includes("host");
  const dashboardLink = userRole === "admin" ? "/admin" : userRole === "host" ? "/host/dashboard" : "/dashboard";

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Home className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold text-foreground">
            Hostel<span className="text-primary">&</span>Housing Hub
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link to="/search" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Find Housing</Link>
          <Link to="/roommates" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <Users className="w-4 h-4" />Roommates
          </Link>
          {user && (
            <Link to="/messages" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />Messages
            </Link>
          )}
          {isHost && (
            <Link to="/host/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Host Dashboard</Link>
          )}
          {isAdmin && (
            <Link to="/admin" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <Shield className="w-4 h-4" />Admin
            </Link>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link to={dashboardLink}>
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <User className="w-4 h-4" />
                  {profile?.full_name?.split(" ")[0] || "Dashboard"}
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={signOut} className="gap-1.5 text-muted-foreground">
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
              <Link to="/signup"><Button size="sm">Get Started</Button></Link>
            </>
          )}
        </div>

        <button className="md:hidden p-2 text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t bg-card px-4 py-4 space-y-3 animate-fade-in">
          <Link to="/search" className="block text-sm font-medium text-muted-foreground py-2" onClick={() => setMobileOpen(false)}>Find Housing</Link>
          {user ? (
            <>
              <Link to={dashboardLink} className="block text-sm font-medium text-muted-foreground py-2" onClick={() => setMobileOpen(false)}>Dashboard</Link>
              <Link to="/messages" className="block text-sm font-medium text-muted-foreground py-2" onClick={() => setMobileOpen(false)}>Messages</Link>
              <Link to="/roommates" className="block text-sm font-medium text-muted-foreground py-2" onClick={() => setMobileOpen(false)}>Roommates</Link>
              {isAdmin && (
                <Link to="/admin" className="block text-sm font-medium text-primary py-2 flex items-center gap-1" onClick={() => setMobileOpen(false)}>
                  <Shield className="w-4 h-4" />Admin Dashboard
                </Link>
              )}
              <Button variant="ghost" size="sm" onClick={() => { signOut(); setMobileOpen(false); }} className="w-full justify-start text-muted-foreground">Sign Out</Button>
            </>
          ) : (
            <div className="flex gap-2 pt-2">
              <Link to="/login" className="flex-1" onClick={() => setMobileOpen(false)}><Button variant="ghost" size="sm" className="w-full">Sign In</Button></Link>
              <Link to="/signup" className="flex-1" onClick={() => setMobileOpen(false)}><Button size="sm" className="w-full">Get Started</Button></Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
