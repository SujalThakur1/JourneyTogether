import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { useColors } from "../../contexts/ColorContext";

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

interface SearchResultsProps {
  destinations: Destination[];
  isLoading: boolean;
  onDestinationPress?: (destination: Destination) => void;
  emptyMessage?: string;
  isRecommended?: boolean;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  destinations,
  isLoading,
  onDestinationPress,
  emptyMessage = "No destinations found",
  isRecommended = false,
}) => {
  const colors = useColors();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accentColor} />
        <Text style={[styles.loadingText, { color: colors.textColor }]}>
          Searching destinations...
        </Text>
      </View>
    );
  }

  if (destinations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textColor }]}>
          {emptyMessage}
        </Text>
        <Text
          style={[styles.recommendedText, { color: colors.mutedTextColor }]}
        >
          Try searching for popular destinations like "Paris", "New York", or
          "Tokyo"
        </Text>
      </View>
    );
  }

  const renderItem = ({
    item,
    index,
  }: {
    item: Destination;
    index: number;
  }) => (
    <TouchableOpacity
      style={[
        styles.destinationItem,
        {
          backgroundColor: colors.cardBgColor,
          borderColor: colors.borderColor,
        },
      ]}
      onPress={() => onDestinationPress && onDestinationPress(item)}
    >
      {index === 0 && !isRecommended && (
        <View style={[styles.badge, { backgroundColor: colors.accentColor }]}>
          <Text style={styles.badgeText}>Best Match</Text>
        </View>
      )}
      <Image
        source={{
          uri: item.primary_image || "https://via.placeholder.com/100",
        }}
        style={styles.destinationImage}
      />
      <View style={styles.destinationInfo}>
        <Text
          style={[styles.destinationName, { color: colors.textColor }]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text
          style={[styles.destinationLocation, { color: colors.mutedTextColor }]}
          numberOfLines={1}
        >
          {item.location}
        </Text>
        <View style={styles.ratingContainer}>
          <Text style={[styles.ratingText, { color: colors.accentColor }]}>
            ★
          </Text>
          <Text style={[styles.ratingValue, { color: colors.textColor }]}>
            {item.rating.toFixed(1)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {isRecommended ? (
        <Text style={[styles.recommendedHeader, { color: colors.textColor }]}>
          Recommended Destinations
        </Text>
      ) : destinations.length > 1 ? (
        <Text style={[styles.recommendedHeader, { color: colors.textColor }]}>
          Similar Destinations
        </Text>
      ) : null}
      <FlatList
        data={destinations}
        renderItem={renderItem}
        keyExtractor={(item) => item.destination_id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  recommendedHeader: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  recommendedText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  badge: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  listContainer: {
    paddingVertical: 16,
  },
  destinationItem: {
    flexDirection: "row",
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
  },
  destinationImage: {
    width: 100,
    height: 100,
    resizeMode: "cover",
  },
  destinationInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  destinationName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  destinationLocation: {
    fontSize: 14,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 16,
    marginRight: 4,
  },
  ratingValue: {
    fontSize: 14,
  },
  loadingContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
  },
});

export default SearchResults;
