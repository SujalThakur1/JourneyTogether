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

  // State for showing the add marker form
  const [showAddMarkerForm, setShowAddMarkerForm] = useState(false);

  // Location where a new marker will be added
  const [markerLocation, setMarkerLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Fetch markers from the database
  useEffect(() => {
    const fetchMarkers = async () => {
      try {
        const { data, error } = await supabase
          .from("mark_location")
          .select(
            "mark_id, user_id, latitude, longitude, location_name, description, marked_at, group_id, users(username)"
          )
          .eq("group_id", groupId);

        if (error) {
          console.error("Error fetching markers:", error);
          return;
        }

        if (data) {
          const formattedMarkers: CustomMarker[] = data.map((item: any) => ({
            id: item.mark_id.toString(),
            latitude: parseFloat(item.latitude),
            longitude: parseFloat(item.longitude),
            title: item.location_name || "Unnamed location",
            description: item.description || "",
            createdBy: item.users?.username || "Unknown user",
            createdAt: new Date(item.marked_at),
            userId: item.user_id,
          }));
          setMarkers(formattedMarkers);
        }
      } catch (error) {
        console.error("Error in fetchMarkers:", error);
      }
    };

    if (groupId) {
      fetchMarkers();
    }

    // Set up real-time subscription for markers
    const markersSubscription = supabase
      .channel(`group-markers-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "mark_location",
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          // Refresh markers when changes are detected
          fetchMarkers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(markersSubscription);
    };
  }, [groupId]);

  // Add new marker to database
  const addMarker = useCallback(
    async (marker: Omit<CustomMarker, "id" | "userId">) => {
      try {
        const { data, error } = await supabase
          .from("mark_location")
          .insert({
            group_id: groupId,
            user_id: userId,
            latitude: marker.latitude,
            longitude: marker.longitude,
            location_name: marker.title,
            description: marker.description,
          })
          .select();

        if (error) {
          console.error("Error adding marker to database:", error);
          Alert.alert("Error", "Failed to add marker. Please try again.");
          return;
        }

        // Marker will be added to state via the real-time subscription
      } catch (error) {
        console.error("Error in addMarker:", error);
        Alert.alert("Error", "Failed to add marker. Please try again.");
      }
    },
    [groupId, userId]
  );

  // Edit marker in database
  const editMarker = useCallback(
    async (updatedMarker: CustomMarker) => {
      try {
        const { error } = await supabase
          .from("mark_location")
          .update({
            latitude: updatedMarker.latitude,
            longitude: updatedMarker.longitude,
            location_name: updatedMarker.title,
            description: updatedMarker.description,
          })
          .eq("mark_id", parseInt(updatedMarker.id))
          .eq("group_id", groupId);

        if (error) {
          console.error("Error updating marker in database:", error);
          Alert.alert("Error", "Failed to update marker. Please try again.");
          return;
        }

        // Marker will be updated in state via the real-time subscription
      } catch (error) {
        console.error("Error in editMarker:", error);
        Alert.alert("Error", "Failed to update marker. Please try again.");
      }
    },
    [groupId]
  );

  // Delete marker from database
  const deleteMarker = useCallback(
    (markerId: string, creatorId: string) => {
      // Only allow deletion if the user created the marker or is the group leader
      if (creatorId !== userId) {
        Alert.alert(
          "Permission Denied",
          "You can only delete markers you created."
        );
        return;
      }

      Alert.alert(
        "Delete Marker",
        "Are you sure you want to delete this marker?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                const { error } = await supabase
                  .from("mark_location")
                  .delete()
                  .eq("mark_id", parseInt(markerId))
                  .eq("group_id", groupId);

                if (error) {
                  console.error("Error deleting marker from database:", error);
                  Alert.alert(
                    "Error",
                    "Failed to delete marker. Please try again."
                  );
                  return;
                }

                // Marker will be removed from state via the real-time subscription
              } catch (error) {
                console.error("Error in deleteMarker:", error);
                Alert.alert(
                  "Error",
                  "Failed to delete marker. Please try again."
                );
              }
            },
          },
        ]
      );
    },
    [groupId, userId]
  );

  // Show marker form at current location
  const showMarkerFormAtLocation = useCallback(
    (latitude: number, longitude: number) => {
      setMarkerLocation({ latitude, longitude });
      setShowAddMarkerForm(true);
    },
    []
  );

  // Close marker form
  const closeMarkerForm = useCallback(() => {
    setShowAddMarkerForm(false);
    setMarkerLocation(null);
  }, []);

  return {
    markers,
    showAddMarkerForm,
    markerLocation,
    addMarker,
    editMarker,
    deleteMarker,
    showMarkerFormAtLocation,
    closeMarkerForm,
  };
};
