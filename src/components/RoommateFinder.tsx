import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Send, Heart, X } from "lucide-react";
import { roommateFinderAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function RoommateFinder() {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [tab, setTab] = useState<"search" | "create" | "requests" | "matches">("search");
  const [roommates, setRoommates] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [myProfile, setMyProfile] = useState<any>(null);

  // Search filters
  const [filters, setFilters] = useState({
    genderPreference: "",
    budgetMin: "",
    budgetMax: "",
    university: "",
    cleanlinessLevel: "",
    sleepSchedule: "",
  });

  // Create profile form
  const [profileForm, setProfileForm] = useState({
    bio: "",
    genderPreference: "",
    budgetMin: "",
    budgetMax: "",
    university: "",
    interests: "",
    sleepSchedule: "normal",
    cleanlinessLevel: "medium",
    smokingAllowed: false,
  });

  // Send request form
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState("");

  useEffect(() => {
    loadMyProfile();
  }, [user?.id]);

  useEffect(() => {
    if (tab === "search") {
      searchRoommates();
    } else if (tab === "requests") {
      loadRequests();
    } else if (tab === "matches") {
      loadMatches();
    }
  }, [tab]);

  const loadMyProfile = async () => {
    if (!user?.id) return;
    try {
      const profile = await roommateFinderAPI.getRoommateProfile(user.id);
      setMyProfile(profile);
    } catch (err) {
      console.error("Error loading profile:", err);
    }
  };

  const searchRoommates = async () => {
    setLoading(true);
    try {
      const results = await roommateFinderAPI.searchRoommates({
        genderPreference: filters.genderPreference || undefined,
        budgetMin: filters.budgetMin ? parseInt(filters.budgetMin) : undefined,
        budgetMax: filters.budgetMax ? parseInt(filters.budgetMax) : undefined,
        university: filters.university || undefined,
        cleanlinessLevel: filters.cleanlinessLevel || undefined,
        sleepSchedule: filters.sleepSchedule || undefined,
      });
      setRoommates(results);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to search roommates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await roommateFinderAPI.getRoommateRequests(user.id);
      setRequests(data);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await roommateFinderAPI.getAcceptedMatches(user.id);
      setMatches(data);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load matches",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !profileForm.bio) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const data = await roommateFinderAPI.createRoommateProfile(user.id, {
        bio: profileForm.bio,
        genderPreference: profileForm.genderPreference,
        budgetRange: {
          min: parseInt(profileForm.budgetMin || "0"),
          max: parseInt(profileForm.budgetMax || "999999"),
        },
        university: profileForm.university,
        interests: profileForm.interests.split(",").map((i) => i.trim()),
        sleepSchedule: profileForm.sleepSchedule as any,
        cleanlinessLevel: profileForm.cleanlinessLevel as any,
        smokingAllowed: profileForm.smokingAllowed,
      });

      setMyProfile(data);
      toast({
        title: "Success",
        description: "Roommate profile created successfully",
      });

      setTab("search");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to create profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (recipientId: string) => {
    if (!user?.id) return;
    setSendingRequest(recipientId);
    try {
      await roommateFinderAPI.sendRoommateRequest(user.id, recipientId, requestMessage);
      toast({
        title: "Success",
        description: "Roommate request sent!",
      });
      setRequestMessage("");
      setSendingRequest(null);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to send request",
        variant: "destructive",
      });
    } finally {
      setSendingRequest(null);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await roommateFinderAPI.acceptRoommateRequest(requestId);
      setRequests(requests.filter((r) => r.id !== requestId));
      toast({
        title: "Success",
        description: "Request accepted!",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to accept request",
        variant: "destructive",
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await roommateFinderAPI.rejectRoommateRequest(requestId);
      setRequests(requests.filter((r) => r.id !== requestId));
      toast({
        title: "Success",
        description: "Request rejected",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to reject request",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {["search", "create", "requests", "matches"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            className={`px-4 py-2 border-b-2 font-medium capitalize transition-all ${
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
            {t === "requests" && requests.length > 0 && (
              <Badge className="ml-2">{requests.length}</Badge>
            )}
            {t === "matches" && matches.length > 0 && (
              <Badge className="ml-2">{matches.length}</Badge>
            )}
          </button>
        ))}
      </div>

      {/* Search Tab */}
      {tab === "search" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Find Roommates</CardTitle>
              <CardDescription>Search for compatible roommates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Gender Preference</Label>
                  <Select value={filters.genderPreference} onValueChange={(v) => setFilters({ ...filters, genderPreference: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="any">Any</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Cleanliness Level</Label>
                  <Select value={filters.cleanlinessLevel} onValueChange={(v) => setFilters({ ...filters, cleanlinessLevel: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Budget Min (₦)</Label>
                  <Input
                    type="number"
                    value={filters.budgetMin}
                    onChange={(e) => setFilters({ ...filters, budgetMin: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Budget Max (₦)</Label>
                  <Input
                    type="number"
                    value={filters.budgetMax}
                    onChange={(e) => setFilters({ ...filters, budgetMax: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <Button onClick={searchRoommates} disabled={loading} className="w-full gap-2">
                <Search className="h-4 w-4" />
                {loading ? "Searching..." : "Search"}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="grid gap-4">
            {roommates.length === 0 ? (
              <Alert>
                <AlertDescription>No roommates found matching your criteria</AlertDescription>
              </Alert>
            ) : (
              roommates.map((roommate) => (
                <Card key={roommate.id}>
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={roommate.user?.profile_photo_url} />
                        <AvatarFallback>{roommate.user?.full_name?.charAt(0)}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <h3 className="font-semibold">{roommate.user?.full_name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{roommate.bio}</p>

                        <div className="flex gap-2 mb-3 flex-wrap">
                          {roommate.interests?.map((interest: string) => (
                            <Badge key={interest} variant="outline" className="text-xs">
                              {interest}
                            </Badge>
                          ))}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
                          {roommate.budget_min && (
                            <div>Budget: ₦{roommate.budget_min?.toLocaleString()} - ₦{roommate.budget_max?.toLocaleString()}</div>
                          )}
                          <div>Sleep: {roommate.sleep_schedule}</div>
                          <div>Cleanliness: {roommate.cleanliness_level}</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {sendingRequest === roommate.user?.id ? (
                          <Textarea
                            placeholder="Add a message..."
                            value={requestMessage}
                            onChange={(e) => setRequestMessage(e.target.value)}
                            className="text-sm"
                          />
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSendingRequest(roommate.user?.id)}
                            className="gap-1"
                          >
                            <Heart className="h-4 w-4" />
                            Interest
                          </Button>
                        )}

                        {sendingRequest === roommate.user?.id && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => handleSendRequest(roommate.user?.id)}
                              className="gap-1"
                            >
                              <Send className="h-4 w-4" />
                              Send
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSendingRequest(null);
                                setRequestMessage("");
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Create Profile Tab */}
      {tab === "create" && (
        <Card>
          <CardHeader>
            <CardTitle>{myProfile ? "Edit" : "Create"} Roommate Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateProfile} className="space-y-4">
              <div>
                <Label htmlFor="bio">About You *</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell other students about yourself..."
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gender">Gender Preference</Label>
                  <Select value={profileForm.genderPreference} onValueChange={(v) => setProfileForm({ ...profileForm, genderPreference: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="any">Any</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sleep">Sleep Schedule</Label>
                  <Select value={profileForm.sleepSchedule} onValueChange={(v) => setProfileForm({ ...profileForm, sleepSchedule: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="early">Early Bird</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="late">Night Owl</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budgetMin">Budget Min (₦)</Label>
                  <Input
                    id="budgetMin"
                    type="number"
                    value={profileForm.budgetMin}
                    onChange={(e) => setProfileForm({ ...profileForm, budgetMin: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="budgetMax">Budget Max (₦)</Label>
                  <Input
                    id="budgetMax"
                    type="number"
                    value={profileForm.budgetMax}
                    onChange={(e) => setProfileForm({ ...profileForm, budgetMax: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="interests">Interests (comma-separated)</Label>
                <Input
                  id="interests"
                  placeholder="e.g., Gaming, Music, Sports"
                  value={profileForm.interests}
                  onChange={(e) => setProfileForm({ ...profileForm, interests: e.target.value })}
                  className="mt-1"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Requests Tab */}
      {tab === "requests" && (
        <div className="space-y-4">
          {requests.length === 0 ? (
            <Alert>
              <AlertDescription>No roommate requests yet</AlertDescription>
            </Alert>
          ) : (
            requests.map((request) => (
              <Card key={request.id}>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={request.sender?.profile_photo_url} />
                      <AvatarFallback>{request.sender?.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <h3 className="font-semibold">{request.sender?.full_name}</h3>
                      {request.senderProfile?.bio && (
                        <p className="text-sm text-muted-foreground">{request.senderProfile.bio}</p>
                      )}
                      {request.message && (
                        <p className="text-sm mt-2 italic">"{request.message}"</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptRequest(request.id)}
                        className="gap-1"
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectRequest(request.id)}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Matches Tab */}
      {tab === "matches" && (
        <div className="space-y-4">
          {matches.length === 0 ? (
            <Alert>
              <AlertDescription>No accepted matches yet</AlertDescription>
            </Alert>
          ) : (
            matches.map((match) => {
              const otherUser = match.sender?.id === user?.id ? match.recipient : match.sender;
              return (
                <Card key={match.id}>
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={otherUser?.profile_photo_url} />
                        <AvatarFallback>{otherUser?.full_name?.charAt(0)}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <h3 className="font-semibold">{otherUser?.full_name}</h3>
                        <p className="text-sm text-muted-foreground">{otherUser?.email}</p>
                      </div>

                      <Button variant="outline" size="sm">
                        Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
