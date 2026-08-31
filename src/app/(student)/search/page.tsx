"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
;
import { MapPin, ArrowLeft, Map, List, SlidersHorizontal, X } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ListingCard from "@/components/ListingCard";
import HeroSearch from "@/components/HeroSearch";
import MapView from "@/components/MapView";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { propertiesAPI } from "@/lib/api";

const propertyTypes = ["HOSTEL", "SELF_CONTAIN", "SHARED_ROOM", "MINI_FLAT", "APARTMENT"] as const;
const propertyTypeLabels: Record<string, string> = {
  HOSTEL: "Hostel", SELF_CONTAIN: "Self Contain", SHARED_ROOM: "Shared Room",
  MINI_FLAT: "Mini Flat", APARTMENT: "Apartment",
};
const genderOptions = ["ANY", "MALE_ONLY", "FEMALE_ONLY"] as const;
const genderLabels: Record<string, string> = { ANY: "Mixed", MALE_ONLY: "Male Only", FEMALE_ONLY: "Female Only" };
const amenityList = ["WiFi", "Generator", "Borehole", "CCTV", "Parking", "Security Guard", "Reading Room", "Study Hall", "Laundry Area", "AC", "Furnished", "Gym", "Common Room"];

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const router = useRouter();
  const selectedUni = searchParams.get("university") || "";
  const [typeFilter, setTypeFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [amenityFilters, setAmenityFilters] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [maxDistance, setMaxDistance] = useState(5000);
  const [sortBy, setSortBy] = useState<"price" | "rating" | "distance">("distance");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [showFilters, setShowFilters] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uniCenter, setUniCenter] = useState<[number, number]>([6.5244, 3.3792]);

  useEffect(() => { fetchProperties(); }, [selectedUni]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const data = await propertiesAPI.getProperties({
        universityId: selectedUni,
      });
      setProperties(data);

      // Set map center to university if available
      if (data.length > 0 && data[0].universities?.latitude) {
        setUniCenter([data[0].universities.latitude, data[0].universities.longitude]);
      }
    } catch (err) {
      console.error("Failed to fetch properties:", err);
    } finally {
      setLoading(false);
    }
  };

  // Apply all filters
  let filtered = properties;
  if (typeFilter) filtered = filtered.filter(p => p.property_type === typeFilter);
  if (genderFilter && genderFilter !== "ANY") filtered = filtered.filter(p => p.gender_restriction === genderFilter || p.gender_restriction === "ANY");
  if (amenityFilters.length > 0) {
    filtered = filtered.filter(p => amenityFilters.every(a => (p.amenities || []).includes(a)));
  }
  filtered = filtered.filter(p => {
    const price = p.lowestPrice || 0;
    return price >= priceRange[0] && (priceRange[1] >= 1000000 || price <= priceRange[1]);
  });
  filtered = filtered.filter(p => {
    const dist = p.distance_to_gate_meters || 0;
    return dist === 0 || dist <= maxDistance;
  });

  filtered = [...filtered].sort((a, b) => {
    if (sortBy === "price") return (a.lowestPrice || 0) - (b.lowestPrice || 0);
    if (sortBy === "rating") return (b.avgRating || 0) - (a.avgRating || 0);
    return (a.distance_to_gate_meters || 9999) - (b.distance_to_gate_meters || 9999);
  });

  const formatPrice = (v: number) => v >= 1000000 ? "₦1M+" : `₦${(v / 1000).toFixed(0)}k`;

  const toggleAmenity = (a: string) => {
    setAmenityFilters(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  };

  const hasActiveFilters = typeFilter || genderFilter || amenityFilters.length > 0 || priceRange[0] > 0 || priceRange[1] < 1000000 || maxDistance < 5000;

  const clearFilters = () => {
    setTypeFilter("");
    setGenderFilter("");
    setAmenityFilters([]);
    setPriceRange([0, 1000000]);
    setMaxDistance(5000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link href="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />Back
            </Link>
            <HeroSearch compact />
          </div>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              {selectedUni ? `Housing near ${selectedUni}` : "All Available Housing"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{filtered.length} listings found</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant={showFilters ? "default" : "outline"} size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-1.5">
              <SlidersHorizontal className="w-4 h-4" />Filters
            </Button>
            <div className="flex rounded-lg border overflow-hidden">
              <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")} className="rounded-none gap-1">
                <List className="w-4 h-4" />List
              </Button>
              <Button variant={viewMode === "map" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("map")} className="rounded-none gap-1">
                <Map className="w-4 h-4" />Map
              </Button>
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="text-sm bg-muted rounded-lg px-3 py-2 outline-none font-body text-foreground">
              <option value="distance">Nearest first</option>
              <option value="price">Lowest price</option>
              <option value="rating">Highest rated</option>
            </select>
          </div>
        </div>

        {/* Property type badges */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <Badge variant={typeFilter === "" ? "default" : "outline"} className="cursor-pointer shrink-0 px-3 py-1.5" onClick={() => setTypeFilter("")}>All Types</Badge>
          {propertyTypes.map(type => (
            <Badge key={type} variant={typeFilter === type ? "default" : "outline"} className="cursor-pointer shrink-0 px-3 py-1.5" onClick={() => setTypeFilter(type === typeFilter ? "" : type)}>
              {propertyTypeLabels[type]}
            </Badge>
          ))}
        </div>

        {/* Advanced filters panel */}
        {showFilters && (
          <div className="bg-card rounded-xl border p-5 mb-6 space-y-5 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Price range */}
              <div>
                <Label className="text-sm font-medium">Price Range</Label>
                <Slider
                  value={priceRange}
                  onValueChange={(v) => setPriceRange(v as [number, number])}
                  min={0}
                  max={1000000}
                  step={10000}
                  className="mt-3"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{formatPrice(priceRange[0])}</span>
                  <span>{formatPrice(priceRange[1])}</span>
                </div>
              </div>

              {/* Distance */}
              <div>
                <Label className="text-sm font-medium">Max Distance to Campus</Label>
                <Slider
                  value={[maxDistance]}
                  onValueChange={(v) => setMaxDistance(v[0])}
                  min={100}
                  max={5000}
                  step={100}
                  className="mt-3"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {maxDistance >= 5000 ? "Any distance" : `Within ${maxDistance >= 1000 ? `${(maxDistance/1000).toFixed(1)}km` : `${maxDistance}m`}`}
                </p>
              </div>

              {/* Gender */}
              <div>
                <Label className="text-sm font-medium">Gender</Label>
                <div className="flex gap-2 mt-2">
                  <Badge variant={genderFilter === "" ? "default" : "outline"} className="cursor-pointer" onClick={() => setGenderFilter("")}>All</Badge>
                  {genderOptions.map(g => (
                    <Badge key={g} variant={genderFilter === g ? "default" : "outline"} className="cursor-pointer" onClick={() => setGenderFilter(g === genderFilter ? "" : g)}>
                      {genderLabels[g]}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div>
              <Label className="text-sm font-medium">Amenities</Label>
              <div className="flex flex-wrap gap-3 mt-2">
                {amenityList.map(a => (
                  <label key={a} className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox checked={amenityFilters.includes(a)} onCheckedChange={() => toggleAmenity(a)} />
                    <span className="text-sm">{a}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear All Filters
            </Button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20"><div className="animate-pulse text-muted-foreground">Loading listings...</div></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">No listings found</h2>
            <p className="text-muted-foreground text-sm">Try adjusting your filters or search for another university.</p>
          </div>
        ) : viewMode === "map" ? (
          <div className="rounded-xl overflow-hidden border" style={{ height: "calc(100vh - 340px)" }}>
            <MapView
              properties={filtered}
              center={uniCenter}
              onMarkerClick={(id) => router.push(`/listing/${id}`)}
            />
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
