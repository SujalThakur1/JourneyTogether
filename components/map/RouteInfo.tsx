import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface RouteInfoProps {
  visible: boolean;
  distance: string;
  duration: string;
  originName: string;
  destinationName: string;
  routeError: string | null;
  onClose: () => void;
  textColor: string;
  bgColor: string;
  borderColor: string;
}

const RouteInfo: React.FC<RouteInfoProps> = ({
  visible,
  distance,
  duration,
  originName,
  destinationName,
  routeError,
  onClose,
  textColor,
  bgColor,
  borderColor,
}) => {
  if (!visible) return null;

  return (
    <View style={[styles.container, { backgroundColor: bgColor, borderColor }]}>
      {routeError ? (
        <View style={styles.errorContent}>
          <MaterialIcons name="error-outline" size={20} color="#EF4444" />
          <Text style={styles.errorText}>{routeError}</Text>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.routeInfo}>
            <View style={styles.locationInfo}>
              <MaterialIcons
                name="person-pin-circle"
                size={18}
                color={textColor}
              />
              <Text
                style={[styles.locationText, { color: textColor }]}
                numberOfLines={1}
              >
                {originName}
              </Text>
            </View>

            <View style={styles.arrow}>
              <MaterialIcons
                name="arrow-downward"
                size={18}
                color={textColor}
              />
            </View>

            <View style={styles.locationInfo}>
              <MaterialIcons name="location-on" size={18} color={textColor} />
              <Text
                style={[styles.locationText, { color: textColor }]}
                numberOfLines={1}
              >
                {destinationName}
              </Text>
            </View>
          </View>

          <View style={styles.metrics}>
            <View style={styles.metricItem}>
              <MaterialIcons name="straighten" size={18} color={textColor} />
              <Text style={[styles.metricText, { color: textColor }]}>
                {distance || "Unknown"}
              </Text>
            </View>

            <View style={styles.metricItem}>
              <MaterialIcons name="schedule" size={18} color={textColor} />
              <Text style={[styles.metricText, { color: textColor }]}>
                {duration || "Unknown"}
              </Text>
            </View>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <MaterialIcons name="close" size={20} color={textColor} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 92, // Below the header
    left: 16,
    right: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10,
    marginHorizontal: 70,
  },
  content: {
    flex: 1,
  },
  routeInfo: {
    marginBottom: 4,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  arrow: {
    alignItems: "center",
    marginVertical: 2,
  },
  metrics: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metricText: {
    fontSize: 14,
  },
  closeButton: {
    padding: 4,
  },
  errorContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    flex: 1,
  },
});

export default RouteInfo;
