import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProfileEditor from "@/components/ProfileEditor";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home as HomeIcon, BookOpen, Heart, MessageSquare, Bell, User, Calendar, MapPin, Star, Edit } from "lucide-react";
import { toast } from "sonner";

const StudentDashboard = () => {
  const { user, profile, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [savedListings, setSavedListings] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [universities, setUniversities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    if (userRole === "host") { navigate("/host/dashboard"); return; }
    fetchData();
  }, [user, userRole]);

  const fetchData = async () => {
    if (!user) return;
    const [bookingsRes, savedRes, notifRes, messagesRes, uniRes] = await Promise.all([
      supabase.from("bookings").select("*, properties(title, address, university_id, universities(short_name)), rooms(room_type, price_per_session)").eq("student_id", user.id).order("created_at", { ascending: false }),
      supabase.from("saved_listings").select("*, properties(*, universities(short_name))").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("messages").select("*, sender:profiles!messages_sender_id_fkey(full_name)").eq("receiver_id", user.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("universities").select("*").order("name"),
    ]);
    setBookings(bookingsRes.data || []);
    setSavedListings(savedRes.data || []);
    setNotifications(notifRes.data || []);
    setMessages(messagesRes.data || []);
    setUniversities(uniRes.data || []);
    setLoading(false);
  };

  const markNotificationsRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    fetchData();
  };

  const formatPrice = (amount: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(amount);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Welcome, {profile?.full_name || "Student"}</h1>
            <p className="text-muted-foreground mt-1">Manage your bookings, saved listings, and messages</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/messages")} className="gap-1.5">
              <MessageSquare className="w-4 h-4" /> Messages
            </Button>
            <Link to="/search"><Button>Find Housing</Button></Link>
          </div>
        </div>

        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="bookings" className="gap-1.5"><BookOpen className="w-4 h-4" />Bookings</TabsTrigger>
            <TabsTrigger value="saved" className="gap-1.5"><Heart className="w-4 h-4" />Saved</TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5 relative">
              <Bell className="w-4 h-4" />Notifications
              {unreadCount > 0 && <span className="ml-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 inline-flex items-center justify-center">{unreadCount}</span>}
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-1.5"><User className="w-4 h-4" />Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            {bookings.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-xl border">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display text-lg font-semibold mb-2">No bookings yet</h3>
                <p className="text-muted-foreground text-sm mb-4">Start by finding housing near your campus</p>
                <Link to="/search"><Button>Browse Listings</Button></Link>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((b) => (
                  <div key={b.id} className="bg-card rounded-xl border p-5 flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-foreground">{b.properties?.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{b.properties?.address}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant={b.status === "CONFIRMED" ? "default" : "outline"}>{b.status}</Badge>
                        <Badge variant="outline">{b.payment_status}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary text-lg">{formatPrice(b.total_amount)}</p>
                      <p className="text-xs text-muted-foreground">{new Date(b.start_date).toLocaleDateString()} — {new Date(b.end_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved">
            {savedListings.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-xl border">
                <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display text-lg font-semibold mb-2">No saved listings</h3>
                <p className="text-muted-foreground text-sm">Save properties you like to compare later</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedListings.map((s) => (
                  <Link key={s.id} to={`/listing/${s.property_id}`} className="bg-card rounded-xl border p-4 card-hover">
                    <h3 className="font-semibold text-foreground">{s.properties?.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{s.properties?.address}</p>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="notifications">
            {unreadCount > 0 && (
              <div className="flex justify-end mb-3">
                <Button variant="ghost" size="sm" onClick={markNotificationsRead}>Mark all as read</Button>
              </div>
            )}
            {notifications.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-xl border">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display text-lg font-semibold mb-2">No notifications</h3>
                <p className="text-muted-foreground text-sm">You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div key={n.id} className={`bg-card rounded-xl border p-4 ${!n.is_read ? "border-primary/30 bg-primary/5" : ""}`}>
                    <div className="flex justify-between">
                      <span className="font-medium text-sm">{n.title}</span>
                      <span className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="profile">
            {editingProfile ? (
              <div>
                <Button variant="ghost" size="sm" onClick={() => setEditingProfile(false)} className="mb-4">← Back to profile</Button>
                <ProfileEditor universities={universities} onUpdate={() => { setEditingProfile(false); fetchData(); window.location.reload(); }} />
              </div>
            ) : (
              <div className="bg-card rounded-xl border p-6 max-w-lg">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold font-display text-2xl">
                    {profile?.full_name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-semibold">{profile?.full_name}</h3>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <Badge variant="outline" className="mt-1">Student</Badge>
                  </div>
                </div>
                {profile?.phone && <p className="text-sm text-muted-foreground mb-2">📞 {profile.phone}</p>}
                {profile?.matric_number && <p className="text-sm text-muted-foreground mb-2">🎓 {profile.matric_number}</p>}
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" onClick={() => setEditingProfile(true)} className="gap-1.5">
                    <Edit className="w-4 h-4" />Edit Profile
                  </Button>
                  <Button variant="destructive" onClick={signOut}>Sign Out</Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default StudentDashboard;
