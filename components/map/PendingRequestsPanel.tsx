import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";

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

interface PendingRequestsPanelProps {
  groupId: number;
  requests: RequestMember[];
  textColor: string;
  cardBgColor: string;
  bgColor: string;
  borderColor: string;
  isLeader: boolean;
  onClose: () => void;
  onRequestProcessed: () => void;
}

const PendingRequestsPanel = ({
  groupId,
  requests,
  textColor,
  cardBgColor,
  bgColor,
  borderColor,
  isLeader,
  onClose,
  onRequestProcessed,
}: PendingRequestsPanelProps) => {
  const [pendingRequests, setPendingRequests] = useState<RequestMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [processLoading, setProcessLoading] = useState<{
    [key: string]: boolean;
  }>({});

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!requests || requests.length === 0) {
        setPendingRequests([]);
        setLoading(false);
        return;
      }

      // Filter only pending requests
      const pending = requests.filter((req) => req.status === "pending");

      if (pending.length === 0) {
        setPendingRequests([]);
        setLoading(false);
        return;
      }

      try {
        // Get user details for each request
        const userIds = pending.map((req) => req.uuid);

        const { data: userData, error } = await supabase
          .from("users")
          .select("id, username, email, avatar_url")
          .in("id", userIds);

        if (error) throw error;

        // Merge user data with request data
        const requestsWithUserData = pending.map((req) => {
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
        console.error("Error fetching user details for requests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [requests]);

  const handleAccept = async (request: RequestMember) => {
    if (!isLeader) return;

    try {
      setProcessLoading((prev) => ({ ...prev, [request.uuid]: true }));

      // Get current group data
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .select("group_members, request")
        .eq("group_id", groupId)
        .single();

      if (groupError) throw groupError;

      // Update the request status
      const updatedRequests = (groupData.request || []).map((req: any) => {
        if (req.uuid === request.uuid) {
          return { ...req, status: "accepted" };
        }
        return req;
      });

      // Add member to group_members array
      const updatedMembers = [...(groupData.group_members || [])];
      if (!updatedMembers.includes(request.uuid)) {
        updatedMembers.push(request.uuid);
      }

      // Update group
      const { error: updateError } = await supabase
        .from("groups")
        .update({
          group_members: updatedMembers,
          request: updatedRequests,
        })
        .eq("group_id", groupId);

      if (updateError) throw updateError;

      // Update local state
      setPendingRequests((prev) => prev.filter((r) => r.uuid !== request.uuid));

      // Notify parent component
      onRequestProcessed();
    } catch (error) {
      console.error("Error accepting request:", error);
    } finally {
      setProcessLoading((prev) => ({ ...prev, [request.uuid]: false }));
    }
  };

  const handleReject = async (request: RequestMember) => {
    if (!isLeader) return;

    try {
      setProcessLoading((prev) => ({ ...prev, [request.uuid]: true }));

      // Get current group data
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .select("request")
        .eq("group_id", groupId)
        .single();

      if (groupError) throw groupError;

      // Update the request status
      const updatedRequests = (groupData.request || []).map((req: any) => {
        if (req.uuid === request.uuid) {
          return { ...req, status: "rejected" };
        }
        return req;
      });

      // Update group
      const { error: updateError } = await supabase
        .from("groups")
        .update({
          request: updatedRequests,
        })
        .eq("group_id", groupId);

      if (updateError) throw updateError;

      // Update local state
      setPendingRequests((prev) => prev.filter((r) => r.uuid !== request.uuid));

      // Notify parent component
      onRequestProcessed();
    } catch (error) {
      console.error("Error rejecting request:", error);
    } finally {
      setProcessLoading((prev) => ({ ...prev, [request.uuid]: false }));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <View
        style={[styles.container, { backgroundColor: bgColor, borderColor }]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>
            Pending Requests
          </Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color={textColor} />
          </TouchableOpacity>
        </View>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={[styles.loadingText, { color: textColor }]}>
            Loading requests...
          </Text>
        </View>
      </View>
    );
  }

  if (pendingRequests.length === 0) {
    return (
      <View
        style={[styles.container, { backgroundColor: bgColor, borderColor }]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>
            Pending Requests
          </Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color={textColor} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <MaterialIcons name="info-outline" size={36} color={textColor} />
          <Text style={[styles.emptyText, { color: textColor }]}>
            No pending requests
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor, borderColor }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>
          Pending Requests ({pendingRequests.length})
        </Text>
        <TouchableOpacity onPress={onClose}>
          <MaterialIcons name="close" size={24} color={textColor} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.requestsList}>
        {pendingRequests.map((request) => (
          <View
            key={request.uuid}
            style={[styles.requestItem, { backgroundColor: cardBgColor }]}
          >
            <View style={styles.requestInfo}>
              <Text style={[styles.userName, { color: textColor }]}>
                {request.userData?.username ||
                  request.userData?.email ||
                  "Unknown User"}
              </Text>
              <Text style={styles.requestDate}>
                Requested on {formatDate(request.date)}
              </Text>
            </View>

            {isLeader && (
              <View style={styles.actions}>
                {processLoading[request.uuid] ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.acceptButton]}
                      onPress={() => handleAccept(request)}
                    >
                      <MaterialIcons name="check" size={18} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => handleReject(request)}
                    >
                      <MaterialIcons name="close" size={18} color="white" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  requestsList: {
    maxHeight: 300,
  },
  requestItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    margin: 8,
    borderRadius: 8,
  },
  requestInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "500",
  },
  requestDate: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  acceptButton: {
    backgroundColor: "#22C55E",
  },
  rejectButton: {
    backgroundColor: "#EF4444",
  },
  loaderContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    marginTop: 8,
  },
});

export default PendingRequestsPanel;
