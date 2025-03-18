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

interface DestinationSearchProps {
  onSearch: (searchText: string) => void;
  placeholder?: string;
  onDestinationSelect?: (destinationId: number) => void;
}

const DestinationSearch: React.FC<DestinationSearchProps> = ({
  onSearch,
  placeholder = "Search destinations...",
  onDestinationSelect,
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

  const colors = useColors();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);

  const storeDestination = async (
    name: string,
    location: string,
    latitude: number,
    longitude: number,
  ) => {
    try {
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

      const { data: newDestination, error: insertError } = await supabase
        .from("destination")
        .insert({
          name,
          location,
          latitude,
          longitude,
          rating: 4.6,
          category_id: 1,
          images: [],
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

  const storeDestinationImages = async (
    destinationId: number,
    destinationName: string
  ) => {
    try {
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
      const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
        destinationName
      )}&inputtype=textquery&fields=place_id&key=${placesApiKey}`;

      const searchResponse = await axios.get(searchUrl);

      if (!searchResponse.data.candidates?.[0]?.place_id) {
        console.log(`No place found for: ${destinationName}`);
        return;
      }

      const placeId = searchResponse.data.candidates[0].place_id;
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${placesApiKey}`;
      const detailsResponse = await axios.get(detailsUrl);
      const photos = detailsResponse.data.result?.photos || [];

      const imageUrls = [];
      for (let i = 0; i < Math.min(photos.length, 5); i++) {
        const photoRef = photos[i].photo_reference;
        const imageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${placesApiKey}`;
        imageUrls.push(imageUrl);

      }

      

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

  const handleDestinationSelect = async (data: any, details: any = null) => {
    try {
      setDestination(data.description);
      setProcessingError(null);

      console.log("data ->", data);
      console.log("--------------------------------");
      console.log("details ->", details);
      console.log("--------------------------------");
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

  const handleSearchPress = () => {
    if (destination) {
      onSearch(destination);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
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
              flex: 1,
              zIndex: 9999,
              position: "relative",
            },
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
            listView: {
              position: "absolute",
              top: 45,
              left: 0,
              right: 0,
              backgroundColor: isDark ? "#27272a" : "white",
              borderRadius: 10,
              borderWidth: 1,
              borderColor: inputBorderColor,
              elevation: 5,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              zIndex: 9999,
            },
            row: {
              backgroundColor: isDark ? "#27272a" : "white",
              padding: 13,
              height: 50,
              flexDirection: "row",
            },
            separator: {
              height: 1,
              backgroundColor: isDark ? "#3f3f46" : "#e0e0e0",
            },
            description: {
              color: inputTextColor,
            },
            poweredContainer: {
              display: "none", // This hides the "Powered by Google" section
            },
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
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearchPress}
        >
          <Ionicons name="search" size={20} color={colors.iconColor} />
        </TouchableOpacity>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    position: "relative",
    zIndex: 9999,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    zIndex: 9999,
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderRadius: 23,
    paddingHorizontal: 16,
    fontSize: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
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
