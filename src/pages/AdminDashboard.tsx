import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Building2, Flag, Users, CheckCircle2, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const AdminDashboard = () => {
  const { user, userRoles } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userFilter, setUserFilter] = useState<"all" | "students" | "hosts" | "pending">("all");

  useEffect(() => {
    if (!user) { navigate("/admin/login"); return; }
    if (!userRoles.includes("admin")) { navigate("/"); toast.error("Access denied"); return; }
    fetchData();
  }, [user, userRoles]);

  const fetchData = async () => {
    const [propsRes, reportsRes, profilesRes] = await Promise.all([
      supabase.from("properties").select("*, universities(short_name)").order("created_at", { ascending: false }),
      supabase.from("reports").select("*, properties(title)").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*, user_roles(role), universities(short_name)").order("created_at", { ascending: false }),
    ]);
    setProperties(propsRes.data || []);
    setReports(reportsRes.data || []);
    setUsers(profilesRes.data || []);
    setLoading(false);
  };

  const updatePropertyStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("properties").update({ status: status as any }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`Property ${status.toLowerCase()}`); fetchData(); }
  };

  const verifyProperty = async (id: string) => {
    const { error } = await supabase.from("properties").update({ is_verified: true }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Property verified"); fetchData(); }
  };

  const updateReportStatus = async (id: string, status: string) => {
    // Reports don't have update RLS for regular users, but admin role check happens server-side
    const { error } = await supabase.from("reports").update({ status: status as any }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`Report ${status.toLowerCase()}`); fetchData(); }
  };

  const verifyHost = async (userId: string) => {
    const { error } = await supabase.from("profiles").update({ is_verified: true }).eq("user_id", userId);
    if (error) toast.error(error.message);
    else { toast.success("Host verified"); fetchData(); }
  };

  const verifyStudent = async (userId: string) => {
    const { error } = await supabase.from("profiles").update({ is_student_verified: true }).eq("user_id", userId);
    if (error) toast.error(error.message);
    else { toast.success("Student verified"); fetchData(); }
  };

  const revokeVerification = async (userId: string, type: "host" | "student") => {
    const field = type === "host" ? { is_verified: false } : { is_student_verified: false };
    const { error } = await supabase.from("profiles").update(field).eq("user_id", userId);
    if (error) toast.error(error.message);
    else { toast.success("Verification revoked"); fetchData(); }
  };

  const pendingProperties = properties.filter(p => p.status === "PENDING");
  const pendingReports = reports.filter(r => r.status === "PENDING");

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage properties, users, and reports</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Properties", value: properties.length, icon: Building2 },
            { label: "Pending Approval", value: pendingProperties.length, icon: AlertTriangle },
            { label: "Open Reports", value: pendingReports.length, icon: Flag },
            { label: "Total Users", value: users.length, icon: Users },
          ].map(s => (
            <div key={s.label} className="bg-card rounded-xl border p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><s.icon className="w-5 h-5 text-primary" /></div>
                <div><p className="text-2xl font-bold text-foreground">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
              </div>
            </div>
          ))}
        </div>

        <Tabs defaultValue="properties" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="properties" className="gap-1.5"><Building2 className="w-4 h-4" />Properties {pendingProperties.length > 0 && <Badge variant="destructive" className="ml-1 text-xs">{pendingProperties.length}</Badge>}</TabsTrigger>
            <TabsTrigger value="reports" className="gap-1.5"><Flag className="w-4 h-4" />Reports {pendingReports.length > 0 && <Badge variant="destructive" className="ml-1 text-xs">{pendingReports.length}</Badge>}</TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5"><Users className="w-4 h-4" />Users</TabsTrigger>
          </TabsList>

          <TabsContent value="properties">
            <div className="space-y-4">
              {properties.map(p => (
                <div key={p.id} className="bg-card rounded-xl border p-5">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{p.title}</h3>
                        <Badge variant={p.status === "APPROVED" ? "default" : p.status === "SUSPENDED" ? "destructive" : "outline"}>{p.status}</Badge>
                        {p.is_verified && <Badge className="bg-success/10 text-success border-0 text-xs">Verified</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{p.address}</p>
                      <p className="text-xs text-muted-foreground mt-1">Near {p.universities?.short_name}</p>
                    </div>
                    <div className="flex gap-2 items-start">
                      {p.status === "PENDING" && (
                        <>
                          <Button size="sm" onClick={() => updatePropertyStatus(p.id, "APPROVED")} className="gap-1"><CheckCircle2 className="w-4 h-4" />Approve</Button>
                          <Button size="sm" variant="destructive" onClick={() => updatePropertyStatus(p.id, "SUSPENDED")} className="gap-1"><X className="w-4 h-4" />Reject</Button>
                        </>
                      )}
                      {!p.is_verified && p.status === "APPROVED" && (
                        <Button size="sm" variant="outline" onClick={() => verifyProperty(p.id)} className="gap-1"><CheckCircle2 className="w-4 h-4" />Verify</Button>
                      )}
                      {p.status === "APPROVED" && (
                        <Button size="sm" variant="ghost" onClick={() => updatePropertyStatus(p.id, "SUSPENDED")}>Suspend</Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reports">
            {reports.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-xl border">
                <Flag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display text-lg font-semibold mb-2">No reports</h3>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map(r => (
                  <div key={r.id} className="bg-card rounded-xl border p-5">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{r.reason}</h3>
                          <Badge variant={r.status === "PENDING" ? "outline" : r.status === "RESOLVED" ? "default" : "secondary"}>{r.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{r.description || "No details"}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Report
                          {r.properties?.title && ` · Property: ${r.properties.title}`}
                          {" · "}{new Date(r.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {r.status === "PENDING" && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => updateReportStatus(r.id, "RESOLVED")}>Resolve</Button>
                          <Button size="sm" variant="ghost" onClick={() => updateReportStatus(r.id, "DISMISSED")}>Dismiss</Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="users">
            <div className="flex flex-wrap gap-2 mb-4">
              {([
                { key: "all", label: `All (${users.length})` },
                { key: "students", label: `Students (${users.filter(u => u.user_roles?.some((r: any) => r.role === "student")).length})` },
                { key: "hosts", label: `Hosts (${users.filter(u => u.user_roles?.some((r: any) => r.role === "host")).length})` },
                { key: "pending", label: `Pending Verification (${users.filter(u => (u.user_roles?.some((r: any) => r.role === "host") && !u.is_verified) || (u.user_roles?.some((r: any) => r.role === "student") && u.matric_number && !u.is_student_verified)).length})` },
              ] as const).map(f => (
                <Button key={f.key} size="sm" variant={userFilter === f.key ? "default" : "outline"} onClick={() => setUserFilter(f.key)}>
                  {f.label}
                </Button>
              ))}
            </div>
            <div className="space-y-3">
              {users
                .filter(u => {
                  if (userFilter === "all") return true;
                  if (userFilter === "students") return u.user_roles?.some((r: any) => r.role === "student");
                  if (userFilter === "hosts") return u.user_roles?.some((r: any) => r.role === "host");
                  if (userFilter === "pending") {
                    const isHost = u.user_roles?.some((r: any) => r.role === "host");
                    const isStudent = u.user_roles?.some((r: any) => r.role === "student");
                    return (isHost && !u.is_verified) || (isStudent && u.matric_number && !u.is_student_verified);
                  }
                  return true;
                })
                .map(u => {
                  const isHost = u.user_roles?.some((r: any) => r.role === "host");
                  const isStudent = u.user_roles?.some((r: any) => r.role === "student");
                  return (
                    <div key={u.id} className="bg-card rounded-xl border p-5">
                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          {u.profile_photo_url ? (
                            <img src={u.profile_photo_url} alt={u.full_name} className="w-12 h-12 rounded-full object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                              {u.full_name?.charAt(0) || "U"}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-foreground">{u.full_name || "Unnamed user"}</p>
                              {u.user_roles?.map((r: any) => (
                                <Badge key={r.role} variant="outline" className="text-xs capitalize">{r.role}</Badge>
                              ))}
                              {isHost && u.is_verified && <Badge className="bg-success/10 text-success border-0 text-xs gap-1"><CheckCircle2 className="w-3 h-3" />Host Verified</Badge>}
                              {isStudent && u.is_student_verified && <Badge className="bg-success/10 text-success border-0 text-xs gap-1"><CheckCircle2 className="w-3 h-3" />Student Verified</Badge>}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-2 text-xs text-muted-foreground">
                              {u.phone && <span>📞 {u.phone}</span>}
                              {u.universities?.short_name && <span>🎓 {u.universities.short_name}</span>}
                              {u.matric_number && <span>🆔 Matric: {u.matric_number}</span>}
                              <span>📅 Joined {new Date(u.created_at).toLocaleDateString()}</span>
                            </div>
                            {isStudent && !u.matric_number && (
                              <p className="text-xs text-muted-foreground italic mt-2">⚠ Student has not submitted matric number — cannot verify yet.</p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 sm:items-end">
                          {isHost && !u.is_verified && (
                            <Button size="sm" onClick={() => verifyHost(u.user_id)} className="gap-1">
                              <CheckCircle2 className="w-4 h-4" />Verify Host
                            </Button>
                          )}
                          {isHost && u.is_verified && (
                            <Button size="sm" variant="ghost" onClick={() => revokeVerification(u.user_id, "host")}>Revoke Host</Button>
                          )}
                          {isStudent && u.matric_number && !u.is_student_verified && (
                            <Button size="sm" onClick={() => verifyStudent(u.user_id)} className="gap-1">
                              <CheckCircle2 className="w-4 h-4" />Verify Student
                            </Button>
                          )}
                          {isStudent && u.is_student_verified && (
                            <Button size="sm" variant="ghost" onClick={() => revokeVerification(u.user_id, "student")}>Revoke Student</Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
