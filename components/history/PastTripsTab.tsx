import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "../../contexts/ColorContext";
import { PAST_TRIPS, MENU_ITEMS } from "./types";
import TripCard from "./TripCard";
import EmptyState from "./EmptyState";
import { useBottomSheet } from "../../app/(tabs)/history";
import { router } from "expo-router";

export default function PastTripsTab() {
  const [showFilter, setShowFilter] = useState(false);
  const colors = useColors();
  const { openBottomSheet } = useBottomSheet();

  const handleExploreTrips = () => {
    router.push("/");
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scrollContent, styles.bottomPadding]}
    >
      <View style={[styles.content, { padding: 20 }]}>
        <View style={[styles.sectionHeader, { marginBottom: 8 }]}>
          <Text style={[styles.sectionTitle, { color: colors.textColor }]}>
            Recent Trips
          </Text>
          <TouchableOpacity onPress={() => setShowFilter(!showFilter)}>
            <View
              style={[
                styles.filterButton,
                { backgroundColor: colors.filterBgColor },
              ]}
            >
              <View style={styles.filterContent}>
                <Ionicons
                  name="funnel-outline"
                  size={16}
                  color={colors.iconColor}
                />
                <Text style={[styles.filterText, { color: colors.textColor }]}>
                  Filter
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {showFilter && (
          <View
            style={[
              styles.filterDropdown,
              { backgroundColor: colors.cardBgColor },
            ]}
          >
            {MENU_ITEMS.map((item, index) => (
              <TouchableOpacity key={index} style={styles.filterItem}>
                <Ionicons name={item.icon} size={16} color={colors.iconColor} />
                <Text
                  style={[styles.filterItemText, { color: colors.textColor }]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {PAST_TRIPS?.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}

        <EmptyState
          icon="boat-outline"
          title="Looking for More Adventures?"
          description="Explore our curated trips and create unforgettable memories"
          buttonText="Explore Trips"
          onButtonPress={handleExploreTrips}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  content: {},
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
  },
  filterContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterText: {
    fontSize: 14,
    marginLeft: 4,
  },
  filterDropdown: {
    position: "absolute",
    top: 40,
    right: 0,
    padding: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  filterItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  filterItemText: {
    marginLeft: 8,
    fontSize: 14,
  },
  bottomPadding: {
    paddingBottom: 45,
  },
});
