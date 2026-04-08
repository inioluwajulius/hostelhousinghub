import { Link } from "react-router-dom";
import { MapPin, Star, BadgeCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import property1 from "@/assets/property-1.jpg";
import property2 from "@/assets/property-2.jpg";
import property3 from "@/assets/property-3.jpg";
import property4 from "@/assets/property-4.jpg";
import property5 from "@/assets/property-5.jpg";
import property6 from "@/assets/property-6.jpg";

const fallbackImages = [property1, property2, property3, property4, property5, property6];

const propertyTypeLabels: Record<string, string> = {
  HOSTEL: "Hostel", APARTMENT: "Apartment", SELF_CONTAIN: "Self Contain",
  MINI_FLAT: "Mini Flat", SHARED_ROOM: "Shared Room",
};

const formatPrice = (amount: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(amount);
const formatDistance = (meters: number | null) => {
  if (!meters) return "";
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)}km`;
};

interface ListingCardProps {
  property: any;
}

const ListingCard = ({ property }: ListingCardProps) => {
  const genderLabel =
    property.gender_restriction === "FEMALE_ONLY" ? "Female Only"
    : property.gender_restriction === "MALE_ONLY" ? "Male Only"
    : null;

  // Use first room photo, or fallback
  const imageIdx = Math.abs(property.id?.charCodeAt(0) || 0) % fallbackImages.length;
  const image = property.rooms?.[0]?.photos?.[0] || fallbackImages[imageIdx];

  const lowestPrice = property.lowestPrice || (property.rooms?.[0]?.price_per_session || 0);
  const rating = property.avgRating || 0;
  const reviewCount = property.reviewCount || 0;
  const uniShort = property.universities?.short_name || property.universityShort || "";
  const available = property.totalAvailable || property.availableRooms || 0;

  return (
    <Link to={`/listing/${property.id}`} className="group block rounded-xl overflow-hidden bg-card shadow-card card-hover">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          width={800}
          height={600}
        />
        <div className="absolute top-3 left-3 flex gap-1.5">
          <Badge className="bg-card/90 text-foreground backdrop-blur-sm text-xs font-medium border-0">
            {propertyTypeLabels[property.property_type || property.propertyType] || "Housing"}
          </Badge>
          {genderLabel && (
            <Badge className="bg-secondary/90 text-secondary-foreground backdrop-blur-sm text-xs font-medium border-0">
              {genderLabel}
            </Badge>
          )}
        </div>
        {(property.is_verified || property.isVerified) && (
          <div className="absolute top-3 right-3">
            <div className="bg-primary/90 backdrop-blur-sm text-primary-foreground rounded-full p-1.5">
              <BadgeCheck className="w-4 h-4" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          {property.distance_to_gate_meters || property.distanceMeters ? (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              <span>{formatDistance(property.distance_to_gate_meters || property.distanceMeters)} from {uniShort}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" /><span>{uniShort}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-xs">
            <Star className="w-3.5 h-3.5 fill-accent text-accent" />
            <span className="font-semibold">{rating > 0 ? rating.toFixed(1) : "New"}</span>
            {reviewCount > 0 && <span className="text-muted-foreground">({reviewCount})</span>}
          </div>
        </div>

        <h3 className="font-display font-semibold text-card-foreground leading-tight line-clamp-1">{property.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2">{property.address}</p>

        <div className="flex items-center justify-between pt-1 border-t border-border">
          <div>
            {lowestPrice > 0 ? (
              <>
                <span className="text-lg font-bold text-primary">{formatPrice(lowestPrice)}</span>
                <span className="text-xs text-muted-foreground">/session</span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">Price on request</span>
            )}
          </div>
          {available > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="w-3.5 h-3.5" />{available} left
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ListingCard;
