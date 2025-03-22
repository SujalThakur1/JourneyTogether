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
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { MemberWithLocation, CustomMarker } from "../../types/group";
import { useColors } from "../../contexts/ColorContext";

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
  waypoints?: CustomMarker[];
  onClearWaypoints?: () => void;
}

const JourneyControls: React.FC<JourneyControlsProps> = ({
  groupId,
  members,
  isLeader,
  isJourneyActive,
  isFollowJourney,
  followedMemberId,
  onJourneyStart,
  onJourneyEnd,
  onFollowMember,
  onUpdateMembers,
  textColor,
  buttonColor,
  borderColor,
  bgColor,
  waypoints,
  onClearWaypoints,
}) => {
  const colors = useColors();
  const [showMemberActions, setShowMemberActions] = useState(false);
  const [selectedMember, setSelectedMember] =
    useState<MemberWithLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMembersList, setShowMembersList] = useState(false);

  const handleStartJourney = () => {
    if (isFollowJourney && !followedMemberId && members.length > 1) {
      // If it's a follow journey and no member is selected yet
      if (isLeader) {
        // Leaders should just start the journey without selecting members
        onJourneyStart();
      } else {
        // Non-leaders automatically follow the leader
        const leader = members.find((m) => m.isLeader);
        if (leader && leader.location) {
          onFollowMember(leader.id);
          onJourneyStart();
        } else {
          Alert.alert(
            "Cannot Start Journey",
            "The leader is not online or their location is not available."
          );
        }
      }
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
            style={[styles.button, { backgroundColor: colors.bgColor }]}
            onPress={handleStartJourney}
          >
            <MaterialIcons
              name="play-circle-fill"
              size={24}
              color={colors.textColor}
            />
            <Text style={[styles.buttonText, { color: colors.textColor }]}>
              {isFollowJourney
                ? isLeader
                  ? "Start Journey"
                  : "Follow Leader"
                : "Start Journey"}
            </Text>
          </TouchableOpacity>
        )}

        {/* Waypoints display */}
        {waypoints && waypoints.length > 0 && (
          <View
            style={[
              styles.waypointsPanel,
              { backgroundColor: colors.cardBgColor, borderColor: borderColor },
            ]}
          >
            <View style={styles.waypointsHeader}>
              <Text style={[styles.waypointsTitle, { color: textColor }]}>
                Waypoints ({waypoints.length})
              </Text>
              {onClearWaypoints && (
                <TouchableOpacity
                  onPress={onClearWaypoints}
                  style={styles.clearWaypointsButton}
                >
                  <MaterialIcons name="clear-all" size={18} color={textColor} />
                  <Text
                    style={[{ color: textColor, fontSize: 12, marginLeft: 4 }]}
                  >
                    Clear All
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.waypointsList}
            >
              {waypoints.map((waypoint, index) => (
                <View
                  key={waypoint.id}
                  style={[styles.waypointItem, { borderColor: borderColor }]}
                >
                  <MaterialIcons name="flag" size={16} color={textColor} />
                  <Text
                    style={[
                      {
                        color: textColor,
                        fontSize: 12,
                        marginLeft: 4,
                        maxWidth: 100,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {index + 1}. {waypoint.title}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
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
                {isLeader ? "Manage Members" : "Select Leader to Follow"}
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
    margin: 16,
  },
  buttonText: {
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
  waypointsPanel: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  waypointsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  waypointsTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  clearWaypointsButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  waypointsList: {
    flexDirection: "row",
  },
  waypointItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
  },
});

export default JourneyControls;
