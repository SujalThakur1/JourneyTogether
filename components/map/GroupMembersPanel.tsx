import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { UserLocation } from "@/lib/locationService";

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

interface GroupMembersPanelProps {
  members: MemberWithLocation[];
  leaderId: string;
  currentUserId?: string;
  textColor: string;
  cardBgColor: string;
  onMemberSelect?: (member: MemberWithLocation) => void;
  onClose: () => void;
}

const GroupMembersPanel = ({
  members,
  leaderId,
  currentUserId,
  textColor,
  cardBgColor,
  onMemberSelect,
  onClose,
}: GroupMembersPanelProps) => {
  const getInitials = (name: string): string => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>
          Group Members ({members.length})
        </Text>
        <TouchableOpacity onPress={onClose}>
          <MaterialIcons name="close" size={24} color={textColor} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.membersList}>
        {members.length > 0 ? (
          members.map((member) => {
            const hasLocation = member.location !== undefined;

            return (
              <TouchableOpacity
                key={member.id}
                onPress={() =>
                  onMemberSelect && hasLocation ? onMemberSelect(member) : null
                }
                style={[
                  styles.memberItem,
                  {
                    backgroundColor: hasLocation ? cardBgColor : "transparent",
                    opacity: hasLocation ? 1 : 0.7,
                  },
                ]}
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
                    {member.id === leaderId && (
                      <Text style={{ color: "#FBBF24" }}> (Leader)</Text>
                    )}
                    {member.id === currentUserId && (
                      <Text style={{ color: "#3B82F6" }}> (You)</Text>
                    )}
                  </Text>

                  <Text
                    style={[
                      styles.locationStatus,
                      { color: hasLocation ? "#22C55E" : "#6B7280" },
                    ]}
                  >
                    {hasLocation ? "Location available" : "No location data"}
                  </Text>
                </View>

                {hasLocation && (
                  <MaterialIcons name="location-on" size={24} color="#22C55E" />
                )}

                {onMemberSelect && hasLocation && (
                  <MaterialIcons
                    name="navigate-next"
                    size={24}
                    color={textColor}
                  />
                )}
              </TouchableOpacity>
            );
          })
        ) : (
          <Text style={[styles.emptyText, { color: textColor }]}>
            No members in this group
          </Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  membersList: {
    maxHeight: 350,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  locationStatus: {
    fontSize: 14,
    marginTop: 2,
  },
  emptyText: {
    textAlign: "center",
    padding: 16,
    fontStyle: "italic",
  },
});

export default GroupMembersPanel;
