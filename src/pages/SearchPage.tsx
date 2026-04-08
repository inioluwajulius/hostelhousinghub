import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { MapPin, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ListingCard from "@/components/ListingCard";
import HeroSearch from "@/components/HeroSearch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

const propertyTypes = ["HOSTEL", "SELF_CONTAIN", "SHARED_ROOM", "MINI_FLAT", "APARTMENT"] as const;
const propertyTypeLabels: Record<string, string> = {
  HOSTEL: "Hostel", SELF_CONTAIN: "Self Contain", SHARED_ROOM: "Shared Room",
  MINI_FLAT: "Mini Flat", APARTMENT: "Apartment",
};

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const selectedUni = searchParams.get("university") || "";
  const [typeFilter, setTypeFilter] = useState("");
  const [sortBy, setSortBy] = useState<"price" | "rating" | "distance">("distance");
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, [selectedUni]);

  const fetchProperties = async () => {
    setLoading(true);
    let query = supabase.from("properties").select(`
      *, universities(name, short_name),
      rooms(room_type, price_per_session, price_per_month, available_count),
      reviews:reviews(rating)
    `).eq("is_active", true);

    if (selectedUni) {
      query = query.eq("universities.short_name", selectedUni);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (!error && data) {
      // Filter out properties without matching university if filter is set
      let filtered = selectedUni ? data.filter(p => p.universities?.short_name === selectedUni) : data;
      // Compute avg rating and lowest price
      const enriched = filtered.map(p => {
        const ratings = (p.reviews || []).map((r: any) => r.rating);
        const avgRating = ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;
        const prices = (p.rooms || []).map((r: any) => r.price_per_session).filter((v: number) => v > 0);
        const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const totalAvailable = (p.rooms || []).reduce((sum: number, r: any) => sum + (r.available_count || 0), 0);
        return { ...p, avgRating, reviewCount: ratings.length, lowestPrice, totalAvailable };
      });
      setProperties(enriched);
    }
    setLoading(false);
  };

  let filtered = properties;
  if (typeFilter) filtered = filtered.filter(p => p.property_type === typeFilter);

  filtered = [...filtered].sort((a, b) => {
    if (sortBy === "price") return (a.lowestPrice || 0) - (b.lowestPrice || 0);
    if (sortBy === "rating") return (b.avgRating || 0) - (a.avgRating || 0);
    return (a.distance_to_gate_meters || 9999) - (b.distance_to_gate_meters || 9999);
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />Back
            </Link>
            <HeroSearch compact />
          </div>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              {selectedUni ? `Housing near ${selectedUni}` : "All Available Housing"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{filtered.length} listings found</p>
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="text-sm bg-muted rounded-lg px-3 py-2 outline-none font-body text-foreground">
            <option value="distance">Nearest first</option>
            <option value="price">Lowest price</option>
            <option value="rating">Highest rated</option>
          </select>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <Badge variant={typeFilter === "" ? "default" : "outline"} className="cursor-pointer shrink-0 px-3 py-1.5" onClick={() => setTypeFilter("")}>All Types</Badge>
          {propertyTypes.map(type => (
            <Badge key={type} variant={typeFilter === type ? "default" : "outline"} className="cursor-pointer shrink-0 px-3 py-1.5" onClick={() => setTypeFilter(type === typeFilter ? "" : type)}>
              {propertyTypeLabels[type]}
            </Badge>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20"><div className="animate-pulse text-muted-foreground">Loading listings...</div></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">No listings found</h2>
            <p className="text-muted-foreground text-sm">Try adjusting your filters or search for another university.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(property => (
              <ListingCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SearchPage;
