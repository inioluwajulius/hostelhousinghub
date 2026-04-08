import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Star, BadgeCheck, Users, Wifi, Zap, Shield, Droplets, Car, BookOpen, Check } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { properties, formatPrice, formatDistance, propertyTypeLabels } from "@/lib/mockData";

import property1 from "@/assets/property-1.jpg";
import property2 from "@/assets/property-2.jpg";
import property3 from "@/assets/property-3.jpg";
import property4 from "@/assets/property-4.jpg";
import property5 from "@/assets/property-5.jpg";
import property6 from "@/assets/property-6.jpg";

const propertyImages: Record<string, string> = {
  "1": property1, "2": property2, "3": property3,
  "4": property4, "5": property5, "6": property6,
};

const amenityIcons: Record<string, React.ReactNode> = {
  WiFi: <Wifi className="w-4 h-4" />,
  Generator: <Zap className="w-4 h-4" />,
  CCTV: <Shield className="w-4 h-4" />,
  Borehole: <Droplets className="w-4 h-4" />,
  Parking: <Car className="w-4 h-4" />,
  "Reading Room": <BookOpen className="w-4 h-4" />,
  "Study Hall": <BookOpen className="w-4 h-4" />,
};

const ListingDetailPage = () => {
  const { id } = useParams();
  const property = properties.find((p) => p.id === id);

  if (!property) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold mb-2">Listing not found</h1>
            <Link to="/search" className="text-primary hover:underline text-sm">Back to search</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const genderLabel =
    property.genderRestriction === "FEMALE_ONLY" ? "Female Only"
    : property.genderRestriction === "MALE_ONLY" ? "Male Only"
    : "Mixed Gender";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Image */}
        <div className="relative h-64 sm:h-80 md:h-96 overflow-hidden">
          <img
            src={propertyImages[property.id] || property1}
            alt={property.title}
            className="w-full h-full object-cover"
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
          <div className="absolute bottom-6 left-4 right-4 container mx-auto">
            <Link to="/search" className="inline-flex items-center gap-1 text-primary-foreground/80 text-sm mb-3 hover:text-primary-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to results
            </Link>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-primary-foreground">{property.title}</h1>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Quick Info */}
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="bg-primary/10 text-primary border-0">{propertyTypeLabels[property.propertyType]}</Badge>
                <Badge variant="outline">{genderLabel}</Badge>
                {property.isVerified && (
                  <Badge className="bg-success/10 text-success border-0 gap-1">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    Verified
                  </Badge>
                )}
                <div className="flex items-center gap-1 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{formatDistance(property.distanceMeters)} from {property.universityShort}</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="w-4 h-4 fill-accent text-accent" />
                  <span className="font-semibold">{property.rating}</span>
                  <span className="text-muted-foreground">({property.reviewCount} reviews)</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="font-display text-xl font-semibold mb-3">About This Property</h2>
                <p className="text-muted-foreground leading-relaxed">{property.description}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  📍 {property.address}
                </p>
              </div>

              {/* Amenities */}
              <div>
                <h2 className="font-display text-xl font-semibold mb-3">Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {property.amenities.map((a) => (
                    <div key={a} className="flex items-center gap-2 text-sm text-foreground bg-muted/50 rounded-lg px-3 py-2.5">
                      {amenityIcons[a] || <Check className="w-4 h-4 text-primary" />}
                      {a}
                    </div>
                  ))}
                </div>
              </div>

              {/* Host */}
              <div>
                <h2 className="font-display text-xl font-semibold mb-3">Your Host</h2>
                <div className="flex items-center gap-3 bg-card rounded-xl p-4 border shadow-card">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold font-display">
                    {property.hostName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{property.hostName}</p>
                    <p className="text-xs text-muted-foreground">
                      {property.isVerified ? "Verified Host · " : ""}
                      {property.totalRooms} rooms managed
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-card rounded-2xl border shadow-elevated p-6 space-y-5">
                <div>
                  <span className="text-2xl font-bold text-primary font-display">{formatPrice(property.pricePerSession)}</span>
                  <span className="text-muted-foreground text-sm"> / session</span>
                  {property.pricePerMonth && (
                    <p className="text-sm text-muted-foreground mt-1">
                      or {formatPrice(property.pricePerMonth)}/month for short stays
                    </p>
                  )}
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Rent</span>
                    <span className="font-medium">{formatPrice(property.pricePerSession)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Service fee (8%)</span>
                    <span className="font-medium">{formatPrice(property.pricePerSession * 0.08)}</span>
                  </div>
                  <div className="flex justify-between py-2 font-bold">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(property.pricePerSession * 1.08)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{property.availableRooms} rooms available</span>
                </div>

                <Button className="w-full" size="lg">
                  Reserve Now
                </Button>
                <Button variant="outline" className="w-full" size="lg">
                  Schedule Inspection
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Secure payment via Paystack · Escrow protection
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ListingDetailPage;
