import React from "react";
import { StyleSheet, Platform, View, Text, Image } from "react-native";
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
import { useColors } from "@/contexts/ColorContext";

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
  userLocation?: { latitude: number; longitude: number };
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
  userLocation,
}) => {
  const color = useColors();
  // Find out if current user created each custom marker
  const isCurrentUserCreator = (marker: CustomMarker) => {
    return marker.userId === currentUserId;
  };

  // Filter members with location data
  const membersWithLocation = members.filter(
    (member) => member.location && member.id !== currentUserId
  );

  // Styling for member callouts
  const bgColor = color.bgColor;
  const textColor = color.textColor;
  const borderColor = color.borderColor;

  // Add helper function to calculate distance in km
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance.toFixed(1);
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
            latitude: member.location?.latitude || 0,
            longitude: member.location?.longitude || 0,
          }}
          tracksViewChanges={false}
        >
          {/* Marker Container */}
          <View
            style={{
              alignItems: "center",
            }}
          >
            {/* Circular Frame with Avatar or Initial */}
            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: "white",
                justifyContent: "center",
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 2,
                elevation: 5,
                ...(member.isLeader && {
                  borderWidth: 2,
                  borderColor: "white",
                }),
              }}
            >
              {member.avatar_url ? (
                <Image
                  source={{ uri: member.avatar_url }}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                  }}
                />
              ) : (
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: member.isLeader ? "#3B82F6" : "#F97316",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      fontSize: 18,
                      fontWeight: "bold",
                    }}
                  >
                    {member.username
                      ? member.username.charAt(0).toUpperCase()
                      : "?"}
                  </Text>
                </View>
              )}
            </View>
            {/* Triangular Pointer */}
            <View
              style={{
                width: 0,
                height: 0,
                backgroundColor: "transparent",
                borderStyle: "solid",
                borderLeftWidth: 6,
                borderRightWidth: 6,
                borderTopWidth: 12,
                borderLeftColor: "transparent",
                borderRightColor: "transparent",
                borderTopColor: "white",
                marginTop: -1,
              }}
            />
          </View>

          {/* Updated Callout with Member Info */}
          <Callout tooltip>
            <View
              style={{
                padding: 16,
                borderRadius: 12,
                backgroundColor: bgColor,
                borderWidth: 1,
                borderColor: borderColor,
                minWidth: 200,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
              }}
            >
              {/* Member Name and Role */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    fontWeight: "700",
                    fontSize: 18,
                    color: textColor,
                    flex: 1,
                  }}
                >
                  {member.username}
                  {member.isLeader && (
                    <MaterialIcons name="star" size={20} color="#F59E0B" />
                  )}
                </Text>
              </View>

              {/* Member Email */}
              <Text
                style={{
                  fontSize: 14,
                  color: textColor + "99",
                  marginBottom: 12,
                }}
              >
                {member.email}
              </Text>

              {/* Distances */}
              <View style={{ marginBottom: 8 }}>
                {userLocation && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <MaterialIcons
                      name="person-pin"
                      size={16}
                      color={textColor + "80"}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={{ fontSize: 14, color: textColor }}>
                      <Text style={{ fontWeight: "600" }}>
                        {calculateDistance(
                          userLocation.latitude,
                          userLocation.longitude,
                          member.location?.latitude || 0,
                          member.location?.longitude || 0
                        )}{" "}
                        km
                      </Text>{" "}
                      from you
                    </Text>
                  </View>
                )}
                {destination && (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <MaterialIcons
                      name="flag"
                      size={16}
                      color={textColor + "80"}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={{ fontSize: 14, color: textColor }}>
                      <Text style={{ fontWeight: "600" }}>
                        {calculateDistance(
                          destination.latitude,
                          destination.longitude,
                          member.location?.latitude || 0,
                          member.location?.longitude || 0
                        )}{" "}
                        km
                      </Text>{" "}
                      to destination
                    </Text>
                  </View>
                )}
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
  memberMarkerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "white",
  },
  leaderAvatar: {
    borderColor: "#3B82F6",
    borderWidth: 3,
  },
  memberAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  memberInitial: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  memberMarkerBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    position: "absolute",
    bottom: 0,
    borderWidth: 1,
    borderColor: "white",
  },
});

export default GroupMap;
