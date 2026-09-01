import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertCircle, Upload } from "lucide-react";
import { matricVerificationAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface MatricVerificationProps {
  universitiesData: any[];
}

export default function MatricVerification({ universitiesData }: MatricVerificationProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [matricNumber, setMatricNumber] = useState("");
  const [selectedUniversityId, setSelectedUniversityId] = useState("");
  const [matricPhoto, setMatricPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [verificationData, setVerificationData] = useState<any>(null);
  const [error, setError] = useState("");

  // Fetch current verification status on mount
  const fetchVerificationStatus = async () => {
    if (!user?.id) return;
    try {
      const data = await matricVerificationAPI.getMatricVerificationStatus(user.id);
      setVerificationData(data);
    } catch (err) {
      console.error("Error fetching verification status:", err);
    }
  };

  useEffect(() => {
    fetchVerificationStatus();
  }, [user?.id]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMatricPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !matricNumber || !selectedUniversityId || !photoPreview) {
      setError("Please fill all fields and upload a photo");
      return;
    }

    setStatus("loading");
    setError("");

    try {
      const data = await matricVerificationAPI.submitMatricVerification(
        user.id,
        selectedUniversityId,
        matricNumber,
        photoPreview
      );
      
      setVerificationData(data);
      setStatus("success");
      setMatricNumber("");
      setSelectedUniversityId("");
      setMatricPhoto(null);
      setPhotoPreview("");
      
      toast({
        title: "Success",
        description: "Matric verification submitted. Your submission is under review.",
      });

      setTimeout(() => setStatus("idle"), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to submit verification");
      setStatus("error");
    }
  };

  const getStatusBadge = (verificationStatus: string) => {
    if (verificationStatus === "APPROVED") {
      return <Badge className="bg-green-600"><CheckCircle2 className="mr-1 h-3 w-3" /> Verified</Badge>;
    } else if (verificationStatus === "PENDING") {
      return <Badge className="bg-yellow-600"><Clock className="mr-1 h-3 w-3" /> Under Review</Badge>;
    } else if (verificationStatus === "REJECTED") {
      return <Badge className="bg-red-600"><AlertCircle className="mr-1 h-3 w-3" /> Rejected</Badge>;
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Verification</CardTitle>
        <CardDescription>Verify your student status with your matric card</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {verificationData && (
          <Alert className={verificationData.status === "APPROVED" ? "border-green-600" : 
                            verificationData.status === "PENDING" ? "border-yellow-600" : "border-red-600"}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Current Status: {verificationData.status}</p>
                  <p className="text-sm mt-1">Matric: {verificationData.matric_number}</p>
                  <p className="text-sm">Submitted: {new Date(verificationData.submitted_at).toLocaleDateString()}</p>
                  {verificationData.rejection_reason && (
                    <p className="text-sm mt-2 text-red-700">Reason: {verificationData.rejection_reason}</p>
                  )}
                </div>
                <div>{getStatusBadge(verificationData.status)}</div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {(!verificationData || verificationData.status === "REJECTED") && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="university">University *</Label>
              <select
                id="university"
                value={selectedUniversityId}
                onChange={(e) => setSelectedUniversityId(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              >
                <option value="">Select University</option>
                {universitiesData?.map((uni: any) => (
                  <option key={uni.id} value={uni.id}>
                    {uni.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="matric">Matric Number *</Label>
              <Input
                id="matric"
                type="text"
                placeholder="e.g., A01234567"
                value={matricNumber}
                onChange={(e) => setMatricNumber(e.target.value.toUpperCase())}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="photo">Matric Card Photo *</Label>
              <div className="mt-1 flex items-center gap-4">
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("photo")?.click()}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload Photo
                </Button>
                {photoPreview && (
                  <div className="relative">
                    <img src={photoPreview} alt="Preview" className="h-24 w-24 object-cover rounded border" />
                    <button
                      type="button"
                      onClick={() => {
                        setMatricPhoto(null);
                        setPhotoPreview("");
                      }}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <Alert className="border-red-600">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-600">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={status === "loading"}
              className="w-full"
            >
              {status === "loading" ? "Submitting..." : "Submit for Verification"}
            </Button>

            <p className="text-xs text-gray-500">
              Your information will be reviewed by our team within 24 hours.
            </p>
          </form>
        )}

        {verificationData?.status === "APPROVED" && (
          <Alert className="border-green-600">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-600">
              <p className="font-semibold">You are verified! 🎉</p>
              <p className="text-sm mt-2">You have access to all student features including booking properties and leaving reviews.</p>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
