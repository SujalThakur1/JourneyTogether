import { useState, useEffect } from "react";
import DestinationSearch from "@/components/DestinationSearch";
import { supabase } from "@/lib/supabase";

export default function HomePage() {
  const [destinations, setDestinations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    try {
      // First, try to get destinations from Supabase that match the query
      const { data: existingDestinations, error } = await supabase
        .from("destinations")
        .select("*")
        .ilike("name", `%${query}%`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // If we have results, use them
      if (existingDestinations && existingDestinations.length > 0) {
        setDestinations(existingDestinations);
      } else {
        // If no results, fetch from Google Places API and add to Supabase
        await fetchAndAddGooglePlace(query);
      }
    } catch (error) {
      console.error("Error searching destinations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAndAddGooglePlace = async (query: string) => {
    try {
      // Get details from Google Places API
      const response = await fetch(
        `/api/places/details?query=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      console.log("Google Place Details:", data);

      if (data.result) {
        const place = data.result;

        // Add to Supabase
        const { data: newDestination, error } = await supabase
          .from("destinations")
          .insert({
            name: place.name,
            description: place.formatted_address || "",
            latitude: place.geometry?.location.lat,
            longitude: place.geometry?.location.lng,
            place_id: place.place_id,
            // Add other fields as needed
          })
          .select()
          .single();

        if (error) throw error;

        // Fetch all destinations again to show the new one at the top
        const { data: allDestinations } = await supabase
          .from("destinations")
          .select("*")
          .order("created_at", { ascending: false });

        if (allDestinations && allDestinations.length > 0) {
          setDestinations(allDestinations);
        }
      }
    } catch (error) {
      console.error("Error fetching Google Place Details:", error);
    }
  };

  return <div>{/* Render your component content here */}</div>;
}
