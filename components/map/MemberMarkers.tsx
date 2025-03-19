import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Marker, Callout } from "react-native-maps";
import { MaterialIcons } from "@expo/vector-icons";
import { MemberWithLocation } from "../../types/group";

interface MemberMarkersProps {
  members: MemberWithLocation[];
  followedMemberId?: string;
  destination?: { latitude: number; longitude: number } | null;
  isDark: boolean;
}

const MemberMarkers: React.FC<MemberMarkersProps> = ({
  members,
  followedMemberId,
  destination,
  isDark,
}) => {
  // Filter out members without location data
  const membersWithLocation = members.filter((member) => member.location);

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

  const getDistanceText = (memberLocation: any) => {
    if (!destination) return null;

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

  const bgColor = isDark ? "#374151" : "#FFFFFF";
  const textColor = isDark ? "#F3F4F6" : "#1F2937";
  const borderColor = isDark ? "#4B5563" : "#E5E7EB";

  return (
    <>
      {membersWithLocation.map((member) => {
        if (!member.location) return null;

        const isFollowed = member.id === followedMemberId;
        const isCurrentUser = member.isCurrentUser;
        const distanceText = destination
          ? getDistanceText(member.location)
          : null;

        return (
          <Marker
            key={member.id}
            coordinate={{
              latitude: member.location.latitude,
              longitude: member.location.longitude,
            }}
            pinColor={isFollowed ? "blue" : isCurrentUser ? "red" : "green"}
            title={member.username}
          >
            <Callout tooltip>
              <View
                style={[
                  styles.callout,
                  { backgroundColor: bgColor, borderColor },
                ]}
              >
                <Text style={[styles.calloutTitle, { color: textColor }]}>
                  {member.username}
                  {member.isLeader && " (Leader)"}
                  {isCurrentUser && " (You)"}
                </Text>

                <View style={styles.statusRow}>
                  <MaterialIcons name="access-time" size={14} color="#22C55E" />
                  <Text style={styles.statusText}>Online</Text>
                </View>

                {distanceText && (
                  <View style={styles.statusRow}>
                    <MaterialIcons name="place" size={14} color="#F59E0B" />
                    <Text style={styles.distanceText}>{distanceText}</Text>
                  </View>
                )}
              </View>
            </Callout>
          </Marker>
        );
      })}
    </>
  );
};

const styles = StyleSheet.create({
  callout: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 150,
  },
  calloutTitle: {
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    color: "#22C55E",
    marginLeft: 4,
  },
  distanceText: {
    fontSize: 12,
    color: "#F59E0B",
    marginLeft: 4,
  },
});

export default MemberMarkers;
