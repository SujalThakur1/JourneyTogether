import React, { useRef } from "react";
import { StyleSheet, Platform } from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import {
  MemberWithLocation,
  Region,
  CustomMarker,
  JourneyState,
} from "../../types/group";
import MemberMarkers from "./MemberMarkers";
import DestinationMarker from "./DestinationMarker";
import RouteLines from "./RouteLines";
import CustomMapMarker from "./CustomMapMarker";

interface GroupMapProps {
  initialRegion: Region | null;
  members: MemberWithLocation[];
  destination: any;
  currentUserId: string;
  customMarkers: CustomMarker[];
  journeyState: JourneyState;
  mapStyle?: any[];
  isDark: boolean;
  onMapPress: (event: any) => void;
  onMarkerEdit: (marker: CustomMarker) => void;
  onMarkerDelete: (markerId: string, userId: string) => void;
  onMapReady: () => void;
  mapRef: React.RefObject<MapView>;
}

const GroupMap: React.FC<GroupMapProps> = ({
  initialRegion,
  members,
  destination,
  currentUserId,
  customMarkers,
  journeyState,
  mapStyle,
  isDark,
  onMapPress,
  onMarkerEdit,
  onMarkerDelete,
  onMapReady,
  mapRef,
}) => {
  // Find out if current user created each custom marker
  const isCurrentUserCreator = (marker: CustomMarker) => {
    const currentUserName = members.find(
      (m) => m.id === currentUserId
    )?.username;
    return marker.createdBy === currentUserName;
  };

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
      onMapReady={onMapReady}
    >
      {/* Destination marker */}
      {destination && <DestinationMarker destination={destination} />}

      {/* Member location markers */}
      <MemberMarkers
        members={members}
        followedMemberId={journeyState.followedMemberId}
        destination={destination}
        isDark={isDark}
      />

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
});

export default GroupMap;
