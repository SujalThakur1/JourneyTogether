import React, { useState, createContext, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "../../contexts/ColorContext";
import PastTripsTab from "../../components/history/PastTripsTab";
import SavedTripsTab from "../../components/history/SavedTripsTab";
import { UserProvider } from "../../contexts/UserContext";
import CreateGroupBottomSheet from "../../components/Sheet/bottomSheet";

// Create a context for handling bottom sheet state across components
interface BottomSheetContextType {
  showBottomSheet: boolean;
  destinationName: string;
  destinationId: number;
  openBottomSheet: (name: string, id: number) => void;
  closeBottomSheet: () => void;
}

export const BottomSheetContext = createContext<BottomSheetContextType>({
  showBottomSheet: false,
  destinationName: "",
  destinationId: 1,
  openBottomSheet: () => {},
  closeBottomSheet: () => {},
});

export const useBottomSheet = () => useContext(BottomSheetContext);

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

  // Bottom sheet state
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [destinationName, setDestinationName] = useState("New Trip");
  const [destinationId, setDestinationId] = useState(1);

  // Bottom sheet handlers
  const openBottomSheet = (name: string, id: number) => {
    setDestinationName(name);
    setDestinationId(id);
    setShowBottomSheet(true);
  };

  const closeBottomSheet = () => {
    setShowBottomSheet(false);
  };

  // Context value
  const bottomSheetContextValue = {
    showBottomSheet,
    destinationName,
    destinationId,
    openBottomSheet,
    closeBottomSheet,
  };

  return (
    <UserProvider>
      <BottomSheetContext.Provider value={bottomSheetContextValue}>
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

          {/* Bottom Sheet positioned at the root level */}
          <CreateGroupBottomSheet
            isVisible={showBottomSheet}
            onClose={closeBottomSheet}
            destinationName={destinationName}
            destinationId={destinationId}
            maxHeight={Platform.OS === "ios" ? 750 : 550}
            mb={90}
          />
        </SafeAreaView>
      </BottomSheetContext.Provider>
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
