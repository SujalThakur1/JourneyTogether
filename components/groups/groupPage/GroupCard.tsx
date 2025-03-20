import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColors } from "../../../contexts/ColorContext";
import { useGroups } from "../../../contexts/GroupsContext";
import MapView, { Marker } from "react-native-maps";
import { supabase } from "../../../lib/supabase";
import { useApp } from "../../../contexts/AppContext";

interface GroupCardProps {
  group: {
    group_id: number;
    group_name: string;
    group_code: string;
    group_type: "TravelToDestination" | "FollowMember";
    destination_id: number | null;
    leader_id: string;
    group_members: string[];
    created_by: string;
    created_at: string;
  };
  isUserCreator: boolean;
}

const GroupCard: React.FC<GroupCardProps> = ({ group, isUserCreator }) => {
  const router = useRouter();
  const colors = useColors();
  const { fetchDestinationDetails, refreshGroups, joinGroup } = useGroups();
  const { userDetails } = useApp();

  const [destinationDetails, setDestinationDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [membersData, setMembersData] = useState<any[]>([]);
  const [leaderData, setLeaderData] = useState<any>(null);
  const [joiningGroup, setJoiningGroup] = useState(false);
  const [leavingGroup, setLeavingGroup] = useState(false);

  const memberCount = group.group_members.length;
  const isDestinationGroup = group.group_type === "TravelToDestination";
  const isUserMember =
    userDetails?.id && group.group_members.includes(userDetails.id);
  const isUserLeader = userDetails?.id && group.leader_id === userDetails.id;

  // Fetch destination details if this is a destination group
  useEffect(() => {
    const loadDestinationDetails = async () => {
      if (isDestinationGroup && group.destination_id) {
        try {
          setLoading(true);
          const details = await fetchDestinationDetails(group.destination_id);
          setDestinationDetails(details);
        } catch (error) {
          console.error("Error fetching destination details:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadDestinationDetails();
  }, [isDestinationGroup, group.destination_id, fetchDestinationDetails]);

  // Fetch leader data
  useEffect(() => {
    const fetchLeaderData = async () => {
      if (group.leader_id) {
        try {
          const { data, error } = await supabase
            .from("users")
            .select("id, username, avatar_url, email")
            .eq("id", group.leader_id)
            .single();

          if (error) throw error;
          setLeaderData(data);
        } catch (error) {
          console.error("Error fetching leader data:", error);
        }
      }
    };

    fetchLeaderData();
  }, [group.leader_id]);

  const navigateToGroup = () => {
    router.push({
      pathname: "/map/[code]",
      params: { code: group.group_code },
    });
  };

  const handleShowMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select("id, username, avatar_url, email")
        .in("id", group.group_members);

      if (error) throw error;
      setMembersData(data || []);
      setShowMembersModal(true);
    } catch (error) {
      console.error("Error fetching group members:", error);
      Alert.alert("Error", "Failed to load group members. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!userDetails?.id) {
      Alert.alert("Error", "You must be logged in to join a group.");
      return;
    }

    try {
      setJoiningGroup(true);
      await joinGroup(group.group_code);
      await refreshGroups();
    } catch (error) {
      console.error("Error joining group:", error);
      Alert.alert("Error", "Failed to join group. Please try again.");
    } finally {
      setJoiningGroup(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!userDetails?.id) return;

    Alert.alert("Leave Group", "Are you sure you want to leave this group?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          try {
            setLeavingGroup(true);
            // Get current group members
            const { data, error } = await supabase
              .from("groups")
              .select("group_members, leader_id")
              .eq("group_id", group.group_id)
              .single();

            if (error) throw error;

            if (data.group_members.length <= 1) {
              // Last member leaving - delete the group
              const { error: delError } = await supabase
                .from("groups")
                .delete()
                .eq("group_id", group.group_id);

              if (delError) throw delError;
            } else {
              // Remove user from members
              const updatedMembers = data.group_members.filter(
                (id: string) => id !== userDetails.id
              );

              let updatedLeader = data.leader_id;

              // If leader is leaving, assign a new leader
              if (
                data.leader_id === userDetails.id &&
                updatedMembers.length > 0
              ) {
                updatedLeader = updatedMembers[0];
              }

              const { error: updateError } = await supabase
                .from("groups")
                .update({
                  group_members: updatedMembers,
                  leader_id: updatedLeader,
                })
                .eq("group_id", group.group_id);

              if (updateError) throw updateError;
            }

            await refreshGroups();
          } catch (error) {
            console.error("Error leaving group:", error);
            Alert.alert("Error", "Failed to leave group. Please try again.");
          } finally {
            setLeavingGroup(false);
          }
        },
      },
    ]);
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.cardBgColor,
          borderColor: colors.cardBorderColor,
          shadowColor: colors.cardShadowColor,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.cardContent}
        onPress={navigateToGroup}
        activeOpacity={0.7}
      >
        <View style={styles.leftContent}>
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: isDestinationGroup
                  ? colors.destinationGroupColor
                  : colors.followGroupColor,
              },
            ]}
          >
            <Ionicons
              name={isDestinationGroup ? "location" : "people"}
              size={20}
              color="white"
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.groupName, { color: colors.textColor }]}>
              {group.group_name}
            </Text>
            <Text style={[styles.groupInfo, { color: colors.subTextColor }]}>
              {isDestinationGroup ? "Destination Group" : "Follow Group"} •{" "}
              {memberCount} {memberCount === 1 ? "member" : "members"}
            </Text>
            {isDestinationGroup && destinationDetails && (
              <Text
                style={[styles.destinationName, { color: colors.accentColor }]}
              >
                {destinationDetails.name}
              </Text>
            )}
            {leaderData && (
              <Text style={[styles.leaderInfo, { color: colors.subTextColor }]}>
                Leader: {leaderData.username}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.rightContent}>
          {isUserCreator && (
            <View
              style={[
                styles.creatorBadge,
                { backgroundColor: colors.accentColor },
              ]}
            >
              <Text style={styles.creatorText}>Creator</Text>
            </View>
          )}
          <MaterialIcons
            name="chevron-right"
            size={24}
            color={colors.chevronColor}
          />
        </View>
      </TouchableOpacity>

      {/* Map for destination groups */}
      {isDestinationGroup &&
        destinationDetails &&
        destinationDetails.latitude &&
        destinationDetails.longitude && (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: destinationDetails.latitude,
                longitude: destinationDetails.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
            >
              <Marker
                coordinate={{
                  latitude: destinationDetails.latitude,
                  longitude: destinationDetails.longitude,
                }}
                title={destinationDetails.name}
              />
            </MapView>
          </View>
        )}

      {/* Buttons for actions */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.accentColor }]}
          onPress={handleShowMembers}
        >
          <MaterialIcons name="people" size={16} color="white" />
          <Text style={styles.actionButtonText}>Members</Text>
        </TouchableOpacity>

        {isUserMember ? (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#EF4444" }]}
            onPress={handleLeaveGroup}
            disabled={leavingGroup}
          >
            <MaterialIcons name="exit-to-app" size={16} color="white" />
            <Text style={styles.actionButtonText}>
              {leavingGroup ? "Leaving..." : "Leave Group"}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.buttonBgColor },
            ]}
            onPress={handleJoinGroup}
            disabled={joiningGroup}
          >
            <MaterialIcons name="person-add" size={16} color="white" />
            <Text style={styles.actionButtonText}>
              {joiningGroup ? "Joining..." : "Join Group"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Members Modal */}
      <Modal
        visible={showMembersModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMembersModal(false)}
      >
        <View
          style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.cardBgColor },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textColor }]}>
                Group Members
              </Text>
              <TouchableOpacity onPress={() => setShowMembersModal(false)}>
                <MaterialIcons
                  name="close"
                  size={24}
                  color={colors.textColor}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.membersList}>
              {membersData.map((member) => (
                <View key={member.id} style={styles.memberItem}>
                  <View
                    style={[
                      styles.memberAvatar,
                      { backgroundColor: colors.accentColor },
                    ]}
                  >
                    <Text style={styles.memberInitial}>
                      {member.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.memberDetails}>
                    <Text
                      style={[styles.memberName, { color: colors.textColor }]}
                    >
                      {member.username}
                    </Text>
                    <Text
                      style={[
                        styles.memberEmail,
                        { color: colors.subTextColor },
                      ]}
                    >
                      {member.email}
                    </Text>
                  </View>
                  {member.id === group.leader_id && (
                    <View
                      style={[
                        styles.leaderBadge,
                        { backgroundColor: colors.accentColor },
                      ]}
                    >
                      <Text style={styles.leaderBadgeText}>Leader</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  groupInfo: {
    fontSize: 14,
    marginBottom: 4,
  },
  leaderInfo: {
    fontSize: 13,
    fontStyle: "italic",
    marginBottom: 4,
  },
  destinationName: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  rightContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  creatorBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  creatorText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  mapContainer: {
    height: 120,
    marginTop: 12,
    borderRadius: 8,
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  membersList: {
    padding: 16,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  memberInitial: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 14,
  },
  leaderBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  leaderBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
});

export default GroupCard;
