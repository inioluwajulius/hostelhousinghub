export const universities = [
  { id: "1", name: "University of Lagos", short_name: "UNILAG", state: "Lagos", city: "Akoka" },
  { id: "2", name: "University of Ibadan", short_name: "UI", state: "Oyo", city: "Ibadan" },
  { id: "3", name: "Obafemi Awolowo University", short_name: "OAU", state: "Osun", city: "Ile-Ife" },
  { id: "4", name: "University of Nigeria", short_name: "UNN", state: "Enugu", city: "Nsukka" },
  { id: "5", name: "Ahmadu Bello University", short_name: "ABU", state: "Kaduna", city: "Zaria" },
  { id: "6", name: "University of Benin", short_name: "UNIBEN", state: "Edo", city: "Benin City" },
  { id: "7", name: "Lagos State University", short_name: "LASU", state: "Lagos", city: "Ojo" },
  { id: "8", name: "Covenant University", short_name: "CU", state: "Ogun", city: "Ota" },
];

export type PropertyType = "HOSTEL" | "APARTMENT" | "SELF_CONTAIN" | "MINI_FLAT" | "SHARED_ROOM";
export type GenderRestriction = "ANY" | "MALE_ONLY" | "FEMALE_ONLY";

export interface Property {
  id: string;
  title: string;
  description: string;
  address: string;
  university: string;
  universityShort: string;
  distanceMeters: number;
  propertyType: PropertyType;
  genderRestriction: GenderRestriction;
  pricePerSession: number;
  pricePerMonth?: number;
  amenities: string[];
  photos: string[];
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  hostName: string;
  hostPhoto: string;
  totalRooms: number;
  availableRooms: number;
}

export const properties: Property[] = [
  {
    id: "1",
    title: "Sunrise Hostel — Female Only",
    description: "A clean, secure, all-female hostel just 3 minutes walk from UNILAG main gate. Features 24/7 security, constant water supply, and a quiet reading room. Each room is well-ventilated with tiled floors and built-in wardrobes.",
    address: "12 Akoka Road, Yaba, Lagos",
    university: "University of Lagos",
    universityShort: "UNILAG",
    distanceMeters: 250,
    propertyType: "HOSTEL",
    genderRestriction: "FEMALE_ONLY",
    pricePerSession: 180000,
    amenities: ["WiFi", "Generator", "Borehole", "CCTV", "Reading Room", "Laundry Area"],
    photos: [],
    rating: 4.6,
    reviewCount: 84,
    isVerified: true,
    hostName: "Mrs. Adebayo",
    hostPhoto: "",
    totalRooms: 40,
    availableRooms: 8,
  },
  {
    id: "2",
    title: "GreenView Apartments — Self Contain",
    description: "Modern self-contained apartments with en-suite bathrooms, fully tiled. Located in a gated compound with ample parking and 24-hour security. Perfect for postgraduate students or young professionals.",
    address: "5 University Road, Ibadan",
    university: "University of Ibadan",
    universityShort: "UI",
    distanceMeters: 400,
    propertyType: "SELF_CONTAIN",
    genderRestriction: "ANY",
    pricePerSession: 250000,
    pricePerMonth: 35000,
    amenities: ["WiFi", "Generator", "Borehole", "Parking", "Security Guard"],
    photos: [],
    rating: 4.8,
    reviewCount: 56,
    isVerified: true,
    hostName: "Mr. Okonkwo",
    hostPhoto: "",
    totalRooms: 16,
    availableRooms: 3,
  },
  {
    id: "3",
    title: "Campus Edge — 2-in-1 Shared Rooms",
    description: "Affordable shared rooms (2 per room) right at the edge of OAU campus. Clean environment, prepaid electricity meters, and a friendly community of students. Best value near Ile-Ife campus.",
    address: "Ife-Ibadan Road, Ile-Ife",
    university: "Obafemi Awolowo University",
    universityShort: "OAU",
    distanceMeters: 150,
    propertyType: "SHARED_ROOM",
    genderRestriction: "MALE_ONLY",
    pricePerSession: 95000,
    amenities: ["Borehole", "Generator", "Security Gate"],
    photos: [],
    rating: 4.2,
    reviewCount: 120,
    isVerified: true,
    hostName: "Chief Adeniyi",
    hostPhoto: "",
    totalRooms: 60,
    availableRooms: 15,
  },
  {
    id: "4",
    title: "Pearl Mini Flats — Luxury Student Living",
    description: "Premium mini-flat apartments with a kitchenette, living room, and bedroom. Fully furnished with air conditioning. Ideal for students who want privacy and comfort near UNN campus.",
    address: "Hilltop, Nsukka",
    university: "University of Nigeria",
    universityShort: "UNN",
    distanceMeters: 600,
    propertyType: "MINI_FLAT",
    genderRestriction: "ANY",
    pricePerSession: 380000,
    pricePerMonth: 50000,
    amenities: ["WiFi", "AC", "Generator", "Furnished", "Parking", "CCTV"],
    photos: [],
    rating: 4.9,
    reviewCount: 32,
    isVerified: true,
    hostName: "Dr. Eze",
    hostPhoto: "",
    totalRooms: 10,
    availableRooms: 2,
  },
  {
    id: "5",
    title: "Unity Lodge — Mixed Hostel",
    description: "A popular mixed-gender hostel with separate floors for males and females. Very close to ABU main campus with regular bus service. Affordable and well-maintained.",
    address: "Samaru, Zaria",
    university: "Ahmadu Bello University",
    universityShort: "ABU",
    distanceMeters: 300,
    propertyType: "HOSTEL",
    genderRestriction: "ANY",
    pricePerSession: 120000,
    amenities: ["Generator", "Borehole", "Security Gate", "Study Hall"],
    photos: [],
    rating: 4.3,
    reviewCount: 95,
    isVerified: false,
    hostName: "Alhaji Musa",
    hostPhoto: "",
    totalRooms: 80,
    availableRooms: 22,
  },
  {
    id: "6",
    title: "Prestige Courts — Self Contain",
    description: "Newly built self-contained rooms in a quiet neighborhood near UNIBEN. Each unit features modern fittings, spacious rooms, and reliable power supply. Ideal for final-year students.",
    address: "Ekosodin, Benin City",
    university: "University of Benin",
    universityShort: "UNIBEN",
    distanceMeters: 200,
    propertyType: "SELF_CONTAIN",
    genderRestriction: "ANY",
    pricePerSession: 200000,
    pricePerMonth: 28000,
    amenities: ["WiFi", "Generator", "Borehole", "CCTV", "Parking"],
    photos: [],
    rating: 4.5,
    reviewCount: 67,
    isVerified: true,
    hostName: "Mrs. Igbinosa",
    hostPhoto: "",
    totalRooms: 24,
    availableRooms: 5,
  },
];

export const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatDistance = (meters: number): string => {
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)}km`;
};

export const propertyTypeLabels: Record<PropertyType, string> = {
  HOSTEL: "Hostel",
  APARTMENT: "Apartment",
  SELF_CONTAIN: "Self Contain",
  MINI_FLAT: "Mini Flat",
  SHARED_ROOM: "Shared Room",
};
