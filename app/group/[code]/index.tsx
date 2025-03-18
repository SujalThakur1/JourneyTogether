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
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
import GroupActions from "../../../components/groups/GroupActions";
import GroupMembersPanel from "../../../components/groups/GroupMembersPanel";
import PendingRequestsPanel from "../../../components/groups/PendingRequestsPanel";

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
  request?: RequestMember[];
}

interface RequestMember {
  uuid: string;
  date: string;
  status: "pending" | "accepted" | "rejected";
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

// Component to display group members stats
const GroupMembersStats = ({
  group,
  bgColor,
  textColor,
  borderColor,
}: {
  group: Group | null;
  bgColor: string;
  textColor: string;
  borderColor: string;
}) => {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [acceptedCount, setPendingAccepted] = useState<number>(0);

  useEffect(() => {
    if (!group) return;

    // Set accepted members count
    setPendingAccepted(group.group_members.length);

    // Count pending requests
    if (group.request && group.request.length > 0) {
      const pendingMembers = group.request.filter(
        (r) => r.status === "pending"
      );
      setPendingCount(pendingMembers.length);
    } else {
      setPendingCount(0);
    }
  }, [group]);

  if (!group) return null;

  return (
    <View
      style={[styles.statsContainer, { backgroundColor: bgColor, borderColor }]}
    >
      <View style={styles.statsItem}>
        <Text style={[styles.statsValue, { color: textColor }]}>
          {acceptedCount}
        </Text>
        <Text style={[styles.statsLabel, { color: textColor }]}>Members</Text>
      </View>
      <View style={[styles.divider, { backgroundColor: borderColor }]} />
      <View style={styles.statsItem}>
        <Text style={[styles.statsValue, { color: textColor }]}>
          {pendingCount}
        </Text>
        <Text style={[styles.statsLabel, { color: textColor }]}>Pending</Text>
      </View>
    </View>
  );
};

const GroupMapScreen = () => {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const { userDetails, userLocation, startTrackingLocation } = useApp();
  const mapRef = useRef<MapView>(null);
  const { effectiveColorMode } = useColorModeContext();
  const isDark = effectiveColorMode === "dark";
  const { fetchDestinationDetails, refreshGroups } = useGroups();

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
  const [showPendingRequests, setShowPendingRequests] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [initialRegion, setInitialRegion] = useState<Region | null>(null);

  // Colors
  const bgColor = isDark ? "#1F2937" : "white";
  const textColor = isDark ? "#F3F4F6" : "#1F2937";
  const borderColor = isDark ? "#4B5563" : "#E5E7EB";
  const cardBgColor = isDark ? "#374151" : "#F9FAFB";
  const buttonColor = isDark ? "#3B82F6" : "#2563EB";
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

        // Count pending requests
        if (groupData.request && groupData.request.length > 0) {
          const pendingRequests = groupData.request.filter(
            (req: RequestMember) => req.status === "pending"
          );
          setPendingCount(pendingRequests.length);
        } else {
          setPendingCount(0);
        }

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

        // Set initial region logic
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

  // Start tracking location if user is a member
  useEffect(() => {
    if (isUserMember() && userDetails) {
      startTrackingLocation();
    }
  }, [group, userDetails]);

  // Set up real-time subscription to group data for notifications and updates
  useEffect(() => {
    if (!code) return;

    // Set up real-time subscription for group updates
    const groupSubscription = supabase
      .channel(`group-${code}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "groups",
          filter: `group_code=eq.${code}`,
        },
        async (payload) => {
          console.log("Real-time group update received:", payload);

          // Refresh the group data when changes are detected
          try {
            const { data: updatedGroup } = await supabase
              .from("groups")
              .select("*")
              .eq("group_code", code)
              .single();

            if (updatedGroup) {
              console.log("Updated group data:", updatedGroup);
              setGroup(updatedGroup);

              // Update pending count
              if (updatedGroup.request && updatedGroup.request.length > 0) {
                const pendingRequests = updatedGroup.request.filter(
                  (req: RequestMember) => req.status === "pending"
                );
                setPendingCount(pendingRequests.length);
              } else {
                setPendingCount(0);
              }

              // If members list changed, refresh member data
              if (
                updatedGroup.group_members &&
                JSON.stringify(updatedGroup.group_members) !==
                  JSON.stringify(group?.group_members)
              ) {
                const { data: membersData } = await supabase
                  .from("users")
                  .select("id, username, avatar_url, email")
                  .in("id", updatedGroup.group_members);

                if (membersData) setMembers(membersData);
              }

              // If leader changed, refresh leader data
              if (updatedGroup.leader_id !== group?.leader_id) {
                const { data: leaderData } = await supabase
                  .from("users")
                  .select("id, username, avatar_url, email")
                  .eq("id", updatedGroup.leader_id)
                  .single();

                if (leaderData) setLeader(leaderData);
              }
            }
          } catch (error) {
            console.error("Error refreshing group data:", error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(groupSubscription);
    };
  }, [code, group]);

  // Helper Functions
  const isUserMember = () => {
    if (!group || !userDetails) return false;
    return group.group_members.includes(userDetails.id);
  };

  const isUserLeader = () => {
    if (!group || !userDetails) return false;
    return group.leader_id === userDetails.id;
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
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

          // The group update will be handled by the real-time subscription
          startTrackingLocation();
          await refreshGroups();
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

  const handleMemberSelect = (member: MemberWithLocation) => {
    if (!mapRef.current || !member.location) return;

    mapRef.current.animateToRegion(
      {
        latitude: member.location.latitude,
        longitude: member.location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      500
    );

    setShowMembersList(false);
  };

  const handleRequestProcessed = async () => {
    try {
      const { data: updatedGroup } = await supabase
        .from("groups")
        .select("*")
        .eq("group_code", code)
        .single();

      if (updatedGroup) {
        setGroup(updatedGroup);

        // Update pending count
        if (updatedGroup.request && updatedGroup.request.length > 0) {
          const pendingRequests = updatedGroup.request.filter(
            (req: RequestMember) => req.status === "pending"
          );
          setPendingCount(pendingRequests.length);
        } else {
          setPendingCount(0);
        }

        // Refresh members if needed
        const { data: membersData } = await supabase
          .from("users")
          .select("id, username, avatar_url, email")
          .in("id", updatedGroup.group_members);

        if (membersData) setMembers(membersData);
      }
    } catch (error) {
      console.error("Error refreshing group data:", error);
    }
  };

  // Render loading, error, and not found states
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
        <View style={[styles.container, { backgroundColor: bgColor }]}>
          <Text style={{ color: textColor }}>Loading group map...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
        <View style={[styles.container, { backgroundColor: bgColor }]}>
          <MaterialIcons name="error-outline" size={64} color="#EF4444" />
          <Text style={[styles.errorText, { color: textColor }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: buttonColor }]}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
        <View style={[styles.container, { backgroundColor: bgColor }]}>
          <MaterialIcons name="group-off" size={64} color="#9CA3AF" />
          <Text style={[styles.errorText, { color: textColor }]}>
            Group not found
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: buttonColor }]}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: bgColor }}
      edges={["top", "right", "left"]}
    >
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            { borderBottomColor: borderColor, backgroundColor: bgColor },
          ]}
        >
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <MaterialIcons name="arrow-back" size={24} color={textColor} />
            </TouchableOpacity>
            <View>
              <Text style={[styles.groupName, { color: textColor }]}>
                {group.group_name}
              </Text>
              <Text style={[styles.groupCode, { color: textColor }]}>
                Code: {group.group_code}
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            {isUserLeader() && pendingCount > 0 && (
              <TouchableOpacity
                style={[styles.iconButton, { borderColor }]}
                onPress={() => setShowPendingRequests(true)}
              >
                <MaterialIcons
                  name="notifications-active"
                  size={22}
                  color={textColor}
                />
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingCount}</Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.iconButton, { borderColor }]}
              onPress={() => setShowMembersList(true)}
            >
              <MaterialIcons name="people" size={22} color={textColor} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconButton, { borderColor }]}
              onPress={fitToMarkers}
            >
              <MaterialIcons name="my-location" size={22} color={textColor} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Group Stats */}
        <View
          style={[
            styles.statsContainer,
            { backgroundColor: cardBgColor, borderColor },
          ]}
        >
          <View style={styles.statsItem}>
            <Text style={[styles.statsValue, { color: textColor }]}>
              {group.group_members.length}
            </Text>
            <Text style={[styles.statsLabel, { color: textColor }]}>
              Members
            </Text>
          </View>

          {isUserLeader() && (
            <>
              <View
                style={[styles.divider, { backgroundColor: borderColor }]}
              />
              <View style={styles.statsItem}>
                <Text style={[styles.statsValue, { color: textColor }]}>
                  {pendingCount}
                </Text>
                <Text style={[styles.statsLabel, { color: textColor }]}>
                  Pending
                </Text>
              </View>
            </>
          )}

          <View style={[styles.divider, { backgroundColor: borderColor }]} />
          <View style={styles.statsItem}>
            <Text style={[styles.statsValue, { color: textColor }]}>
              {membersWithLocations.filter((m) => m.location).length}
            </Text>
            <Text style={[styles.statsLabel, { color: textColor }]}>
              Online
            </Text>
          </View>
        </View>

        {/* Group Actions */}
        {isUserMember() && (
          <GroupActions
            groupId={group.group_id}
            groupName={group.group_name}
            isLeader={isUserLeader()}
            membersCount={group.group_members.length}
            textColor={textColor}
            borderColor={borderColor}
            buttonColor={buttonColor}
            bgColor={bgColor}
          />
        )}

        {/* Map View */}
        {initialRegion && isMapReady ? (
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={Platform.OS === "ios" ? undefined : PROVIDER_GOOGLE}
              initialRegion={initialRegion}
              showsUserLocation={true}
              showsMyLocationButton={false}
              showsCompass={true}
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
                      <Text style={styles.calloutTitle}>
                        {destination.name}
                      </Text>
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
                        <Text style={styles.calloutTitle}>
                          {member.username}
                        </Text>
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
          </View>
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={{ color: textColor }}>Loading map...</Text>
          </View>
        )}

        {/* Bottom Join Button for non-members */}
        {!isUserMember() && (
          <View style={styles.joinButtonContainer}>
            <TouchableOpacity
              style={[styles.joinButton, { backgroundColor: buttonColor }]}
              onPress={joinGroup}
            >
              <MaterialIcons name="person-add" size={24} color="white" />
              <Text style={styles.joinButtonText}>Join Group</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Modals */}
        <Modal
          visible={showMembersList}
          transparent
          animationType="slide"
          onRequestClose={() => setShowMembersList(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <GroupMembersPanel
                members={membersWithLocations}
                leaderId={group.leader_id}
                currentUserId={userDetails?.id}
                textColor={textColor}
                cardBgColor={cardBgColor}
                onMemberSelect={handleMemberSelect}
                onClose={() => setShowMembersList(false)}
              />
            </View>
          </View>
        </Modal>

        <Modal
          visible={showPendingRequests && isUserLeader()}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPendingRequests(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <PendingRequestsPanel
                groupId={group.group_id}
                requests={group.request || []}
                textColor={textColor}
                cardBgColor={cardBgColor}
                bgColor={bgColor}
                borderColor={borderColor}
                isLeader={isUserLeader()}
                onClose={() => setShowPendingRequests(false)}
                onRequestProcessed={handleRequestProcessed}
              />
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerRight: {
    flexDirection: "row",
    gap: 8,
  },
  backButton: {
    marginRight: 12,
  },
  groupName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  groupCode: {
    fontSize: 14,
    opacity: 0.8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#EF4444",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  statsContainer: {
    flexDirection: "row",
    marginVertical: 12,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "space-around",
    alignItems: "center",
  },
  statsItem: {
    alignItems: "center",
    flex: 1,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  statsLabel: {
    fontSize: 14,
    opacity: 0.8,
  },
  divider: {
    width: 1,
    height: 36,
  },
  mapContainer: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 12,
    margin: 16,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    margin: 16,
  },
  joinButtonContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  joinButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  joinButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 16,
  },
  modalContent: {
    borderRadius: 12,
    overflow: "hidden",
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

export default GroupMapScreen;
