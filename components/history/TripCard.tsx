import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Trip } from "./types";
import { useColors } from "../../contexts/ColorContext";
import { useRouter } from "expo-router";
import { useBottomSheet } from "../../app/(tabs)/history";

interface TripCardProps {
  trip: Trip;
}

export default function TripCard({ trip }: TripCardProps) {
  const colors = useColors();
  const router = useRouter();
  const { openBottomSheet } = useBottomSheet();

  const handleCreateGroup = () => {
    openBottomSheet(trip.name, trip.id);
  };

  const handleViewDetails = () => {
    // Navigate to a details page with the trip ID
    router.push(`/destination/${trip.id}`);
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.cardBgColor,
          borderColor: colors.borderColor,
        },
      ]}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text
            style={[
              styles.statusBadge,
              {
                backgroundColor: "#DCFCE7",
                color: "#15803D",
              },
            ]}
          >
            {trip.status}
          </Text>
        </View>

        <View style={[styles.cardBody, { marginTop: 12 }]}>
          <Image source={{ uri: trip.primary_image }} style={styles.avatar} />
          <View style={styles.tripDetails}>
            <Text style={[styles.tripTitle, { color: colors.textColor }]}>
              {trip.name}
            </Text>
            <Text style={{ color: colors.mutedTextColor }}>
              <Ionicons name="location-outline" size={14} /> {trip.location}
            </Text>
            <View style={[styles.tags, { marginTop: 4 }]}>
              {trip.tags.map((tag, index) => (
                <Text
                  key={index}
                  style={[
                    styles.tag,
                    {
                      borderColor: index === 0 ? "#3B82F6" : "#F97316",
                      color: index === 0 ? "#3B82F6" : "#F97316",
                    },
                  ]}
                >
                  {tag}
                </Text>
              ))}
            </View>
          </View>
        </View>

        <View
          style={[styles.divider, { backgroundColor: colors.borderColor }]}
        />

        <View style={styles.cardFooter}>
          <TouchableOpacity onPress={handleCreateGroup}>
            <View style={styles.actionLink}>
              <Ionicons
                name="people-outline"
                size={16}
                color={colors.iconColor}
              />
              <Text style={[styles.actionText, { color: "#F97316" }]}>
                Create Group
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleViewDetails}>
            <View style={styles.detailsLink}>
              <Ionicons
                name="document-text-outline"
                size={16}
                color={colors.iconColor}
              />
              <Text style={[styles.detailsText, { color: "#3B82F6" }]}>
                View Details
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// Styles remain the same
const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
  },
  cardBody: {
    flexDirection: "row",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 12,
  },
  tripDetails: {
    flex: 1,
  },
  tripTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  tags: {
    flexDirection: "row",
  },
  tag: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    fontSize: 12,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between", // Changed to space-between for two buttons
    alignItems: "center",
  },
  actionLink: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionText: {
    marginLeft: 4,
    fontSize: 14,
  },
  detailsLink: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailsText: {
    marginLeft: 4,
    fontSize: 14,
  },
});
