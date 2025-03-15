import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { supabase } from "../../lib/supabase";
import axios from "axios";
import { useGroups } from "../../contexts/GroupsContext";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "../../contexts/ColorContext";

// Define props interface for type safety
interface DestinationSearchProps {
  onSearch: (searchText: string) => void;
  placeholder?: string;
  onDestinationSelect?: (destinationId: number) => void;
}

// Main component for destination search functionality
const DestinationSearch: React.FC<DestinationSearchProps> = ({
  onSearch,
  placeholder = "Search destinations...",
  onDestinationSelect,
}) => {
  // Destructure context values for state management and styling
  const {
    destination,
    setDestination,
    isDark,
    textColor,
    inputTextColor,
    inputBorderColor,
    focusedBorderColor,
    focusedInput,
    setFocusedInput,
    setDestinationCoordinates,
  } = useGroups();

  const colors = useColors();
  const [isProcessing, setIsProcessing] = useState(false); // Loading state for destination processing
  const [processingError, setProcessingError] = useState<string | null>(null); // Error state for processing

  // Stores destination data in Supabase database
  const storeDestination = async (
    name: string,
    location: string,
    latitude: number,
    longitude: number,
    rating: number = 0
  ) => {
    try {
      // Check if destination already exists to avoid duplicates
      const { data: existingDestinations, error: searchError } = await supabase
        .from("destination")
        .select("destination_id")
        .eq("latitude", latitude)
        .eq("longitude", longitude);

      if (searchError) {
        throw new Error(
          `Error searching for destination: ${searchError.message}`
        );
      }

      if (existingDestinations && existingDestinations.length > 0) {
        console.log("Destination already exists:", existingDestinations[0]);
        return existingDestinations[0].destination_id;
      }

      // Insert new destination if it doesn't exist
      const { data: newDestination, error: insertError } = await supabase
        .from("destination")
        .insert({
          name,
          location,
          latitude,
          longitude,
          rating,
          category_id: 1, // Default category
          images: [], // Initialize empty images array
          created_at: new Date().toISOString(),
        })
        .select("destination_id")
        .single();

      if (insertError) {
        throw new Error(`Error inserting destination: ${insertError.message}`);
      }

      console.log("New destination created:", newDestination);
      return newDestination.destination_id;
    } catch (error) {
      console.error("Error in storeDestination:", error);
      throw error;
    }
  };

  // Fetches and stores destination images from Google Places API
  const storeDestinationImages = async (
    destinationId: number,
    destinationName: string
  ) => {
    try {
      // Check if images already exist for this destination
      const { data: existingDestination, error: fetchError } = await supabase
        .from("destination")
        .select("images")
        .eq("destination_id", destinationId)
        .single();

      if (fetchError) {
        console.error(`Error fetching destination: ${fetchError.message}`);
        return;
      }

      if (existingDestination?.images?.length > 0) {
        console.log(`Destination ${destinationName} already has images`);
        return;
      }

      const placesApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

      // Get place ID from Google Places API
      const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
        destinationName
      )}&inputtype=textquery&fields=place_id&key=${placesApiKey}`;

      const searchResponse = await axios.get(searchUrl);

      if (!searchResponse.data.candidates?.[0]?.place_id) {
        console.log(`No place found for: ${destinationName}`);
        return;
      }

      const placeId = searchResponse.data.candidates[0].place_id;

      // Fetch place details including photos
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${placesApiKey}`;
      const detailsResponse = await axios.get(detailsUrl);
      const photos = detailsResponse.data.result?.photos || [];

      // Generate image URLs (limited to 5)
      const imageUrls = [];
      for (let i = 0; i < Math.min(photos.length, 5); i++) {
        const photoRef = photos[i].photo_reference;
        const imageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${placesApiKey}`;
        imageUrls.push(imageUrl);
      }

      // Update destination with image URLs
      const { error: updateError } = await supabase
        .from("destination")
        .update({
          images: imageUrls,
          primary_image: imageUrls[0] || null,
        })
        .eq("destination_id", destinationId);

      if (updateError) {
        throw new Error(`Error updating images: ${updateError.message}`);
      }
    } catch (error) {
      console.error(`Error processing images for ${destinationName}:`, error);
    }
  };

  // Handles selection of a destination from autocomplete
  const handleDestinationSelect = async (data: any, details: any = null) => {
    try {
      setDestination(data.description);
      setProcessingError(null);

      if (details?.geometry?.location) {
        const coordinates = {
          latitude: details.geometry.location.lat,
          longitude: details.geometry.location.lng,
        };
        setDestinationCoordinates(coordinates);

        setIsProcessing(true);
        const destinationId = await storeDestination(
          data.description,
          details.formatted_address || data.description,
          coordinates.latitude,
          coordinates.longitude,
          details.rating || 0
        );

        await storeDestinationImages(destinationId, data.description);

        if (onDestinationSelect) {
          onDestinationSelect(destinationId);
        }

        onSearch(data.description);
      }
    } catch (error) {
      console.error("Error processing destination:", error);
      setProcessingError(
        error instanceof Error ? error.message : "Failed to process destination"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Triggers search when search button is pressed
  const handleSearchPress = () => {
    if (destination) {
      onSearch(destination);
    }
  };

  // Render the search component
  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        {/* Google Places Autocomplete input */}
        <GooglePlacesAutocomplete
          placeholder={placeholder}
          onPress={handleDestinationSelect}
          query={{
            key: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
            language: "en",
          }}
          fetchDetails={true}
          styles={{
            // Custom styles for autocomplete component
            container: { flex: 1, zIndex: 20 },
            textInput: {
              ...styles.input,
              backgroundColor: isDark ? "#27272a" : "white",
              borderColor:
                focusedInput === "destination"
                  ? focusedBorderColor
                  : inputBorderColor,
              color: inputTextColor,
              paddingRight: 40,
            },
            // ... other styles
          }}
          textInputProps={{
            onFocus: () => setFocusedInput("destination"),
            onBlur: () => setFocusedInput(null),
            selectionColor: inputTextColor,
            placeholderTextColor: "gray",
            value: destination,
            onChangeText: setDestination,
            onSubmitEditing: handleSearchPress,
          }}
          // ... other props
        />
        {/* Search button */}
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearchPress}
        >
          <Ionicons name="search" size={20} color={colors.iconColor} />
        </TouchableOpacity>
      </View>

      {/* Loading indicator */}
      {isProcessing && (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="small" color="#0000ff" />
          <Text style={styles.processingText}>Processing destination...</Text>
        </View>
      )}

      {/* Error message */}
      {processingError && (
        <Text style={styles.errorText}>{processingError}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    zIndex: 20,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  searchButton: {
    position: "absolute",
    right: 12,
    padding: 8,
    zIndex: 30,
  },
  processingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  processingText: {
    fontSize: 12,
    marginLeft: 8,
    color: "#666",
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    color: "red",
  },
});

export default DestinationSearch;
