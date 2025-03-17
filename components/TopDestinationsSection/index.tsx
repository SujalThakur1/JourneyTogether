import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
} from "react-native";
import { useApp } from "../../contexts/AppContext";
import { useColors } from "../../contexts/ColorContext"; // Updated import
import { useRouter } from "expo-router";

export const TopDestinationsSection = () => {
  const { topDestinations, isLoading } = useApp();
  const colors = useColors(); // Use the color context
  const router = useRouter();

  const handleDestinationPress = (destinationId: number) => {
    router.push(`/destination/${destinationId}`);
  };

  if (topDestinations.length === 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.topDestinationsContainer,
        { backgroundColor: colors.bgColor },
      ]}
    >
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textColor }]}>
          Top Destinations
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalScroll}
      >
        {topDestinations.map((destination) => (
          <TouchableOpacity
            key={destination.destination_id}
            style={[
              styles.topDestinationCard,
              { backgroundColor: colors.cardBgColor },
            ]}
            onPress={() => handleDestinationPress(destination.destination_id)}
          >
            <ImageBackground
              source={{ uri: destination.destinationimages?.[0]?.image_url }}
              style={styles.topDestinationImage}
            >
              <View
                style={[
                  styles.textContainer,
                  {
                    backgroundColor: colors.isDark
                      ? "rgba(39, 39, 42, 0.85)" // Using cardBgColor with opacity
                      : "rgba(249, 250, 251, 0.85)",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.topDestinationName,
                    { color: colors.textColor },
                  ]}
                >
                  {destination.name}
                </Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  topDestinationsContainer: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  horizontalScroll: {
    paddingVertical: 8,
  },
  topDestinationCard: {
    width: 200,
    marginRight: 16,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  topDestinationImage: {
    width: "100%",
    height: 150,
    borderRadius: 12,
    justifyContent: "flex-end",
  },
  textContainer: {
    padding: 8,
    margin: 8,
    borderRadius: 8,
  },
  topDestinationName: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default TopDestinationsSection;
