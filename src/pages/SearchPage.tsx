import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, MapPin, Star, BadgeCheck, Users, SlidersHorizontal, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ListingCard from "@/components/ListingCard";
import HeroSearch from "@/components/HeroSearch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { properties, universities, propertyTypeLabels, type PropertyType } from "@/lib/mockData";

const propertyTypes: PropertyType[] = ["HOSTEL", "SELF_CONTAIN", "SHARED_ROOM", "MINI_FLAT", "APARTMENT"];

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const selectedUni = searchParams.get("university") || "";
  const [typeFilter, setTypeFilter] = useState<PropertyType | "">("");
  const [sortBy, setSortBy] = useState<"price" | "rating" | "distance">("distance");

  let filtered = properties;
  if (selectedUni) {
    filtered = filtered.filter((p) => p.universityShort === selectedUni);
  }
  if (typeFilter) {
    filtered = filtered.filter((p) => p.propertyType === typeFilter);
  }

  filtered = [...filtered].sort((a, b) => {
    if (sortBy === "price") return a.pricePerSession - b.pricePerSession;
    if (sortBy === "rating") return b.rating - a.rating;
    return a.distanceMeters - b.distanceMeters;
  });

  const uniName = universities.find((u) => u.short_name === selectedUni)?.name;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <HeroSearch compact />
          </div>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              {uniName ? `Housing near ${uniName}` : "All Available Housing"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {filtered.length} {filtered.length === 1 ? "listing" : "listings"} found
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-sm bg-muted rounded-lg px-3 py-2 outline-none font-body text-foreground"
            >
              <option value="distance">Nearest first</option>
              <option value="price">Lowest price</option>
              <option value="rating">Highest rated</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <Badge
            variant={typeFilter === "" ? "default" : "outline"}
            className="cursor-pointer shrink-0 px-3 py-1.5"
            onClick={() => setTypeFilter("")}
          >
            All Types
          </Badge>
          {propertyTypes.map((type) => (
            <Badge
              key={type}
              variant={typeFilter === type ? "default" : "outline"}
              className="cursor-pointer shrink-0 px-3 py-1.5"
              onClick={() => setTypeFilter(type === typeFilter ? "" : type)}
            >
              {propertyTypeLabels[type]}
            </Badge>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">No listings found</h2>
            <p className="text-muted-foreground text-sm">Try adjusting your filters or search for another university.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((property) => (
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
