import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import {
  JourneyState,
  MemberRoute,
  MemberWithLocation,
  RouteInfo,
  CustomMarker,
} from "../types/group";
import {
  getDirections,
  getMemberToDestinationDirections,
  getMemberToMemberDirections,
} from "../lib/directionsService";
import { supabase } from "../lib/supabase";

interface UseJourneyProps {
  members: MemberWithLocation[];
  groupType: "TravelToDestination" | "FollowMember";
  destination?: { latitude: number; longitude: number; name: string } | null;
  currentUserId: string;
  groupId: number;
}

export const useJourney = ({
  members,
  groupType,
  destination,
  currentUserId,
  groupId,
}: UseJourneyProps) => {
  // Journey state
  const [journeyState, setJourneyState] = useState<JourneyState>({
    isActive: false,
    routes: [],
    waypoints: [],
  });

  // Route calculations and error handling
  const [activeRoute, setActiveRoute] = useState<RouteInfo | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeOriginName, setRouteOriginName] = useState("");
  const [routeDestinationName, setRouteDestinationName] = useState("");

  // Fetch waypoints for all members including current user
  const fetchWaypoints = useCallback(async () => {
    if (!groupId) return;

    try {
      const { data, error } = await supabase
        .from("mark_location")
        .select(
          "mark_id, latitude, longitude, location_name, description, followed_route_by"
        )
        .eq("group_id", groupId);

      if (error) {
        console.error("Error fetching waypoints:", error);
        return;
      }

      if (data) {
        // Process waypoints for the current user
        const userWaypoints = data
          .filter((item) => {
            const followers = item.followed_route_by || [];
            return followers.includes(currentUserId);
          })
          .map((item) => ({
            id: item.mark_id.toString(),
            latitude: parseFloat(item.latitude),
            longitude: parseFloat(item.longitude),
            title: item.location_name || "Unnamed location",
            description: item.description || "",
            createdBy: "", // We don't need this for routing
            createdAt: new Date(),
            userId: "", // We don't need this for routing
            followedBy: item.followed_route_by || [],
          }));

        // Update waypoints in journey state
        setJourneyState((prev) => ({
          ...prev,
          waypoints: userWaypoints,
        }));
      }
    } catch (error) {
      console.error("Error in fetchWaypoints:", error);
    }
  }, [groupId, currentUserId]);

  // Set up real-time subscription for waypoint changes
  useEffect(() => {
    if (!groupId) return;

    // Initial fetch
    fetchWaypoints();

    // Create handler for waypoint changes
    const handleWaypointChange = (payload: any) => {
      console.log("Waypoint change event:", payload);
      fetchWaypoints();
    };

    // Set up the subscription channel
    const waypointsSubscription = supabase
      .channel(`group-waypoints-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen for all events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "mark_location",
          filter: `group_id=eq.${groupId}`,
        },
        handleWaypointChange
      )
      .subscribe((status) => {
        console.log(`Supabase waypoints subscription status: ${status}`);
      });

    return () => {
      supabase.removeChannel(waypointsSubscription);
    };
  }, [groupId, fetchWaypoints]);

  // Calculate routes for all members
  const calculateRoutes = useCallback(async () => {
    try {
      if (!journeyState.isActive) return;

      const newRoutes: MemberRoute[] = [];

      // For each member with location, calculate route
      for (const member of members.filter((m) => m.location)) {
        try {
          let routeInfo: RouteInfo;

          if (groupType === "TravelToDestination") {
            // Get waypoints for this member
            let waypoints: { latitude: number; longitude: number }[] = [];

            // If this is the current user, use waypoints from journeyState
            if (member.id === currentUserId) {
              waypoints = journeyState.waypoints.map((waypoint) => ({
                latitude: waypoint.latitude,
                longitude: waypoint.longitude,
              }));
            } else {
              // For other members, fetch their waypoints from the database
              try {
                const { data, error } = await supabase
                  .from("mark_location")
                  .select("mark_id, latitude, longitude, followed_route_by")
                  .eq("group_id", groupId)
                  .contains("followed_route_by", [member.id]);

                if (!error && data) {
                  waypoints = data.map((item) => ({
                    latitude: parseFloat(item.latitude),
                    longitude: parseFloat(item.longitude),
                  }));
                }
              } catch (e) {
                console.error(
                  `Error fetching waypoints for member ${member.id}:`,
                  e
                );
              }
            }

            // Handle waypoint-only navigation (no destination)
            if (waypoints.length > 0) {
              // If no destination but we have waypoints, use the last waypoint as destination
              const effectiveDestination = destination || {
                latitude: waypoints[waypoints.length - 1].latitude,
                longitude: waypoints[waypoints.length - 1].longitude,
                name: "Last Waypoint",
              };

              const waypointsForRoute = destination
                ? waypoints
                : waypoints.slice(0, -1); // Remove last waypoint if it's being used as destination

              const result = await getDirections(
                member.location!,
                effectiveDestination,
                waypointsForRoute
              );

              routeInfo = result;

              // Set current user's active route for display if this is the current user
              if (member.id === currentUserId) {
                setActiveRoute(result);
                setRouteOriginName(member.username);
                setRouteDestinationName(
                  destination?.name || "Waypoint Destination"
                );

                if (result.error) {
                  setRouteError(result.error);
                } else {
                  setRouteError(null);
                }
              }
            } else if (destination) {
              // No waypoints, just calculate direct route to destination if it exists
              const result = await getMemberToDestinationDirections(
                member.location!,
                destination
              );

              routeInfo = result;

              // Set current user's active route for display
              if (member.id === currentUserId) {
                setActiveRoute(result);
                setRouteOriginName(member.username);
                setRouteDestinationName(destination.name || "Destination");

                if (result.error) {
                  setRouteError(result.error);
                } else {
                  setRouteError(null);
                }
              }
            } else {
              // No waypoints and no destination
              if (member.id === currentUserId) {
                setRouteError("No destination or waypoints set");
                setActiveRoute(null);
              }
              continue;
            }
          } else if (
            groupType === "FollowMember" &&
            journeyState.followedMemberId
          ) {
            // Route to the followed member
            const followedMember = members.find(
              (m) => m.id === journeyState.followedMemberId
            );

            if (!followedMember || !followedMember.location) {
              throw new Error(`Cannot find location for member to follow`);
            }

            // Get waypoints for this member
            let waypoints: { latitude: number; longitude: number }[] = [];

            // If this is the current user, use waypoints from journeyState
            if (member.id === currentUserId) {
              waypoints = journeyState.waypoints.map((waypoint) => ({
                latitude: waypoint.latitude,
                longitude: waypoint.longitude,
              }));
            }

            // If we have waypoints, include them in the route
            let result;
            if (waypoints.length > 0) {
              result = await getDirections(
                member.location!,
                followedMember.location,
                waypoints
              );
            } else {
              result = await getMemberToMemberDirections(
                member.location!,
                followedMember.location
              );
            }

            routeInfo = result;

            // Set current user's active route for display
            if (member.id === currentUserId) {
              setActiveRoute(result);
              setRouteOriginName(member.username);
              setRouteDestinationName(followedMember.username);

              if (result.error) {
                setRouteError(result.error);
              } else {
                setRouteError(null);
              }
            }

            // Add destination member ID for proper display
            newRoutes.push({
              memberId: member.id,
              destMemberId: journeyState.followedMemberId,
              route: routeInfo,
            });
            continue;
          } else {
            // No valid journey configuration
            if (member.id === currentUserId) {
              setRouteError("Invalid journey configuration");
              setActiveRoute(null);
            }
            continue;
          }

          newRoutes.push({
            memberId: member.id,
            route: routeInfo,
          });
        } catch (error) {
          console.error(
            `Error calculating route for ${member.username}:`,
            error
          );

          if (member.id === currentUserId) {
            setRouteError(
              error instanceof Error
                ? error.message
                : "Failed to calculate route"
            );
            setActiveRoute({
              polylineCoords: [],
              distance: "",
              duration: "",
              error:
                error instanceof Error
                  ? error.message
                  : "Route calculation failed",
            });
          }
        }
      }

      setJourneyState((prev) => ({
        ...prev,
        routes: newRoutes,
      }));
    } catch (error) {
      console.error("Error calculating routes:", error);
      setRouteError(
        error instanceof Error ? error.message : "Failed to calculate routes"
      );
    }
  }, [
    journeyState.isActive,
    journeyState.followedMemberId,
    journeyState.waypoints,
    members,
    currentUserId,
    groupType,
    destination,
    groupId,
  ]);

  // Start journey
  const startJourney = useCallback(
    (followedMemberId?: string) => {
      // Validate journey can be started
      if (groupType === "TravelToDestination" && !destination) {
        Alert.alert(
          "Cannot Start Journey",
          "No destination is set for this group."
        );
        return;
      }

      if (
        groupType === "FollowMember" &&
        !followedMemberId &&
        members.length <= 1
      ) {
        Alert.alert(
          "Cannot Start Journey",
          "There are no other members to follow."
        );
        return;
      }

      // Set journey state
      setJourneyState({
        isActive: true,
        startTime: Date.now(),
        followedMemberId,
        routes: [],
        waypoints: journeyState.waypoints, // Preserve existing waypoints
      });
    },
    [groupType, destination, members, journeyState.waypoints]
  );

  // End journey
  const endJourney = useCallback(() => {
    setJourneyState({
      isActive: false,
      routes: [],
      waypoints: [],
    });
    setActiveRoute(null);
    setRouteError(null);
  }, []);

  // Update routes when members move
  useEffect(() => {
    if (journeyState.isActive) {
      calculateRoutes();
    }
  }, [journeyState.isActive, members, calculateRoutes]);

  // Set up route update interval
  useEffect(() => {
    if (!journeyState.isActive) return;

    // Update routes every 10 seconds
    const intervalId = setInterval(calculateRoutes, 10000);
    return () => clearInterval(intervalId);
  }, [journeyState.isActive, calculateRoutes]);

  // Add waypoint to journey
  const addWaypoint = useCallback(
    (marker: CustomMarker) => {
      setJourneyState((prev) => ({
        ...prev,
        waypoints: [...prev.waypoints, marker],
      }));

      // Force recalculate route if journey is active
      if (journeyState.isActive) {
        calculateRoutes();
      }
    },
    [journeyState.isActive, calculateRoutes]
  );

  // Remove waypoint from journey
  const removeWaypoint = useCallback(
    (marker: CustomMarker) => {
      setJourneyState((prev) => ({
        ...prev,
        waypoints: prev.waypoints.filter((wp) => wp.id !== marker.id),
      }));

      // Force recalculate route if journey is active
      if (journeyState.isActive) {
        calculateRoutes();
      }
    },
    [journeyState.isActive, calculateRoutes]
  );

  // Clear all waypoints
  const clearWaypoints = useCallback(() => {
    setJourneyState((prev) => ({
      ...prev,
      waypoints: [],
    }));

    // Force recalculate route if journey is active
    if (journeyState.isActive) {
      calculateRoutes();
    }
  }, [journeyState.isActive, calculateRoutes]);

  return {
    journeyState,
    activeRoute,
    routeError,
    routeOriginName,
    routeDestinationName,
    startJourney,
    endJourney,
    setFollowedMember: (memberId: string) => {
      setJourneyState((prev) => ({
        ...prev,
        followedMemberId: memberId,
      }));
    },
    addWaypoint,
    removeWaypoint,
    clearWaypoints,
  };
};
