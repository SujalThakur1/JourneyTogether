import React from "react";
import { Marker } from "react-native-maps";
import { CustomMarker } from "../../types/group";

interface CustomMapMarkerProps {
  marker: CustomMarker;
  onMarkerPress: (marker: CustomMarker) => void;
  onEdit?: (marker: CustomMarker) => void;
  onDelete?: (markerId: string, userId: string) => void;
  isCurrentUserCreator: boolean;
  isDark: boolean;
}

const CustomMapMarker: React.FC<CustomMapMarkerProps> = ({
  marker,
  onMarkerPress,
  onEdit,
  onDelete,
  isCurrentUserCreator,
  isDark,
}) => {
  return (
    <Marker
      coordinate={{
        latitude: marker.latitude,
        longitude: marker.longitude,
      }}
      pinColor="#10B981"
      onPress={() => onMarkerPress(marker)}
    />
  );
};

export default CustomMapMarker;
