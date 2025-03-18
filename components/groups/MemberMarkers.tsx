import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Marker, Callout } from "react-native-maps";
import { MemberWithLocation } from "../../types/group";

interface MemberMarkersProps {
  members: MemberWithLocation[];
  followedMemberId?: string;
}

const MemberMarkers: React.FC<MemberMarkersProps> = ({
  members,
  followedMemberId,
}) => {
  // Helper function to get member initials
  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <>
      {members.map((member) =>
        member.location ? (
          <Marker
            key={member.id}
            coordinate={{
              latitude: member.location.latitude,
              longitude: member.location.longitude,
            }}
            pinColor={
              member.id === followedMemberId
                ? "gold" // Following this member
                : member.isLeader
                ? "orange" // Leader
                : member.isCurrentUser
                ? "blue" // Current user
                : "green" // Other member
            }
          >
            <View style={styles.markerAvatarContainer}>
              <View
                style={[
                  styles.markerAvatar,
                  {
                    backgroundColor:
                      member.id === followedMemberId
                        ? "#F59E0B" // Amber
                        : member.isLeader
                        ? "#FBBF24" // Yellow
                        : member.isCurrentUser
                        ? "#3B82F6" // Blue
                        : "#22C55E", // Green
                    borderColor: "white",
                  },
                ]}
              >
                <Text style={styles.markerAvatarText}>
                  {getInitials(member.username)}
                </Text>
              </View>
            </View>
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{member.username}</Text>
                <Text style={styles.calloutSubtitle}>
                  {member.isLeader ? "Group Leader" : "Member"}
                  {member.isCurrentUser ? " (You)" : ""}
                  {member.id === followedMemberId ? " (Following)" : ""}
                </Text>
              </View>
            </Callout>
          </Marker>
        ) : null
      )}
    </>
  );
};

const styles = StyleSheet.create({
  markerAvatarContainer: {
    alignItems: "center",
  },
  markerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  markerAvatarText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  callout: {
    padding: 8,
    width: 150,
  },
  calloutTitle: {
    fontWeight: "bold",
    fontSize: 14,
  },
  calloutSubtitle: {
    fontSize: 12,
    color: "#6B7280",
  },
});

export default MemberMarkers;
