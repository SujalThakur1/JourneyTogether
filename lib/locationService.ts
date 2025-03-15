import * as Location from "expo-location";
import { Platform, Alert, Linking } from "react-native";
import { supabase } from "./supabase";

export type UserLocation = {
  latitude: number;
  longitude: number;
  timestamp: number;
};

export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status: foregroundStatus } =
      await Location.requestForegroundPermissionsAsync();

    if (Platform.OS === "ios" && foregroundStatus === "granted") {
      const { status: backgroundStatus } =
        await Location.requestBackgroundPermissionsAsync();
      console.log(`Background location permission: ${backgroundStatus}`);
    }

    return foregroundStatus === "granted";
  } catch (error) {
    console.error("Error requesting location permission:", error);
    return false;
  }
}

export async function checkLocationServicesEnabled(): Promise<boolean> {
  try {
    const enabled = await Location.hasServicesEnabledAsync();
    return enabled;
  } catch (error) {
    console.error("Error checking location services:", error);
    return false;
  }
}

export async function getCurrentLocation(): Promise<UserLocation | null> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== "granted") {
      console.log("Location permission not granted");
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: location.timestamp,
    };
  } catch (error) {
    console.error("Error getting current location:", error);
    return null;
  }
}

export async function saveUserLocation(
  userId: string,
  location: UserLocation
): Promise<boolean> {
  try {
    const { error } = await supabase.from("userlocations").upsert(
      {
        user_id: userId,
        latitude: location.latitude,
        longitude: location.longitude,
        last_updated: new Date(location.timestamp).toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) {
      console.error("Error saving location to Supabase:", error);
      return false;
    }

    console.log("Location saved successfully");
    return true;
  } catch (error) {
    console.error("Error in saveUserLocation:", error);
    return false;
  }
}

export async function startLocationTracking(
  userId: string,
  onLocationUpdate?: (location: UserLocation) => void
): Promise<Location.LocationSubscription | null> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== "granted") {
      console.log("Location permission not granted");
      const granted = await requestLocationPermission();
      if (!granted) return null;
    }

    // Get initial location and save it
    const initialLocation = await getCurrentLocation();
    if (initialLocation) {
      await saveUserLocation(userId, initialLocation);
      if (onLocationUpdate) {
        onLocationUpdate(initialLocation);
      }
    }

    // Start watching position and return the subscription
    return await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      async (location) => {
        const userLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: location.timestamp,
        };

        await saveUserLocation(userId, userLocation);

        if (onLocationUpdate) {
          onLocationUpdate(userLocation);
        }
      }
    );
  } catch (error) {
    console.error("Error starting location tracking:", error);
    return null;
  }
}

export function stopLocationTracking(
  subscription: Location.LocationSubscription | null
) {
  if (subscription) {
    subscription.remove();
    console.log("Location tracking stopped");
  }
}

export async function getGroupMembersLocations(
  groupMembers: string[]
): Promise<Record<string, UserLocation>> {
  try {
    const { data, error } = await supabase
      .from("userlocations")
      .select("user_id, latitude, longitude, last_updated")
      .in("user_id", groupMembers);

    if (error) {
      console.error("Error fetching group members locations:", error);
      return {};
    }

    const result: Record<string, UserLocation> = {};
    data?.forEach((item: any) => {
      result[item.user_id] = {
        latitude: item.latitude,
        longitude: item.longitude,
        timestamp: new Date(item.last_updated).getTime(),
      };
    });

    return result;
  } catch (error) {
    console.error("Error in getGroupMembersLocations:", error);
    return {};
  }
}

export async function checkAndRequestLocationPermission(
  onSuccess?: () => void,
  onCancel?: () => void
): Promise<boolean> {
  try {
    // First check if location services are enabled
    const servicesEnabled = await checkLocationServicesEnabled();

    if (!servicesEnabled) {
      // Location services are not enabled, show alert
      Alert.alert(
        "Location Services Disabled",
        "Please enable location services in your device settings to use this feature.",
        [
          { text: "Cancel", style: "cancel", onPress: onCancel },
          {
            text: "Open Settings",
            onPress: () => {
              Platform.OS === "ios"
                ? Linking.openURL("app-settings:")
                : Linking.openSettings();
              if (onCancel) onCancel();
            },
          },
        ]
      );
      return false;
    }

    // Check if we already have permission
    const { status } = await Location.getForegroundPermissionsAsync();

    if (status === "granted") {
      if (onSuccess) onSuccess();
      return true;
    }

    // Request permission
    const granted = await requestLocationPermission();

    if (granted) {
      if (onSuccess) onSuccess();
      return true;
    } else {
      // Permission denied, show alert
      Alert.alert(
        "Location Permission Required",
        "This feature requires location permission. Please enable it in your device settings.",
        [
          { text: "Cancel", style: "cancel", onPress: onCancel },
          {
            text: "Open Settings",
            onPress: () => {
              Platform.OS === "ios"
                ? Linking.openURL("app-settings:")
                : Linking.openSettings();
              if (onCancel) onCancel();
            },
          },
        ]
      );
      return false;
    }
  } catch (error) {
    console.error("Error checking location permission:", error);
    return false;
  }
}
