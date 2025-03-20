import React from "react";
import { View, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface MapToolControlsProps {
  onFitMarkers: () => void;
  onAddMarker: () => void;
  isMarkerModeActive?: boolean;
  onToggleMembersList: () => void;
  onToggleFollowMode: () => void;
  onGoToMyLocation: () => void;
  isFollowingActive: boolean;
  pendingRequestsCount: number;
  onShowPendingRequests: () => void;
  isLeader: boolean;
  textColor: string;
  borderColor: string;
  bgColor: string;
}

const MapToolControls: React.FC<MapToolControlsProps> = ({
  onFitMarkers,
  onAddMarker,
  isMarkerModeActive = false,
  onToggleMembersList,
  onToggleFollowMode,
  onGoToMyLocation,
  isFollowingActive,
  pendingRequestsCount,
  onShowPendingRequests,
  isLeader,
  textColor,
  borderColor,
  bgColor,
}) => {
  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <TouchableOpacity
        style={[styles.button, { borderColor }]}
        onPress={onFitMarkers}
      >
        <MaterialIcons name="my-location" size={22} color={textColor} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { borderColor }]}
        onPress={onGoToMyLocation}
      >
        <MaterialIcons name="near-me" size={22} color={textColor} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { borderColor }]}
        onPress={onToggleMembersList}
      >
        <MaterialIcons name="people" size={22} color={textColor} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          isMarkerModeActive
            ? styles.activeMarkerButton
            : styles.addMarkerButton,
          { borderColor },
        ]}
        onPress={onAddMarker}
      >
        <MaterialIcons
          name={isMarkerModeActive ? "place" : "add-location"}
          size={22}
          color={isMarkerModeActive ? "#fff" : textColor}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { borderColor }]}
        onPress={onToggleFollowMode}
      >
        <MaterialIcons
          name={isFollowingActive ? "gps-fixed" : "gps-not-fixed"}
          size={22}
          color={textColor}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 92, // Below header
    right: 16,
    borderRadius: 8,
    padding: 8,
    gap: 12,
    alignItems: "center",
    zIndex: 5,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  addMarkerButton: {
    backgroundColor: "rgba(52, 211, 153, 0.2)",
  },
  activeMarkerButton: {
    backgroundColor: "#10B981", // Green color to indicate active mode
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeIcon: {
    position: "absolute",
  },
  badgeTextContainer: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    position: "absolute",
  },
});

export default MapToolControls;
