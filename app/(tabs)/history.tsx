import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "../../contexts/ColorContext";
import PastTripsTab from "../../components/history/PastTripsTab";
import SavedTripsTab from "../../components/history/SavedTripsTab";
import { UserProvider } from "../../contexts/UserContext";

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
  const colors = useColors();

  return (
    <UserProvider>
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.bgColor }]}
      >
        <View
          style={[styles.header, { borderBottomColor: colors.borderColor }]}
        >
          <Text style={[styles.heading, { color: colors.textColor }]}>
            History
          </Text>
        </View>

        <View
          style={[
            styles.tabContainer,
            { borderBottomColor: colors.borderColor },
          ]}
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

        {activeTab === 0 ? <PastTripsTab /> : <SavedTripsTab />}
      </SafeAreaView>
    </UserProvider>
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
});
