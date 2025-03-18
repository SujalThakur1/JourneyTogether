import React, { useState, useEffect, useRef } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { View, StyleSheet, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView from "react-native-maps";
import { supabase } from "../../../lib/supabase";
import { useApp } from "../../../contexts/AppContext";
import {
  checkAndRequestLocationPermission,
  getGroupMembersLocations,
} from "../../../lib/locationService";
import { useColorModeContext } from "../../../contexts/ColorModeContext";
import { useGroups } from "../../../contexts/GroupsContext";

// Custom hooks
import { useJourney } from "../../../hooks/useJourney";
import { useMapMarkers } from "../../../hooks/useMapMarkers";

// Components
import GroupStateDisplay from "../../../components/groups/GroupStateDisplay";
import GroupHeader from "../../../components/groups/GroupHeader";
import GroupStats from "../../../components/groups/GroupStats";
import GroupMap from "../../../components/groups/GroupMap";
import MapToolControls from "../../../components/groups/MapToolControls";
import JourneyControls from "../../../components/groups/JourneyControls";
import RouteInfo from "../../../components/groups/RouteInfo";
import GroupMembersPanel from "../../../components/groups/GroupMembersPanel";
import PendingRequestsPanel from "../../../components/groups/PendingRequestsPanel";
import JoinGroupButton from "../../../components/groups/JoinGroupButton";
import CustomMapMarkerForm from "../../../components/groups/CustomMapMarkerForm";

// Types
import { Group, MemberWithLocation, Region } from "../../../types/group";

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
  const [destination, setDestination] = useState<any | null>(null);
  const [leader, setLeader] = useState<any | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [membersWithLocations, setMembersWithLocations] = useState<
    MemberWithLocation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMembersList, setShowMembersList] = useState(false);
  const [showPendingRequests, setShowPendingRequests] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [initialRegion, setInitialRegion] = useState<Region | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isFollowingActive, setIsFollowingActive] = useState(false);

  // Colors
  const bgColor = isDark ? "#1F2937" : "white";
  const textColor = isDark ? "#F3F4F6" : "#1F2937";
  const borderColor = isDark ? "#4B5563" : "#E5E7EB";
  const cardBgColor = isDark ? "#374151" : "#F9FAFB";
  const buttonColor = isDark ? "#3B82F6" : "#2563EB";

  // Dark mode map style
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
        // ...more map style config (truncated for brevity)
      ]
    : undefined;

  // Initialize custom hooks
  const {
    markers,
    showAddMarkerForm,
    markerLocation,
    addMarker,
    editMarker,
    deleteMarker,
    showMarkerFormAtLocation,
    closeMarkerForm,
  } = useMapMarkers(userDetails?.username || "");

  const {
    journeyState,
    activeRoute,
    routeError,
    routeOriginName,
    routeDestinationName,
    startJourney,
    endJourney,
    setFollowedMember,
  } = useJourney({
    members: membersWithLocations,
    groupType: group?.group_type || "TravelToDestination",
    destination: destination,
    currentUserId: userDetails?.id || "",
  });

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
            (req: any) => req.status === "pending"
          );
          setPendingCount(pendingRequests.length);
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

        const { data: leaderData } = await supabase
          .from("users")
          .select("id, username, avatar_url, email")
          .eq("id", groupData.leader_id)
          .single();

        if (leaderData) setLeader(leaderData);

        if (groupData.group_members && groupData.group_members.length > 0) {
          const { data: membersData } = await supabase
            .from("users")
            .select("id, username, avatar_url, email")
            .in("id", groupData.group_members);

          if (membersData) setMembers(membersData);
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

  // Update member locations
  useEffect(() => {
    const updateMemberLocations = async () => {
      if (!group || !members.length) return;

      try {
        const locationsData = await getGroupMembersLocations(
          group.group_members
        );

        const membersWithLoc = members.map((member) => ({
          ...member,
          location: locationsData[member.id],
          isLeader: member.id === group.leader_id,
          isCurrentUser: member.id === userDetails?.id,
        }));

        setMembersWithLocations(membersWithLoc);

        // Set initial region if not already set
        if (!initialRegion) {
          const validLocations = membersWithLoc.filter((m) => m.location);
          if (destination) {
            setInitialRegion({
              latitude: destination.latitude,
              longitude: destination.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            });
          } else if (validLocations.length > 0) {
            const firstMember = validLocations[0];
            if (firstMember.location) {
              setInitialRegion({
                latitude: firstMember.location.latitude,
                longitude: firstMember.location.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              });
            }
          } else if (userLocation) {
            setInitialRegion({
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            });
          }
        }
      } catch (error) {
        console.error("Error updating member locations:", error);
      }
    };

    updateMemberLocations();
    const intervalId = setInterval(updateMemberLocations, 10000);
    return () => clearInterval(intervalId);
  }, [group, members, userLocation, destination, initialRegion, userDetails]);

  // Set up real-time subscription to group data
  useEffect(() => {
    if (!code) return;

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
              setGroup(updatedGroup);

              // Update pending count
              if (updatedGroup.request && updatedGroup.request.length > 0) {
                const pendingRequests = updatedGroup.request.filter(
                  (req: any) => req.status === "pending"
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

  // Start tracking location if user is a member
  useEffect(() => {
    if (isUserMember() && userDetails) {
      startTrackingLocation();
    }
  }, [group, userDetails]);

  // Follow user's location when isFollowingActive is true
  useEffect(() => {
    if (!isFollowingActive || !userLocation || !mapRef.current) return;

    const interval = setInterval(() => {
      if (isFollowingActive && userLocation && mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          500
        );
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isFollowingActive, userLocation]);

  // Helper Functions
  const isUserMember = () => {
    if (!group || !userDetails) return false;
    return group.group_members.includes(userDetails.id);
  };

  const isUserLeader = () => {
    if (!group || !userDetails) return false;
    return group.leader_id === userDetails.id;
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

      if (!hasLocationPermission) {
        return;
      }
    } catch (error) {
      console.error("Error joining group:", error);
    }
  };

  const fitToMarkers = () => {
    if (!mapRef.current || membersWithLocations.length === 0) return;

    const markers = [];

    // Add members with locations
    const validMembers = membersWithLocations.filter((m) => m.location);
    if (validMembers.length > 0) {
      markers.push(
        ...validMembers.map((m) => ({
          latitude: m.location!.latitude,
          longitude: m.location!.longitude,
        }))
      );
    }

    // Add destination if exists
    if (destination) {
      markers.push({
        latitude: destination.latitude,
        longitude: destination.longitude,
      });
    }

    // Add custom markers
    if (markers.length > 0) {
      markers.push(
        ...markers.map((m) => ({
          latitude: m.latitude,
          longitude: m.longitude,
        }))
      );
    }

    if (markers.length > 0) {
      mapRef.current.fitToCoordinates(markers, {
        edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
        animated: true,
      });
    }
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

  const handleMapPress = (event: any) => {
    // Only allow adding markers if user is a member
    if (isUserMember() && event.nativeEvent.action === "press") {
      const { coordinate } = event.nativeEvent;
      showMarkerFormAtLocation(coordinate.latitude, coordinate.longitude);
    }
  };

  const handleToggleFollowMode = () => {
    setIsFollowingActive(!isFollowingActive);
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
        setPendingCount(
          (updatedGroup.request || []).filter(
            (r: any) => r.status === "pending"
          ).length
        );

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

  // Render state components
  if (loading || error || !group) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
        <GroupStateDisplay
          loading={loading}
          error={error}
          notFound={!group && !loading && !error}
          bgColor={bgColor}
          textColor={textColor}
          buttonColor={buttonColor}
          onGoBack={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: bgColor }}
      edges={["top", "right", "left"]}
    >
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        {/* Group Header */}
        <GroupHeader
          groupName={group.group_name}
          groupCode={group.group_code}
          onBack={() => router.back()}
          textColor={textColor}
          borderColor={borderColor}
          backgroundColor={bgColor}
        />

        {/* Group Stats */}
        <GroupStats
          group={group}
          onlineCount={membersWithLocations.filter((m) => m.location).length}
          pendingCount={pendingCount}
          showPending={isUserLeader()}
          textColor={textColor}
          bgColor={cardBgColor}
          borderColor={borderColor}
        />

        {/* Map View */}
        {initialRegion && (
          <GroupMap
            mapRef={mapRef}
            initialRegion={initialRegion}
            members={membersWithLocations}
            destination={destination}
            currentUserId={userDetails?.id || ""}
            customMarkers={markers}
            journeyState={journeyState}
            mapStyle={mapStyle}
            isDark={isDark}
            onMapPress={handleMapPress}
            onMarkerEdit={editMarker}
            onMarkerDelete={deleteMarker}
            onMapReady={() => setIsMapReady(true)}
          />
        )}

        {/* Map Tool Controls */}
        <MapToolControls
          onFitMarkers={fitToMarkers}
          onAddMarker={() =>
            showMarkerFormAtLocation(
              initialRegion?.latitude || 0,
              initialRegion?.longitude || 0
            )
          }
          onToggleMembersList={() => setShowMembersList(true)}
          onToggleFollowMode={handleToggleFollowMode}
          isFollowingActive={isFollowingActive}
          pendingRequestsCount={pendingCount}
          onShowPendingRequests={() => setShowPendingRequests(true)}
          isLeader={isUserLeader()}
          textColor={textColor}
          borderColor={borderColor}
          bgColor={cardBgColor}
        />

        {/* Route Info Card */}
        <RouteInfo
          visible={journeyState.isActive && !!activeRoute}
          distance={activeRoute?.distance || ""}
          duration={activeRoute?.duration || ""}
          originName={routeOriginName}
          destinationName={routeDestinationName}
          routeError={routeError}
          onClose={() => endJourney()}
          textColor={textColor}
          bgColor={cardBgColor}
          borderColor={borderColor}
        />

        {/* Journey Controls for members */}
        {isUserMember() && (
          <JourneyControls
            groupId={group.group_id}
            groupName={group.group_name}
            members={membersWithLocations}
            isLeader={isUserLeader()}
            isJourneyActive={journeyState.isActive}
            isFollowJourney={group.group_type === "FollowMember"}
            followedMemberId={journeyState.followedMemberId}
            destinationId={group.destination_id}
            onJourneyStart={() => {
              // For FollowMember type, we need to select someone to follow if not already set
              if (
                group.group_type === "FollowMember" &&
                !journeyState.followedMemberId
              ) {
                // Find a non-current user to follow
                const otherMembers = membersWithLocations.filter(
                  (m) => m.id !== userDetails?.id && m.location
                );

                if (otherMembers.length > 0) {
                  // Start following the first member with location
                  startJourney(otherMembers[0].id);
                } else {
                  // No one to follow
                  alert(
                    "No members available to follow. Make sure other members are online."
                  );
                }
              } else {
                // Regular destination journey or follow journey with member already selected
                startJourney(journeyState.followedMemberId);
              }
            }}
            onJourneyEnd={endJourney}
            onFollowMember={setFollowedMember}
            onUpdateMembers={handleRequestProcessed}
            textColor={textColor}
            buttonColor={buttonColor}
            borderColor={borderColor}
            bgColor={bgColor}
          />
        )}

        {/* Join Button for non-members */}
        {!isUserMember() && (
          <JoinGroupButton onJoin={joinGroup} buttonColor={buttonColor} />
        )}

        {/* Modals */}
        <Modal
          visible={showMembersList}
          transparent
          animationType="slide"
          onRequestClose={() => setShowMembersList(false)}
        >
          <GroupMembersPanel
            members={membersWithLocations}
            leaderId={group.leader_id}
            currentUserId={userDetails?.id || ""}
            textColor={textColor}
            cardBgColor={cardBgColor}
            onMemberSelect={handleMemberSelect}
            onClose={() => setShowMembersList(false)}
          />
        </Modal>

        <Modal
          visible={showPendingRequests && isUserLeader()}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPendingRequests(false)}
        >
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
        </Modal>

        {/* Custom Marker Form */}
        {markerLocation && (
          <CustomMapMarkerForm
            visible={showAddMarkerForm}
            onClose={closeMarkerForm}
            onAddMarker={addMarker}
            locationCoordinates={markerLocation}
            username={userDetails?.username || "Unknown"}
            textColor={textColor}
            bgColor={bgColor}
            borderColor={borderColor}
            buttonColor={buttonColor}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default GroupMapScreen;
