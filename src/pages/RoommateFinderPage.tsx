import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, X, MessageSquare, GraduationCap } from "lucide-react";
import { toast } from "sonner";

const formatPrice = (v: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(v);

const RoommateFinderPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [universities, setUniversities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [myRequest, setMyRequest] = useState<any>(null);
  const [filterUni, setFilterUni] = useState("");

  const [form, setForm] = useState({
    university_id: "",
    budget_min: "50000",
    budget_max: "300000",
    gender_preference: "ANY",
    room_type_preference: "ANY",
    description: "",
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [reqRes, uniRes] = await Promise.all([
      supabase.from("roommate_requests").select("*, universities(name, short_name)").eq("is_active", true).order("created_at", { ascending: false }),
      supabase.from("universities").select("*").order("name"),
    ]);
    const allRequests = reqRes.data || [];
    
    // Fetch profile names for each request
    const userIds = [...new Set(allRequests.map((r: any) => r.user_id))];
    let profileMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
      (profiles || []).forEach((p: any) => { profileMap[p.user_id] = p.full_name; });
    }
    
    const enriched = allRequests.map((r: any) => ({ ...r, profile_name: profileMap[r.user_id] || "Student" }));
    setRequests(enriched);
    setUniversities(uniRes.data || []);
    if (user) {
      const mine = enriched.find((r: any) => r.user_id === user.id);
      setMyRequest(mine || null);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Please sign in"); return; }
    if (!form.university_id) { toast.error("Select your university"); return; }

    const payload = {
      user_id: user.id,
      university_id: form.university_id,
      budget_min: parseInt(form.budget_min) || 0,
      budget_max: parseInt(form.budget_max) || 500000,
      gender_preference: form.gender_preference,
      room_type_preference: form.room_type_preference,
      description: form.description.trim() || null,
    };

    if (myRequest) {
      const { error } = await supabase.from("roommate_requests").update(payload).eq("id", myRequest.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Request updated!");
    } else {
      const { error } = await supabase.from("roommate_requests").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Roommate request posted!");
    }
    setShowForm(false);
    fetchData();
  };

  const handleDelete = async () => {
    if (!myRequest) return;
    await supabase.from("roommate_requests").delete().eq("id", myRequest.id);
    toast.success("Request removed");
    setMyRequest(null);
    fetchData();
  };

  let filtered = requests;
  if (filterUni) filtered = filtered.filter(r => r.university_id === filterUni);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />Roommate Finder
            </h1>
            <p className="text-muted-foreground mt-1">Find students looking to share accommodation near your campus</p>
          </div>
          <div className="flex gap-2">
            {myRequest && (
              <Button variant="destructive" size="sm" onClick={handleDelete}>Remove My Post</Button>
            )}
            <Button onClick={() => { if (!user) { toast.error("Please sign in"); return; } setShowForm(true); }} className="gap-1.5">
              <Plus className="w-4 h-4" />{myRequest ? "Edit My Post" : "Post Request"}
            </Button>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-3 mb-6">
          <Select value={filterUni} onValueChange={setFilterUni}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Filter by university" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Universities</SelectItem>
              {universities.map(u => <SelectItem key={u.id} value={u.id}>{u.short_name}</SelectItem>)}
            </SelectContent>
          </Select>
          {filterUni && filterUni !== "all" && <Button variant="ghost" size="sm" onClick={() => setFilterUni("")}>Clear</Button>}
        </div>

        {/* Post form modal */}
        {showForm && (
          <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-2xl border shadow-elevated max-w-lg w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-bold">Find a Roommate</h2>
                <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Your University *</Label>
                  <Select value={form.university_id} onValueChange={v => setForm({ ...form, university_id: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select university" /></SelectTrigger>
                    <SelectContent>{universities.map(u => <SelectItem key={u.id} value={u.id}>{u.name} ({u.short_name})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Min Budget (₦)</Label><Input type="number" value={form.budget_min} onChange={e => setForm({ ...form, budget_min: e.target.value })} className="mt-1" /></div>
                  <div><Label>Max Budget (₦)</Label><Input type="number" value={form.budget_max} onChange={e => setForm({ ...form, budget_max: e.target.value })} className="mt-1" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Gender Preference</Label>
                    <Select value={form.gender_preference} onValueChange={v => setForm({ ...form, gender_preference: v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ANY">Any</SelectItem>
                        <SelectItem value="MALE_ONLY">Male Only</SelectItem>
                        <SelectItem value="FEMALE_ONLY">Female Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Room Type</Label>
                    <Select value={form.room_type_preference} onValueChange={v => setForm({ ...form, room_type_preference: v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ANY">Any</SelectItem>
                        <SelectItem value="SHARED_2">Shared (2-in-1)</SelectItem>
                        <SelectItem value="SHARED_4">Shared (4-in-1)</SelectItem>
                        <SelectItem value="SHARED_6">Shared (6-in-1)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>About you / what you're looking for</Label>
                  <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="E.g. I'm a 200-level student, quiet, prefer someone who keeps things tidy..." className="mt-1" rows={3} />
                </div>
                <Button type="submit" className="w-full">{myRequest ? "Update Request" : "Post Request"}</Button>
              </form>
            </div>
          </div>
        )}

        {/* Requests grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-xl border">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-lg font-semibold mb-2">No roommate requests yet</h3>
            <p className="text-muted-foreground text-sm">Be the first to post a request!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(r => (
              <div key={r.id} className={`bg-card rounded-xl border p-5 space-y-3 ${r.user_id === user?.id ? "ring-2 ring-primary/30" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {r.profile_name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{r.profile_name || "Student"}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <GraduationCap className="w-3 h-3" />{r.universities?.short_name || "N/A"}
                    </div>
                  </div>
                  {r.user_id === user?.id && <Badge className="ml-auto text-xs">You</Badge>}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">{formatPrice(r.budget_min)} — {formatPrice(r.budget_max)}</Badge>
                  {r.gender_preference !== "ANY" && <Badge variant="outline" className="text-xs">{r.gender_preference === "MALE_ONLY" ? "Male" : "Female"}</Badge>}
                  {r.room_type_preference !== "ANY" && <Badge variant="outline" className="text-xs">{r.room_type_preference.replace("_", " ")}</Badge>}
                </div>

                {r.description && <p className="text-sm text-muted-foreground line-clamp-3">{r.description}</p>}

                {user && r.user_id !== user.id && (
                  <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={() => navigate(`/messages?with=${r.user_id}`)}>
                    <MessageSquare className="w-4 h-4" />Message
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default RoommateFinderPage;
