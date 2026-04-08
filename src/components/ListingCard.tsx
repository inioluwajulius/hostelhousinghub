import { Link } from "react-router-dom";
import { MapPin, Star, BadgeCheck, Users } from "lucide-react";
import { Property, formatPrice, formatDistance, propertyTypeLabels } from "@/lib/mockData";
import { Badge } from "@/components/ui/badge";

import property1 from "@/assets/property-1.jpg";
import property2 from "@/assets/property-2.jpg";
import property3 from "@/assets/property-3.jpg";
import property4 from "@/assets/property-4.jpg";
import property5 from "@/assets/property-5.jpg";
import property6 from "@/assets/property-6.jpg";

const propertyImages: Record<string, string> = {
  "1": property1,
  "2": property2,
  "3": property3,
  "4": property4,
  "5": property5,
  "6": property6,
};

interface ListingCardProps {
  property: Property;
}

const ListingCard = ({ property }: ListingCardProps) => {
  const genderLabel =
    property.genderRestriction === "FEMALE_ONLY"
      ? "Female Only"
      : property.genderRestriction === "MALE_ONLY"
      ? "Male Only"
      : null;

  return (
    <Link
      to={`/listing/${property.id}`}
      className="group block rounded-xl overflow-hidden bg-card shadow-card card-hover"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={propertyImages[property.id] || property1}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          width={800}
          height={600}
        />
        <div className="absolute top-3 left-3 flex gap-1.5">
          <Badge className="bg-card/90 text-foreground backdrop-blur-sm text-xs font-medium border-0">
            {propertyTypeLabels[property.propertyType]}
          </Badge>
          {genderLabel && (
            <Badge className="bg-secondary/90 text-secondary-foreground backdrop-blur-sm text-xs font-medium border-0">
              {genderLabel}
            </Badge>
          )}
        </div>
        {property.isVerified && (
          <div className="absolute top-3 right-3">
            <div className="bg-primary/90 backdrop-blur-sm text-primary-foreground rounded-full p-1.5">
              <BadgeCheck className="w-4 h-4" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            <span>{formatDistance(property.distanceMeters)} from {property.universityShort}</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <Star className="w-3.5 h-3.5 fill-accent text-accent" />
            <span className="font-semibold">{property.rating}</span>
            <span className="text-muted-foreground">({property.reviewCount})</span>
          </div>
        </div>

        <h3 className="font-display font-semibold text-card-foreground leading-tight line-clamp-1">
          {property.title}
        </h3>

        <p className="text-xs text-muted-foreground line-clamp-2">
          {property.address}
        </p>

        <div className="flex items-center justify-between pt-1 border-t border-border">
          <div>
            <span className="text-lg font-bold text-primary">{formatPrice(property.pricePerSession)}</span>
            <span className="text-xs text-muted-foreground">/session</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            {property.availableRooms} left
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ListingCard;
