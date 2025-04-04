import React, { useState, useEffect, useRef } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  StyleSheet,
  Modal,
  Text,
  Alert,
  ActivityIndicator,
} from "react-native";
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
import GroupStateDisplay from "../../../components/map/GroupStateDisplay";
import GroupHeader from "../../../components/map/GroupHeader";
import GroupMap from "../../../components/map/GroupMap";
import MapToolControls from "../../../components/map/MapToolControls";
import JourneyControls from "../../../components/map/JourneyControls";
import RouteInfo from "../../../components/map/RouteInfo";
import GroupMembersPanel from "../../../components/map/GroupMembersPanel";
import JoinGroupButton from "../../../components/groups/joinGroup/JoinGroupButton";
import CustomMapMarkerForm from "../../../components/map/CustomMapMarkerForm";
import CustomMapClickForm from "../../../components/map/CustomMapClickForm";
import { useColors } from "../../../contexts/ColorContext";

// Types
import {
  Group,
  MemberWithLocation,
  Region,
  CustomMarker,
} from "../../../types/group";
import { MapProvider } from "@/contexts/MapContext";
import { MaterialIcons } from "@expo/vector-icons";

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
  const [pendingCount, setPendingCount] = useState(0);
  const [initialRegion, setInitialRegion] = useState<Region | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isFollowingActive, setIsFollowingActive] = useState(false);
  const [isMarkerModeActive, setIsMarkerModeActive] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<CustomMarker | null>(
    null
  );
  const [showMarkerDetails, setShowMarkerDetails] = useState(false);

  const colors = useColors();

  // Colors
  const bgColor = colors.bgColor;
  const textColor = colors.textColor;
  const borderColor = colors.borderColor;
  const cardBgColor = colors.cardBgColor;
  const buttonColor = colors.buttonBgColor;

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
    addWaypoint,
    removeWaypoint,
    isUserWaypoint,
    getUserWaypointMarkers,
    showMarkerFormAtLocation,
    closeMarkerForm,
    clearAllWaypoints,
  } = useMapMarkers(
    userDetails?.username || "",
    userDetails?.id || "",
    group?.group_id || 0
  );

  const {
    journeyState,
    activeRoute,
    routeError,
    routeOriginName,
    routeDestinationName,
    startJourney,
    endJourney,
    setFollowedMember,
    addWaypoint: addJourneyWaypoint,
    removeWaypoint: removeJourneyWaypoint,
    clearWaypoints,
  } = useJourney({
    members: membersWithLocations,
    groupType: group?.group_type || "TravelToDestination",
    destination: destination,
    currentUserId: userDetails?.id || "",
    groupId: group?.group_id || 0,
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
              // Check if current user was kicked
              if (
                userDetails &&
                !updatedGroup.group_members.includes(userDetails.id)
              ) {
                Alert.alert(
                  "Kicked from Group",
                  "You have been removed from this group.",
                  [
                    {
                      text: "OK",
                      onPress: async () => {
                        await refreshGroups();
                        router.replace("/groups");
                      },
                    },
                  ]
                );
                return;
              }

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
  }, [code, group, userDetails]);

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
    if (
      !mapRef.current ||
      (membersWithLocations.length === 0 &&
        !destination &&
        markers.length === 0)
    )
      return;

    const coordinatesToFit = [];

    // Add members with locations
    const validMembers = membersWithLocations.filter((m) => m.location);
    if (validMembers.length > 0) {
      coordinatesToFit.push(
        ...validMembers.map((m) => ({
          latitude: m.location!.latitude,
          longitude: m.location!.longitude,
          avatar: m.avatar_url,
        }))
      );
    }

    // Add destination if exists
    if (destination) {
      coordinatesToFit.push({
        latitude: destination.latitude,
        longitude: destination.longitude,
      });
    }

    // Add custom markers
    if (markers.length > 0) {
      coordinatesToFit.push(
        ...markers.map((m) => ({
          latitude: m.latitude,
          longitude: m.longitude,
        }))
      );
    }

    if (coordinatesToFit.length > 0) {
      mapRef.current.fitToCoordinates(coordinatesToFit, {
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

  // Create a temporary marker at the tapped location
  const handleMapPress = (event: any) => {
    // Only handle map press if marker mode is active
    if (isUserMember() && isMarkerModeActive) {
      const coordinate = event.nativeEvent.coordinate;

      if (coordinate) {
        console.log("Adding marker at:", coordinate);

        // Show the form to edit the marker details
        showMarkerFormAtLocation(coordinate);
      } else {
        console.error("No coordinate found in map press event");
      }
    }
  };

  const handleMapLongPress = (event: any) => {
    // Delegate to regular press handler
    handleMapPress(event);
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

  const goToUserLocation = () => {
    if (!userLocation || !mapRef.current) return;

    mapRef.current.animateToRegion(
      {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      500
    );
  };

  // Handle map ready event
  const handleMapReady = () => {
    setIsMapReady(true);
  };

  // Toggle marker mode
  const toggleMarkerMode = () => {
    const newMode = !isMarkerModeActive;
    setIsMarkerModeActive(newMode);
    // No alert is displayed anymore
  };

  // Wrap the closeMarkerForm to also turn off marker mode
  const handleCloseMarkerForm = () => {
    // If user exits without saving, marker won't be created
    closeMarkerForm();
    setIsMarkerModeActive(false);
  };

  const handleMemberKicked = (memberId: string) => {
    // If the current user was kicked, show a popup and navigate away
    if (memberId === userDetails?.id) {
      Alert.alert(
        "Kicked from Group",
        "You have been removed from this group.",
        [
          {
            text: "OK",
            onPress: async () => {
              // Refresh groups before navigating
              await refreshGroups();
              router.replace("/groups");
            },
          },
        ]
      );
      return;
    }

    // Update the members list
    setMembers((prevMembers) =>
      prevMembers.filter((member) => member.id !== memberId)
    );
  };

  const handleMarkerPress = (marker: CustomMarker) => {
    setSelectedMarker(marker);
    setShowMarkerDetails(true);
  };

  // Updated function to handle adding a waypoint
  const handleAddWaypoint = (marker: CustomMarker) => {
    // Update in database via useMapMarkers
    addWaypoint(marker);

    // Also update journey state for immediate route recalculation
    addJourneyWaypoint(marker);
  };

  // Updated function to handle removing a waypoint
  const handleRemoveWaypoint = (marker: CustomMarker) => {
    // Update in database via useMapMarkers
    removeWaypoint(marker);

    // Also update journey state for immediate route recalculation
    removeJourneyWaypoint(marker);
  };

  // Handler for clearing all waypoints
  const handleClearAllWaypoints = async () => {
    try {
      // Clear waypoints in the database
      await clearAllWaypoints();

      // Also clear waypoints in journey state
      clearWaypoints();

      console.log("All waypoints cleared successfully");
    } catch (error) {
      console.error("Error clearing waypoints:", error);
      Alert.alert("Error", "Failed to clear all waypoints. Please try again.");
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
    <MapProvider>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: bgColor }}
        edges={["top", "right", "left"]}
      >
        <View style={[styles.container, { backgroundColor: "transparent" }]}>
          {/* Group Header */}
          <GroupHeader
            groupName={group.group_name}
            groupCode={group.group_code}
            onBack={() => router.back()}
            textColor={textColor}
            borderColor={borderColor}
            backgroundColor={bgColor}
            isJourneyActive={journeyState.isActive}
            distance={activeRoute?.distance || ""}
            duration={activeRoute?.duration || ""}
            routeError={routeError}
          />

          {/* Map View */}
          {initialRegion && (
            <GroupMap
              mapRef={mapRef}
              initialRegion={initialRegion}
              destination={destination}
              currentUserId={userDetails?.id || ""}
              customMarkers={markers}
              journeyState={journeyState}
              mapStyle={mapStyle}
              isDark={isDark}
              onMapPress={handleMapPress}
              onMapLongPress={handleMapLongPress}
              onMarkerEdit={editMarker}
              onMarkerDelete={deleteMarker}
              onMapReady={handleMapReady}
              members={membersWithLocations}
              userLocation={userLocation || undefined}
              onMarkerPress={handleMarkerPress}
            />
          )}

          {/* Map Tool Controls */}
          <MapToolControls
            onFitMarkers={fitToMarkers}
            onAddMarker={toggleMarkerMode}
            isMarkerModeActive={isMarkerModeActive}
            onToggleMembersList={() => setShowMembersList(true)}
            onToggleFollowMode={handleToggleFollowMode}
            onGoToMyLocation={goToUserLocation}
            isFollowingActive={isFollowingActive}
            pendingRequestsCount={0} // Hide pending requests indicator
            onShowPendingRequests={() => {}} // Disabled
            isLeader={false} // Disable leader-specific controls
            textColor={textColor}
            borderColor={borderColor}
            bgColor={cardBgColor}
          />

          {/* Marker Mode Indicator */}
          {isMarkerModeActive && (
            <View
              style={[
                styles.markerModeIndicator,
                { backgroundColor: "#10B981" },
              ]}
            >
              <Text style={styles.markerModeText}>
                Tap anywhere on the map to add a marker
              </Text>
            </View>
          )}

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
                  if (isUserLeader()) {
                    // Leaders can start journey without following anyone
                    startJourney();
                  } else {
                    // Non-leader automatically follows the leader
                    const leader = membersWithLocations.find(
                      (m) => m.id === group.leader_id && m.location
                    );

                    if (leader) {
                      startJourney(leader.id);
                    } else {
                      alert(
                        "Leader is not online. Wait for the leader to come online and accept your request."
                      );
                    }
                  }
                } else if (group.group_type === "TravelToDestination") {
                  // For TravelToDestination, leaders need either a destination or waypoints
                  if (
                    isUserLeader() &&
                    !group.destination_id &&
                    journeyState.waypoints.length === 0
                  ) {
                    Alert.alert(
                      "No Destination Set",
                      "There is no destination set for this journey. Add waypoints on the map to create a route.",
                      [{ text: "OK" }]
                    );
                  } else {
                    // Start journey with either destination or waypoints
                    startJourney();
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
              waypoints={journeyState.waypoints}
              onClearWaypoints={handleClearAllWaypoints}
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
              groupId={group.group_id}
              isLeader={isUserLeader()}
              members={membersWithLocations}
              leaderId={group.leader_id}
              currentUserId={userDetails?.id || ""}
              destination={destination}
              textColor={textColor}
              cardBgColor={cardBgColor}
              createdBy={group.created_by}
              onMemberSelect={handleMemberSelect}
              onClose={() => setShowMembersList(false)}
              onMemberKicked={handleMemberKicked}
            />
          </Modal>

          {/* Existing Marker Form for adding new markers */}
          <CustomMapMarkerForm
            visible={showAddMarkerForm}
            onClose={handleCloseMarkerForm}
            onAddMarker={addMarker}
            locationCoordinates={
              markerLocation || { latitude: 0, longitude: 0 }
            }
            username={userDetails?.username || ""}
            textColor={textColor}
            bgColor={bgColor}
            borderColor={borderColor}
            buttonColor={buttonColor}
          />

          {/* New Marker Details Form */}
          {selectedMarker && (
            <>
              <CustomMapClickForm
                visible={showMarkerDetails && !!selectedMarker}
                onClose={() => setShowMarkerDetails(false)}
                onEditMarker={editMarker}
                onDeleteMarker={deleteMarker}
                onAddWaypoint={handleAddWaypoint}
                onRemoveWaypoint={handleRemoveWaypoint}
                onStartJourney={() => {
                  if (isUserLeader()) {
                    // Leader starts a navigation journey without following anyone
                    startJourney();
                  } else {
                    // Regular member follows the leader
                    const leader = membersWithLocations.find(
                      (m) => m.id === group.leader_id
                    );
                    if (leader && leader.location) {
                      startJourney(leader.id);
                    } else {
                      alert(
                        "Leader is not online. Wait for the leader to come online."
                      );
                    }
                  }
                }}
                marker={selectedMarker!}
                bgColor={cardBgColor}
                textColor={textColor}
                borderColor={borderColor}
                buttonColor={buttonColor}
                isCurrentUserCreator={
                  selectedMarker
                    ? selectedMarker.userId === userDetails?.id
                    : false
                }
                isWaypoint={
                  selectedMarker ? isUserWaypoint(selectedMarker.id) : false
                }
                isLeader={isUserLeader()}
              />

              {/* 
                Waypoint Functionality:
                - When a user clicks on a marker, CustomMapClickForm shows with "Add as Waypoint" button
                - When clicked, the marker is added to journeyState.waypoints via addWaypoint function
                - If journey is active, route is recalculated including the waypoint
                - Waypoints are displayed in JourneyControls component
                - Users can clear all waypoints using the Clear All button
                - Leader can start navigation with the waypoint
                - Other members can navigate to the leader through the waypoint
              */}
            </>
          )}
        </View>
      </SafeAreaView>
    </MapProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  markerModeIndicator: {
    position: "absolute",
    top: 150,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  markerModeText: {
    color: "white",
    fontWeight: "500",
  },
});

export default GroupMapScreen;
