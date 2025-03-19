import React from "react";
import { View, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface MapToolControlsProps {
  onFitMarkers: () => void;
  onAddMarker: () => void;
  onToggleMembersList: () => void;
  onToggleFollowMode: () => void;
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
  onToggleMembersList,
  onToggleFollowMode,
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
        onPress={onToggleMembersList}
      >
        <MaterialIcons name="people" size={22} color={textColor} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { borderColor }]}
        onPress={onAddMarker}
      >
        <MaterialIcons name="add-location" size={22} color={textColor} />
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

      {isLeader && pendingRequestsCount > 0 && (
        <TouchableOpacity
          style={[styles.button, { borderColor }]}
          onPress={onShowPendingRequests}
        >
          <MaterialIcons name="notifications" size={22} color={textColor} />
          <View style={styles.badge}>
            <MaterialIcons
              name="circle"
              size={18}
              color="#EF4444"
              style={styles.badgeIcon}
            />
            {pendingRequestsCount > 9 ? (
              <MaterialIcons
                name="more"
                size={12}
                color="white"
                style={styles.badgeText}
              />
            ) : (
              <View style={styles.badgeTextContainer}>
                <MaterialIcons
                  name={`filter-${pendingRequestsCount}` as any}
                  size={12}
                  color="white"
                  style={styles.badgeText}
                />
              </View>
            )}
          </View>
        </TouchableOpacity>
      )}
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
