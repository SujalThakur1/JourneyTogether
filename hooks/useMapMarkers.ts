import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { CustomMarker } from "../types/group";

export const useMapMarkers = (username: string) => {
  // State for all custom markers
  const [markers, setMarkers] = useState<CustomMarker[]>([]);

  // State for showing the add marker form
  const [showAddMarkerForm, setShowAddMarkerForm] = useState(false);

  // Location where a new marker will be added
  const [markerLocation, setMarkerLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Add new marker
  const addMarker = useCallback((marker: CustomMarker) => {
    setMarkers((prev) => [...prev, marker]);
  }, []);

  // Edit marker
  const editMarker = useCallback((updatedMarker: CustomMarker) => {
    setMarkers((prev) =>
      prev.map((marker) =>
        marker.id === updatedMarker.id ? updatedMarker : marker
      )
    );
  }, []);

  // Delete marker
  const deleteMarker = useCallback((markerId: string) => {
    Alert.alert(
      "Delete Marker",
      "Are you sure you want to delete this marker?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setMarkers((prev) =>
              prev.filter((marker) => marker.id !== markerId)
            );
          },
        },
      ]
    );
  }, []);

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
