import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { useRouter } from "expo-router";
import { useApp } from "../../contexts/AppContext";
import { useGroups } from "../../contexts/GroupsContext";

interface GroupActionsProps {
  groupId: number;
  groupName: string;
  isLeader: boolean;
  membersCount: number;
  textColor: string;
  borderColor: string;
  buttonColor: string;
  bgColor: string;
}

const GroupActions = ({
  groupId,
  groupName,
  isLeader,
  membersCount,
  textColor,
  borderColor,
  buttonColor,
  bgColor,
}: GroupActionsProps) => {
  const router = useRouter();
  const { userDetails } = useApp();
  const { refreshGroups } = useGroups();

  const [userEmail, setUserEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const inviteUser = async () => {
    if (!userEmail || !userEmail.includes("@")) {
      setErrorMsg("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      // Find user by email
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("email", userEmail.trim())
        .single();

      if (userError || !userData) {
        setErrorMsg("User not found with this email");
        setLoading(false);
        return;
      }

      // Check if user is already a member
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .select("group_members, request")
        .eq("group_id", groupId)
        .single();

      if (groupError) {
        setErrorMsg("Failed to check group members");
        setLoading(false);
        return;
      }

      if (groupData.group_members.includes(userData.id)) {
        setErrorMsg("User is already a member of this group");
        setLoading(false);
        return;
      }

      // Check if there's already a pending request
      const requests = groupData.request || [];
      const existingRequest = requests.find(
        (req: any) => req.uuid === userData.id && req.status === "pending"
      );

      if (existingRequest) {
        setErrorMsg("User already has a pending invitation");
        setLoading(false);
        return;
      }

      // Add new request
      const newRequest = {
        uuid: userData.id,
        date: new Date().toISOString(),
        status: "pending",
      };

      const updatedRequests = [...requests, newRequest];

      // Update group requests
      const { error: updateError } = await supabase
        .from("groups")
        .update({ request: updatedRequests })
        .eq("group_id", groupId);

      if (updateError) {
        setErrorMsg("Failed to send invitation");
        setLoading(false);
        return;
      }

      // Send notification to user
      const { data: userNotifData, error: notifError } = await supabase
        .from("users")
        .select("notification")
        .eq("id", userData.id)
        .single();

      if (notifError) {
        console.error("Error fetching user notifications:", notifError);
      } else {
        const existingNotifications = Array.isArray(userNotifData?.notification)
          ? userNotifData.notification
          : [];

        const notification = {
          group_id: groupId,
          group_name: groupName,
          date: newRequest.date,
          is_leader: false,
        };

        const updatedNotifications = [...existingNotifications, notification];

        await supabase
          .from("users")
          .update({ notification: updatedNotifications })
          .eq("id", userData.id);
      }

      setUserEmail("");
      setShowInviteModal(false);
      Alert.alert("Success", "Invitation sent successfully");
    } catch (error) {
      console.error("Error inviting user:", error);
      setErrorMsg("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const leaveGroup = async () => {
    if (!userDetails?.id) return;

    Alert.alert("Leave Group", "Are you sure you want to leave this group?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          try {
            // Get current group members
            const { data, error } = await supabase
              .from("groups")
              .select("group_members, leader_id")
              .eq("group_id", groupId)
              .single();

            if (error) throw error;

            if (data.group_members.length <= 1) {
              // Last member leaving - delete the group
              const { error: delError } = await supabase
                .from("groups")
                .delete()
                .eq("group_id", groupId);

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
                .eq("group_id", groupId);

              if (updateError) throw updateError;
            }

            await refreshGroups();
            router.replace("/");
          } catch (error) {
            console.error("Error leaving group:", error);
            Alert.alert("Error", "Failed to leave group. Please try again.");
          }
        },
      },
    ]);
  };

  const deleteGroup = async () => {
    if (!isLeader) return;

    Alert.alert(
      "Delete Group",
      "Are you sure you want to delete this group? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("groups")
                .delete()
                .eq("group_id", groupId);

              if (error) throw error;

              await refreshGroups();
              router.replace("/");
            } catch (error) {
              console.error("Error deleting group:", error);
              Alert.alert("Error", "Failed to delete group. Please try again.");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: buttonColor }]}
        onPress={() => setShowInviteModal(true)}
      >
        <MaterialIcons name="person-add" size={20} color="white" />
        <Text style={styles.actionButtonText}>Invite</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: "#EF4444" }]}
        onPress={isLeader ? deleteGroup : leaveGroup}
      >
        <MaterialIcons
          name={isLeader ? "delete" : "exit-to-app"}
          size={20}
          color="white"
        />
        <Text style={styles.actionButtonText}>
          {isLeader ? "Delete Group" : "Leave Group"}
        </Text>
      </TouchableOpacity>

      {/* Invite User Modal */}
      <Modal
        visible={showInviteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: bgColor, borderColor },
            ]}
          >
            <Text style={[styles.modalTitle, { color: textColor }]}>
              Invite User
            </Text>

            <TextInput
              style={[styles.input, { color: textColor, borderColor }]}
              placeholder="Enter user email"
              placeholderTextColor="#888"
              value={userEmail}
              onChangeText={setUserEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowInviteModal(false);
                  setUserEmail("");
                  setErrorMsg(null);
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.inviteButton,
                  { backgroundColor: buttonColor },
                ]}
                onPress={inviteUser}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.modalButtonText}>Send Invite</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 15,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 120,
    gap: 8,
  },
  actionButtonText: {
    color: "white",
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },
  modalContent: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
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
  errorText: {
    color: "#EF4444",
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#6B7280",
  },
  inviteButton: {
    backgroundColor: "#3B82F6",
  },
  modalButtonText: {
    color: "white",
    fontWeight: "600",
  },
});

export default GroupActions;
