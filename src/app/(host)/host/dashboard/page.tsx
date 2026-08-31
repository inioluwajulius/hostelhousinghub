"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
;
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import RoomManager from "@/components/RoomManager";
import PhotoUploader from "@/components/PhotoUploader";
import { Building2, Plus, BarChart3, BookOpen, MessageSquare, User, TrendingUp, CheckCircle2, Clock, X, Image } from "lucide-react";
import { toast } from "sonner";

const HostDashboard = () => {
  const { user, profile, userRole, signOut } = useAuth();
  const router = useRouter();
  const [properties, setProperties] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [universities, setUniversities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedProperty, setExpandedProperty] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "", description: "", address: "", university_id: "",
    property_type: "HOSTEL" as string, gender_restriction: "ANY" as string,
    total_rooms: "1", amenities: [] as string[], house_rules: "",
    distance_to_gate_meters: "",
  });

  const amenityOptions = ["WiFi", "Generator", "Borehole", "CCTV", "Parking", "Security Guard", "Reading Room", "Study Hall", "Laundry Area", "AC", "Furnished"];

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    if (userRole === "student") { router.push("/dashboard"); return; }
    fetchData();
  }, [user, userRole]);

  const fetchData = async () => {
    if (!user) return;
    const [propsRes, bookingsRes, uniRes] = await Promise.all([
      supabase.from("properties").select("*, universities(name, short_name), rooms(*)").eq("host_id", user.id).order("created_at", { ascending: false }),
      supabase.from("bookings").select("*, properties!inner(host_id, title), rooms(room_type, price_per_session)").order("created_at", { ascending: false }),
      supabase.from("universities").select("*").order("name"),
    ]);
    setProperties(propsRes.data || []);
    const hostBookings = (bookingsRes.data || []).filter((b: any) => b.properties?.host_id === user.id);
    setBookings(hostBookings);
    setUniversities(uniRes.data || []);
    setLoading(false);
  };

  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.title || !form.address || !form.university_id) {
      toast.error("Please fill in required fields"); return;
    }
    const { error } = await supabase.from("properties").insert({
      host_id: user.id, title: form.title, description: form.description,
      address: form.address, university_id: form.university_id,
      property_type: form.property_type as any, gender_restriction: form.gender_restriction as any,
      total_rooms: parseInt(form.total_rooms) || 1, amenities: form.amenities,
      house_rules: form.house_rules,
      distance_to_gate_meters: form.distance_to_gate_meters ? parseInt(form.distance_to_gate_meters) : null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Property listed! It will be reviewed by admin.");
    setShowAddForm(false);
    setForm({ title: "", description: "", address: "", university_id: "", property_type: "HOSTEL", gender_restriction: "ANY", total_rooms: "1", amenities: [], house_rules: "", distance_to_gate_meters: "" });
    fetchData();
  };

  const handleBookingAction = async (bookingId: string, status: string) => {
    const { error } = await supabase.from("bookings").update({ status: status as any }).eq("id", bookingId);
    if (error) toast.error(error.message);
    else { toast.success(`Booking ${status.toLowerCase()}`); fetchData(); }
  };

  const handlePhotoUpdate = async (propertyId: string, roomId: string, urls: string[]) => {
    await supabase.from("rooms").update({ photos: urls }).eq("id", roomId);
    fetchData();
  };

  const formatPrice = (amount: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(amount);

  const totalEarnings = bookings.filter(b => b.payment_status === "PAID").reduce((sum, b) => sum + (b.total_amount - b.service_fee), 0);
  const pendingBookings = bookings.filter(b => b.status === "PENDING").length;
  const activeListings = properties.filter(p => p.is_active).length;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Host Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your properties and bookings</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/messages")} className="gap-1.5">
              <MessageSquare className="w-4 h-4" /> Messages
            </Button>
            <Button onClick={() => setShowAddForm(true)} className="gap-1.5">
              <Plus className="w-4 h-4" /> Add Property
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-card rounded-xl border p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Building2 className="w-5 h-5 text-primary" /></div>
              <div><p className="text-2xl font-bold text-foreground">{activeListings}</p><p className="text-xs text-muted-foreground">Active Listings</p></div>
            </div>
          </div>
          <div className="bg-card rounded-xl border p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center"><Clock className="w-5 h-5 text-accent" /></div>
              <div><p className="text-2xl font-bold text-foreground">{pendingBookings}</p><p className="text-xs text-muted-foreground">Pending Bookings</p></div>
            </div>
          </div>
          <div className="bg-card rounded-xl border p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-success" /></div>
              <div><p className="text-2xl font-bold text-foreground">{formatPrice(totalEarnings)}</p><p className="text-xs text-muted-foreground">Total Earnings</p></div>
            </div>
          </div>
        </div>

        {/* Add Property Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-2xl border shadow-elevated max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-bold">Add New Property</h2>
                <button onClick={() => setShowAddForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleAddProperty} className="space-y-4">
                <div><Label>Property Title *</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Sunrise Hostel — Female Only" className="mt-1" /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe your property..." className="mt-1" rows={3} /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>Address *</Label><Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Street address" className="mt-1" /></div>
                  <div>
                    <Label>Nearest University *</Label>
                    <Select value={form.university_id} onValueChange={v => setForm({...form, university_id: v})}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select university" /></SelectTrigger>
                      <SelectContent>{universities.map(u => (<SelectItem key={u.id} value={u.id}>{u.name} ({u.short_name})</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label>Property Type</Label>
                    <Select value={form.property_type} onValueChange={v => setForm({...form, property_type: v})}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HOSTEL">Hostel</SelectItem><SelectItem value="SELF_CONTAIN">Self Contain</SelectItem>
                        <SelectItem value="SHARED_ROOM">Shared Room</SelectItem><SelectItem value="MINI_FLAT">Mini Flat</SelectItem>
                        <SelectItem value="APARTMENT">Apartment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <Select value={form.gender_restriction} onValueChange={v => setForm({...form, gender_restriction: v})}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ANY">Mixed</SelectItem><SelectItem value="MALE_ONLY">Male Only</SelectItem><SelectItem value="FEMALE_ONLY">Female Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Total Rooms</Label><Input type="number" value={form.total_rooms} onChange={e => setForm({...form, total_rooms: e.target.value})} className="mt-1" min="1" /></div>
                </div>
                <div><Label>Distance to Campus Gate (meters)</Label><Input type="number" value={form.distance_to_gate_meters} onChange={e => setForm({...form, distance_to_gate_meters: e.target.value})} placeholder="e.g. 250" className="mt-1" /></div>
                <div>
                  <Label>Amenities</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {amenityOptions.map(a => (
                      <Badge key={a} variant={form.amenities.includes(a) ? "default" : "outline"} className="cursor-pointer"
                        onClick={() => setForm({ ...form, amenities: form.amenities.includes(a) ? form.amenities.filter(x => x !== a) : [...form.amenities, a] })}
                      >{a}</Badge>
                    ))}
                  </div>
                </div>
                <div><Label>House Rules</Label><Textarea value={form.house_rules} onChange={e => setForm({...form, house_rules: e.target.value})} placeholder="Any rules for tenants..." className="mt-1" rows={2} /></div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" className="flex-1">List Property</Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        <Tabs defaultValue="properties" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="properties" className="gap-1.5"><Building2 className="w-4 h-4" />Properties</TabsTrigger>
            <TabsTrigger value="bookings" className="gap-1.5"><BookOpen className="w-4 h-4" />Bookings</TabsTrigger>
            <TabsTrigger value="earnings" className="gap-1.5"><BarChart3 className="w-4 h-4" />Earnings</TabsTrigger>
            <TabsTrigger value="profile" className="gap-1.5"><User className="w-4 h-4" />Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="properties">
            {properties.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-xl border">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display text-lg font-semibold mb-2">No properties listed</h3>
                <p className="text-muted-foreground text-sm mb-4">List your first property to start receiving bookings</p>
                <Button onClick={() => setShowAddForm(true)}>Add Property</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {properties.map(p => (
                  <div key={p.id} className="bg-card rounded-xl border">
                    <div className="p-5">
                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">{p.title}</h3>
                            <Badge variant={p.status === "APPROVED" ? "default" : "outline"} className="text-xs">{p.status}</Badge>
                            {p.is_verified && <Badge className="bg-success/10 text-success border-0 text-xs">Verified</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{p.address}</p>
                          <p className="text-xs text-muted-foreground mt-1">Near {p.universities?.name} · {p.total_rooms} rooms · {p.property_type.replace("_", " ")}</p>
                          <div className="flex gap-1.5 mt-2">
                            {p.amenities?.slice(0, 4).map((a: string) => (<Badge key={a} variant="outline" className="text-xs">{a}</Badge>))}
                            {p.amenities?.length > 4 && <Badge variant="outline" className="text-xs">+{p.amenities.length - 4}</Badge>}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <p className="text-sm text-muted-foreground">{p.rooms?.length || 0} room types</p>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setExpandedProperty(expandedProperty === p.id ? null : p.id)}>
                              <Image className="w-4 h-4 mr-1" />Manage
                            </Button>
                            <Link href={`/listing/${p.id}`}><Button variant="ghost" size="sm">View</Button></Link>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded: Room Manager + Photo Upload */}
                    {expandedProperty === p.id && (
                      <div className="border-t p-5 space-y-6 bg-muted/30">
                        <RoomManager propertyId={p.id} rooms={p.rooms || []} onUpdate={fetchData} />
                        {p.rooms?.map((room: any) => (
                          <div key={room.id} className="border-t pt-4">
                            <p className="text-sm font-medium mb-2">Photos for {room.room_type.replace("_", " ")}</p>
                            <PhotoUploader
                              propertyId={p.id}
                              roomId={room.id}
                              existingPhotos={room.photos || []}
                              onUploadComplete={(urls) => handlePhotoUpdate(p.id, room.id, urls)}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bookings">
            {bookings.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-xl border">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display text-lg font-semibold mb-2">No bookings yet</h3>
                <p className="text-muted-foreground text-sm">Bookings from students will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map(b => (
                  <div key={b.id} className="bg-card rounded-xl border p-5">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-foreground">{b.properties?.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">Student: {b.student?.full_name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{new Date(b.start_date).toLocaleDateString()} — {new Date(b.end_date).toLocaleDateString()}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant={b.status === "CONFIRMED" ? "default" : "outline"}>{b.status}</Badge>
                          <Badge variant="outline">{b.payment_status}</Badge>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <p className="font-bold text-primary text-lg">{formatPrice(b.total_amount)}</p>
                        {b.status === "PENDING" && (
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" onClick={() => handleBookingAction(b.id, "CONFIRMED")}>
                              <CheckCircle2 className="w-4 h-4 mr-1" />Accept
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleBookingAction(b.id, "CANCELLED")}>Decline</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="earnings">
            <div className="bg-card rounded-xl border p-6">
              <h3 className="font-display text-xl font-semibold mb-6">Earnings Overview</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-muted/50 rounded-xl">
                  <p className="text-3xl font-bold text-primary font-display">{formatPrice(totalEarnings)}</p>
                  <p className="text-sm text-muted-foreground mt-1">Total Earnings</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-xl">
                  <p className="text-3xl font-bold text-foreground font-display">{bookings.filter(b => b.status === "COMPLETED").length}</p>
                  <p className="text-sm text-muted-foreground mt-1">Completed Bookings</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-xl">
                  <p className="text-3xl font-bold text-foreground font-display">{properties.length}</p>
                  <p className="text-sm text-muted-foreground mt-1">Total Properties</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-6 text-center">Payouts are released to your bank account after student confirms move-in (minus 8% platform commission)</p>
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <div className="bg-card rounded-xl border p-6 max-w-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold font-display text-2xl">
                  {profile?.full_name?.charAt(0) || "H"}
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold">{profile?.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <Badge className="mt-1 bg-primary/10 text-primary border-0">Host</Badge>
                </div>
              </div>
              <Button variant="destructive" onClick={signOut}>Sign Out</Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default HostDashboard;
