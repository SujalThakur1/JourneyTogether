import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { useColors } from "../../contexts/ColorContext";
import { useApp } from "../../contexts/AppContext";
import NotificationCard from "./NotificationCard";
import { Ionicons } from "@expo/vector-icons";

interface Notification {
  group_id: number;
  group_name: string;
  is_leader: boolean;
  date: string;
}

interface NotificationsListProps {
  visible: boolean;
  onClose: () => void;
}

const NotificationsList = ({ visible, onClose }: NotificationsListProps) => {
  const colors = useColors();
  const { userDetails, refreshUserDetails } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && userDetails?.id) {
      fetchNotifications();
    }
  }, [visible, userDetails?.id]);

  const fetchNotifications = async () => {
    if (!userDetails?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch user notifications
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("notification")
        .eq("id", userDetails.id)
        .single();

      if (userError) throw userError;

      if (!userData?.notification || userData.notification.length === 0) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      // Process notifications and get group details
      const notificationPromises = userData.notification.map(
        async (notif: any) => {
          const { data: groupData } = await supabase
            .from("groups")
            .select("group_name")
            .eq("group_id", notif.group_id)
            .single();

          return {
            group_id: notif.group_id,
            group_name: groupData?.group_name || "Unknown Group",
            is_leader: notif.is_leader || false,
            date: notif.date || new Date().toISOString(),
          };
        }
      );

      const resolvedNotifications = await Promise.all(notificationPromises);
      setNotifications(resolvedNotifications);
    } catch (err: any) {
      console.error("Error fetching notifications:", err);
      setError("Failed to load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (groupId: number) => {
    if (!userDetails?.id) return;

    try {
      // Get group data first
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .select("*")
        .eq("group_id", groupId)
        .single();

      if (groupError) throw groupError;

      // Get the current request array
      const requests = groupData.request || [];

      // Find the current user request and update its status
      const updatedRequests = requests.map((req: any) => {
        if (req.uuid === userDetails.id) {
          return { ...req, status: "accepted" };
        }
        return req;
      });

      // Add user to group_members array if not already there
      let updatedMembers = [...(groupData.group_members || [])];
      if (!updatedMembers.includes(userDetails.id)) {
        updatedMembers.push(userDetails.id);
      }

      // Update the group with new member and updated request status
      const { error: updateError } = await supabase
        .from("groups")
        .update({
          group_members: updatedMembers,
          request: updatedRequests,
        })
        .eq("group_id", groupId);

      if (updateError) throw updateError;

      // Remove notification from user
      await removeNotification(groupId);

      // Refresh notifications list
      await fetchNotifications();

      // Refresh user details
      if (refreshUserDetails) {
        await refreshUserDetails();
      }
    } catch (err) {
      console.error("Error accepting invitation:", err);
      throw err;
    }
  };

  const handleRejectInvitation = async (groupId: number) => {
    if (!userDetails?.id) return;

    try {
      // Get group data first
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .select("request")
        .eq("group_id", groupId)
        .single();

      if (groupError) throw groupError;

      // Update the request status to rejected
      const requests = groupData.request || [];
      const updatedRequests = requests.map((req: any) => {
        if (req.uuid === userDetails.id) {
          return { ...req, status: "rejected" };
        }
        return req;
      });

      // Update the group with the rejected status
      const { error: updateError } = await supabase
        .from("groups")
        .update({ request: updatedRequests })
        .eq("group_id", groupId);

      if (updateError) throw updateError;

      // Remove notification from user
      await removeNotification(groupId);

      // Refresh notifications list
      await fetchNotifications();
    } catch (err) {
      console.error("Error rejecting invitation:", err);
      throw err;
    }
  };

  const removeNotification = async (groupId: number) => {
    if (!userDetails?.id) return;

    try {
      // Get current notifications
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("notification")
        .eq("id", userDetails.id)
        .single();

      if (userError) throw userError;

      // Filter out the notification for this group
      const updatedNotifications = (userData.notification || []).filter(
        (notif: any) => notif.group_id !== groupId
      );

      // Update user notifications
      const { error: updateError } = await supabase
        .from("users")
        .update({ notification: updatedNotifications })
        .eq("id", userDetails.id);

      if (updateError) throw updateError;
    } catch (err) {
      console.error("Error removing notification:", err);
      throw err;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View
        style={[styles.modalContainer, { backgroundColor: "rgba(0,0,0,0.5)" }]}
      >
        <View
          style={[styles.modalContent, { backgroundColor: colors.bgColor }]}
        >
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.textColor }]}>
              Notifications
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.iconColor} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accentColor} />
              <Text
                style={[styles.loadingText, { color: colors.mutedTextColor }]}
              >
                Loading notifications...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons
                name="alert-circle-outline"
                size={48}
                color={colors.errorColor}
              />
              <Text style={[styles.errorText, { color: colors.errorColor }]}>
                {error}
              </Text>
              <TouchableOpacity
                style={[
                  styles.retryButton,
                  { backgroundColor: colors.buttonBgColor },
                ]}
                onPress={fetchNotifications}
              >
                <Text
                  style={[styles.retryText, { color: colors.buttonTextColor }]}
                >
                  Retry
                </Text>
              </TouchableOpacity>
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="notifications-off-outline"
                size={48}
                color={colors.mutedTextColor}
              />
              <Text
                style={[styles.emptyText, { color: colors.mutedTextColor }]}
              >
                No new notifications
              </Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(item) => `${item.group_id}-${item.date}`}
              renderItem={({ item }) => (
                <NotificationCard
                  notification={item}
                  userId={userDetails?.id || ""}
                  onAccept={handleAcceptInvitation}
                  onReject={handleRejectInvitation}
                />
              )}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    fontWeight: "600",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
  },
});

export default NotificationsList;
