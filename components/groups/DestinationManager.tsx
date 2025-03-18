import React, { useState } from "react";
import { View, StyleSheet, Text, ActivityIndicator } from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { supabase } from "../../lib/supabase";
import axios from "axios";
import { useGroups } from "../../contexts/GroupsContext";

interface DestinationManagerProps {
  onDestinationSelect?: (destinationId: number) => void;
  placeholder?: string;
  label?: string;
  helperText?: string;
}

const DestinationManager: React.FC<DestinationManagerProps> = ({
  onDestinationSelect,
  placeholder = "Enter destination",
  label = "Destination",
  helperText,
}) => {
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

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);

  // Function to store destination in Supabase
  const storeDestination = async (
    name: string,
    location: string,
    latitude: number,
    longitude: number,
    rating: number = 0
  ) => {
    try {
      // First check if destination already exists
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

      // If destination exists, return its ID
      if (existingDestinations && existingDestinations.length > 0) {
        console.log("Destination already exists:", existingDestinations[0]);
        return existingDestinations[0].destination_id;
      }

      // Otherwise, insert new destination
      const { data: newDestination, error: insertError } = await supabase
        .from("destination")
        .insert({
          name,
          location,
          latitude,
          longitude,
          rating,
          category_id: 1, // Default to category_id 1 (General)
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

  // Function to fetch and store images for a destination in the images array
  const storeDestinationImages = async (
    destinationId: number,
    destinationName: string
  ) => {
    try {
      // Check if destination already has images
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
        console.log(
          `Destination ${destinationName} already has ${existingDestination.images.length} images. Skipping.`
        );
        return;
      }

      // Fetch place ID from Google Places API
      const placesApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
      const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
        destinationName
      )}&inputtype=textquery&fields=place_id&key=${placesApiKey}`;

      console.log("Google Place Api Key has been used");
      const searchResponse = await axios.get(searchUrl);
      if (!searchResponse.data.candidates?.[0]?.place_id) {
        console.log(`No place found for: ${destinationName}`);
        return;
      }

      const placeId = searchResponse.data.candidates[0].place_id;

      // Get place details including photos
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${placesApiKey}`;
      const detailsResponse = await axios.get(detailsUrl);
      const photos = detailsResponse.data.result?.photos || [];

      // Prepare image URLs (up to 5)
      const imageUrls = [];
      for (let i = 0; i < Math.min(photos.length, 5); i++) {
        const photoRef = photos[i].photo_reference;
        const imageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${placesApiKey}`;
        imageUrls.push(imageUrl);
      }

      // Update the destination with the images array
      const { error: updateError } = await supabase
        .from("destination")
        .update({
          images: imageUrls,
          primary_image: imageUrls[0] || null, // Set first image as primary
        })
        .eq("destination_id", destinationId);

      if (updateError) {
        throw new Error(`Error updating images: ${updateError.message}`);
      }

      console.log(`Stored ${imageUrls.length} images for ${destinationName}`);
    } catch (error) {
      console.error(`Error processing images for ${destinationName}:`, error);
      // Continue even if image processing fails
    }
  };

  // Handle destination selection
  const handleDestinationSelect = async (data: any, details: any = null) => {
    try {
      console.log("Selected destination:", data.description);
      setDestination(data.description);
      setProcessingError(null);

      if (details?.geometry?.location) {
        console.log("Coordinates:", details.geometry.location);
        const coordinates = {
          latitude: details.geometry.location.lat,
          longitude: details.geometry.location.lng,
        };
        setDestinationCoordinates(coordinates);

        // Start processing destination data
        setIsProcessing(true);

        // Store destination in database
        const destinationId = await storeDestination(
          data.description,
          details.formatted_address || data.description,
          coordinates.latitude,
          coordinates.longitude,
          details.rating || 0
        );

        // Store destination images
        await storeDestinationImages(destinationId, data.description);

        // Call the callback with the destination ID
        if (onDestinationSelect) {
          onDestinationSelect(destinationId);
        }
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

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      <View style={styles.autocompleteContainer}>
        <GooglePlacesAutocomplete
          placeholder={placeholder}
          onPress={handleDestinationSelect}
          query={{
            key: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
            language: "en",
          }}
          fetchDetails={true}
          styles={{
            container: {
              flex: 0,
              zIndex: 20,
            },
            textInput: {
              ...styles.input,
              backgroundColor: isDark ? "#27272a" : "white",
              borderColor:
                focusedInput === "destination"
                  ? focusedBorderColor
                  : inputBorderColor,
              color: inputTextColor,
            },
            listView: {
              backgroundColor: isDark ? "#27272a" : "white",
              borderWidth: 1,
              borderColor: inputBorderColor,
              borderRadius: 8,
              position: "absolute",
              bottom: 45,
              left: 0,
              right: 0,
              zIndex: 20,
            },
            row: {
              backgroundColor: isDark ? "#27272a" : "white",
              padding: 13,
            },
            description: {
              color: inputTextColor,
            },
            separator: {
              height: 1,
              backgroundColor: isDark ? "#3f3f46" : "#e5e5e5",
            },
          }}
          textInputProps={{
            onFocus: () => setFocusedInput("destination"),
            onBlur: () => setFocusedInput(null),
            selectionColor: inputTextColor,
            placeholderTextColor: "gray",
            value: destination,
            onChangeText: setDestination,
          }}
          enablePoweredByContainer={false}
          debounce={300}
          minLength={2}
          keyboardShouldPersistTaps="handled"
          listViewDisplayed="auto"
          disableScroll={true}
        />
      </View>

      {isProcessing && (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="small" color="#0000ff" />
          <Text style={styles.processingText}>Processing destination...</Text>
        </View>
      )}

      {processingError && (
        <Text style={styles.errorText}>{processingError}</Text>
      )}

      {helperText && !processingError && !isProcessing && (
        <Text
          style={[
            styles.helperText,
            { color: isDark ? "gray.400" : "gray.600" },
          ]}
        >
          {helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  autocompleteContainer: {
    zIndex: 20,
    position: "relative",
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
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

export default DestinationManager;
