import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import {
  JourneyState,
  MemberRoute,
  MemberWithLocation,
  RouteInfo,
} from "../types/group";
import {
  getDirections,
  getMemberToDestinationDirections,
  getMemberToMemberDirections,
} from "../lib/directionsService";

interface UseJourneyProps {
  members: MemberWithLocation[];
  groupType: "TravelToDestination" | "FollowMember";
  destination?: { latitude: number; longitude: number; name: string } | null;
  currentUserId: string;
}

export const useJourney = ({
  members,
  groupType,
  destination,
  currentUserId,
}: UseJourneyProps) => {
  // Journey state
  const [journeyState, setJourneyState] = useState<JourneyState>({
    isActive: false,
    routes: [],
  });

  // Route calculations and error handling
  const [activeRoute, setActiveRoute] = useState<RouteInfo | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeOriginName, setRouteOriginName] = useState("");
  const [routeDestinationName, setRouteDestinationName] = useState("");

  // Calculate routes for all members
  const calculateRoutes = useCallback(async () => {
    try {
      if (!journeyState.isActive) return;

      const newRoutes: MemberRoute[] = [];

      // For each member with location, calculate route
      for (const member of members.filter((m) => m.location)) {
        try {
          let routeInfo: RouteInfo;

          if (groupType === "TravelToDestination" && destination) {
            // Route to the specified destination
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

            const result = await getMemberToMemberDirections(
              member.location!,
              followedMember.location
            );

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
      setRouteError("Failed to calculate routes");
    }
  }, [
    journeyState.isActive,
    journeyState.followedMemberId,
    members,
    groupType,
    destination,
    currentUserId,
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
      });
    },
    [groupType, destination, members]
  );

  // End journey
  const endJourney = useCallback(() => {
    setJourneyState({
      isActive: false,
      routes: [],
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
  };
};
