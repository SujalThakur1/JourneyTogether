import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColors } from "../../contexts/ColorContext";
import { useGroups } from "../../contexts/GroupsContext";
import MapView, { Marker } from "react-native-maps";

interface GroupCardProps {
  group: {
    group_id: number;
    group_name: string;
    group_code: string;
    group_type: "TravelToDestination" | "FollowMember";
    destination_id: number | null;
    leader_id: string;
    group_members: string[];
    created_by: string;
    created_at: string;
  };
  isUserCreator: boolean;
}

const GroupCard: React.FC<GroupCardProps> = ({ group, isUserCreator }) => {
  const router = useRouter();
  const colors = useColors();
  const { fetchDestinationDetails } = useGroups();

  const [destinationDetails, setDestinationDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const memberCount = group.group_members.length;
  const isDestinationGroup = group.group_type === "TravelToDestination";

  // Fetch destination details if this is a destination group
  useEffect(() => {
    const loadDestinationDetails = async () => {
      if (isDestinationGroup && group.destination_id) {
        try {
          setLoading(true);
          const details = await fetchDestinationDetails(group.destination_id);
          setDestinationDetails(details);
        } catch (error) {
          console.error("Error fetching destination details:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadDestinationDetails();
  }, [isDestinationGroup, group.destination_id, fetchDestinationDetails]);

  const navigateToGroup = () => {
    router.push({
      pathname: "/group/[code]",
      params: { code: group.group_code },
    });
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.cardBgColor,
          borderColor: colors.cardBorderColor,
          shadowColor: colors.cardShadowColor,
        },
      ]}
      onPress={navigateToGroup}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.leftContent}>
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: isDestinationGroup
                  ? colors.destinationGroupColor
                  : colors.followGroupColor,
              },
            ]}
          >
            <Ionicons
              name={isDestinationGroup ? "location" : "people"}
              size={20}
              color="white"
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.groupName, { color: colors.textColor }]}>
              {group.group_name}
            </Text>
            <Text style={[styles.groupInfo, { color: colors.subTextColor }]}>
              {isDestinationGroup ? "Destination Group" : "Follow Group"} •{" "}
              {memberCount} {memberCount === 1 ? "member" : "members"}
            </Text>
            {isDestinationGroup && destinationDetails && (
              <Text
                style={[styles.destinationName, { color: colors.accentColor }]}
              >
                {destinationDetails.name}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.rightContent}>
          {isUserCreator && (
            <View
              style={[
                styles.creatorBadge,
                { backgroundColor: colors.accentColor },
              ]}
            >
              <Text style={styles.creatorText}>Creator</Text>
            </View>
          )}
          <MaterialIcons
            name="chevron-right"
            size={24}
            color={colors.chevronColor}
          />
        </View>
      </View>

      {/* Map for destination groups */}
      {isDestinationGroup &&
        destinationDetails &&
        destinationDetails.latitude &&
        destinationDetails.longitude && (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: destinationDetails.latitude,
                longitude: destinationDetails.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
            >
              <Marker
                coordinate={{
                  latitude: destinationDetails.latitude,
                  longitude: destinationDetails.longitude,
                }}
                title={destinationDetails.name}
              />
            </MapView>
          </View>
        )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  groupInfo: {
    fontSize: 14,
    marginBottom: 4,
  },
  destinationName: {
    fontSize: 14,
    fontWeight: "500",
  },
  rightContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  creatorBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  creatorText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  mapContainer: {
    height: 120,
    marginTop: 12,
    borderRadius: 8,
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
});

export default GroupCard;
