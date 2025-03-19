import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Marker, Callout } from "react-native-maps";
import { Destination } from "../../types/group";

interface DestinationMarkerProps {
  destination: Destination;
}

const DestinationMarker: React.FC<DestinationMarkerProps> = ({
  destination,
}) => {
  if (!destination) return null;

  return (
    <Marker
      coordinate={{
        latitude: destination.latitude,
        longitude: destination.longitude,
      }}
      pinColor="red"
    >
      <Callout>
        <View style={styles.callout}>
          <Text style={styles.calloutTitle}>{destination.name}</Text>
          <Text style={styles.calloutSubtitle}>Destination</Text>
        </View>
      </Callout>
    </Marker>
  );
};

const styles = StyleSheet.create({
  callout: {
    padding: 8,
    width: 150,
  },
  calloutTitle: {
    fontWeight: "bold",
    fontSize: 14,
  },
  calloutSubtitle: {
    fontSize: 12,
    color: "#6B7280",
  },
});

export default DestinationMarker;
