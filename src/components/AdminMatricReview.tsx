import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check, X, Clock } from "lucide-react";
import { matricVerificationAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function AdminMatricReview() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadVerifications();
  }, []);

  const loadVerifications = async () => {
    try {
      setLoading(true);
      const data = await matricVerificationAPI.getPendingVerifications();
      setVerifications(data);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load verifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (verificationId: string) => {
    if (!user?.id) return;
    setProcessing(true);
    try {
      await matricVerificationAPI.approveMatricVerification(verificationId, user.id);
      setVerifications(verifications.filter((v) => v.id !== verificationId));
      setSelectedVerification(null);
      toast({
        title: "Success",
        description: "Verification approved",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to approve verification",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (verificationId: string) => {
    if (!user?.id || !rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a rejection reason",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      await matricVerificationAPI.rejectMatricVerification(
        verificationId,
        user.id,
        rejectionReason
      );
      setVerifications(verifications.filter((v) => v.id !== verificationId));
      setSelectedVerification(null);
      setRejectionReason("");
      toast({
        title: "Success",
        description: "Verification rejected",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to reject verification",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">Loading verifications...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Student Matric Verifications</CardTitle>
          <CardDescription>Review and approve student matric card submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge className="mb-4">
            <Clock className="mr-2 h-3 w-3" />
            {verifications.length} Pending
          </Badge>

          {verifications.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No pending verifications</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {verifications.map((verification) => (
                <div
                  key={verification.id}
                  onClick={() => setSelectedVerification(verification)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedVerification?.id === verification.id
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-primary"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold">{verification.user?.full_name}</p>
                      <p className="text-sm text-gray-500">{verification.university?.name}</p>
                      <p className="text-sm text-gray-600">Matric: {verification.matric_number}</p>
                    </div>
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(verification.submitted_at).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedVerification && (
        <Card>
          <CardHeader>
            <CardTitle>Review Submission</CardTitle>
            <CardDescription>{selectedVerification.user?.full_name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-gray-500">Student Name</Label>
                <p className="font-semibold">{selectedVerification.user?.full_name}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">University</Label>
                <p className="font-semibold">{selectedVerification.university?.name}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Matric Number</Label>
                <p className="font-semibold">{selectedVerification.matric_number}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Submitted Date</Label>
                <p className="font-semibold">
                  {new Date(selectedVerification.submitted_at).toLocaleDateString()}
                </p>
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-gray-500">Student Email</Label>
                <p className="font-semibold">{selectedVerification.user?.email}</p>
              </div>
            </div>

            {selectedVerification.matric_photo_url && (
              <div>
                <Label className="text-xs text-gray-500 mb-2 block">Matric Card Photo</Label>
                <img
                  src={selectedVerification.matric_photo_url}
                  alt="Matric Card"
                  className="max-w-xs border rounded-lg"
                />
              </div>
            )}

            <div>
              <Label htmlFor="reason">Rejection Reason (if rejecting)</Label>
              <Textarea
                id="reason"
                placeholder="Explain why the submission is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleApprove(selectedVerification.id)}
                disabled={processing}
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                Approve
              </Button>
              <Button
                onClick={() => handleReject(selectedVerification.id)}
                disabled={processing || !rejectionReason.trim()}
                variant="destructive"
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Reject
              </Button>
              <Button
                onClick={() => {
                  setSelectedVerification(null);
                  setRejectionReason("");
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
