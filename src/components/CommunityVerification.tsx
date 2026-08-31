import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThumbsUp, ThumbsDown, AlertTriangle, Shield, Flag } from "lucide-react";
import { communityVerificationAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface CommunityVerificationProps {
  propertyId: string;
}

export default function CommunityVerification({ propertyId }: CommunityVerificationProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [communityScore, setCommunityScore] = useState<any>(null);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [flagging, setFlagging] = useState(false);
  const [flagForm, setFlagForm] = useState({
    reason: "",
    description: "",
  });
  const [showFlagForm, setShowFlagForm] = useState(false);

  useEffect(() => {
    loadCommunityData();
  }, [propertyId, user?.id]);

  const loadCommunityData = async () => {
    try {
      setLoading(true);
      const [score, userVoteData, flagData] = await Promise.all([
        communityVerificationAPI.getCommunityScore(propertyId),
        user?.id ? communityVerificationAPI.getUserVote(propertyId, user.id) : Promise.resolve(null),
        communityVerificationAPI.getPropertyFlags(propertyId),
      ]);

      setCommunityScore(score);
      setUserVote(userVoteData);
      setFlags(flagData);
    } catch (err) {
      console.error("Error loading community data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to vote",
        variant: "destructive",
      });
      return;
    }

    setVoting(true);
    try {
      await communityVerificationAPI.upvoteProperty(propertyId, user.id);
      setUserVote("upvote");
      await loadCommunityData();
      toast({
        title: "Success",
        description: "Thank you for your vote!",
      });
    } catch (err: any) {
      if (err.error === "Already upvoted") {
        setUserVote(null);
        await loadCommunityData();
      } else {
        toast({
          title: "Error",
          description: err.message || "Failed to vote",
          variant: "destructive",
        });
      }
    } finally {
      setVoting(false);
    }
  };

  const handleDownvote = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to vote",
        variant: "destructive",
      });
      return;
    }

    setVoting(true);
    try {
      await communityVerificationAPI.downvoteProperty(propertyId, user.id);
      setUserVote("downvote");
      await loadCommunityData();
      toast({
        title: "Success",
        description: "Thank you for your feedback!",
      });
    } catch (err: any) {
      if (err.error === "Already downvoted") {
        setUserVote(null);
        await loadCommunityData();
      } else {
        toast({
          title: "Error",
          description: err.message || "Failed to vote",
          variant: "destructive",
        });
      }
    } finally {
      setVoting(false);
    }
  };

  const handleFlagProperty = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id || !flagForm.reason) {
      toast({
        title: "Error",
        description: "Please provide a reason",
        variant: "destructive",
      });
      return;
    }

    setFlagging(true);
    try {
      await communityVerificationAPI.flagProperty(propertyId, user.id, flagForm.reason, flagForm.description);
      setFlagForm({ reason: "", description: "" });
      setShowFlagForm(false);
      await loadCommunityData();
      toast({
        title: "Success",
        description: "Thank you for reporting. Our team will review it.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to flag property",
        variant: "destructive",
      });
    } finally {
      setFlagging(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading community data...</p>
        </CardContent>
      </Card>
    );
  }

  const getTrustBadge = (score: number) => {
    if (score >= 80) return { color: "bg-green-600", label: "Highly Trusted" };
    if (score >= 60) return { color: "bg-blue-600", label: "Trusted" };
    if (score >= 40) return { color: "bg-yellow-600", label: "Fair" };
    return { color: "bg-red-600", label: "Suspicious" };
  };

  const trustInfo = getTrustBadge(communityScore?.trustScore || 0);

  return (
    <div className="space-y-4">
      {/* Trust Score Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Community Trust Score
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Trust Score</span>
              <span className="text-2xl font-bold">{communityScore?.trustScore || 0}%</span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`${trustInfo.color} h-2 rounded-full transition-all`}
                style={{ width: `${communityScore?.trustScore || 0}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <Badge className={trustInfo.color}>{trustInfo.label}</Badge>
              {communityScore?.isSuspicious && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Under Review
                </Badge>
              )}
            </div>
          </div>

          {/* Voting Section */}
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-3">Is this property reliable?</p>
            <div className="flex gap-2">
              <Button
                variant={userVote === "upvote" ? "default" : "outline"}
                size="sm"
                onClick={handleUpvote}
                disabled={voting}
                className="flex-1 gap-2"
              >
                <ThumbsUp className="h-4 w-4" />
                {communityScore?.votes?.upvotes || 0}
              </Button>

              <Button
                variant={userVote === "downvote" ? "destructive" : "outline"}
                size="sm"
                onClick={handleDownvote}
                disabled={voting}
                className="flex-1 gap-2"
              >
                <ThumbsDown className="h-4 w-4" />
                {communityScore?.votes?.downvotes || 0}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flags Section */}
      {communityScore?.flagCount > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Community Concerns ({communityScore?.flagCount})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {flags.slice(0, 5).map((flag) => (
              <div key={flag.id} className="border rounded-lg p-3 bg-white">
                <div className="flex items-start gap-2 mb-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={flag.reporter?.profile_photo_url} />
                    <AvatarFallback>{flag.reporter?.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{flag.reason}</p>
                    {flag.description && (
                      <p className="text-sm text-gray-600 mt-1">{flag.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(flag.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Report Property */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Flag className="h-4 w-4" />
            Report an Issue
          </CardTitle>
          <CardDescription>Help the community by reporting concerning information</CardDescription>
        </CardHeader>
        <CardContent>
          {showFlagForm ? (
            <form onSubmit={handleFlagProperty} className="space-y-3">
              <div>
                <Label htmlFor="reason">Reason for Report *</Label>
                <Select value={flagForm.reason} onValueChange={(v) => setFlagForm({ ...flagForm, reason: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scam">Potential Scam</SelectItem>
                    <SelectItem value="unsafe">Safety Concerns</SelectItem>
                    <SelectItem value="misrepresented">Misrepresented Property</SelectItem>
                    <SelectItem value="harassment">Harassment/Abuse</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Details (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Provide more information about the issue..."
                  value={flagForm.description}
                  onChange={(e) => setFlagForm({ ...flagForm, description: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={flagging || !flagForm.reason} className="flex-1">
                  {flagging ? "Reporting..." : "Submit Report"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowFlagForm(false);
                    setFlagForm({ reason: "", description: "" });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button onClick={() => setShowFlagForm(true)} variant="outline" className="w-full gap-2">
              <Flag className="h-4 w-4" />
              Report This Property
            </Button>
          )}
        </CardContent>
      </Card>

      {communityScore?.isSuspicious && (
        <Alert className="border-red-600 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            This property has multiple community concerns. Please exercise caution and conduct due diligence before booking.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
