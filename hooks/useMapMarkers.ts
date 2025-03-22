import { useState, useCallback, useEffect } from "react";
import { Alert } from "react-native";
import { CustomMarker } from "../types/group";
import { supabase } from "../lib/supabase";

export const useMapMarkers = (
  username: string,
  userId: string,
  groupId: number
) => {
  // State for all custom markers
  const [markers, setMarkers] = useState<CustomMarker[]>([]);

  // State for tracking which markers the current user is following as waypoints
  const [userWaypoints, setUserWaypoints] = useState<string[]>([]);

  // State for showing the add marker form
  const [showAddMarkerForm, setShowAddMarkerForm] = useState(false);

  // Location where a new marker will be added
  const [markerLocation, setMarkerLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Temporary marker ID for visual feedback before saving
  const [tempMarker, setTempMarker] = useState<CustomMarker | null>(null);

  // Fetch markers from the database using useCallback
  const fetchMarkers = useCallback(async () => {
    if (!groupId) return;

    try {
      console.log("Fetching markers for group:", groupId);
      const { data, error } = await supabase
        .from("mark_location")
        .select(
          "mark_id, user_id, latitude, longitude, location_name, description, marked_at, group_id, followed_route_by, users(username)"
        )
        .eq("group_id", groupId);

      if (error) {
        console.error("Error fetching markers:", error);
        return;
      }

      if (data) {
        console.log(`Found ${data.length} markers for group ${groupId}`);
        const formattedMarkers: CustomMarker[] = data.map((item: any) => ({
          id: item.mark_id.toString(),
          latitude: parseFloat(item.latitude),
          longitude: parseFloat(item.longitude),
          title: item.location_name || "Unnamed location",
          description: item.description || "",
          createdBy: item.users?.username || "Unknown user",
          createdAt: new Date(item.marked_at),
          userId: item.user_id,
          followedBy: item.followed_route_by || [],
        }));

        setMarkers(formattedMarkers);

        // Update user waypoints
        const waypointIds = formattedMarkers
          .filter((marker) => marker.followedBy?.includes(userId))
          .map((marker) => marker.id);
        setUserWaypoints(waypointIds);
      }
    } catch (error) {
      console.error("Error in fetchMarkers:", error);
    }
  }, [groupId, userId]);

  // Set up real-time subscription for markers
  useEffect(() => {
    if (!groupId) return;

    console.log(
      `Setting up real-time subscription for markers in group ${groupId}`
    );
    fetchMarkers();

    // Create separate handlers for each event type
    const handleInsert = (payload: any) => {
      console.log("INSERT event received:", payload);
      fetchMarkers();
    };

    const handleUpdate = (payload: any) => {
      console.log("UPDATE event received:", payload);
      fetchMarkers();
    };

    const handleDelete = (payload: any) => {
      console.log("DELETE event received:", payload);
      // For delete operations, we can also directly update state for better responsiveness
      const deletedId = payload.old.mark_id.toString();
      console.log(`Marker deleted with ID: ${deletedId}`);

      setMarkers((currentMarkers) =>
        currentMarkers.filter((marker) => marker.id !== deletedId)
      );

      setUserWaypoints((currentWaypoints) =>
        currentWaypoints.filter((id) => id !== deletedId)
      );
    };

    // Set up the subscription channel with separate event handlers
    const markersSubscription = supabase
      .channel(`group-markers-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mark_location",
          filter: `group_id=eq.${groupId}`,
        },
        handleInsert
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "mark_location",
          filter: `group_id=eq.${groupId}`,
        },
        handleUpdate
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "mark_location",
          filter: `group_id=eq.${groupId}`,
        },
        handleDelete
      )
      .subscribe((status) => {
        console.log(`Supabase marker subscription status: ${status}`);
        if (status === "SUBSCRIBED") {
          console.log(
            `Successfully subscribed to real-time markers for group ${groupId}`
          );
        }
      });

    return () => {
      console.log(
        `Cleaning up Supabase subscription for markers in group ${groupId}`
      );
      supabase.removeChannel(markersSubscription);
    };
  }, [groupId, fetchMarkers]);

  // Add new marker to database
  const addMarker = useCallback(
    async (marker: Omit<CustomMarker, "id" | "userId">) => {
      try {
        console.log("Adding marker:", marker);
        const { data, error } = await supabase
          .from("mark_location")
          .insert([
            {
              group_id: groupId,
              user_id: userId,
              latitude: marker.latitude,
              longitude: marker.longitude,
              location_name: marker.title,
              description: marker.description,
              followed_route_by: [],
            },
          ])
          .select();

        if (error) {
          console.error("Error adding marker:", error);
          Alert.alert("Error", "Failed to add marker. Please try again.");
          return;
        }

        console.log("Marker added successfully:", data);

        // No need to update local state here since we are using Realtime
        // The subscription will handle state updates
      } catch (error) {
        console.error("Exception in addMarker:", error);
        Alert.alert("Error", "An unexpected error occurred. Please try again.");
      }
    },
    [groupId, userId]
  );

  // Edit existing marker
  const editMarker = useCallback(
    async (updatedMarker: CustomMarker) => {
      try {
        console.log("Editing marker:", updatedMarker);
        const { error } = await supabase
          .from("mark_location")
          .update({
            location_name: updatedMarker.title,
            description: updatedMarker.description,
          })
          .eq("mark_id", updatedMarker.id)
          .eq("user_id", userId); // Ensure only owner can edit

        if (error) {
          console.error("Error editing marker:", error);
          Alert.alert("Error", "Failed to update marker. Please try again.");
          return;
        }

        console.log("Marker updated successfully");
        // The subscription will handle state updates
      } catch (error) {
        console.error("Exception in editMarker:", error);
        Alert.alert("Error", "An unexpected error occurred. Please try again.");
      }
    },
    [userId]
  );

  // Delete marker
  const deleteMarker = useCallback(
    async (markerId: string, markUserId: string) => {
      try {
        console.log("Deleting marker:", markerId);

        // Only the creator can delete their marker
        if (markUserId !== userId) {
          Alert.alert("Error", "You can only delete markers you created.");
          return;
        }

        const { error } = await supabase
          .from("mark_location")
          .delete()
          .eq("mark_id", markerId)
          .eq("user_id", userId);

        if (error) {
          console.error("Error deleting marker:", error);
          Alert.alert("Error", "Failed to delete marker. Please try again.");
          return;
        }

        console.log("Marker deleted successfully");
        // The subscription will handle state updates
      } catch (error) {
        console.error("Exception in deleteMarker:", error);
        Alert.alert("Error", "An unexpected error occurred. Please try again.");
      }
    },
    [userId]
  );

  // Add marker as waypoint
  const addWaypoint = useCallback(
    async (marker: CustomMarker) => {
      try {
        console.log("Adding marker as waypoint:", marker.id);

        // Get current followed_route_by array
        const { data, error: fetchError } = await supabase
          .from("mark_location")
          .select("followed_route_by")
          .eq("mark_id", marker.id)
          .single();

        if (fetchError) {
          console.error("Error fetching marker data:", fetchError);
          Alert.alert("Error", "Failed to add waypoint. Please try again.");
          return;
        }

        // Prepare updated followed_route_by array
        const currentFollowers = data.followed_route_by || [];
        if (!currentFollowers.includes(userId)) {
          currentFollowers.push(userId);
        }

        // Update the marker with the new followed_route_by array
        const { error } = await supabase
          .from("mark_location")
          .update({
            followed_route_by: currentFollowers,
          })
          .eq("mark_id", marker.id);

        if (error) {
          console.error("Error adding waypoint:", error);
          Alert.alert("Error", "Failed to add waypoint. Please try again.");
          return;
        }

        console.log("Waypoint added successfully");
        // Update local state for immediate feedback
        setUserWaypoints((prev) => [...prev, marker.id]);
      } catch (error) {
        console.error("Exception in addWaypoint:", error);
        Alert.alert("Error", "An unexpected error occurred. Please try again.");
      }
    },
    [userId]
  );

  // Remove marker as waypoint
  const removeWaypoint = useCallback(
    async (marker: CustomMarker) => {
      try {
        console.log("Removing marker as waypoint:", marker.id);

        // Get current followed_route_by array
        const { data, error: fetchError } = await supabase
          .from("mark_location")
          .select("followed_route_by")
          .eq("mark_id", marker.id)
          .single();

        if (fetchError) {
          console.error("Error fetching marker data:", fetchError);
          Alert.alert("Error", "Failed to remove waypoint. Please try again.");
          return;
        }

        // Prepare updated followed_route_by array by removing current user
        const currentFollowers = data.followed_route_by || [];
        const updatedFollowers = currentFollowers.filter(
          (id: string) => id !== userId
        );

        // Update the marker with the new followed_route_by array
        const { error } = await supabase
          .from("mark_location")
          .update({
            followed_route_by: updatedFollowers,
          })
          .eq("mark_id", marker.id);

        if (error) {
          console.error("Error removing waypoint:", error);
          Alert.alert("Error", "Failed to remove waypoint. Please try again.");
          return;
        }

        console.log("Waypoint removed successfully");
        // Update local state for immediate feedback
        setUserWaypoints((prev) => prev.filter((id) => id !== marker.id));
      } catch (error) {
        console.error("Exception in removeWaypoint:", error);
        Alert.alert("Error", "An unexpected error occurred. Please try again.");
      }
    },
    [userId]
  );

  // Utility function to check if a marker is being used as a waypoint by the current user
  const isUserWaypoint = useCallback(
    (markerId: string) => {
      return userWaypoints.includes(markerId);
    },
    [userWaypoints]
  );

  // Utility function to get all markers that are being used as waypoints by the current user
  const getUserWaypointMarkers = useCallback(() => {
    return markers.filter((marker) => userWaypoints.includes(marker.id));
  }, [markers, userWaypoints]);

  // Show marker form at a specific location
  const showMarkerFormAtLocation = useCallback(
    (location: { latitude: number; longitude: number }) => {
      setMarkerLocation(location);
      setShowAddMarkerForm(true);
    },
    []
  );

  // Close marker form
  const closeMarkerForm = useCallback(() => {
    setShowAddMarkerForm(false);
    setMarkerLocation(null);
    setTempMarker(null);
  }, []);

  // Clear all waypoints for current user
  const clearAllWaypoints = useCallback(async () => {
    try {
      console.log("Clearing all waypoints for user:", userId);

      // First get all markers that the user is following
      const { data, error: fetchError } = await supabase
        .from("mark_location")
        .select("mark_id, followed_route_by")
        .eq("group_id", groupId)
        .contains("followed_route_by", [userId]);

      if (fetchError) {
        console.error("Error fetching waypoints to clear:", fetchError);
        Alert.alert("Error", "Failed to clear waypoints. Please try again.");
        return;
      }

      if (!data || data.length === 0) {
        console.log("No waypoints to clear");
        return;
      }

      console.log(`Found ${data.length} waypoints to clear`);

      // For each marker, update its followed_route_by array to remove current user
      for (const marker of data) {
        const currentFollowers = marker.followed_route_by || [];
        const updatedFollowers = currentFollowers.filter(
          (id: string) => id !== userId
        );

        const { error } = await supabase
          .from("mark_location")
          .update({
            followed_route_by: updatedFollowers,
          })
          .eq("mark_id", marker.mark_id);

        if (error) {
          console.error(`Error clearing waypoint ${marker.mark_id}:`, error);
        }
      }

      console.log("All waypoints cleared successfully");

      // Update local state for immediate feedback
      setUserWaypoints([]);
    } catch (error) {
      console.error("Exception in clearAllWaypoints:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    }
  }, [userId, groupId]);

  return {
    markers,
    showAddMarkerForm,
    markerLocation,
    addMarker,
    editMarker,
    deleteMarker,
    addWaypoint,
    removeWaypoint,
    clearAllWaypoints,
    isUserWaypoint,
    getUserWaypointMarkers,
    showMarkerFormAtLocation,
    closeMarkerForm,
  };
};
