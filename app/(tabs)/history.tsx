import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorModeContext } from "../../contexts/ColorModeContext";
import { useColors } from "../../contexts/ColorContext";

interface Trip {
  id: number;
  status: string;
  date: string;
  image: string;
  title: string;
  location: string;
  tags: string[];
  participants: number;
}

const PAST_TRIPS: Trip[] | null = [
  {
    id: 1,
    status: "Completed",
    date: "March 15, 2024",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
    title: "Beach Paradise Tour",
    location: "Miami Beach, FL",
    tags: ["Beach", "Adventure"],
    participants: 4,
  },
  {
    id: 2,
    status: "Completed",
    date: "March 15, 2024",
    image:
      "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&q=80&w=600",
    title: "Beach Paradise Tour",
    location: "Miami Beach, FL",
    tags: ["Beach", "Adventure"],
    participants: 4,
  },
];

const MENU_ITEMS = [
  { icon: "calendar-outline" as const, label: "Date Range" },
  { icon: "checkmark-circle-outline" as const, label: "Status" },
];

export default function HistoryScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const [showFilter, setShowFilter] = useState(false);
  const colors = useColors();

  const renderContent = () => {
    if (activeTab === 0) {
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
                    <Text
                      style={[styles.filterText, { color: colors.textColor }]}
                    >
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
                    <Ionicons
                      name={item.icon}
                      size={16}
                      color={colors.iconColor}
                    />
                    <Text
                      style={[
                        styles.filterItemText,
                        { color: colors.textColor },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {PAST_TRIPS?.map((trip) => (
              <View
                key={trip.id}
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
                    <Text style={{ color: colors.mutedTextColor }}>
                      {trip.date}
                    </Text>
                  </View>

                  <View style={[styles.cardBody, { marginTop: 12 }]}>
                    <Image source={{ uri: trip.image }} style={styles.avatar} />
                    <View style={styles.tripDetails}>
                      <Text
                        style={[styles.tripTitle, { color: colors.textColor }]}
                      >
                        {trip.title}
                      </Text>
                      <Text style={{ color: colors.mutedTextColor }}>
                        <Ionicons name="location-outline" size={14} />{" "}
                        {trip.location}
                      </Text>
                      <View style={[styles.tags, { marginTop: 4 }]}>
                        {trip.tags.map((tag, index) => (
                          <Text
                            key={index}
                            style={[
                              styles.tag,
                              {
                                borderColor:
                                  index === 0 ? "#3B82F6" : "#F97316",
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
                    style={[
                      styles.divider,
                      { backgroundColor: colors.borderColor },
                    ]}
                  />

                  <View style={styles.cardFooter}>
                    <Text style={{ color: colors.mutedTextColor }}>
                      <Ionicons name="people-outline" size={14} />{" "}
                      {trip.participants} People
                    </Text>
                    <TouchableOpacity>
                      <View style={styles.detailsLink}>
                        <Ionicons
                          name="document-text-outline"
                          size={16}
                          color={colors.iconColor}
                        />
                        <Text
                          style={[styles.detailsText, { color: "#3B82F6" }]}
                        >
                          View Details
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}

            <View
              style={[
                styles.emptyState,
                { backgroundColor: colors.cardBgColor },
              ]}
            >
              <Ionicons
                name="boat-outline"
                size={48}
                color={colors.iconColor}
              />
              <Text style={[styles.emptyTitle, { color: colors.textColor }]}>
                Looking for More Adventures?
              </Text>
              <Text style={{ color: colors.textColor, textAlign: "center" }}>
                Explore our curated trips and create unforgettable memories
              </Text>
              <TouchableOpacity
                style={[
                  styles.exploreButton,
                  { backgroundColor: colors.buttonBgColor },
                ]}
              >
                <Text
                  style={[styles.buttonText, { color: colors.buttonTextColor }]}
                >
                  Explore Trips
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      );
    }
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, styles.bottomPadding]}
      >
        <View style={[styles.content, { padding: 20 }]}>
          <View
            style={[styles.emptyState, { backgroundColor: colors.cardBgColor }]}
          >
            <Ionicons
              name="bookmark-outline"
              size={48}
              color={colors.iconColor}
            />
            <Text style={[styles.emptyTitle, { color: colors.textColor }]}>
              No Saved Trips Yet
            </Text>
            <Text style={{ color: colors.textColor, textAlign: "center" }}>
              Save your favorite trips for quick access. Start exploring and
              bookmark trips that interest you!
            </Text>
            <TouchableOpacity
              style={[
                styles.exploreButton,
                { backgroundColor: colors.buttonBgColor },
              ]}
            >
              <Text
                style={[styles.buttonText, { color: colors.buttonTextColor }]}
              >
                Browse Trips
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.bgColor }]}
    >
      <View style={[styles.header, { borderBottomColor: colors.borderColor }]}>
        <Text style={[styles.heading, { color: colors.textColor }]}>
          History
        </Text>
      </View>

      <View
        style={[styles.tabContainer, { borderBottomColor: colors.borderColor }]}
      >
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 0 && [
              styles.activeTab,
              { borderBottomColor: colors.activeTabBorderColor },
            ],
          ]}
          onPress={() => setActiveTab(0)}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: colors.tabTextColor,
                fontWeight: activeTab === 0 ? "bold" : "normal",
              },
            ]}
          >
            Past Trips
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 1 && [
              styles.activeTab,
              { borderBottomColor: colors.activeTabBorderColor },
            ],
          ]}
          onPress={() => setActiveTab(1)}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: colors.tabTextColor,
                fontWeight: activeTab === 1 ? "bold" : "normal",
              },
            ]}
          >
            Saved
          </Text>
        </TouchableOpacity>
      </View>

      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 0,
  },
  heading: {
    fontSize: 32,
    fontWeight: "bold",
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
  },
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
    justifyContent: "space-between",
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
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailsLink: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailsText: {
    marginLeft: 4,
    fontSize: 14,
  },
  emptyState: {
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 12,
    textAlign: "center",
  },
  exploreButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 12,
  },
  buttonText: {
    fontWeight: "bold",
    fontSize: 14,
  },
  bottomPadding: {
    paddingBottom: 45,
  },
});
