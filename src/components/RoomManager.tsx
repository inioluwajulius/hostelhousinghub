import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

const roomTypeLabels: Record<string, string> = {
  SELF_CONTAIN: "Self Contain", SHARED_2: "Shared (2-in-1)", SHARED_4: "Shared (4-in-1)",
  SHARED_6: "Shared (6-in-1)", MINI_FLAT: "Mini Flat",
};

interface RoomManagerProps {
  propertyId: string;
  rooms: any[];
  onUpdate: () => void;
}

const RoomManager = ({ propertyId, rooms, onUpdate }: RoomManagerProps) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    room_type: "SELF_CONTAIN" as string,
    price_per_session: "",
    price_per_month: "",
    total_count: "1",
    available_count: "1",
    max_occupants: "1",
    is_furnished: false,
  });

  const handleAdd = async () => {
    if (!form.price_per_session) { toast.error("Price per session is required"); return; }
    const { error } = await supabase.from("rooms").insert({
      property_id: propertyId,
      room_type: form.room_type as any,
      price_per_session: parseFloat(form.price_per_session),
      price_per_month: form.price_per_month ? parseFloat(form.price_per_month) : null,
      total_count: parseInt(form.total_count) || 1,
      available_count: parseInt(form.available_count) || 1,
      max_occupants: parseInt(form.max_occupants) || 1,
      is_furnished: form.is_furnished,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Room type added");
      setShowForm(false);
      setForm({ room_type: "SELF_CONTAIN", price_per_session: "", price_per_month: "", total_count: "1", available_count: "1", max_occupants: "1", is_furnished: false });
      onUpdate();
    }
  };

  const handleDelete = async (roomId: string) => {
    const { error } = await supabase.from("rooms").delete().eq("id", roomId);
    if (error) toast.error(error.message);
    else { toast.success("Room removed"); onUpdate(); }
  };

  const formatPrice = (amount: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(amount);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-foreground">Room Types</h3>
        <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)} className="gap-1">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancel" : "Add Room"}
        </Button>
      </div>

      {showForm && (
        <div className="bg-muted/50 rounded-xl p-4 space-y-3 border">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Room Type</Label>
              <Select value={form.room_type} onValueChange={v => setForm({...form, room_type: v})}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(roomTypeLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Max Occupants</Label>
              <Input type="number" value={form.max_occupants} onChange={e => setForm({...form, max_occupants: e.target.value})} className="mt-1" min="1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Price/Session (₦) *</Label>
              <Input type="number" value={form.price_per_session} onChange={e => setForm({...form, price_per_session: e.target.value})} className="mt-1" placeholder="150000" />
            </div>
            <div>
              <Label className="text-xs">Price/Month (₦)</Label>
              <Input type="number" value={form.price_per_month} onChange={e => setForm({...form, price_per_month: e.target.value})} className="mt-1" placeholder="Optional" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Total Rooms</Label>
              <Input type="number" value={form.total_count} onChange={e => setForm({...form, total_count: e.target.value})} className="mt-1" min="1" />
            </div>
            <div>
              <Label className="text-xs">Available</Label>
              <Input type="number" value={form.available_count} onChange={e => setForm({...form, available_count: e.target.value})} className="mt-1" min="0" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.is_furnished} onCheckedChange={v => setForm({...form, is_furnished: v})} />
            <Label className="text-xs">Furnished</Label>
          </div>
          <Button onClick={handleAdd} size="sm" className="w-full">Add Room Type</Button>
        </div>
      )}

      {rooms.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No room types added yet</p>
      ) : (
        <div className="space-y-2">
          {rooms.map((r: any) => (
            <div key={r.id} className="flex items-center justify-between bg-card rounded-lg border p-3">
              <div>
                <p className="font-medium text-sm">{roomTypeLabels[r.room_type] || r.room_type}</p>
                <p className="text-xs text-muted-foreground">
                  {formatPrice(r.price_per_session)}/session · {r.available_count}/{r.total_count} avail · {r.is_furnished ? "Furnished" : "Unfurnished"}
                </p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => handleDelete(r.id)} className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RoomManager;
