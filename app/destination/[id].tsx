import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  FlatList,
  Animated,
  Share,
  Alert,
  Platform,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
  FontAwesome,
} from "@expo/vector-icons";
import { useColors } from "@/contexts/ColorContext";
import { useApp } from "@/contexts/AppContext";
import { useGroups } from "@/contexts/GroupsContext";
import { supabase } from "@/lib/supabase";
import MapView, { Marker } from "react-native-maps";
import { ToastManager } from "@/components/ui/toast";
import CreateGroupBottomSheet from "@/components/Sheet/bottomSheet";
import { getPlaceDetailsByName, PlaceDetails } from "@/lib/placesService";

const { width } = Dimensions.get("window");

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

export default function DestinationDetail() {
  const { id } = useLocalSearchParams();
  const colors = useColors();
  const router = useRouter();
  const { userDetails, setUserUpdated } = useApp();
  const { setDestinationId, setDestination: setContextDestination } =
    useGroups();

  // Rename local state to avoid conflict
  const [destinationData, setDestinationData] = useState<Destination | null>(
    null
  );
  const [placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [showBottomSheet, setShowBottomSheet] = useState(false);

  useEffect(() => {
    fetchDestinationDetails();
    checkIfSaved();
  }, [id]);

  useEffect(() => {
    if (destinationData) {
      fetchPlaceDetails();
    }
  }, [destinationData]);

  const fetchDestinationDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("destination")
        .select("*")
        .eq("destination_id", id)
        .single();

      if (error) {
        console.error("Error fetching destination:", error);
        return;
      }

      setDestinationData(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlaceDetails = async () => {
    if (!destinationData) return;
    setPlacesLoading(true);

    try {
      const details = await getPlaceDetailsByName(
        destinationData.name,
        destinationData.location
      );

      if (details) {
        setPlaceDetails(details);
      }
    } catch (error) {
      console.error("Error fetching place details:", error);
    } finally {
      setPlacesLoading(false);
    }
  };

  const checkIfSaved = async () => {
    if (!userDetails) return;

    try {
      const { data, error } = await supabase
        .from("users")
        .select("savedtrips")
        .eq("id", userDetails.id)
        .single();

      if (error) {
        console.error("Error checking saved trips:", error);
        return;
      }

      const savedTrips = data.savedtrips || [];
      setIsSaved(savedTrips.includes(Number(id)));
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const toggleSaveDestination = async () => {
    if (!userDetails) {
      ToastManager.show({
        message: "Please sign in to save destinations",
        type: "warning",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("users")
        .select("savedtrips")
        .eq("id", userDetails.id)
        .single();

      if (error) {
        console.error("Error fetching saved trips:", error);
        return;
      }

      let savedTrips = data.savedtrips || [];

      if (isSaved) {
        savedTrips = savedTrips.filter(
          (tripId: number) => tripId !== Number(id)
        );
      } else {
        savedTrips.push(Number(id));
      }

      const { error: updateError } = await supabase
        .from("users")
        .update({ savedtrips: savedTrips })
        .eq("id", userDetails.id);

      if (updateError) {
        console.error("Error updating saved trips:", updateError);
        return;
      }

      setIsSaved(!isSaved);
      setUserUpdated(true);

      ToastManager.show({
        message: isSaved
          ? "This destination has been removed from your saved trips"
          : "This destination has been added to your saved trips",
        type: isSaved ? "info" : "success",
      });
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleCreateGroup = () => {
    if (!destinationData) return;
    setShowBottomSheet(true);
  };

  const shareDestination = async () => {
    if (!destinationData) return;

    try {
      await Share.share({
        message: `Check out ${destinationData.name} on Journey! It's an amazing destination in ${destinationData.location}.`,
        title: `Journey - ${destinationData.name}`,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const openWebsite = (url: string) => {
    Linking.openURL(url).catch((err) => {
      console.error("Error opening URL:", err);
      ToastManager.show({
        message: "Could not open website",
        type: "error",
      });
    });
  };

  const callPhoneNumber = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`).catch((err) => {
      console.error("Error opening phone:", err);
      ToastManager.show({
        message: "Could not make phone call",
        type: "error",
      });
    });
  };

  if (loading) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: colors.bgColor }]}
      >
        <ActivityIndicator size="large" color={colors.accentColor} />
        <Text style={[styles.loadingText, { color: colors.textColor }]}>
          Loading destination details...
        </Text>
      </View>
    );
  }

  if (!destinationData) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: colors.bgColor }]}
      >
        <Text style={[styles.errorText, { color: colors.textColor }]}>
          Destination not found
        </Text>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.accentColor }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bgColor }]}>
      <StatusBar style={colors.isDark ? "light" : "dark"} />

      {/* Header with back button and actions */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.cardBgColor }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textColor} />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.cardBgColor }]}
            onPress={shareDestination}
          >
            <Ionicons name="share-outline" size={24} color={colors.textColor} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.cardBgColor }]}
            onPress={toggleSaveDestination}
          >
            <Ionicons
              name={isSaved ? "bookmark" : "bookmark-outline"}
              size={24}
              color={isSaved ? colors.accentColor : colors.textColor}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Image Gallery */}
        <View style={styles.imageGalleryContainer}>
          <FlatList
            data={
              // Use Google Places photos if available, otherwise fall back to the destination images
              placeDetails &&
              placeDetails.photos &&
              placeDetails.photos.length > 0
                ? placeDetails.photos
                : destinationData.images && destinationData.images.length > 0
                ? destinationData.images
                : [destinationData.primary_image]
            }
            keyExtractor={(item, index) => `image-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            onMomentumScrollEnd={(event) => {
              const newIndex = Math.round(
                event.nativeEvent.contentOffset.x / width
              );
              setActiveImageIndex(newIndex);
            }}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item || "" }}
                style={styles.galleryImage}
                resizeMode="cover"
              />
            )}
          />

          {/* Pagination dots */}
          <View style={styles.paginationContainer}>
            {(placeDetails &&
            placeDetails.photos &&
            placeDetails.photos.length > 0
              ? placeDetails.photos
              : destinationData.images && destinationData.images.length > 0
              ? destinationData.images
              : [destinationData.primary_image]
            ).map((_, index) => {
              const inputRange = [
                (index - 1) * width,
                index * width,
                (index + 1) * width,
              ];

              const dotWidth = scrollX.interpolate({
                inputRange,
                outputRange: [8, 16, 8],
                extrapolate: "clamp",
              });

              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.4, 1, 0.4],
                extrapolate: "clamp",
              });

              return (
                <Animated.View
                  key={`dot-${index}`}
                  style={[
                    styles.dot,
                    {
                      width: dotWidth,
                      opacity,
                      backgroundColor: colors.accentColor,
                    },
                  ]}
                />
              );
            })}
          </View>
        </View>

        {/* Destination Info */}
        <View
          style={[
            styles.infoContainer,
            { backgroundColor: colors.cardBgColor },
          ]}
        >
          {/* Title and Rating */}
          <View style={styles.titleRow}>
            <View>
              <Text
                style={[styles.destinationName, { color: colors.textColor }]}
              >
                {destinationData.name}
              </Text>
              <Text
                style={[
                  styles.destinationLocation,
                  { color: colors.mutedTextColor },
                ]}
              >
                {placeDetails?.address || destinationData.location}
              </Text>
            </View>

            <View style={styles.ratingContainer}>
              <Text style={[styles.ratingText, { color: colors.textColor }]}>
                <Text style={{ color: colors.accentColor }}>★</Text>{" "}
                {placeDetails?.rating || destinationData.rating}
              </Text>
            </View>
          </View>

          {/* Contact Information */}
          {(placeDetails?.website) && (
            <View style={styles.contactContainer}>
              {placeDetails?.website && (
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => openWebsite(placeDetails.website || "")}
                >
                  <FontAwesome
                    name="globe"
                    size={16}
                    color={colors.accentColor}
                  />
                  <Text
                    style={[styles.contactText, { color: colors.accentColor }]}
                  >
                    Website
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Google Places Loading Indicator */}
          {placesLoading && (
            <View style={styles.placesLoadingContainer}>
              <ActivityIndicator size="small" color={colors.accentColor} />
              <Text
                style={[
                  styles.placesLoadingText,
                  { color: colors.mutedTextColor },
                ]}
              >
                Fetching Google Places data...
              </Text>
            </View>
          )}

          {/* Description */}
          {placeDetails?.description && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textColor }]}>
                About
              </Text>
              <Text
                style={[
                  styles.descriptionText,
                  { color: colors.mutedTextColor },
                ]}
              >
                {placeDetails.description}
              </Text>
            </View>
          )}

          {/* Opening Hours */}
          {placeDetails?.openingHours &&
            placeDetails.openingHours.length > 0 && (
              <View style={styles.section}>
                <Text
                  style={[styles.sectionTitle, { color: colors.textColor }]}
                >
                  Opening Hours
                </Text>
                {placeDetails.openingHours.map((hours, index) => (
                  <Text
                    key={`hours-${index}`}
                    style={[styles.hoursText, { color: colors.mutedTextColor }]}
                  >
                    {hours}
                  </Text>
                ))}
              </View>
            )}

          {/* Activities */}
          {placeDetails?.activities && placeDetails.activities.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textColor }]}>
                Activities
              </Text>
              <View style={styles.activitiesContainer}>
                {placeDetails.activities.map((activity, index) => (
                  <View
                    key={`activity-${index}`}
                    style={[
                      styles.activityTag,
                      { backgroundColor: `${colors.accentColor}20` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.activityText,
                        { color: colors.accentColor },
                      ]}
                    >
                      {activity}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Additional Info */}
          {(placeDetails?.bestTimeToVisit ||
            placeDetails?.averageCost ||
            placeDetails?.difficulty ||
            placeDetails?.duration) && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textColor }]}>
                Travel Information
              </Text>

              <View style={styles.infoRow}>
                {placeDetails?.bestTimeToVisit && (
                  <View style={styles.infoItem}>
                    <MaterialIcons
                      name="calendar-today"
                      size={20}
                      color={colors.accentColor}
                    />
                    <View style={styles.infoTextContainer}>
                      <Text
                        style={[
                          styles.infoLabel,
                          { color: colors.mutedTextColor },
                        ]}
                      >
                        Best Time
                      </Text>
                      <Text
                        style={[styles.infoValue, { color: colors.textColor }]}
                      >
                        {placeDetails.bestTimeToVisit}
                      </Text>
                    </View>
                  </View>
                )}

                {placeDetails?.averageCost && (
                  <View style={styles.infoItem}>
                    <MaterialIcons
                      name="attach-money"
                      size={20}
                      color={colors.accentColor}
                    />
                    <View style={styles.infoTextContainer}>
                      <Text
                        style={[
                          styles.infoLabel,
                          { color: colors.mutedTextColor },
                        ]}
                      >
                        Average Cost
                      </Text>
                      <Text
                        style={[styles.infoValue, { color: colors.textColor }]}
                      >
                        {placeDetails.averageCost}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.infoRow}>
                {placeDetails?.difficulty && (
                  <View style={styles.infoItem}>
                    <FontAwesome5
                      name="hiking"
                      size={20}
                      color={colors.accentColor}
                    />
                    <View style={styles.infoTextContainer}>
                      <Text
                        style={[
                          styles.infoLabel,
                          { color: colors.mutedTextColor },
                        ]}
                      >
                        Difficulty
                      </Text>
                      <Text
                        style={[styles.infoValue, { color: colors.textColor }]}
                      >
                        {placeDetails.difficulty}
                      </Text>
                    </View>
                  </View>
                )}

                {placeDetails?.duration && (
                  <View style={styles.infoItem}>
                    <MaterialIcons
                      name="timer"
                      size={20}
                      color={colors.accentColor}
                    />
                    <View style={styles.infoTextContainer}>
                      <Text
                        style={[
                          styles.infoLabel,
                          { color: colors.mutedTextColor },
                        ]}
                      >
                        Duration
                      </Text>
                      <Text
                        style={[styles.infoValue, { color: colors.textColor }]}
                      >
                        {placeDetails.duration}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Local Tips */}
          {placeDetails?.localTips && placeDetails.localTips.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textColor }]}>
                Local Tips
              </Text>
              {placeDetails.localTips.map((tip, index) => (
                <View key={`tip-${index}`} style={styles.tipContainer}>
                  <MaterialIcons
                    name="format-quote"
                    size={20}
                    color={colors.accentColor}
                  />
                  <Text
                    style={[styles.tipText, { color: colors.mutedTextColor }]}
                  >
                    {tip}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Reviews */}
          {placeDetails?.reviews && placeDetails.reviews.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textColor }]}>
                Reviews
              </Text>
              {placeDetails.reviews.slice(0, 3).map((review, index) => (
                <View key={`review-${index}`} style={styles.reviewContainer}>
                  <View style={styles.reviewHeader}>
                    <Text
                      style={[styles.reviewAuthor, { color: colors.textColor }]}
                    >
                      {review.authorName}
                    </Text>
                    <View style={styles.reviewRating}>
                      <Text style={{ color: colors.accentColor }}>
                        {"★".repeat(Math.floor(review.rating))}
                        <Text style={{ color: colors.mutedTextColor }}>
                          {"★".repeat(5 - Math.floor(review.rating))}
                        </Text>
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.reviewText,
                      { color: colors.mutedTextColor },
                    ]}
                  >
                    {review.text}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Map */}
          {destinationData.latitude && destinationData.longitude && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textColor }]}>
                Location
              </Text>
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: destinationData.latitude,
                    longitude: destinationData.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                >
                  <Marker
                    coordinate={{
                      latitude: destinationData.latitude,
                      longitude: destinationData.longitude,
                    }}
                    title={destinationData.name}
                  />
                </MapView>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Button */}
      <View style={[styles.bottomBar, { backgroundColor: colors.cardBgColor }]}>
        <TouchableOpacity
          style={[
            styles.createGroupButton,
            { backgroundColor: colors.accentColor },
          ]}
          onPress={handleCreateGroup}
        >
          <Ionicons name="people" size={20} color="#FFFFFF" />
          <Text style={styles.createGroupButtonText}>Create Group Trip</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet */}
      {destinationData && (
        <CreateGroupBottomSheet
          isVisible={showBottomSheet}
          onClose={() => setShowBottomSheet(false)}
          destinationName={destinationData.name}
          destinationId={destinationData.destination_id}
          maxHeight={Platform.OS === "ios" ? 750 : 550}
          mb={20}
        />
      )}
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 10,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerActions: {
    flexDirection: "row",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageGalleryContainer: {
    height: 400,
    width: "100%",
  },
  galleryImage: {
    width,
    height: 400,
  },
  paginationContainer: {
    flexDirection: "row",
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  infoContainer: {
    marginTop: -30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  destinationName: {
    fontSize: 24,
    fontWeight: "700",
  },
  destinationLocation: {
    fontSize: 16,
    marginTop: 4,
  },
  contactContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  contactText: {
    marginLeft: 6,
    fontWeight: "500",
  },
  placesLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: 8,
  },
  placesLoadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 18,
    fontWeight: "600",
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
  },
  hoursText: {
    fontSize: 14,
    lineHeight: 22,
  },
  activitiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  activityTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  activityText: {
    fontSize: 14,
    fontWeight: "500",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
  },
  infoTextContainer: {
    marginLeft: 10,
  },
  infoLabel: {
    fontSize: 12,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 2,
  },
  mapContainer: {
    height: 200,
    borderRadius: 16,
    overflow: "hidden",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  createGroupButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  createGroupButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
  tipContainer: {
    flexDirection: "row",
    marginBottom: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
    padding: 12,
    borderRadius: 8,
    alignItems: "flex-start",
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
    marginLeft: 8,
    fontStyle: "italic",
  },
  reviewContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: 8,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  reviewAuthor: {
    fontWeight: "600",
    fontSize: 14,
  },
  reviewRating: {
    flexDirection: "row",
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
