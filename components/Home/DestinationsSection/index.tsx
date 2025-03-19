import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
} from "react-native";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/contexts/ColorContext";
import { useRouter } from "expo-router";

// Function to create styles using colors from context
export const createStyles = (colors: any) =>
  StyleSheet.create({
    destinationsContainer: {
      paddingHorizontal: 16,
      marginBottom: 16,
      backgroundColor: colors.bgColor,
    },
    horizontalScroll: {
      paddingVertical: 8,
    },
    destinationCard: {
      width: 250,
      marginRight: 16,
      borderRadius: 40,
      overflow: "hidden",
      backgroundColor: "transparent",
      elevation: 0,
      shadowColor: colors.textColor, // Using textColor for shadow for better contrast
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
    },
    destinationImage: {
      width: "100%",
      height: 400,
    },
    detailsContainer: {
      flex: 1,
      justifyContent: "flex-end",
    },
    detailsOverlay: {
      backgroundColor: colors.isDark
        ? `${colors.cardBgColor}D9` // 85% opacity in hex (D9 ≈ 0.85)
        : `${colors.cardBgColor}D9`,
      paddingBottom: 12,
      paddingTop: 12,
      paddingLeft: 24,
      borderRadius: 30,
      marginBottom: 20,
      marginLeft: 12,
      marginRight: 12,
      marginTop: 12,
    },
    destinationNameOverlay: {
      opacity: 1,
      fontSize: 18,
      fontWeight: "600",
      color: colors.textColor,
    },
    destinationLocationOverlay: {
      opacity: 1,
      fontSize: 14,
      color: colors.mutedTextColor,
      marginTop: 4,
    },
    destinationRatingOverlay: {
      opacity: 1,
      fontSize: 14,
      color: colors.textColor,
      marginTop: 4,
    },
    loadingText: {
      fontSize: 16,
      color: colors.textColor,
    },
  });

export const DestinationsSection = () => {
  const { destinations, isLoading } = useApp();
  const colors = useColors();
  const router = useRouter();
  const styles = createStyles(colors);

  const handleDestinationPress = (destinationId: number) => {
    console.log("Destination pressed:", destinationId);
    router.push(`/destination/${destinationId}`);
  };

  if (isLoading) {
    return (
      <View style={styles.destinationsContainer}>
        <Text style={styles.loadingText}>Loading destinations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.destinationsContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalScroll}
      >
        {destinations.map((destination) => (
          <TouchableOpacity
            key={destination.destination_id}
            style={styles.destinationCard}
            onPress={() => handleDestinationPress(destination.destination_id)}
          >
            <ImageBackground
              source={{
                uri: destination.destinationimages?.[0]?.image_url,
              }}
              style={styles.destinationImage}
            >
              <View style={styles.detailsContainer}>
                <View style={styles.detailsOverlay}>
                  <Text style={styles.destinationNameOverlay}>
                    {destination.name}
                  </Text>
                  <Text style={styles.destinationLocationOverlay}>
                    {destination.location}
                  </Text>
                  <Text style={styles.destinationRatingOverlay}>
                    <Text style={{ color: colors.accentColor, opacity: 1 }}>
                      ★
                    </Text>{" "}
                    {destination.rating}
                  </Text>
                </View>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

// For backward compatibility, export default light mode styles
const dummyColors = {
  bgColor: "white",
  textColor: "#1F2937",
  mutedTextColor: "#6B7280",
  cardBgColor: "#F9FAFB",
  isDark: false,
  accentColor: "#ED851B",
};
export const styles = createStyles(dummyColors);

export default DestinationsSection;
