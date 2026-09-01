"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
;
import { ArrowLeft, MapPin, Star, BadgeCheck, Users, Wifi, Zap, Shield, Droplets, Car, BookOpen, Check, Heart, Calendar, MessageSquare } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ReviewForm from "@/components/ReviewForm";
import CommunityVerification from "@/components/CommunityVerification";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

import property1 from "@/assets/property-1.jpg";
import property2 from "@/assets/property-2.jpg";
import property3 from "@/assets/property-3.jpg";
import property4 from "@/assets/property-4.jpg";
import property5 from "@/assets/property-5.jpg";
import property6 from "@/assets/property-6.jpg";

const fallbackImages = [property1, property2, property3, property4, property5, property6];

const amenityIcons: Record<string, React.ReactNode> = {
  WiFi: <Wifi className="w-4 h-4" />, Generator: <Zap className="w-4 h-4" />,
  CCTV: <Shield className="w-4 h-4" />, Borehole: <Droplets className="w-4 h-4" />,
  Parking: <Car className="w-4 h-4" />, "Reading Room": <BookOpen className="w-4 h-4" />,
  "Study Hall": <BookOpen className="w-4 h-4" />,
};

const propertyTypeLabels: Record<string, string> = {
  HOSTEL: "Hostel", APARTMENT: "Apartment", SELF_CONTAIN: "Self Contain",
  MINI_FLAT: "Mini Flat", SHARED_ROOM: "Shared Room",
};

const roomTypeLabels: Record<string, string> = {
  SELF_CONTAIN: "Self Contain", SHARED_2: "Shared (2-in-1)", SHARED_4: "Shared (4-in-1)",
  SHARED_6: "Shared (6-in-1)", MINI_FLAT: "Mini Flat",
};

