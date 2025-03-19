import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity} from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "../../contexts/ColorContext";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";

interface NotificationProps {
  notification: {
    group_id: number;
    group_name: string;
    is_leader: boolean;
    date: string;
  };
  userId: string;
  onAccept: (groupId: number) => Promise<void>;
  onReject: (groupId: number) => Promise<void>;
}

const NotificationCard = ({
  notification,
  userId,
  onAccept,
  onReject,
}: NotificationProps) => {
  const colors = useColors();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Format the notification date to show how long ago it was
  const timeAgo = formatDistanceToNow(new Date(notification.date), {
    addSuffix: true,
  });

  const handleAccept = async () => {
    try {
      setIsLoading(true);
      await onAccept(notification.group_id);
    } catch (error) {
      console.error("Error accepting invitation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsLoading(true);
      await onReject(notification.group_id);
    } catch (error) {
      console.error("Error rejecting invitation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.cardBgColor,
          borderColor: colors.borderColor,
        },
      ]}
    >
      <View style={styles.contentContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name="people" size={24} color={colors.accentColor} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.textColor }]}>
            Group Invitation: {notification.group_name}
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedTextColor }]}>
            You've been invited to join as{" "}
            {notification.is_leader ? "a leader" : "a member"}
          </Text>
          <Text style={[styles.time, { color: colors.mutedTextColor }]}>
            {timeAgo}
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            styles.acceptButton,
            { backgroundColor: colors.successColor },
          ]}
          onPress={handleAccept}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            styles.rejectButton,
            { backgroundColor: colors.errorColor },
          ]}
          onPress={handleReject}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  contentContainer: {
    flexDirection: "row",
    marginBottom: 12,
  },
  iconContainer: {
    marginRight: 12,
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  acceptButton: {
    backgroundColor: "#4CAF50",
  },
  rejectButton: {
    backgroundColor: "#F44336",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
});

export default NotificationCard;
