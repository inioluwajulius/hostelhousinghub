import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface ProfileEditorProps {
  universities: any[];
  onUpdate: () => void;
}

const ProfileEditor = ({ universities, onUpdate }: ProfileEditorProps) => {
  const { user, profile } = useAuth();
  const [form, setForm] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    matric_number: profile?.matric_number || "",
    university_id: profile?.university_id || "",
  });
  const [saving, setSaving] = useState(false);

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
    </div>
  );
};

export default ProfileEditor;
