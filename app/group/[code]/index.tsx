import React, { useEffect, useState, useRef } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
  Dimensions,
  Platform,
} from "react-native";
import { supabase } from "../../../lib/supabase";
import { MaterialIcons } from "@expo/vector-icons";
import { useApp } from "../../../contexts/AppContext";
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from "react-native-maps";
import * as Location from "expo-location";
import {
  getGroupMembersLocations,
  UserLocation,
  checkAndRequestLocationPermission,
} from "../../../lib/locationService";
import { useColorModeContext } from "../../../contexts/ColorModeContext";
import DestinationDetails from "../../../components/groups/DestinationDetails";
import { useGroups } from "../../../contexts/GroupsContext";

// Define types
interface Group {
  group_id: number;
  group_name: string;
  group_code: string;
  group_type: "TravelToDestination" | "FollowMember";
  destination_id: number | null;
  leader_id: string;
  group_members: string[];
  created_at: string;
}

interface Destination {
  destination_id: number;
  name: string;
  latitude: number;
  longitude: number;
  image_url?: string;
}

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

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

const GroupMapScreen = () => {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const { userDetails, userLocation, startTrackingLocation } = useApp();
  const mapRef = useRef<MapView>(null);
  const { effectiveColorMode } = useColorModeContext();
  const isDark = effectiveColorMode === "dark";
  const { fetchDestinationDetails } = useGroups();

  // State
  const [group, setGroup] = useState<Group | null>(null);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [leader, setLeader] = useState<User | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [membersWithLocations, setMembersWithLocations] = useState<
    MemberWithLocation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMembersList, setShowMembersList] = useState(false);
  const [initialRegion, setInitialRegion] = useState<Region | null>(null);

  // Colors
  const bgColor = isDark ? "#1F2937" : "white";
  const textColor = isDark ? "#F3F4F6" : "#1F2937";
  const borderColor = isDark ? "#4B5563" : "#E5E7EB";
  const cardBgColor = isDark ? "#374151" : "#F9FAFB";
  const mapStyle = isDark
    ? [
        { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
        {
          featureType: "administrative.locality",
          elementType: "labels.text.fill",
          stylers: [{ color: "#d59563" }],
        },
        {
          featureType: "poi",
          elementType: "labels.text.fill",
          stylers: [{ color: "#d59563" }],
        },
        {
          featureType: "poi.park",
          elementType: "geometry",
          stylers: [{ color: "#263c3f" }],
        },
        {
          featureType: "poi.park",
          elementType: "labels.text.fill",
          stylers: [{ color: "#6b9a76" }],
        },
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [{ color: "#38414e" }],
        },
        {
          featureType: "road",
          elementType: "geometry.stroke",
          stylers: [{ color: "#212a37" }],
        },
        {
          featureType: "road",
          elementType: "labels.text.fill",
          stylers: [{ color: "#9ca5b3" }],
        },
        {
          featureType: "road.highway",
          elementType: "geometry",
          stylers: [{ color: "#746855" }],
        },
        {
          featureType: "road.highway",
          elementType: "geometry.stroke",
          stylers: [{ color: "#1f2835" }],
        },
        {
          featureType: "road.highway",
          elementType: "labels.text.fill",
          stylers: [{ color: "#f3d19c" }],
        },
        {
          featureType: "transit",
          elementType: "geometry",
          stylers: [{ color: "#2f3948" }],
        },
        {
          featureType: "transit.station",
          elementType: "labels.text.fill",
          stylers: [{ color: "#d59563" }],
        },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#17263c" }],
        },
        {
          featureType: "water",
          elementType: "labels.text.fill",
          stylers: [{ color: "#515c6d" }],
        },
        {
          featureType: "water",
          elementType: "labels.text.stroke",
          stylers: [{ color: "#17263c" }],
        },
      ]
    : undefined;

  const isMapReady = Platform.OS === "web" || MapView !== null;

  // Fetch group data
  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        setLoading(true);

        if (!code) {
          setError("Group code is missing");
          setLoading(false);
          return;
        }

        const { data: groupData, error: groupError } = await supabase
          .from("groups")
          .select("*")
          .eq("group_code", code)
          .single();

        if (groupError) throw new Error(groupError.message);
        if (!groupData) {
          setError("Group not found");
          setLoading(false);
          return;
        }

        setGroup(groupData);

        if (groupData.destination_id) {
          try {
            const destinationData = await fetchDestinationDetails(
              groupData.destination_id
            );
            setDestination(destinationData);
          } catch (error) {
            console.error("Error fetching destination details:", error);
          }
        }

        const { data: leaderData, error: leaderError } = await supabase
          .from("users")
          .select("id, username, avatar_url, email")
          .eq("id", groupData.leader_id)
          .single();

        if (!leaderError && leaderData) setLeader(leaderData);

        if (groupData.group_members && groupData.group_members.length > 0) {
          const { data: membersData, error: membersError } = await supabase
            .from("users")
            .select("id, username, avatar_url, email")
            .in("id", groupData.group_members);

          if (!membersError && membersData) setMembers(membersData);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching group data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load group data"
        );
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [code]);

  // Fetch and update member locations
  useEffect(() => {
    if (!group || !members.length) return;

    const fetchMemberLocations = async () => {
      try {
        const memberIds = group.group_members;
        const locationsData = await getGroupMembersLocations(memberIds);

        const membersWithLoc = members.map((member) => ({
          ...member,
          location: locationsData[member.id],
          isLeader: member.id === group.leader_id,
          isCurrentUser: member.id === userDetails?.id,
        }));

        setMembersWithLocations(membersWithLoc);

        const validLocations = membersWithLoc.filter((m) => m.location);
        if (validLocations.length > 0) {
          if (destination) {
            setInitialRegion({
              latitude: destination.latitude,
              longitude: destination.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            });
          } else {
            const firstMember = validLocations[0];
            if (firstMember.location) {
              setInitialRegion({
                latitude: firstMember.location.latitude,
                longitude: firstMember.location.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              });
            }
          }
        } else if (userLocation) {
          setInitialRegion({
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        }
      } catch (error) {
        console.error("Error fetching member locations:", error);
      }
    };

    fetchMemberLocations();
    const intervalId = setInterval(fetchMemberLocations, 10000);
    return () => clearInterval(intervalId);
  }, [group, members, userLocation, destination]);

  // Start tracking location
  useEffect(() => {
    if (isUserMember() && userDetails) {
      startTrackingLocation();
    }
  }, [group, userDetails]);

  // Helper functions
  const shareGroupCode = async () => {
    if (!group) return;
    try {
      await Share.share({
        message: `Join my group "${group.group_name}" with code: ${group.group_code}`,
      });
    } catch (error) {
      console.error("Error sharing group code:", error);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const isUserMember = () => {
    if (!group || !userDetails) return false;
    return group.group_members.includes(userDetails.id);
  };

  const joinGroup = async () => {
    if (!group || !userDetails) return;

    try {
      // Check location permission before joining group
      const hasLocationPermission = await checkAndRequestLocationPermission(
        // Success callback
        async () => {
          const updatedMembers = [...group.group_members, userDetails.id];
          const { error } = await supabase
            .from("groups")
            .update({ group_members: updatedMembers })
            .eq("group_id", group.group_id);

          if (error) throw error;

          setGroup({ ...group, group_members: updatedMembers });
          const { data: membersData } = await supabase
            .from("users")
            .select("id, username, avatar_url, email")
            .in("id", updatedMembers);

          if (membersData) setMembers(membersData);
          startTrackingLocation();
        },
        // Cancel callback
        () => {
          console.log("User canceled location permission");
        }
      );

      // If permission check is handling the flow, we don't need to continue
      if (!hasLocationPermission) {
        return;
      }
    } catch (error) {
      console.error("Error joining group:", error);
    }
  };

  const fitToMarkers = () => {
    if (!mapRef.current || membersWithLocations.length === 0) return;
    const validMembers = membersWithLocations.filter((m) => m.location);
    if (validMembers.length === 0) return;

    const markers = validMembers
      .map((m) =>
        m.location
          ? { latitude: m.location.latitude, longitude: m.location.longitude }
          : null
      )
      .filter(Boolean) as { latitude: number; longitude: number }[];

    if (destination) {
      markers.push({
        latitude: destination.latitude,
        longitude: destination.longitude,
      });
    }

    mapRef.current.fitToCoordinates(markers, {
      edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
      animated: true,
    });
  };

  // Render states
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <Text style={{ color: textColor }}>Loading group map...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <MaterialIcons name="error-outline" size={64} color="#EF4444" />
        <Text style={[styles.errorText, { color: textColor }]}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!group) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <MaterialIcons name="group-off" size={64} color="#9CA3AF" />
        <Text style={[styles.errorText, { color: textColor }]}>
          Group not found
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {initialRegion && isMapReady ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={Platform.OS === "ios" ? undefined : PROVIDER_GOOGLE}
          initialRegion={initialRegion}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={true}
          customMapStyle={mapStyle}
        >
          {destination && (
            <Marker
              coordinate={{
                latitude: destination.latitude,
                longitude: destination.longitude,
              }}
              pinColor="red"
            >
              <Callout>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{destination.name}</Text>
                  <Text style={styles.calloutSubtitle}>Destination</Text>
                </View>
              </Callout>
            </Marker>
          )}

          {membersWithLocations.map((member) =>
            member.location ? (
              <Marker
                key={member.id}
                coordinate={{
                  latitude: member.location.latitude,
                  longitude: member.location.longitude,
                }}
                pinColor={
                  member.isLeader
                    ? "gold"
                    : member.isCurrentUser
                    ? "blue"
                    : "green"
                }
              >
                <View style={styles.markerAvatarContainer}>
                  <View
                    style={[
                      styles.markerAvatar,
                      {
                        backgroundColor: member.isLeader
                          ? "#FBBF24"
                          : member.isCurrentUser
                          ? "#3B82F6"
                          : "#22C55E",
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
                    </Text>
                  </View>
                </Callout>
              </Marker>
            ) : null
          )}
        </MapView>
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={{ color: textColor }}>Loading map...</Text>
        </View>
      )}

      {/* Header with Back Button */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: isDark
              ? "rgba(0,0,0,0.8)"
              : "rgba(255,255,255,0.8)",
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            {group.group_name}
          </Text>
          <View style={styles.headerInfo}>
            <Text style={[styles.headerCode, { color: textColor }]}>
              Code: <Text style={styles.bold}>{group.group_code}</Text>
            </Text>
            <TouchableOpacity onPress={shareGroupCode}>
              <MaterialIcons name="share" size={20} color={textColor} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#3B82F6" }]}
            onPress={fitToMarkers}
          >
            <MaterialIcons name="my-location" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: showMembersList ? "#EF4444" : "#3B82F6" },
            ]}
            onPress={() => setShowMembersList(!showMembersList)}
          >
            <MaterialIcons
              name={showMembersList ? "close" : "people"}
              size={20}
              color="white"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Members Panel */}
      {showMembersList && (
        <View
          style={[
            styles.membersPanel,
            {
              backgroundColor: isDark
                ? "rgba(26,32,44,0.9)"
                : "rgba(255,255,255,0.9)",
            },
          ]}
        >
          <View style={styles.membersHeader}>
            <Text style={[styles.membersTitle, { color: textColor }]}>
              Group Members ({members.length})
            </Text>
            <TouchableOpacity onPress={() => setShowMembersList(false)}>
              <MaterialIcons name="close" size={20} color={textColor} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.membersList}>
            {members.length > 0 ? (
              members.map((member) => {
                const memberWithLoc = membersWithLocations.find(
                  (m) => m.id === member.id
                );
                const hasLocation = memberWithLoc?.location !== undefined;

                return (
                  <TouchableOpacity
                    key={member.id}
                    onPress={() => {
                      if (
                        hasLocation &&
                        mapRef.current &&
                        memberWithLoc?.location
                      ) {
                        mapRef.current.animateToRegion(
                          {
                            latitude: memberWithLoc.location.latitude,
                            longitude: memberWithLoc.location.longitude,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                          },
                          1000
                        );
                        setShowMembersList(false);
                      }
                    }}
                    style={[
                      styles.memberItem,
                      {
                        backgroundColor: hasLocation
                          ? cardBgColor
                          : "transparent",
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.memberAvatar,
                        {
                          backgroundColor:
                            member.id === group.leader_id
                              ? "#FBBF24"
                              : "#3B82F6",
                        },
                      ]}
                    >
                      <Text style={styles.memberAvatarText}>
                        {getInitials(member.username)}
                      </Text>
                    </View>
                    <View>
                      <Text style={[styles.memberName, { color: textColor }]}>
                        {member.username}
                        {member.id === group.leader_id && (
                          <Text style={{ color: "#FBBF24" }}> (Leader)</Text>
                        )}
                        {member.id === userDetails?.id && (
                          <Text style={{ color: "#3B82F6" }}> (You)</Text>
                        )}
                      </Text>
                      <Text
                        style={[
                          styles.memberStatus,
                          { color: hasLocation ? "#22C55E" : "#6B7280" },
                        ]}
                      >
                        {hasLocation
                          ? "Location available"
                          : "No location data"}
                      </Text>
                    </View>
                    {hasLocation && (
                      <MaterialIcons
                        name="location-on"
                        size={20}
                        color="#22C55E"
                      />
                    )}
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={{ color: "#9CA3AF" }}>No members in this group</Text>
            )}
          </ScrollView>
          {!isUserMember() && (
            <TouchableOpacity style={styles.joinButton} onPress={joinGroup}>
              <MaterialIcons name="group-add" size={20} color="white" />
              <Text style={styles.joinButtonText}>Join Group</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View
        style={[
          styles.bottomSheet,
          { backgroundColor: cardBgColor, borderTopColor: borderColor },
        ]}
      >
        <View style={[styles.bottomSheetHandle]} />

        {/* Group Info Section */}
        <ScrollView style={styles.groupInfoSection}>
          <Text style={[styles.groupName, { color: textColor }]}>
            {group.group_name}
          </Text>
          <Text style={[styles.groupType]}>
            {group.group_type === "TravelToDestination"
              ? "Destination Group"
              : "Follow Group"}
          </Text>

          {/* Destination Details Section */}
          {group.group_type === "TravelToDestination" &&
            group.destination_id && (
              <View style={styles.destinationSection}>
                <DestinationDetails destinationId={group.destination_id} />
              </View>
            )}

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton]}
              onPress={shareGroupCode}
            >
              <MaterialIcons name="share" size={20} />
              <Text style={[styles.actionButtonText]}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton]}
              onPress={fitToMarkers}
            >
              <MaterialIcons name="my-location" size={20} />
              <Text style={[styles.actionButtonText]}>Fit Map</Text>
            </TouchableOpacity>
          </View>

          {/* Members Section */}
          <View style={styles.membersSection}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Group Members ({membersWithLocations.length})
            </Text>
            {membersWithLocations.map((member) => (
              <View
                key={member.id}
                style={[
                  styles.memberItem,
                  {
                    backgroundColor: cardBgColor,
                    borderColor: borderColor,
                  },
                ]}
              >
                <View
                  style={[
                    styles.memberAvatar,
                    {
                      backgroundColor:
                        member.id === group.leader_id ? "#FBBF24" : "#3B82F6",
                    },
                  ]}
                >
                  <Text style={styles.memberAvatarText}>
                    {getInitials(member.username)}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={[styles.memberName, { color: textColor }]}>
                    {member.username}
                    {member.id === group.leader_id && (
                      <Text style={{ color: "#FBBF24" }}> (Leader)</Text>
                    )}
                    {member.id === userDetails?.id && (
                      <Text style={{ color: "#3B82F6" }}> (You)</Text>
                    )}
                  </Text>
                  <Text
                    style={[
                      styles.memberStatus,
                      {
                        color: member.location ? "#22C55E" : "#6B7280",
                      },
                    ]}
                  >
                    {member.location
                      ? "Location available"
                      : "No location data"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#3B82F6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backButton: {
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  headerCode: {
    fontSize: 14,
  },
  bold: {
    fontWeight: "bold",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  membersPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "60%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  membersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  membersTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  membersList: {
    maxHeight: 300,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    gap: 12,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  memberAvatarText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  memberName: {
    fontSize: 16,
  },
  memberStatus: {
    fontSize: 12,
  },
  joinButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B82F6",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  joinButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
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
    padding: 4,
    width: 150,
  },
  calloutTitle: {
    fontWeight: "bold",
    fontSize: 14,
  },
  calloutSubtitle: {
    fontSize: 12,
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "40%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  bottomSheetHandle: {
    height: 4,
    width: 40,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginBottom: 8,
  },
  groupInfoSection: {
    flex: 1,
  },
  groupName: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  groupType: {
    fontSize: 14,
    color: "#6B7280",
  },
  destinationSection: {
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  buttonBgColor: {
    backgroundColor: "#3B82F6",
  },
  buttonTextColor: {
    color: "white",
  },
  subTextColor: {
    color: "#6B7280",
  },
  handleColor: {
    backgroundColor: "#E5E7EB",
  },
  membersSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  memberInfo: {
    flex: 1,
  },
});

export default GroupMapScreen;
