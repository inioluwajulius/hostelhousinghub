"use client";

import { useState, useEffect } from "react";
import { Search, Shield, Star, MapPin, BadgeCheck, Users, GraduationCap, Building2, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSearch from "@/components/HeroSearch";
import ListingCard from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import Link from "next/link";
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
          {/* using standard img instead of next/image to prevent immediate configuration issues with static assets */}
          <img src={heroBg.src || heroBg} alt="" className="w-full h-full object-cover" width={1920} height={1080} />
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
              <Link href="/search" className="hidden md:flex items-center"><Button variant="ghost" className="gap-1 text-primary">View all <ArrowRight className="w-4 h-4" /></Button></Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((p) => (<ListingCard key={p.id} property={p} />))}
            </div>
            <div className="text-center mt-8 md:hidden">
              <Link href="/search"><Button variant="outline">View All Listings</Button></Link>
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
              <Link key={u.id} href={`/search?university=${u.short_name}`} className="group bg-card rounded-xl border p-4 text-center card-hover">
                <p className="font-display font-bold text-primary text-lg">{u.short_name}</p>
                <p className="text-xs text-muted-foreground mt-1">{u.city}, {u.state}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section-padding bg-background border-t">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">Why Choose Hostel & Housing Hub?</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                We take the stress out of off-campus housing by providing a secure, transparent, and student-first platform.
              </p>
              <ul className="space-y-4 pt-4">
                {[
                  { title: "Verified Landlords Only", desc: "Every property owner is vetted to prevent scams.", icon: BadgeCheck },
                  { title: "Secure Escrow Payments", desc: "Your money is safe until you inspect and approve the room.", icon: Shield },
                  { title: "Campus-Proximity Search", desc: "Find homes strictly within walking or short driving distance.", icon: MapPin }
                ].map((item, idx) => (
                  <li key={idx} className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-foreground">{item.title}</h4>
                      <p className="text-muted-foreground mt-1 text-sm">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative hidden lg:block">
              <div className="aspect-square rounded-3xl bg-muted/50 border overflow-hidden shadow-2xl">
                <img src={heroBg.src || heroBg} alt="Students" className="w-full h-full object-cover opacity-90 transition-opacity" />
              </div>
              <div className="absolute -bottom-8 -left-8 bg-card p-6 rounded-2xl border shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                    <Shield className="w-7 h-7 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-2xl font-display">100%</p>
                    <p className="text-sm text-muted-foreground font-medium">Secure Payments</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-padding bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">What Students Say</h2>
            <p className="text-muted-foreground mt-3 max-w-md mx-auto">Real experiences from students who found their homes through us.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[ 
              { name: "Aisha T.", school: "UNILAG", review: "Found an amazing hostel within walking distance to campus. The process was completely stress-free!" },
              { name: "David O.", school: "OAU", review: "The escrow payment gave my parents peace of mind. Highly recommend for any student moving off-campus." },
              { name: "Sarah M.", school: "UNIBEN", review: "I even found my roommate through the app. Best housing platform for students in Nigeria, hands down." }
            ].map((t, i) => (
              <div key={i} className="bg-card p-8 rounded-2xl border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex text-amber-500 mb-6">
                    {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-current" />)}
                  </div>
                  <p className="text-foreground/80 italic mb-8 leading-relaxed">"{t.review}"</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-lg">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.school}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-primary">
        <div className="container mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground">Own a Hostel or Property?</h2>
          <p className="text-primary-foreground/80 mt-3 max-w-md mx-auto">Join thousands of verified hosts earning from student bookings. List your property for free.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link href="/signup"><Button size="lg" variant="secondary" className="font-semibold w-full sm:w-auto text-primary">List Your Property</Button></Link>
            <Link href="/search"><Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-white">Browse Listings</Button></Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
