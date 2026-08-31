import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { propertiesAPI, roomsAPI, universitiesAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import RoomManager from "./RoomManager";
import PhotoUploader from "./PhotoUploader";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface PropertyListingFormProps {
  propertyId?: string;
  initialData?: any;
  onSuccess?: (propertyId: string) => void;
}

const PropertyListingForm = ({ propertyId, initialData, onSuccess }: PropertyListingFormProps) => {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [universities, setUniversities] = useState<any[]>([]);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    pricing: true,
    amenities: true,
    rules: true,
  });

  const [form, setForm] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    address: initialData?.address || "",
    university_id: initialData?.university_id || "",
    latitude: initialData?.latitude || 6.5244,
    longitude: initialData?.longitude || 3.3792,
    property_type: initialData?.property_type || "HOSTEL",
    gender_restriction: initialData?.gender_restriction || "ANY",
    distance_to_gate_meters: initialData?.distance_to_gate_meters || 0,
    total_rooms: initialData?.total_rooms || 1,
    amenities: initialData?.amenities || [],
    house_rules: initialData?.house_rules || "",
    features_summary: initialData?.features_summary || "",
  });

  const amenityList = [
    "WiFi",
    "Generator",
    "Borehole",
    "CCTV",
    "Parking",
    "Security Guard",
    "Reading Room",
    "Study Hall",
    "Laundry Area",
    "AC",
    "Furnished",
    "Gym",
    "Common Room",
    "Kitchen",
  ];

  const propertyTypes = [
    { value: "HOSTEL", label: "Hostel" },
    { value: "SELF_CONTAIN", label: "Self Contain" },
    { value: "SHARED_ROOM", label: "Shared Room" },
    { value: "MINI_FLAT", label: "Mini Flat" },
    { value: "APARTMENT", label: "Apartment" },
  ];

  const genderOptions = [
    { value: "ANY", label: "Mixed (Any Gender)" },
    { value: "MALE_ONLY", label: "Male Only" },
    { value: "FEMALE_ONLY", label: "Female Only" },
  ];

  // Load universities on mount
  React.useEffect(() => {
    const loadUniversities = async () => {
      try {
        const unis = await universitiesAPI.getUniversities();
        setUniversities(unis);
      } catch (err) {
        console.error("Failed to load universities:", err);
        toast.error("Failed to load universities");
      }
    };
    loadUniversities();
  }, []);

  const toggleAmenity = (amenity: string) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    if (!form.title || !form.address || !form.university_id) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      let pId = propertyId;

      if (!pId) {
        const newProperty = await propertiesAPI.createProperty(user.id, {
          title: form.title,
          description: form.description,
          address: form.address,
          university_id: form.university_id,
          latitude: form.latitude,
          longitude: form.longitude,
          property_type: form.property_type,
          gender_restriction: form.gender_restriction,
          distance_to_gate_meters: form.distance_to_gate_meters || 0,
          total_rooms: form.total_rooms,
          amenities: form.amenities,
          house_rules: form.house_rules,
          features_summary: form.features_summary,
          is_active: true,
        });
        pId = newProperty.id;
        toast.success("Property created! Now add room details.");
      } else {
        await propertiesAPI.updateProperty(pId, form);
        toast.success("Property updated!");
      }

      if (onSuccess) {
        onSuccess(pId);
      } else {
        router.push(`/host/property/${pId}`);
      }
    } catch (err) {
      console.error("Error saving property:", err);
      toast.error("Failed to save property");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* BASIC INFORMATION */}
        <Card className="p-6">
          <button
            type="button"
            onClick={() => toggleSection("basic")}
            className="w-full flex items-center justify-between mb-4"
          >
            <h3 className="font-display text-lg font-semibold">Basic Information</h3>
            {expandedSections.basic ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>

          {expandedSections.basic && (
            <div className="space-y-4">
              <div>
                <Label className="font-semibold">Property Title *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Sunrise Hostel — Female Only, 5 mins to UNILAG"
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label className="font-semibold">Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe your property... Include highlights, nearby amenities, etc."
                  className="mt-2 min-h-24"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">University *</Label>
                  <Select
                    value={form.university_id}
                    onValueChange={(value) => setForm({ ...form, university_id: value })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {universities.map((uni) => (
                        <SelectItem key={uni.id} value={uni.id}>
                          {uni.name} ({uni.short_name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="font-semibold">Property Type *</Label>
                  <Select
                    value={form.property_type}
                    onValueChange={(value) => setForm({ ...form, property_type: value })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {propertyTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="font-semibold">Address *</Label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="e.g., 123 Ikoyi Lane, Lagos"
                  className="mt-2"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Gender Restriction</Label>
                  <Select
                    value={form.gender_restriction}
                    onValueChange={(value) => setForm({ ...form, gender_restriction: value })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {genderOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="font-semibold">Distance to Campus Gate (meters)</Label>
                  <Input
                    type="number"
                    value={form.distance_to_gate_meters}
                    onChange={(e) => setForm({ ...form, distance_to_gate_meters: parseInt(e.target.value) || 0 })}
                    placeholder="e.g., 500"
                    className="mt-2"
                    min="0"
                  />
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* AMENITIES */}
        <Card className="p-6">
          <button
            type="button"
            onClick={() => toggleSection("amenities")}
            className="w-full flex items-center justify-between mb-4"
          >
            <h3 className="font-display text-lg font-semibold">Amenities</h3>
            {expandedSections.amenities ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>

          {expandedSections.amenities && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {amenityList.map((amenity) => (
                <label key={amenity} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={form.amenities.includes(amenity)}
                    onCheckedChange={() => toggleAmenity(amenity)}
                  />
                  <span className="text-sm">{amenity}</span>
                </label>
              ))}
            </div>
          )}
        </Card>

        {/* HOUSE RULES */}
        <Card className="p-6">
          <button
            type="button"
            onClick={() => toggleSection("rules")}
            className="w-full flex items-center justify-between mb-4"
          >
            <h3 className="font-display text-lg font-semibold">House Rules & Policies</h3>
            {expandedSections.rules ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>

          {expandedSections.rules && (
            <div className="space-y-4">
              <div>
                <Label className="font-semibold">House Rules</Label>
                <Textarea
                  value={form.house_rules}
                  onChange={(e) => setForm({ ...form, house_rules: e.target.value })}
                  placeholder="e.g., No smoking, Quiet hours 10pm-6am, No visitors after 9pm, etc."
                  className="mt-2 min-h-20"
                />
              </div>

              <div>
                <Label className="font-semibold">Features Summary</Label>
                <Textarea
                  value={form.features_summary}
                  onChange={(e) => setForm({ ...form, features_summary: e.target.value })}
                  placeholder="Key features that make your property unique..."
                  className="mt-2 min-h-20"
                />
              </div>
            </div>
          )}
        </Card>

        {/* ACTION BUTTONS */}
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : propertyId ? "Update Property" : "Create Property"}
          </Button>
        </div>
      </form>

      {/* Room Manager - only show if property exists */}
      {propertyId && (
        <div className="mt-8">
          <RoomManager propertyId={propertyId} rooms={initialData?.rooms || []} onUpdate={() => {}} />
        </div>
      )}
    </div>
  );
};

export default PropertyListingForm;
