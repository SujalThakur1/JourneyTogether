// Core interfaces for trip-related data
export interface Trip {
  id: number;
  status: "Completed" | "Saved" | "Pending" | "Cancelled"; // Enum-like union type for status
  date: string; // Consider using Date if you plan to do date operations
  image: string; // URL or path to image
  title: string;
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
    id: 1,
    status: "Completed" as const,
    date: "March 15, 2024",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
    title: "Beach Paradise Tour",
    location: "Miami Beach, FL",
    tags: ["Beach", "Adventure"],
    participants: 4,
  },
  {
    id: 2,
    status: "Completed" as const,
    date: "March 15, 2024",
    image:
      "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&q=80&w=600",
    title: "Beach Paradise Tour",
    location: "Miami Beach, FL",
    tags: ["Beach", "Adventure"],
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
