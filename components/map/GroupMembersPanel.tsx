import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
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
  destination?: { latitude: number; longitude: number } | null;
  textColor: string;
  cardBgColor: string;
  onMemberSelect?: (member: MemberWithLocation) => void;
  onClose: () => void;
}

const { height } = Dimensions.get("window");

const GroupMembersPanel = ({
  members,
  leaderId,
  currentUserId,
  destination,
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

  // Calculate distance in kilometers between two coordinates
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
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

      if (distance < 1) {
        return `${Math.round(distance * 1000)} m from destination`;
      } else {
        return `${distance.toFixed(1)} km from destination`;
      }
    } catch (error) {
      console.error("Error calculating distance:", error);
      return null;
    }
  };

  const onlineMembers = members.filter((m) => m.location);
  const offlineMembers = members.filter((m) => !m.location);

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
            Group Members ({members.length})
          </Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color={textColor} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.membersList}>
          {onlineMembers.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Online ({onlineMembers.length})
              </Text>
              {onlineMembers.map((member) => {
                const distanceText = getDistanceText(member.location);

                return (
                  <TouchableOpacity
                    key={member.id}
                    onPress={() =>
                      onMemberSelect && member.location
                        ? onMemberSelect(member)
                        : null
                    }
                    style={styles.memberItem}
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

                      <View style={styles.statusContainer}>
                        <View style={styles.onlineIndicator} />
                        <Text style={styles.onlineText}>Online</Text>
                      </View>

                      {distanceText && (
                        <Text style={styles.distanceText}>{distanceText}</Text>
                      )}
                    </View>

                    <MaterialIcons
                      name="navigate-next"
                      size={24}
                      color={textColor}
                    />
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          {offlineMembers.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Offline ({offlineMembers.length})
              </Text>
              {offlineMembers.map((member) => (
                <View
                  key={member.id}
                  style={[styles.memberItem, { opacity: 0.6 }]}
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
                          opacity: 0.6,
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

                    <Text style={styles.offlineText}>Offline</Text>
                  </View>
                </View>
              ))}
            </>
          )}

          {members.length === 0 && (
            <Text style={[styles.emptyText, { color: textColor }]}>
              No members in this group
            </Text>
          )}
        </ScrollView>
      </View>
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
    paddingBottom: 30, // Add extra padding for iPhone home indicator
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
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 16,
    marginVertical: 12,
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
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22C55E",
    marginRight: 6,
  },
  onlineText: {
    fontSize: 14,
    color: "#22C55E",
  },
  offlineText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
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
});

export default GroupMembersPanel;
