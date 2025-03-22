// Core interfaces for trip-related data
export interface Trip {
  id: number;
  status: "Completed" | "Saved" | "Pending" | "Cancelled"; // Enum-like union type for status
  date: string; // Consider using Date if you plan to do date operations
  longitude: number;
  latitude: number;
  rating: number;
  primary_image: string;
  name: string;
  location: string;
  tags: string[];
  participants: number;
}

export interface SavedTrip {
  id: number;
  user_id: string; // Consider using UUID type if you're using UUIDs
  destination_id: number;
  created_at: string; // Consider using Date if you plan to do date operations
}

export interface Destination {
  destination_id: number;
  title: string;
  location: string;
  image: string; // URL or path to image
  tags: string[];
  // Optional fields that appear in your component
  primary_image?: string;
  images?: string[];
  name?: string;
}

// Menu item type with specific icon names from your icon library
export interface MenuItem {
  icon: "calendar-outline" | "checkmark-circle-outline";
  label: string;
}

// Constants with proper typing
export const MENU_ITEMS: MenuItem[] = [
  { icon: "calendar-outline", label: "Date Range" },
  { icon: "checkmark-circle-outline", label: "Status" },
];

// Sample data with const assertion for better type inference
export const PAST_TRIPS = [
  {
    id: 42,
    status: "Completed" as const,
    date: "March 15, 2024",
    longitude: -159.6588788,
    latitude: 22.1725249,
    rating: 5,
    primary_image:
      "https://static.wixstatic.com/media/181542_c71b7453d37246618b25c3c5dbf56983~mv2.jpg/v1/fill/w_980,h_653,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/181542_c71b7453d37246618b25c3c5dbf56983~mv2.jpg",
    name: "Kalalau Beach",
    location: "Kalalau Beach, Hawaii, USA",
    tags: ["Beach", "Adventure"],
    participants: 4,
  },
  {
    id: 41,
    status: "Completed" as const,
    date: "March 15, 2024",
    longitude: -105.6836389,
    latitude: 40.3427932,
    rating: 4.5,
    primary_image:
      "https://img.freepik.com/premium-photo/image-is-beautiful-landscape-photograph-man-standing-mountaintop-overlooking-vast-sea-clouds_14117-107202.jpg",
    name: "Rocky Mountain National Park",
    location: "Rocky Mountain National Park, Colorado, USA",
    tags: ["Adventure", "Mountain"],
    participants: 4,
  },
] satisfies Trip[]; // Type assertion to ensure array matches Trip interface

// Type utility for the component props (if needed)
export type SavedTripsTabProps = {
  // Add any props your component might receive
};

// Type for Supabase query results
export interface SupabaseDestination extends Destination {
  destination_id: number; // Matches your query field
  primary_image?: string;
  images?: string[];
  name: string;
}

// Type for Supabase user data
export interface SupabaseUserData {
  savedtrips: number[];
}
