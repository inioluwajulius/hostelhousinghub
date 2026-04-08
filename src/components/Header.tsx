import { Link } from "react-router-dom";
import { Home, Menu, X, User } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

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
          <Link to="/search" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Find Housing
          </Link>
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            List Property
          </Link>
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            How It Works
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm">
            Sign In
          </Button>
          <Button size="sm">
            Get Started
          </Button>
        </div>

        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t bg-card px-4 py-4 space-y-3 animate-fade-in">
          <Link to="/search" className="block text-sm font-medium text-muted-foreground py-2" onClick={() => setMobileOpen(false)}>
            Find Housing
          </Link>
          <Link to="/" className="block text-sm font-medium text-muted-foreground py-2" onClick={() => setMobileOpen(false)}>
            List Property
          </Link>
          <Link to="/" className="block text-sm font-medium text-muted-foreground py-2" onClick={() => setMobileOpen(false)}>
            How It Works
          </Link>
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" size="sm" className="flex-1">Sign In</Button>
            <Button size="sm" className="flex-1">Get Started</Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
