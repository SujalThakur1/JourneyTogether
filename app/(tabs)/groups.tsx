import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
// import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
// import { useGroups } from "../../contexts/GroupsContext";
// import JoinGroupSection from "../../components/groups/JoinGroupSection";
// import CreateGroupSection from "../../components/groups/CreateGroupSection";

// Custom hook to handle theme colors
const useThemeColors = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return {
    bgColor: isDark ? "#000000" : "white",
    activeTabBorderColor: isDark ? "#FFFFFF" : "#000000",
    borderColor: isDark ? "#333333" : "#E5E5E5",
    textColor: isDark ? "white" : "#333333",
    tabTextColor: isDark ? "#A1A1AA" : "#666666",
  };
};

const GroupsContent = () => {
  const {
    bgColor,
    activeTabBorderColor,
    borderColor,
    textColor,
    tabTextColor,
  } = useThemeColors();
  const [activeTab, setActiveTab] = useState<"join" | "create">("create");

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Heading */}
      <View
        style={[
          styles.header,
          {
            borderBottomWidth: 0,
            borderBottomColor: borderColor,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <Text style={[styles.heading, { color: textColor }]}>Groups</Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { borderBottomColor: borderColor }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "create" && [
              styles.activeTab,
              { borderBottomColor: activeTabBorderColor },
            ],
          ]}
          onPress={() => setActiveTab("create")}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: tabTextColor,
                fontWeight: activeTab === "create" ? "bold" : "normal",
              },
            ]}
          >
            Create Group
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("join")}
          style={[
            styles.tab,
            activeTab === "join" && [
              styles.activeTab,
              { borderBottomColor: activeTabBorderColor },
            ],
          ]}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: tabTextColor,
                fontWeight: activeTab === "join" ? "bold" : "normal",
              },
            ]}
          >
            Join Group
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {/* <KeyboardAwareScrollView
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={20}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
      >
        {activeTab === "join" && <JoinGroupSection />}
        {activeTab === "create" && (
          <View style={styles.content}>
            <CreateGroupSection />
          </View>
        )}
      </KeyboardAwareScrollView> */}
    </View>
  );
};

export default function GroupsScreen() {
  return <GroupsContent />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heading: {
    fontSize: 28,
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  content: {
    marginTop: 16,
  },
});
