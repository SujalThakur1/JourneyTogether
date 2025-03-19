import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { DestinationsSection } from "@/components/Home/DestinationsSection/index";
import { TopDestinationsSection } from "@/components/Home/TopDestinationsSection/index";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/contexts/ColorContext";
import DestinationSearch from "@/components/Home/DestinationSearch/index";
import SearchResults from "@/components/Home/DestinationSearch/SearchResults";
import { supabase } from "@/lib/supabase";
import axios from "axios";
import { useRouter } from "expo-router";
import NotificationsList from "@/components/Notifications/NotificationsList";
import NotificationBadge from "@/components/Notifications/NotificationBadge";

interface Destination {
  destination_id: number;
  name: string;
  location: string;
  rating: number;
  primary_image: string | null;
  images: string[];
  latitude: number;
  longitude: number;
  category_id: number;
}

export default function DiscoverScreen() {
  const {
    categories,
    isLoading,
    selectedCategory,
    setSelectedCategory,
    notificationCount,
    fetchNotificationCount,
  } = useApp();
  const colors = useColors();
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<Destination[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const router = useRouter();
  const { userDetails, userUpdated, setUserUpdated } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (userDetails === null && !userUpdated) {
      setUserUpdated(true);
    }
  }, [userDetails, userUpdated, setUserUpdated]);

  // Animation setup for loading spinner
  const [spinValue] = useState(new Animated.Value(0));

  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [isLoading]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const handleCloseSearch = () => {
    setShowSearch(false);
    setSearchText("");
    setHasSearched(false);
    setSearchResults([]);
  };

  const handleCategoryPress = (category: any) => {
    setSelectedCategory(category);
  };

  // Function to search destinations from Supabase
  const searchDestinations = async (query: string) => {
    setIsSearching(true);
    setHasSearched(true);

    try {
      // Search for destinations in Supabase that match the query
      const { data, error } = await supabase
        .from("destination")
        .select("*")
        .ilike("name", `%${query}%`)
        .order("rating", { ascending: false })
        .limit(15);

      if (error) {
        console.error("Error searching destinations:", error);
        setSearchResults([]);
        return;
      }

      // If we have results from Supabase, use them
      if (data && data.length > 0) {
        setSearchResults(data);
      } else {
        // If no results from Supabase, try to get from Google Places API
        await searchGooglePlaces(query);
      }
    } catch (error) {
      console.error("Error in searchDestinations:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Function to search Google Places API and add to Supabase
  const searchGooglePlaces = async (query: string) => {
    try {
      // Use Google Places API to search for the destination
      const placesApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

      // First, find the place ID
      const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
        query
      )}&inputtype=textquery&fields=place_id&key=${placesApiKey}`;

      console.log("Google Place API request:", searchUrl);
      const searchResponse = await axios.get(searchUrl);
      console.log("Google Place API response:", searchResponse.data);

      if (!searchResponse.data.candidates?.[0]?.place_id) {
        console.log(`No place found for: ${query}`);
        setSearchResults([]);
        return;
      }

      const placeId = searchResponse.data.candidates[0].place_id;

      // Get place details
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,rating,photos&key=${placesApiKey}`;
      console.log("Google Place Details API request:", detailsUrl);
      const detailsResponse = await axios.get(detailsUrl);
      console.log("Google Place Details API response:", detailsResponse.data);

      const placeDetails = detailsResponse.data.result;

      if (!placeDetails) {
        setSearchResults([]);
        return;
      }

      // Prepare image URLs (up to 5)
      const imageUrls = [];
      const photos = placeDetails.photos || [];
      for (let i = 0; i < Math.min(photos.length, 5); i++) {
        const photoRef = photos[i].photo_reference;
        const imageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${placesApiKey}`;
        imageUrls.push(imageUrl);
      }

      // Store the destination in Supabase
      const { data: newDestination, error } = await supabase
        .from("destination")
        .insert({
          name: placeDetails.name,
          location: placeDetails.formatted_address,
          latitude: placeDetails.geometry.location.lat,
          longitude: placeDetails.geometry.location.lng,
          rating: placeDetails.rating || 0,
          category_id: 1, // Default to category_id 1 (General)
          images: imageUrls,
          primary_image: imageUrls[0] || null,
          created_at: new Date().toISOString(),
        })
        .select("*")
        .single();

      if (error) {
        console.error("Error storing destination:", error);
        setSearchResults([]);
        return;
      }

      // Set the new destination as the first result
      setSearchResults([newDestination]);
    } catch (error) {
      console.error("Error in searchGooglePlaces:", error);
      setSearchResults([]);
    }
  };

  // Handle search from the DestinationSearch component
  const handleSearch = (query: string) => {
    setSearchText(query);
    searchDestinations(query);
  };

  // Refresh notification count when the screen comes into focus
  useEffect(() => {
    fetchNotificationCount();
  }, []);

  // Handle notification icon press
  const handleNotificationPress = () => {
    setShowNotifications(true);
  };

  // Handle notification modal close
  const handleNotificationClose = () => {
    setShowNotifications(false);
    // Refresh the notification count after interaction
    fetchNotificationCount();
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.bgColor }]}
    >
      <View style={styles.header}>
        {!showSearch ? (
          <>
            <Text style={[styles.heading, { color: colors.textColor }]}>
              Discover
            </Text>
            <View style={styles.headerIcons}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setShowSearch(true)}
              >
                <Ionicons name="search" size={24} color={colors.iconColor} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleNotificationPress}
              >
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color={colors.iconColor}
                />
                <NotificationBadge count={notificationCount} />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.searchContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleCloseSearch}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={colors.chevronColor}
              />
            </TouchableOpacity>
            <View style={styles.searchInputContainer}>
              <DestinationSearch
                onSearch={handleSearch}
                placeholder="Search destinations..."
              />
            </View>
          </View>
        )}
      </View>

      {/* Notifications Modal */}
      <NotificationsList
        visible={showNotifications}
        onClose={handleNotificationClose}
      />

      {/* Search Results overlay */}
      {showSearch && hasSearched && (
        <View style={styles.searchResultsOverlay}>
          <SearchResults
            destinations={searchResults}
            isLoading={isSearching}
            onDestinationPress={(destination) => {
              handleCloseSearch();
              // Navigate to the destination
              router.push(`/destination/${destination.destination_id}`);
            }}
          />
        </View>
      )}

      {!showSearch && (
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.category_id}
                style={[
                  styles.categoryButton,
                  { backgroundColor: colors.filterBgColor },
                  selectedCategory?.category_id === category.category_id && {
                    backgroundColor: colors.buttonBgColor,
                  },
                ]}
                onPress={() => handleCategoryPress(category)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    { color: colors.filterTextColor },
                    selectedCategory?.category_id === category.category_id && {
                      color: colors.buttonTextColor,
                    },
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {showSearch && hasSearched ? (
        <View style={styles.contentWhenSearching}>
          {/* We don't need to show search results here anymore as they are in the overlay */}
          <Text
            style={[styles.searchingText, { color: colors.mutedTextColor }]}
          >
            Browse through search results above
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Animated.View
                style={[
                  styles.spinner,
                  {
                    transform: [{ rotate: spin }],
                    borderTopColor: colors.accentColor,
                    borderRightColor: colors.accentColor,
                    borderBottomColor: colors.accentColor,
                    borderLeftColor: `${colors.accentColor}33`, // 20% opacity
                  },
                ]}
              />
              <Text style={[styles.loadingText, { color: colors.textColor }]}>
                Loading Destinations...
              </Text>
            </View>
          ) : (
            <>
              <DestinationsSection />
              <TopDestinationsSection />
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 8,
    zIndex: 999,
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
  },
  headerIcons: {
    flexDirection: "row",
  },
  iconButton: {
    marginLeft: 16,
    padding: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 16,
    zIndex: 50,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  searchInputContainer: {
    flex: 1,
    zIndex: 50,
  },
  searchResultsOverlay: {
    position: "absolute",
    top: 130, // Adjust based on your header height
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.02)",
    zIndex: 40,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  categoriesContainer: {
    paddingHorizontal: 5,
    marginVertical: 12,
    marginHorizontal: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: 200,
  },
  spinner: {
    width: 40,
    height: 40,
    borderWidth: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
  },
  contentWhenSearching: {
    flex: 1,
    alignItems: "center",
    paddingTop: 40,
  },
  searchingText: {
    fontSize: 16,
    opacity: 0.7,
  },
});