const formatPrice = (amount: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(amount);

const ListingDetailPage = () => {
  const { id } = useParams() as { id: string };
  const { user, userRole } = useAuth();
  const router = useRouter();
  const [property, setProperty] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [hostProfile, setHostProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [showInspectionForm, setShowInspectionForm] = useState(false);
  const [inspectionDate, setInspectionDate] = useState("");
  const [hasBooked, setHasBooked] = useState(false);

  useEffect(() => { fetchProperty(); }, [id]);

  const fetchProperty = async () => {
    if (!id) return;
    const { data: prop } = await supabase.from("properties")
      .select("*, universities(name, short_name), rooms(*)")
      .eq("id", id).single();

    if (prop) {
      setProperty(prop);
      setSelectedRoom(prop.rooms?.[0] || null);

      const [revRes, hostRes] = await Promise.all([
        supabase.from("reviews").select("*, reviewer:profiles!reviews_reviewer_id_fkey(full_name)").eq("property_id", id).order("created_at", { ascending: false }),
        supabase.from("profiles").select("*").eq("user_id", prop.host_id).single(),
      ]);
      setReviews(revRes.data || []);
      setHostProfile(hostRes.data);

      if (user) {
        const [savedRes, bookingRes] = await Promise.all([
          supabase.from("saved_listings").select("id").eq("user_id", user.id).eq("property_id", id).maybeSingle(),
          supabase.from("bookings").select("id").eq("student_id", user.id).eq("property_id", id).limit(1),
        ]);
        setIsSaved(!!savedRes.data);
        setHasBooked((bookingRes.data || []).length > 0);
      }
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) { toast.error("Please sign in to save listings"); return; }
    if (isSaved) {
      await supabase.from("saved_listings").delete().eq("user_id", user.id).eq("property_id", id!);
      setIsSaved(false); toast.success("Removed from saved");
    } else {
      await supabase.from("saved_listings").insert({ user_id: user.id, property_id: id! });
      setIsSaved(true); toast.success("Saved!");
    }
  };

  const handleBook = async () => {
    if (!user) { toast.error("Please sign in to book"); return; }
    if (!selectedRoom) { toast.error("No room selected"); return; }

    const totalAmount = selectedRoom.price_per_session;
    const serviceFee = totalAmount * 0.08;

    // 1. Create the booking
    const { data: booking, error } = await supabase.from("bookings").insert({
      student_id: user.id, room_id: selectedRoom.id, property_id: id!,
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date(Date.now() + 270 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      booking_type: "SESSION", total_amount: totalAmount,
      service_fee: serviceFee,
    }).select().single();

    if (error) { toast.error(error.message); return; }

    // 2. Initialize Paystack payment
    toast.info("Redirecting to payment...");
    const { data: { session } } = await supabase.auth.getSession();
    const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID;

    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/paystack-initialize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            booking_id: booking.id,
            email: user.email,
            amount: totalAmount + serviceFee,
          }),
        }
      );
      const data = await res.json();
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        toast.error(data.error || "Payment initialization failed");
      }
    } catch (err: any) {
      toast.error("Could not connect to payment service");
    }
  };

  const handleInspection = async () => {
    if (!user) { toast.error("Please sign in"); return; }
    if (!inspectionDate) { toast.error("Select a date"); return; }
    const { error } = await supabase.from("inspections").insert({
      student_id: user.id, property_id: id!, scheduled_at: new Date(inspectionDate).toISOString(),
    });
    if (error) toast.error(error.message);
    else { toast.success("Inspection scheduled!"); setShowInspectionForm(false); }
  };

  const handleMessageHost = () => {
    if (!user) { toast.error("Please sign in to message the host"); return; }
    if (!property) return;
    router.push(`/messages?with=${property.host_id}`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;

  if (!property) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold mb-2">Listing not found</h1>
            <Link href="/search" className="text-primary hover:underline text-sm">Back to search</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const genderLabel = property.gender_restriction === "FEMALE_ONLY" ? "Female Only" : property.gender_restriction === "MALE_ONLY" ? "Male Only" : "Mixed Gender";
  const imageIdx = Math.abs(property.id?.charCodeAt(0) || 0) % fallbackImages.length;
  const photos = property.rooms?.flatMap((r: any) => r.photos || []).filter(Boolean);
  const displayImage = photos?.length > 0 ? photos[0] : fallbackImages[imageIdx];
  const avgRating = reviews.length > 0 ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length : 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero image */}
        <div className="relative h-64 sm:h-80 md:h-96 overflow-hidden">
          <img src={displayImage} alt={property.title} className="w-full h-full object-cover" width={1920} height={1080} />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
          <div className="absolute bottom-6 left-4 right-4 container mx-auto">
            <Link href="/search" className="inline-flex items-center gap-1 text-primary-foreground/80 text-sm mb-3 hover:text-primary-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />Back to results
            </Link>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-primary-foreground">{property.title}</h1>
          </div>
          <button onClick={handleSave} className="absolute top-4 right-4 bg-card/80 backdrop-blur-sm rounded-full p-2.5">
            <Heart className={`w-5 h-5 ${isSaved ? "fill-destructive text-destructive" : "text-foreground"}`} />
          </button>
        </div>

        {/* Photo gallery */}
        {photos && photos.length > 1 && (
          <div className="container mx-auto px-4 mt-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {photos.map((url: string, i: number) => (
                <img key={i} src={url} alt="" className="h-20 w-28 object-cover rounded-lg shrink-0" />
              ))}
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="bg-primary/10 text-primary border-0">{propertyTypeLabels[property.property_type]}</Badge>
                <Badge variant="outline">{genderLabel}</Badge>
                {property.is_verified && <Badge className="bg-success/10 text-success border-0 gap-1"><BadgeCheck className="w-3.5 h-3.5" />Verified</Badge>}
                {property.distance_to_gate_meters && (
                  <div className="flex items-center gap-1 text-sm"><MapPin className="w-4 h-4 text-muted-foreground" /><span className="text-muted-foreground">{property.distance_to_gate_meters}m from {property.universities?.short_name}</span></div>
                )}
                {avgRating > 0 && (
                  <div className="flex items-center gap-1 text-sm"><Star className="w-4 h-4 fill-accent text-accent" /><span className="font-semibold">{avgRating.toFixed(1)}</span><span className="text-muted-foreground">({reviews.length} reviews)</span></div>
                )}
              </div>

              <div>
                <h2 className="font-display text-xl font-semibold mb-3">About This Property</h2>
                <p className="text-muted-foreground leading-relaxed">{property.description || "No description provided."}</p>
                <p className="text-sm text-muted-foreground mt-2">📍 {property.address}</p>
              </div>

              {property.amenities?.length > 0 && (
                <div>
                  <h2 className="font-display text-xl font-semibold mb-3">Amenities</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {property.amenities.map((a: string) => (
                      <div key={a} className="flex items-center gap-2 text-sm text-foreground bg-muted/50 rounded-lg px-3 py-2.5">
                        {amenityIcons[a] || <Check className="w-4 h-4 text-primary" />}{a}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {property.rooms?.length > 0 && (
                <div>
                  <h2 className="font-display text-xl font-semibold mb-3">Room Types</h2>
                  <div className="space-y-3">
                    {property.rooms.map((room: any) => (
                      <div key={room.id} onClick={() => setSelectedRoom(room)}
                        className={`bg-card rounded-xl border p-4 cursor-pointer transition-all ${selectedRoom?.id === room.id ? "border-primary ring-1 ring-primary" : "hover:border-muted-foreground/30"}`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold">{roomTypeLabels[room.room_type] || room.room_type}</p>
                            <p className="text-xs text-muted-foreground">Max {room.max_occupants} occupants · {room.is_furnished ? "Furnished" : "Unfurnished"}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">{formatPrice(room.price_per_session)}<span className="text-xs text-muted-foreground font-normal">/session</span></p>
                            {room.price_per_month && <p className="text-xs text-muted-foreground">{formatPrice(room.price_per_month)}/month</p>}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{room.available_count} of {room.total_count} available</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {property.house_rules && (
                <div>
                  <h2 className="font-display text-xl font-semibold mb-3">House Rules</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">{property.house_rules}</p>
                </div>
              )}

              {hostProfile && (
                <div>
                  <h2 className="font-display text-xl font-semibold mb-3">Your Host</h2>
                  <div className="flex items-center justify-between bg-card rounded-xl p-4 border shadow-card">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold font-display">
                        {hostProfile.full_name?.charAt(0) || "H"}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{hostProfile.full_name}</p>
                        <p className="text-xs text-muted-foreground">{property.is_verified ? "Verified Host · " : ""}{property.total_rooms} rooms managed</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleMessageHost} className="gap-1.5">
                      <MessageSquare className="w-4 h-4" />Message
                    </Button>
                  </div>
                </div>
              )}

              {/* Reviews */}
              <div>
                <h2 className="font-display text-xl font-semibold mb-3">Reviews ({reviews.length})</h2>
                {reviews.length > 0 ? (
                  <div className="space-y-4 mb-6">
                    {reviews.slice(0, 5).map((r: any) => (
                      <div key={r.id} className="bg-card rounded-xl border p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star key={s} className={`w-4 h-4 ${s <= r.rating ? "fill-accent text-accent" : "text-muted"}`} />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">{r.reviewer?.full_name || "Anonymous"}</span>
                          <span className="text-xs text-muted-foreground">· {new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                        {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mb-6">No reviews yet. Be the first to review!</p>
                )}

                {/* Review form — show if user has booked or is logged in */}
                {user && userRole === "student" && (
                  <ReviewForm propertyId={property.id} onSubmitted={fetchProperty} />
                )}
              </div>

              {/* Community Verification */}
              <div>
                <h2 className="font-display text-xl font-semibold mb-3">Community Trust</h2>
                <CommunityVerification propertyId={property.id} />
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-card rounded-2xl border shadow-elevated p-6 space-y-5">
                {selectedRoom ? (
                  <>
                    <div>
                      <span className="text-2xl font-bold text-primary font-display">{formatPrice(selectedRoom.price_per_session)}</span>
                      <span className="text-muted-foreground text-sm"> / session</span>
                      {selectedRoom.price_per_month && <p className="text-sm text-muted-foreground mt-1">or {formatPrice(selectedRoom.price_per_month)}/month</p>}
                    </div>
                    <p className="text-sm font-medium">{roomTypeLabels[selectedRoom.room_type] || selectedRoom.room_type}</p>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Rent</span><span className="font-medium">{formatPrice(selectedRoom.price_per_session)}</span></div>
                      <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Service fee (8%)</span><span className="font-medium">{formatPrice(selectedRoom.price_per_session * 0.08)}</span></div>
                      <div className="flex justify-between py-2 font-bold"><span>Total</span><span className="text-primary">{formatPrice(selectedRoom.price_per_session * 1.08)}</span></div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="w-4 h-4" />{selectedRoom.available_count} rooms available</div>
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">No rooms listed yet. Contact the host for pricing.</p>
                )}

                <Button className="w-full" size="lg" onClick={handleBook} disabled={!selectedRoom}>Pay & Reserve Now</Button>

                {showInspectionForm ? (
                  <div className="space-y-3">
                    <Label>Inspection Date</Label>
                    <Input type="datetime-local" value={inspectionDate} onChange={e => setInspectionDate(e.target.value)} />
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={handleInspection}>Confirm</Button>
                      <Button variant="ghost" onClick={() => setShowInspectionForm(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" className="w-full" size="lg" onClick={() => setShowInspectionForm(true)}>
                    <Calendar className="w-4 h-4 mr-2" />Schedule Inspection
                  </Button>
                )}

                <Button variant="outline" className="w-full" onClick={handleMessageHost}>
                  <MessageSquare className="w-4 h-4 mr-2" />Message Host
                </Button>

                <p className="text-xs text-center text-muted-foreground">Secure payment via Paystack · Escrow protection</p>
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
