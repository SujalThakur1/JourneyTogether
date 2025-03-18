import { Alert } from "react-native";
import { decode } from "@mapbox/polyline";
import { UserLocation } from "./locationService";

// Types for directions
export interface DirectionsResult {
  routes: Route[];
  status: string;
  error_message?: string;
}

export interface Route {
  legs: RouteLeg[];
  overview_polyline: {
    points: string;
  };
  summary: string;
  warnings: string[];
  waypoint_order: number[];
  bounds: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
}

export interface RouteLeg {
  distance: { text: string; value: number };
  duration: { text: string; value: number };
  end_address: string;
  end_location: { lat: number; lng: number };
  start_address: string;
  start_location: { lat: number; lng: number };
  steps: RouteStep[];
}

export interface RouteStep {
  distance: { text: string; value: number };
  duration: { text: string; value: number };
  end_location: { lat: number; lng: number };
  start_location: { lat: number; lng: number };
  html_instructions: string;
  travel_mode: string;
  polyline: { points: string };
}

export interface DecodedPolyline {
  latitude: number;
  longitude: number;
}

// Replace with your actual API key
// For production, use environment variables
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

/**
 * Get directions between two locations
 */
export const getDirections = async (
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  waypoints: { latitude: number; longitude: number }[] = []
): Promise<{
  polylineCoords: DecodedPolyline[];
  distance: string;
  duration: string;
  error: string | null;
}> => {
  try {
    let waypointsStr = "";
    if (waypoints.length > 0) {
      waypointsStr = "&waypoints=";
      waypoints.forEach((point, idx) => {
        waypointsStr += `${idx > 0 ? "|" : ""}${point.latitude},${
          point.longitude
        }`;
      });
    }

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}${waypointsStr}&key=${GOOGLE_MAPS_API_KEY}&mode=driving`;

    const response = await fetch(url);
    const data: DirectionsResult = await response.json();

    if (data.status !== "OK") {
      throw new Error(
        data.error_message || `Directions API returned status: ${data.status}`
      );
    }

    if (!data.routes || data.routes.length === 0) {
      throw new Error("No routes found");
    }

    const route = data.routes[0];
    const leg = route.legs[0];
    const polylineCoords = decode(route.overview_polyline.points).map(
      (point) => ({
        latitude: point[0],
        longitude: point[1],
      })
    );

    return {
      polylineCoords,
      distance: leg.distance.text,
      duration: leg.duration.text,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching directions:", error);
    return {
      polylineCoords: [],
      distance: "",
      duration: "",
      error:
        error instanceof Error
          ? error.message
          : "Unknown error getting directions",
    };
  }
};

/**
 * Get directions from one user to another
 */
export const getMemberToMemberDirections = async (
  fromMember: UserLocation,
  toMember: UserLocation
) => {
  return getDirections(fromMember, toMember);
};

/**
 * Get directions from a user to the destination
 */
export const getMemberToDestinationDirections = async (
  memberLocation: UserLocation,
  destination: { latitude: number; longitude: number }
) => {
  return getDirections(memberLocation, destination);
};

/**
 * Show error alert for failed directions
 */
export const handleDirectionsError = (error: string) => {
  Alert.alert("Navigation Error", `Could not calculate directions: ${error}`, [
    { text: "OK" },
  ]);
};

/**
 * Format distance or time for display
 */
export const formatRouteInfo = (text: string) => {
  return text || "Unknown";
};
