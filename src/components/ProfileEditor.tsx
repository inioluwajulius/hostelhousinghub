import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, CheckCircle2, Clock, IdCard } from "lucide-react";
import { toast } from "sonner";

interface ProfileEditorProps {
  universities: any[];
  onUpdate: () => void;
}

const ProfileEditor = ({ universities, onUpdate }: ProfileEditorProps) => {
  const { user, profile, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    matric_number: profile?.matric_number || "",
    university_id: profile?.university_id || "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!user || !profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name,
        phone: form.phone || null,
        matric_number: form.matric_number || null,
        university_id: form.university_id || null,
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Profile updated"); onUpdate(); }
  };

  const handleIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("File too large (max 5MB)"); return; }
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/student-id.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("verification-docs")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (upErr) { toast.error(upErr.message); setUploading(false); return; }

    const { error: dbErr } = await supabase
      .from("profiles")
      .update({ student_id_url: path, is_student_verified: false })
      .eq("user_id", user.id);

    if (dbErr) { toast.error(dbErr.message); setUploading(false); return; }

    // Local preview
    setIdPreview(URL.createObjectURL(file));
    toast.success("ID card uploaded — pending admin review");
    setUploading(false);
    await refreshProfile();
    onUpdate();
  };

  const hasUploadedId = !!profile?.student_id_url || !!idPreview;
  const isVerified = profile?.is_student_verified;

  return (
    <div className="bg-card rounded-xl border p-6 max-w-lg space-y-4">
      <h3 className="font-display text-lg font-semibold">Edit Profile</h3>
      <div>
        <Label>Full Name</Label>
        <Input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="mt-1" />
      </div>
      <div>
        <Label>Phone Number</Label>
        <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+234..." className="mt-1" />
      </div>
      <div>
        <Label>Matric Number</Label>
        <Input value={form.matric_number} onChange={e => setForm({...form, matric_number: e.target.value})} placeholder="e.g. 2021/1234" className="mt-1" />
      </div>
      <div>
        <Label>University</Label>
        <Select value={form.university_id} onValueChange={v => setForm({...form, university_id: v})}>
          <SelectTrigger className="mt-1"><SelectValue placeholder="Select university" /></SelectTrigger>
          <SelectContent>
            {universities.map((u: any) => (
              <SelectItem key={u.id} value={u.id}>{u.name} ({u.short_name})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>

      {/* Student ID upload section */}
      <div className="pt-4 border-t space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IdCard className="w-4 h-4 text-primary" />
            <Label className="font-medium">Student ID Card</Label>
          </div>
          {isVerified ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full">
              <CheckCircle2 className="w-3 h-3" />Verified
            </span>
          ) : hasUploadedId ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
              <Clock className="w-3 h-3" />Pending review
            </span>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          Upload a clear photo of your student ID card. An admin will review it and verify your matric number. Only admins can view this image.
        </p>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleIdUpload} />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="gap-1.5"
        >
          <Upload className="w-3.5 h-3.5" />
          {uploading ? "Uploading..." : hasUploadedId ? "Replace ID Card" : "Upload ID Card"}
        </Button>
        {idPreview && (
          <img src={idPreview} alt="Uploaded ID preview" className="mt-2 rounded-lg border max-h-48 object-contain" />
        )}
      </div>
    </div>
  );
};

export default ProfileEditor;
