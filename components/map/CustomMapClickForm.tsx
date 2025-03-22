import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { CustomMarker } from "../../types/group";
import { useColors } from "@/contexts/ColorContext";

interface CustomMapClickFormProps {
  visible: boolean;
  onClose: () => void;
  onEditMarker: (marker: CustomMarker) => void;
  onDeleteMarker: (markerId: string, userId: string) => void;
  onAddWaypoint?: (marker: CustomMarker) => void;
  onRemoveWaypoint?: (marker: CustomMarker) => void;
  marker: CustomMarker;
  textColor: string;
  bgColor: string;
  borderColor: string;
  buttonColor: string;
  isCurrentUserCreator: boolean;
  isWaypoint?: boolean;
}

const CustomMapClickForm: React.FC<CustomMapClickFormProps> = ({
  visible,
  onClose,
  onEditMarker,
  onDeleteMarker,
  onAddWaypoint,
  onRemoveWaypoint,
  marker,
  textColor,
  bgColor,
  borderColor,
  buttonColor,
  isCurrentUserCreator,
  isWaypoint = false,
}) => {
  const color = useColors();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(marker.title);
  const [description, setDescription] = useState(marker.description);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (!title.trim()) {
      setError("Please enter a title");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      onEditMarker({
        ...marker,
        title: title.trim(),
        description: description.trim(),
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating marker:", error);
      setError("Failed to update marker");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    onDeleteMarker(marker.id, marker.userId);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
      >
        <View
          style={[
            styles.formContainer,
            { backgroundColor: bgColor, borderColor },
          ]}
        >
          <View style={[styles.formHeader, { borderBottomColor: borderColor }]}>
            <Text style={[styles.formTitle, { color: textColor }]}>
              Marker Details
            </Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color={textColor} />
            </TouchableOpacity>
          </View>

          <View style={styles.formContent}>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: textColor }]}>Title</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.input, { color: textColor, borderColor }]}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Enter marker title"
                  placeholderTextColor={
                    Platform.OS === "ios" ? "#A0AEC0" : "#6B7280"
                  }
                />
              ) : (
                <Text style={[styles.text, { color: textColor }]}>{title}</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: textColor }]}>
                Description
              </Text>
              {isEditing ? (
                <TextInput
                  style={[styles.textArea, { color: textColor, borderColor }]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Enter marker description (optional)"
                  placeholderTextColor={
                    Platform.OS === "ios" ? "#A0AEC0" : "#6B7280"
                  }
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              ) : (
                <Text style={[styles.text, { color: textColor }]}>
                  {description || "No description provided"}
                </Text>
              )}
            </View>

            <View style={styles.locationInfo}>
              <MaterialIcons name="place" size={20} color={textColor} />
              <Text style={[styles.locationText, { color: textColor }]}>
                Location - Lat: {marker.latitude.toFixed(6)}, Lng:{" "}
                {marker.longitude.toFixed(6)}
              </Text>
            </View>

            {/* Waypoint buttons */}
            {onAddWaypoint && !isWaypoint && (
              <TouchableOpacity
                style={[styles.waypointButton, { backgroundColor: "#10B981" }]}
                onPress={() => {
                  onAddWaypoint(marker);
                  onClose();
                }}
              >
                <MaterialIcons name="directions" size={20} color="white" />
                <Text style={styles.waypointButtonText}>Add as Waypoint</Text>
              </TouchableOpacity>
            )}

            {onRemoveWaypoint && isWaypoint && (
              <TouchableOpacity
                style={[styles.waypointButton, { backgroundColor: "#EF4444" }]}
                onPress={() => {
                  onRemoveWaypoint(marker);
                  onClose();
                }}
              >
                <MaterialIcons name="remove-circle" size={20} color="white" />
                <Text style={styles.waypointButtonText}>Remove Waypoint</Text>
              </TouchableOpacity>
            )}

            <View style={styles.metaInfo}>
              <Text style={[styles.metaText, { color: textColor + "99" }]}>
                Added by {marker.createdBy}
              </Text>
              <Text style={[styles.metaText, { color: textColor + "99" }]}>
                {new Date(marker.createdAt).toLocaleString()}
              </Text>
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <View style={styles.buttonGroup}>
              {isCurrentUserCreator ? (
                <>
                  {isEditing ? (
                    <>
                      <TouchableOpacity
                        style={[
                          styles.button,
                          styles.cancelButton,
                          { borderColor },
                        ]}
                        onPress={() => setIsEditing(false)}
                        disabled={loading}
                      >
                        <Text
                          style={[
                            styles.cancelButtonText,
                            { color: textColor },
                          ]}
                        >
                          Cancel
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.button,
                          styles.saveButton,
                          { backgroundColor: buttonColor },
                        ]}
                        onPress={handleSave}
                        disabled={loading}
                      >
                        {loading ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <Text
                            style={[
                              styles.saveButtonText,
                              { color: color.buttonTextColor },
                            ]}
                          >
                            Save Changes
                          </Text>
                        )}
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={[styles.button, styles.deleteButton]}
                        onPress={handleDelete}
                        disabled={loading}
                      >
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.button,
                          styles.editButton,
                          { backgroundColor: buttonColor },
                        ]}
                        onPress={() => setIsEditing(true)}
                        disabled={loading}
                      >
                        <Text
                          style={[
                            styles.editButtonText,
                            { color: color.buttonTextColor },
                          ]}
                        >
                          Edit
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.button, styles.closeButton, { borderColor }]}
                  onPress={onClose}
                >
                  <Text style={[styles.closeButtonText, { color: textColor }]}>
                    Close
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  formContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  formContent: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 100,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  locationText: {
    fontSize: 14,
  },
  metaInfo: {
    marginBottom: 16,
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  errorText: {
    color: "#EF4444",
    marginBottom: 16,
    fontSize: 14,
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  saveButton: {},
  deleteButton: {
    backgroundColor: "#EF4444",
  },
  editButton: {},
  closeButton: {
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  editButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  waypointButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#10B981",
  },
  waypointButtonText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default CustomMapClickForm;
