import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { MemberWithLocation } from "../../types/group";

interface JourneyControlsProps {
  groupId: number;
  groupName: string;
  members: MemberWithLocation[];
  isLeader: boolean;
  isJourneyActive: boolean;
  isFollowJourney: boolean;
  followedMemberId?: string;
  destinationId?: number | null;
  onJourneyStart: () => void;
  onJourneyEnd: () => void;
  onFollowMember: (memberId: string) => void;
  onUpdateMembers: () => void;
  textColor: string;
  buttonColor: string;
  borderColor: string;
  bgColor: string;
}

const JourneyControls: React.FC<JourneyControlsProps> = ({
  groupId,
  groupName,
  members,
  isLeader,
  isJourneyActive,
  isFollowJourney,
  followedMemberId,
  destinationId,
  onJourneyStart,
  onJourneyEnd,
  onFollowMember,
  onUpdateMembers,
  textColor,
  buttonColor,
  borderColor,
  bgColor,
}) => {
  const [showMemberActions, setShowMemberActions] = useState(false);
  const [selectedMember, setSelectedMember] =
    useState<MemberWithLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMembersList, setShowMembersList] = useState(false);

  const handleStartJourney = () => {
    if (isFollowJourney && !followedMemberId && members.length > 1) {
      // If it's a follow journey and no member is selected yet
      setShowMembersList(true);
    } else {
      onJourneyStart();
    }
  };

  const handleSelectMemberToFollow = (member: MemberWithLocation) => {
    onFollowMember(member.id);
    setShowMembersList(false);
  };

  const handleMemberAction = (member: MemberWithLocation) => {
    setSelectedMember(member);
    setShowMemberActions(true);
  };

  const removeMember = async () => {
    if (!selectedMember || !isLeader) return;

    try {
      setLoading(true);

      // Get current group data
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .select("group_members")
        .eq("group_id", groupId)
        .single();

      if (groupError) throw groupError;

      // Remove member from group_members array
      const updatedMembers = groupData.group_members.filter(
        (id: string) => id !== selectedMember.id
      );

      // Update the group
      const { error: updateError } = await supabase
        .from("groups")
        .update({ group_members: updatedMembers })
        .eq("group_id", groupId);

      if (updateError) throw updateError;

      Alert.alert(
        "Success",
        `${selectedMember.username} has been removed from the group`
      );
      onUpdateMembers();
      setShowMemberActions(false);
    } catch (error) {
      console.error("Error removing member:", error);
      Alert.alert("Error", "Failed to remove member from group");
    } finally {
      setLoading(false);
    }
  };

  const confirmRemoveMember = () => {
    if (!selectedMember) return;

    Alert.alert(
      "Remove Member",
      `Are you sure you want to remove ${selectedMember.username} from this group?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: removeMember },
      ]
    );
  };

  const finishTrip = () => {
    Alert.alert(
      "End Journey",
      "Are you sure you want to end this journey for everyone?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "End Journey", style: "destructive", onPress: onJourneyEnd },
      ]
    );
  };

  return (
    <>
      <View style={styles.controlsContainer}>
        {isJourneyActive ? (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#EF4444" }]}
            onPress={finishTrip}
          >
            <MaterialIcons name="stop-circle" size={24} color="white" />
            <Text style={styles.buttonText}>End Journey</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: buttonColor }]}
            onPress={handleStartJourney}
          >
            <MaterialIcons name="play-circle-fill" size={24} color="white" />
            <Text style={styles.buttonText}>
              {isFollowJourney ? "Follow Member" : "Start Journey"}
            </Text>
          </TouchableOpacity>
        )}

        {isLeader && (
          <TouchableOpacity
            style={[styles.manageMembersButton, { borderColor }]}
            onPress={() => setShowMembersList(true)}
          >
            <MaterialIcons name="people" size={20} color={textColor} />
            <Text style={[styles.manageMembersText, { color: textColor }]}>
              Manage Members
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Select Member to Follow Modal */}
      <Modal
        visible={showMembersList}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMembersList(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: bgColor, borderColor },
            ]}
          >
            <View
              style={[styles.modalHeader, { borderBottomColor: borderColor }]}
            >
              <Text style={[styles.modalTitle, { color: textColor }]}>
                {isLeader ? "Manage Members" : "Select Member to Follow"}
              </Text>
              <TouchableOpacity onPress={() => setShowMembersList(false)}>
                <MaterialIcons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>

            {members.length > 0 ? (
              <FlatList
                data={members}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.memberItem,
                      { borderBottomColor: borderColor },
                    ]}
                    onPress={() =>
                      isLeader
                        ? handleMemberAction(item)
                        : handleSelectMemberToFollow(item)
                    }
                  >
                    <View style={styles.memberInfo}>
                      <View style={styles.memberAvatar}>
                        <Text style={styles.memberInitials}>
                          {item.username.substring(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <Text style={[styles.memberName, { color: textColor }]}>
                          {item.username}
                          {item.isLeader ? " (Leader)" : ""}
                          {item.isCurrentUser ? " (You)" : ""}
                        </Text>
                        <Text
                          style={[styles.memberStatus, { color: textColor }]}
                        >
                          {item.location ? "Online" : "Offline"}
                        </Text>
                      </View>
                    </View>

                    {isLeader && !item.isCurrentUser && !item.isLeader && (
                      <MaterialIcons
                        name="more-vert"
                        size={24}
                        color={textColor}
                      />
                    )}

                    {!isLeader && (
                      <MaterialIcons
                        name="arrow-forward-ios"
                        size={18}
                        color={textColor}
                      />
                    )}
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: textColor }]}>
                  No members found
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Member Actions Modal */}
      <Modal
        visible={showMemberActions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMemberActions(false)}
      >
        <View style={styles.actionModalOverlay}>
          <View
            style={[
              styles.actionModalContent,
              { backgroundColor: bgColor, borderColor },
            ]}
          >
            <Text style={[styles.actionModalTitle, { color: textColor }]}>
              {selectedMember?.username}
            </Text>

            <TouchableOpacity
              style={[styles.actionButton, { borderBottomColor: borderColor }]}
              onPress={() => {
                if (selectedMember) {
                  onFollowMember(selectedMember.id);
                  setShowMemberActions(false);
                  setShowMembersList(false);
                }
              }}
            >
              <MaterialIcons
                name="person-pin-circle"
                size={24}
                color={textColor}
              />
              <Text style={[styles.actionButtonText, { color: textColor }]}>
                Follow this member
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { borderBottomColor: borderColor }]}
              onPress={confirmRemoveMember}
            >
              <MaterialIcons name="person-remove" size={24} color="#EF4444" />
              <Text style={[styles.actionButtonText, { color: "#EF4444" }]}>
                Remove from group
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCancelButton]}
              onPress={() => setShowMemberActions(false)}
            >
              <Text style={[styles.actionCancelText, { color: buttonColor }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={buttonColor} />
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  controlsContainer: {
    padding: 16,
    flexDirection: "column",
    gap: 12,
    width: "100%",
    position: "absolute",
    bottom: 0,
    left: 0,
    zIndex: 10,
  },
  button: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  manageMembersButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  manageMembersText: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  memberItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#60A5FA",
    justifyContent: "center",
    alignItems: "center",
  },
  memberInitials: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
  },
  memberStatus: {
    fontSize: 14,
    opacity: 0.7,
  },
  emptyContainer: {
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
  },
  actionModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  actionModalContent: {
    width: "80%",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  actionModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    padding: 16,
    textAlign: "center",
    borderBottomWidth: 1,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
  },
  actionButtonText: {
    fontSize: 16,
  },
  actionCancelButton: {
    padding: 16,
    alignItems: "center",
  },
  actionCancelText: {
    fontSize: 16,
    fontWeight: "600",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
});

export default JourneyControls;
