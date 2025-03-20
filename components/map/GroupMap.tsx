import React from "react";
import { StyleSheet, Platform, View, Text } from "react-native";
import MapView, { PROVIDER_GOOGLE, Marker, Callout } from "react-native-maps";
import { MaterialIcons } from "@expo/vector-icons";
import {
  Region,
  CustomMarker,
  JourneyState,
  MemberWithLocation,
} from "../../types/group";
import DestinationMarker from "./DestinationMarker";
import RouteLines from "./RouteLines";
import CustomMapMarker from "./CustomMapMarker";

interface GroupMapProps {
  initialRegion: Region | null;
  destination: any;
  currentUserId: string;
  customMarkers: CustomMarker[];
  journeyState: JourneyState;
  mapStyle?: any[];
  isDark: boolean;
  onMapPress: (event: any) => void;
  onMapLongPress?: (event: any) => void;
  onMarkerEdit: (marker: CustomMarker) => void;
  onMarkerDelete: (markerId: string, userId: string) => void;
  onMapReady: () => void;
  mapRef: React.RefObject<MapView>;
  members: MemberWithLocation[];
}

const GroupMap: React.FC<GroupMapProps> = ({
  initialRegion,
  destination,
  currentUserId,
  customMarkers,
  journeyState,
  mapStyle,
  isDark,
  onMapPress,
  onMapLongPress,
  onMarkerEdit,
  onMarkerDelete,
  onMapReady,
  mapRef,
  members,
}) => {
  // Find out if current user created each custom marker
  const isCurrentUserCreator = (marker: CustomMarker) => {
    return marker.userId === currentUserId;
  };

  // Filter members with location data
  const membersWithLocation = members.filter(
    (member) => member.location && member.id !== currentUserId
  );

  // Styling for member callouts
  const bgColor = isDark ? "#374151" : "#FFFFFF";
  const textColor = isDark ? "#F3F4F6" : "#1F2937";
  const borderColor = isDark ? "#4B5563" : "#E5E7EB";

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      provider={Platform.OS === "ios" ? undefined : PROVIDER_GOOGLE}
      initialRegion={initialRegion || undefined}
      showsUserLocation={true}
      showsMyLocationButton={false}
      showsCompass={true}
      customMapStyle={mapStyle}
      onPress={onMapPress}
      onLongPress={onMapLongPress || onMapPress}
      onMapReady={onMapReady}
      zoomEnabled={true}
      rotateEnabled={true}
      pitchEnabled={true}
      scrollEnabled={true}
    >
      {/* Destination marker */}
      {destination && <DestinationMarker destination={destination} />}

      {/* Member markers (excluding current user) */}
      {membersWithLocation.map((member) => (
        <Marker
          key={member.id}
          coordinate={{
            latitude: member.location!.latitude,
            longitude: member.location!.longitude,
          }}
          pinColor={member.isLeader ? "blue" : "orange"}
        >
          <Callout tooltip>
            <View
              style={[
                styles.callout,
                { backgroundColor: bgColor, borderColor },
              ]}
            >
              <Text style={[styles.calloutTitle, { color: textColor }]}>
                {member.username}
                {member.isLeader && " (Leader)"}
              </Text>
              <View style={styles.statusRow}>
                <MaterialIcons name="access-time" size={14} color="#22C55E" />
                <Text style={styles.statusText}>Online</Text>
              </View>
            </View>
          </Callout>
        </Marker>
      ))}

      {/* Custom markers added by users */}
      {customMarkers.map((marker) => (
        <CustomMapMarker
          key={marker.id}
          marker={marker}
          onEdit={onMarkerEdit}
          onDelete={onMarkerDelete}
          isCurrentUserCreator={isCurrentUserCreator(marker)}
          isDark={isDark}
        />
      ))}

      {/* Route lines when journey is active */}
      {journeyState.isActive && journeyState.routes.length > 0 && (
        <RouteLines
          routes={journeyState.routes}
          currentUserId={currentUserId}
        />
      )}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  callout: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 150,
  },
  calloutTitle: {
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    color: "#22C55E",
    marginLeft: 4,
  },
});

export default GroupMap;
