import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGroups, Group } from "../../contexts/GroupsContext";
import { useApp } from "../../contexts/AppContext";
import GroupCard from "../../components/groups/GroupCard";
import EmptyGroupState from "../../components/groups/EmptyGroupState";
import GroupSearchBar from "../../components/groups/GroupSearchBar";
import FilterModal from "../../components/groups/FilterModal";
import StandaloneBottomSheets from "../../components/groups/StandaloneBottomSheets";

const GroupsScreen = () => {
  const {
    bgColor,
    borderColor,
    textColor,
    buttonBgColor,
    buttonTextColor,
    userGroups,
    isLoadingGroups,
    groupsError,
    fetchUserGroups,
    refreshGroups,
  } = useGroups();

  const { userDetails } = useApp();

  // State for filtering and search
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // State for bottom sheets
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [showJoinSheet, setShowJoinSheet] = useState(false);

  // Fetch groups on mount
  useEffect(() => {
    fetchUserGroups();
  }, []);

  // Filter and search groups
  const filteredGroups = userGroups.filter((group) => {
    // First apply search filter
    const matchesSearch =
      searchQuery.trim() === "" ||
      group.group_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.group_code.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Then apply category filter
    if (activeFilter === "all") return true;
    if (activeFilter === "created") return group.created_by === userDetails?.id;
    if (activeFilter === "joined") return group.created_by !== userDetails?.id;
    if (activeFilter === "destination")
      return group.group_type === "TravelToDestination";
    if (activeFilter === "follow") return group.group_type === "FollowMember";
    return true;
  });

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshGroups();
    setRefreshing(false);
  }, [refreshGroups]);

  // Bottom sheet handlers
  const openCreateSheet = useCallback(() => {
    setShowCreateSheet(true);
  }, []);

  const closeCreateSheet = useCallback(() => {
    setShowCreateSheet(false);
  }, []);

  const openJoinSheet = useCallback(() => {
    setShowJoinSheet(true);
  }, []);

  const closeJoinSheet = useCallback(() => {
    setShowJoinSheet(false);
  }, []);

  // Toggle filter modal
  const toggleFilterModal = () => {
    setShowFilterModal(!showFilterModal);
  };

  // Get active filter label
  const getActiveFilterLabel = () => {
    switch (activeFilter) {
      case "all":
        return "All Groups";
      case "created":
        return "Created by Me";
      case "joined":
        return "Joined Groups";
      case "destination":
        return "Destination Groups";
      case "follow":
        return "Follow Groups";
      default:
        return "All Groups";
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.heading, { color: textColor }]}>Groups</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: buttonBgColor }]}
              onPress={openJoinSheet}
            >
              <Text
                style={[styles.actionButtonText, { color: buttonTextColor }]}
              >
                Join
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: buttonBgColor }]}
              onPress={openCreateSheet}
            >
              <Text
                style={[styles.actionButtonText, { color: buttonTextColor }]}
              >
                Create
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <GroupSearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onFilterPress={toggleFilterModal}
      />

      {/* Active Filter Indicator */}
      {activeFilter !== "all" && (
        <View style={styles.activeFilterContainer}>
          <Text style={[styles.filteringByText, { color: textColor }]}>
            Filtering by:
          </Text>
          <View
            style={[
              styles.activeFilterChip,
              { backgroundColor: buttonBgColor },
            ]}
          >
            <Text style={[styles.activeFilterText, { color: buttonTextColor }]}>
              {getActiveFilterLabel()}
            </Text>
            <TouchableOpacity onPress={() => setActiveFilter("all")}>
              <Ionicons name="close-circle" size={16} color={buttonTextColor} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Groups List */}
      {isLoadingGroups && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={textColor} />
          <Text style={[styles.loadingText, { color: textColor }]}>
            Loading groups...
          </Text>
        </View>
      ) : groupsError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="red" />
          <Text style={[styles.errorText, { color: textColor }]}>
            {groupsError}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: buttonBgColor }]}
            onPress={fetchUserGroups}
          >
            <Text style={[styles.retryButtonText, { color: buttonTextColor }]}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filteredGroups.length > 0 ? (
            filteredGroups.map((group) => (
              <GroupCard
                key={group.group_id}
                group={group}
                isUserCreator={group.created_by === userDetails?.id}
              />
            ))
          ) : (
            <EmptyGroupState
              onCreatePress={openCreateSheet}
              onJoinPress={openJoinSheet}
              filterType={activeFilter}
            />
          )}
        </ScrollView>
      )}

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={toggleFilterModal}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
      />

      {/* Bottom Sheets */}
      <StandaloneBottomSheets
        showCreateSheet={showCreateSheet}
        showJoinSheet={showJoinSheet}
        onCloseCreateSheet={closeCreateSheet}
        onCloseJoinSheet={closeJoinSheet}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
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
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  activeFilterContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filteringByText: {
    fontSize: 14,
    marginRight: 8,
  },
  activeFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 6,
  },
  activeFilterText: {
    fontSize: 12,
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Extra padding at bottom
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default GroupsScreen;
