import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { UserLocation } from "@/lib/locationService";
import { supabase } from "../../lib/supabase";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";

interface User {
  id: string;
  username: string;
  avatar_url?: string;
  email?: string;
}

interface MemberWithLocation extends User {
  location?: UserLocation;
  isLeader?: boolean;
  isCurrentUser?: boolean;
}

interface RequestMember {
  uuid: string;
  date: string;
  status: "pending" | "accepted" | "rejected";
  userData?: {
    username: string;
    email: string;
    avatar_url?: string;
  };
}

interface GroupMembersPanelProps {
  members: MemberWithLocation[];
  leaderId: string;
  currentUserId?: string;
  groupId: number;
  destination?: { latitude: number; longitude: number } | null;
  textColor: string;
  cardBgColor: string;
  isLeader: boolean;
  createdBy: string;
  onMemberSelect?: (member: MemberWithLocation) => void;
  onClose: () => void;
  onRequestProcessed?: () => void;
  onMemberKicked?: (memberId: string) => void;
}

const { height } = Dimensions.get("window");

const GroupMembersPanel = ({
  members,
  leaderId,
  currentUserId,
  groupId,
  destination,
  textColor,
  cardBgColor,
  isLeader,
  createdBy,
  onClose,
  onRequestProcessed,
  onMemberKicked,
  onMemberSelect,
}: GroupMembersPanelProps) => {
  const [pendingRequests, setPendingRequests] = useState<RequestMember[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [processLoading, setProcessLoading] = useState<{
    [key: string]: boolean;
  }>({});
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const router = useRouter();

  const isCreator = currentUserId === createdBy;

  useEffect(() => {
    const fetchPendingRequests = async () => {
      try {
        const { data: groupData, error } = await supabase
          .from("groups")
          .select("request")
          .eq("group_id", groupId)
          .single();

        if (error) throw error;

        const requests = (groupData.request || []).filter(
          (req: RequestMember) => req.status === "pending"
        );

        if (requests.length === 0) {
          setPendingRequests([]);
          setLoadingRequests(false);
          return;
        }

        const userIds = requests.map((req: RequestMember) => req.uuid);
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, username, email, avatar_url")
          .in("id", userIds);

        if (userError) throw userError;

        const requestsWithUserData = requests.map((req: RequestMember) => {
          const user = userData?.find((u) => u.id === req.uuid);
          return {
            ...req,
            userData: user
              ? {
                  username: user.username,
                  email: user.email,
                  avatar_url: user.avatar_url,
                }
              : undefined,
          };
        });

        setPendingRequests(requestsWithUserData);
      } catch (error) {
        console.error("Error fetching pending requests:", error);
      } finally {
        setLoadingRequests(false);
      }
    };

    fetchPendingRequests();

    // Subscribe to real-time updates for group changes
    const subscription = supabase
      .channel(`group-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "groups",
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          if (payload.new.request) {
            const requests = payload.new.request.filter(
              (req: RequestMember) => req.status === "pending"
            );
            setPendingRequests(requests);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [groupId]);

  const getInitials = (name: string): string => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
  };

  const getDistanceText = (memberLocation?: UserLocation) => {
    if (!memberLocation || !destination) return null;
    try {
      const distance = calculateDistance(
        memberLocation.latitude,
        memberLocation.longitude,
        destination.latitude,
        destination.longitude
      );
      return distance < 1
        ? `${Math.round(distance * 1000)} m from destination`
        : `${distance.toFixed(1)} km from destination`;
    } catch (error) {
      console.error("Error calculating distance:", error);
      return null;
    }
  };

  const handleAddMember = async () => {
    if (!newMemberEmail || !newMemberEmail.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    try {
      setAddingMember(true);
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, notification")
        .eq("email", newMemberEmail.trim())
        .single();

      if (userError || !userData) {
        Alert.alert("Error", "User not found with this email");
        return;
      }

      // Create notification object
      const notification = {
        group_id: groupId,
        date: new Date().toISOString(),
        is_leader: false,
      };

      // Handle existing notifications
      const existingNotifications = Array.isArray(userData.notification)
        ? userData.notification
        : [];

      // Add new notification
      const updatedNotifications = [...existingNotifications, notification];

      // Update user with new notification
      const { error: notificationError } = await supabase
        .from("users")
        .update({
          notification: updatedNotifications,
        })
        .eq("id", userData.id);

      if (notificationError) {
        console.error("Error updating user notifications:", notificationError);
        throw notificationError;
      }

      // Update group request
      const { error: groupError } = await supabase
        .from("groups")
        .update({
          request: [
            ...pendingRequests,
            {
              uuid: userData.id,
              date: new Date().toISOString(),
              status: "pending",
            },
          ],
        })
        .eq("group_id", groupId);

      if (groupError) throw groupError;

      setNewMemberEmail("");
      setShowAddMemberModal(false);
      if (onRequestProcessed) onRequestProcessed();
    } catch (error) {
      console.error("Error adding member:", error);
      Alert.alert("Error", "Failed to add member. Please try again.");
    } finally {
      setAddingMember(false);
    }
  };

  const handleKickMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from("groups")
        .update({
          group_members: members
            .filter((m) => m.id !== memberId)
            .map((m) => m.id),
        })
        .eq("group_id", groupId);

      if (error) throw error;

      if (onMemberKicked) onMemberKicked(memberId);
    } catch (error) {
      console.error("Error kicking member:", error);
      Alert.alert("Error", "Failed to kick member. Please try again.");
    }
  };

  const navigateToMemberLocation = (member: MemberWithLocation) => {
    if (!member.location) {
      Alert.alert("Error", "Member location is not available");
      return;
    }

    if (onMemberSelect) {
      onMemberSelect(member);
    }
  };

  // Combine members and pending requests into a single list
  const allMembers = [
    ...members.map((member) => ({ ...member, isPending: false })),
    ...pendingRequests.map((request) => ({
      id: request.uuid,
      username:
        request.userData?.username || request.userData?.email || "Unknown User",
      avatar_url: request.userData?.avatar_url,
      isPending: true,
    })),
  ];

  return (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={[styles.container, { backgroundColor: cardBgColor }]}>
        <View style={styles.handleContainer}>
          <View style={[styles.handle, { backgroundColor: textColor }]} />
        </View>

        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>
            Group Members ({allMembers.length})
          </Text>
          <View style={styles.headerActions}>
            {(isCreator || isLeader) && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddMemberModal(true)}
              >
                <MaterialIcons name="person-add" size={24} color={textColor} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color={textColor} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.membersList}>
          {loadingRequests ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="small" color="#3B82F6" />
              <Text style={[styles.loadingText, { color: textColor }]}>
                Loading...
              </Text>
            </View>
          ) : allMembers.length === 0 ? (
            <Text style={[styles.emptyText, { color: textColor }]}>
              No members in this group
            </Text>
          ) : (
            allMembers.map((member) => {
              const distanceText = member.isPending
                ? null
                : getDistanceText((member as MemberWithLocation).location);
              const isPending = member.isPending;

              return (
                <View
                  key={member.id}
                  style={[styles.memberItem, { opacity: isPending ? 0.5 : 1 }]}
                >
                  {member.avatar_url ? (
                    <Image
                      source={{ uri: member.avatar_url }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View
                      style={[
                        styles.avatarFallback,
                        {
                          backgroundColor:
                            member.id === leaderId ? "#FBBF24" : "#3B82F6",
                          opacity: isPending ? 0.5 : 1,
                        },
                      ]}
                    >
                      <Text style={styles.avatarText}>
                        {getInitials(member.username)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.memberInfo}>
                    <Text style={[styles.memberName, { color: textColor }]}>
                      {member.username}
                      {member.id === leaderId && !isPending && (
                        <Text style={{ color: "#FBBF24" }}> (Leader)</Text>
                      )}
                      {member.id === currentUserId && !isPending && (
                        <Text style={{ color: "#3B82F6" }}> (You)</Text>
                      )}
                    </Text>
                    {!isPending && distanceText && (
                      <Text style={styles.distanceText}>{distanceText}</Text>
                    )}
                    {isPending && (
                      <Text style={styles.distanceText}>Pending Request</Text>
                    )}
                  </View>
                  <View style={styles.memberActions}>
                    {!isPending && (member as MemberWithLocation).location && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() =>
                          navigateToMemberLocation(member as MemberWithLocation)
                        }
                      >
                        <MaterialIcons
                          name="directions"
                          size={20}
                          color="#3B82F6"
                        />
                      </TouchableOpacity>
                    )}
                    {(isCreator || isLeader) &&
                      member.id !== currentUserId &&
                      !isPending && (
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleKickMember(member.id)}
                        >
                          <MaterialIcons
                            name="person-remove"
                            size={20}
                            color="#EF4444"
                          />
                        </TouchableOpacity>
                      )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>

      {/* Add Member Modal */}
      <Modal
        visible={showAddMemberModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddMemberModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBgColor }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>
              Add New Member
            </Text>
            <TextInput
              style={[
                styles.input,
                { color: textColor, borderColor: textColor },
              ]}
              placeholder="Enter member's email"
              placeholderTextColor={textColor + "80"}
              value={newMemberEmail}
              onChangeText={setNewMemberEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#EF4444" }]}
                onPress={() => setShowAddMemberModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#3B82F6" }]}
                onPress={handleAddMember}
                disabled={addingMember}
              >
                <Text style={styles.modalButtonText}>
                  {addingMember ? "Adding..." : "Add Member"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    maxHeight: height * 0.8,
    paddingBottom: 30,
  },
  handleContainer: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    opacity: 0.3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  addButton: {
    padding: 4,
  },
  membersList: {
    maxHeight: height * 0.7,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "white",
    fontWeight: "bold",
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "500",
  },
  distanceText: {
    fontSize: 13,
    color: "#F59E0B",
    marginTop: 4,
  },
  emptyText: {
    textAlign: "center",
    padding: 16,
    fontStyle: "italic",
  },
  memberActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    padding: 20,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalButtonText: {
    color: "white",
    fontWeight: "500",
  },
  loaderContainer: {
    padding: 16,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
  },
});

export default GroupMembersPanel;
