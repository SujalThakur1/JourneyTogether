import { Alert } from "react-native";
import { decode } from "@mapbox/polyline";
import { UserLocation } from "./locationService";

// Types for directions (unchanged for now, but see notes below)
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

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

/**
 * Get directions between two locations using Routes API
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
    const url = "https://routes.googleapis.com/directions/v2:computeRoutes";

    const requestBody = {
      origin: {
        location: {
          latLng: {
            latitude: origin.latitude,
            longitude: origin.longitude,
          },
        },
      },
      destination: {
        location: {
          latLng: {
            latitude: destination.latitude,
            longitude: destination.longitude,
          },
        },
      },
      travelMode: "DRIVE", // Options: DRIVE, WALK, BICYCLE, TRANSIT, TWO_WHEELER
      intermediates: waypoints.map((point) => ({
        location: {
          latLng: {
            latitude: point.latitude,
            longitude: point.longitude,
          },
        },
      })),
      routingPreference: "TRAFFIC_AWARE", // Optional: TRAFFIC_AWARE, TRAFFIC_UNAWARE
      units: "METRIC", // METRIC or IMPERIAL
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY!,
        "X-Goog-FieldMask":
          "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    // Check for errors (Routes API doesn't use "status" like Directions API)
    if (data.error) {
      throw new Error(data.error.message || "Routes API returned an error");
    }

    if (!data.routes || data.routes.length === 0) {
      console.log("No routes found");
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    // Decode polyline (Routes API uses encodedPolyline instead of overview_polyline.points)
    const polylineCoords = decode(route.polyline.encodedPolyline).map(
      (point) => ({
        latitude: point[0],
        longitude: point[1],
      })
    );

    // Convert duration (in seconds) and distance (in meters) to human-readable format
    const durationSeconds = parseInt(route.duration.replace("s", ""), 10);
    const durationText = `${Math.round(durationSeconds / 60)} mins`;
    const distanceMeters = route.distanceMeters;
    const distanceText =
      distanceMeters >= 1000
        ? `${(distanceMeters / 1000).toFixed(1)} km`
        : `${distanceMeters} m`;

    return {
      polylineCoords,
      distance: distanceText,
      duration: durationText,
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
