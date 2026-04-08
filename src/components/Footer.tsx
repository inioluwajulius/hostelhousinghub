import { Link } from "react-router-dom";
import { Home, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <Home className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold">
                Hostel & Housing Hub
              </span>
            </div>
            <p className="text-sm opacity-70 leading-relaxed">
              Connecting students to safe, affordable housing near campus across Nigeria.
            </p>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold mb-4 opacity-90">For Students</h4>
            <ul className="space-y-2 text-sm opacity-70">
              <li><Link to="/search" className="hover:opacity-100 transition-opacity">Find Housing</Link></li>
              <li><Link to="/" className="hover:opacity-100 transition-opacity">Roommate Finder</Link></li>
              <li><Link to="/" className="hover:opacity-100 transition-opacity">Safety Guide</Link></li>
              <li><Link to="/" className="hover:opacity-100 transition-opacity">Student Deals</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold mb-4 opacity-90">For Hosts</h4>
            <ul className="space-y-2 text-sm opacity-70">
              <li><Link to="/" className="hover:opacity-100 transition-opacity">List Property</Link></li>
              <li><Link to="/" className="hover:opacity-100 transition-opacity">Host Dashboard</Link></li>
              <li><Link to="/" className="hover:opacity-100 transition-opacity">Pricing Plans</Link></li>
              <li><Link to="/" className="hover:opacity-100 transition-opacity">Get Verified</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold mb-4 opacity-90">Contact</h4>
            <ul className="space-y-3 text-sm opacity-70">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                hello@hostelhub.ng
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                +234 800 HOSTEL
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Lagos, Nigeria
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-10 pt-6 text-center text-xs opacity-50">
          © {new Date().getFullYear()} Hostel & Housing Hub. Built with purpose, designed for students.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
