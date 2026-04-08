import { useState, useEffect } from "react";
import { Search, Shield, Star, MapPin, BadgeCheck, Users, GraduationCap, Building2, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSearch from "@/components/HeroSearch";
import ListingCard from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

const Index = () => {
  const [featured, setFeatured] = useState<any[]>([]);
  const [universities, setUniversities] = useState<any[]>([]);

  useEffect(() => {
    // Fetch featured properties & universities
    Promise.all([
      supabase.from("properties").select("*, universities(name, short_name), rooms(room_type, price_per_session, available_count), reviews:reviews(rating)").eq("is_active", true).limit(6),
      supabase.from("universities").select("*").order("name").limit(8),
    ]).then(([propsRes, uniRes]) => {
      const enriched = (propsRes.data || []).map(p => {
        const ratings = (p.reviews || []).map((r: any) => r.rating);
        const avgRating = ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;
        const prices = (p.rooms || []).map((r: any) => r.price_per_session).filter((v: number) => v > 0);
        const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const totalAvailable = (p.rooms || []).reduce((sum: number, r: any) => sum + (r.available_count || 0), 0);
        return { ...p, avgRating, reviewCount: ratings.length, lowestPrice, totalAvailable };
      });
      setFeatured(enriched.slice(0, 3));
      setUniversities(uniRes.data || []);
    });
  }, []);

  const stats = [
    { value: "2.1M+", label: "Students Served", icon: GraduationCap },
    { value: "600K+", label: "Housing Units", icon: Building2 },
    { value: "150+", label: "Universities", icon: MapPin },
    { value: "4.7★", label: "Avg. Rating", icon: Star },
  ];

  const howItWorks = [
    { step: "01", title: "Select Your School", desc: "Choose from 150+ Nigerian universities. We show only housing near your campus." },
    { step: "02", title: "Browse & Compare", desc: "Filter by room type, price, distance, and amenities. Read real student reviews." },
    { step: "03", title: "Book Securely", desc: "Pay via Paystack with escrow protection. Schedule an inspection before you commit." },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="w-full h-full object-cover" width={1920} height={1080} />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/85 via-foreground/70 to-foreground/40" />
        </div>
        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-sm text-primary-foreground rounded-full px-4 py-1.5 text-xs font-medium">
              <BadgeCheck className="w-3.5 h-3.5" />Verified Listings Only
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight">
              Find Safe Housing{" "}<span className="text-accent">Near Campus</span>
            </h1>
            <p className="text-primary-foreground/80 text-lg max-w-lg leading-relaxed">
              Nigeria's trusted student housing marketplace. Verified landlords, transparent pricing, and campus-proximity search.
            </p>
            <HeroSearch />
            <div className="flex items-center gap-4 text-primary-foreground/60 text-xs pt-2">
              <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Escrow Protection</span>
              <span className="flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5" /> Verified Hosts</span>
              <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5" /> Student Reviews</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b bg-card">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center animate-count-up">
                <s.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-2xl md:text-3xl font-bold font-display text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding bg-background">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">How It Works</h2>
            <p className="text-muted-foreground mt-3 max-w-md mx-auto">Find your perfect student accommodation in three simple steps.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {howItWorks.map((item) => (
              <div key={item.step} className="text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary font-display font-bold text-xl flex items-center justify-center mx-auto">{item.step}</div>
                <h3 className="font-display text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      {featured.length > 0 && (
        <section className="section-padding bg-muted/30">
          <div className="container mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">Featured Listings</h2>
                <p className="text-muted-foreground mt-2">Verified, top-rated housing near popular universities.</p>
              </div>
              <Link to="/search"><Button variant="ghost" className="hidden md:flex items-center gap-1 text-primary">View all <ArrowRight className="w-4 h-4" /></Button></Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((p) => (<ListingCard key={p.id} property={p} />))}
            </div>
            <div className="text-center mt-8 md:hidden">
              <Link to="/search"><Button variant="outline">View All Listings</Button></Link>
            </div>
          </div>
        </section>
      )}

      {/* Popular Universities */}
      <section className="section-padding bg-background">
        <div className="container mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">Popular Universities</h2>
            <p className="text-muted-foreground mt-2">Browse housing near top Nigerian campuses.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {universities.map((u) => (
              <Link key={u.id} to={`/search?university=${u.short_name}`} className="group bg-card rounded-xl border p-4 text-center card-hover">
                <p className="font-display font-bold text-primary text-lg">{u.short_name}</p>
                <p className="text-xs text-muted-foreground mt-1">{u.city}, {u.state}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-primary">
        <div className="container mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground">Own a Hostel or Property?</h2>
          <p className="text-primary-foreground/80 mt-3 max-w-md mx-auto">Join thousands of verified hosts earning from student bookings. List your property for free.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link to="/signup"><Button size="lg" variant="secondary" className="font-semibold">List Your Property</Button></Link>
            <Link to="/search"><Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">Browse Listings</Button></Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
