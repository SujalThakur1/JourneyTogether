import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from "react-native";
import { useGroups } from "../../contexts/GroupsContext";
import MapView, { Marker } from "react-native-maps";

// Define the expected structure of the destination object
interface Destination {
  destination_id: number;
  category_id: number;
  name: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  created_at: string | null;
  images: string[]; // Array of image URLs
  primary_image: string | null;
}

interface DestinationDetailsProps {
  destinationId: number;
}

const DestinationDetails: React.FC<DestinationDetailsProps> = ({
  destinationId,
}) => {
  const { fetchDestinationDetails, textColor, isDark } = useGroups();
  const [destination, setDestination] = useState<Destination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDestinationDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const details = await fetchDestinationDetails(destinationId);
        setDestination(details);
      } catch (err) {
        console.error("Error loading destination details:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load destination details"
        );
      } finally {
        setLoading(false);
      }
    };

    if (destinationId) {
      loadDestinationDetails();
    }
  }, [destinationId, fetchDestinationDetails]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={[styles.loadingText, { color: textColor }]}>
          Loading destination details...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: "red" }]}>{error}</Text>
      </View>
    );
  }

  if (!destination) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: textColor }]}>
          No destination information available
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDark ? "#1a1a1a" : "#fff" },
      ]}
    >
      <Text style={[styles.title, { color: textColor }]}>
        {destination.name}
      </Text>

      {destination.location && (
        <Text style={[styles.location, { color: textColor }]}>
          {destination.location}
        </Text>
      )}

      {destination.rating !== null && destination.rating > 0 && (
        <View style={styles.ratingContainer}>
          <Text style={[styles.rating, { color: textColor }]}>
            Rating: {destination.rating.toFixed(1)}
          </Text>
        </View>
      )}

      {/* Display destination images */}
      {destination.images && destination.images.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.imageScrollView}
        >
          {destination.images.map((imageUrl: string, index: number) => (
            <Image
              key={index}
              source={{ uri: imageUrl }} // Use the string directly
              style={styles.image}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      )}

      {/* Display map with destination marker */}
      {destination.latitude && destination.longitude && (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: destination.latitude,
              longitude: destination.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          >
            <Marker
              coordinate={{
                latitude: destination.latitude,
                longitude: destination.longitude,
              }}
              title={destination.name}
            />
          </MapView>
        </View>
      )}
    </ScrollView>
  );
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  location: {
    fontSize: 16,
    marginBottom: 16,
  },
  ratingContainer: {
    marginBottom: 16,
  },
  rating: {
    fontSize: 16,
    fontWeight: "bold",
  },
  imageScrollView: {
    marginBottom: 16,
  },
  image: {
    width: width * 0.8,
    height: 200,
    borderRadius: 8,
    marginRight: 8,
  },
  mapContainer: {
    height: 200,
    marginBottom: 16,
    borderRadius: 8,
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
});

export default DestinationDetails;
