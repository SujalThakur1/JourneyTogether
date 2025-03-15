import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useGroups } from "../../contexts/GroupsContext";
import JoinGroupSection from "../../components/groups/JoinGroupSection";
import CreateGroupSection from "../../components/groups/CreateGroupSection";
import { SafeAreaView } from "react-native-safe-area-context";

const GroupsContent = () => {
  const {
    bgColor,
    activeTabBorderColor,
    borderColor,
    textColor,
    tabTextColor,
  } = useGroups();
  const [activeTab, setActiveTab] = useState<"join" | "create">("create");

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Heading */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
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
      <KeyboardAwareScrollView
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
          <View style={styles.contentContainer}>
            <CreateGroupSection />
          </View>
        )}
      </KeyboardAwareScrollView>
    </SafeAreaView>
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
    borderBottomWidth: 0,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heading: {
    fontSize: 24,
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
  },
  contentContainer: {
    marginVertical: 16,
  },
});
