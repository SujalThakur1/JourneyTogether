import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Marker, Callout } from "react-native-maps";
import { MaterialIcons } from "@expo/vector-icons";
import { CustomMarker } from "../../types/group";

interface CustomMapMarkerProps {
  marker: CustomMarker;
  onEdit?: (marker: CustomMarker) => void;
  onDelete?: (markerId: string, userId: string) => void;
  isCurrentUserCreator: boolean;
  isDark: boolean;
}

const CustomMapMarker: React.FC<CustomMapMarkerProps> = ({
  marker,
  onEdit,
  onDelete,
  isCurrentUserCreator,
  isDark,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(marker.title);
  const [editedDescription, setEditedDescription] = useState(
    marker.description
  );

  const handleSaveEdit = () => {
    if (
      onEdit &&
      (editedTitle !== marker.title || editedDescription !== marker.description)
    ) {
      onEdit({
        ...marker,
        title: editedTitle,
        description: editedDescription,
      });
    }
    setIsEditing(false);
  };

  const textColor = isDark ? "#F3F4F6" : "#1F2937";
  const bgColor = isDark ? "#374151" : "#F9FAFB";
  const borderColor = isDark ? "#4B5563" : "#E5E7EB";

  return (
    <Marker
      coordinate={{
        latitude: marker.latitude,
        longitude: marker.longitude,
      }}
      pinColor="purple"
    >
      <Callout tooltip>
        <View
          style={[
            styles.calloutContainer,
            { backgroundColor: bgColor, borderColor },
          ]}
        >
          {isEditing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={[styles.input, { color: textColor, borderColor }]}
                value={editedTitle}
                onChangeText={setEditedTitle}
                placeholder="Title"
                placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
              />
              <TextInput
                style={[styles.textArea, { color: textColor, borderColor }]}
                value={editedDescription}
                onChangeText={setEditedDescription}
                placeholder="Description"
                placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                multiline
                numberOfLines={4}
              />
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: "#EF4444" }]}
                  onPress={() => setIsEditing(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: "#10B981" }]}
                  onPress={handleSaveEdit}
                >
                  <Text style={styles.buttonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              <View style={styles.calloutHeader}>
                <Text style={[styles.calloutTitle, { color: textColor }]}>
                  {marker.title}
                </Text>
                {isCurrentUserCreator && (
                  <View style={styles.calloutActions}>
                    <TouchableOpacity onPress={() => setIsEditing(true)}>
                      <MaterialIcons
                        name="edit"
                        size={18}
                        color={isDark ? "#60A5FA" : "#3B82F6"}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        onDelete && onDelete(marker.id, marker.userId)
                      }
                    >
                      <MaterialIcons name="delete" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <Text style={[styles.calloutDescription, { color: textColor }]}>
                {marker.description}
              </Text>
              <View style={styles.calloutFooter}>
                <Text
                  style={[
                    styles.calloutMeta,
                    { color: isDark ? "#9CA3AF" : "#6B7280" },
                  ]}
                >
                  Added by {marker.createdBy}
                </Text>
                <Text
                  style={[
                    styles.calloutMeta,
                    { color: isDark ? "#9CA3AF" : "#6B7280" },
                  ]}
                >
                  {new Date(marker.createdAt).toLocaleString()}
                </Text>
              </View>
            </View>
          )}
        </View>
      </Callout>
    </Marker>
  );
};

const styles = StyleSheet.create({
  calloutContainer: {
    width: 250,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  calloutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  calloutActions: {
    flexDirection: "row",
    gap: 8,
  },
  calloutDescription: {
    fontSize: 14,
    marginVertical: 8,
  },
  calloutFooter: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  calloutMeta: {
    fontSize: 11,
  },
  editContainer: {
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    fontSize: 14,
    textAlignVertical: "top",
    minHeight: 80,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginHorizontal: 4,
  },
  buttonText: {
    color: "white",
    fontWeight: "500",
    fontSize: 14,
  },
});

export default CustomMapMarker;
