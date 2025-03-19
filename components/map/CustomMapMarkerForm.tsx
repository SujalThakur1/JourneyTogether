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
import { CustomMarkerData } from "./CustomMapMarker";
import { nanoid } from "nanoid";

interface CustomMapMarkerFormProps {
  visible: boolean;
  onClose: () => void;
  onAddMarker: (marker: CustomMarkerData) => void;
  locationCoordinates: { latitude: number; longitude: number };
  username: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  buttonColor: string;
}

const CustomMapMarkerForm: React.FC<CustomMapMarkerFormProps> = ({
  visible,
  onClose,
  onAddMarker,
  locationCoordinates,
  username,
  textColor,
  bgColor,
  borderColor,
  buttonColor,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    // Basic validation
    if (!title.trim()) {
      setError("Please enter a title");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newMarker: CustomMarkerData = {
        id: nanoid(), // Generate a unique ID
        latitude: locationCoordinates.latitude,
        longitude: locationCoordinates.longitude,
        title: title.trim(),
        description: description.trim(),
        createdBy: username,
        createdAt: new Date(),
      };

      onAddMarker(newMarker);

      // Reset form
      setTitle("");
      setDescription("");
      onClose();
    } catch (error) {
      console.error("Error adding marker:", error);
      setError("Failed to add marker");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setTitle("");
    setDescription("");
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
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
              Add Map Marker
            </Text>
            <TouchableOpacity onPress={handleCancel}>
              <MaterialIcons name="close" size={24} color={textColor} />
            </TouchableOpacity>
          </View>

          <View style={styles.formContent}>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: textColor }]}>Title</Text>
              <TextInput
                style={[styles.input, { color: textColor, borderColor }]}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter marker title"
                placeholderTextColor={
                  Platform.OS === "ios" ? "#A0AEC0" : "#6B7280"
                }
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: textColor }]}>
                Description
              </Text>
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
            </View>

            <View style={styles.locationInfo}>
              <MaterialIcons name="location-on" size={20} color={textColor} />
              <Text style={[styles.locationText, { color: textColor }]}>
                Lat: {locationCoordinates.latitude.toFixed(6)}, Lng:{" "}
                {locationCoordinates.longitude.toFixed(6)}
              </Text>
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, { borderColor }]}
                onPress={handleCancel}
                disabled={loading}
              >
                <Text style={[styles.cancelButtonText, { color: textColor }]}>
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
                  <Text style={styles.saveButtonText}>Add Marker</Text>
                )}
              </TouchableOpacity>
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
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default CustomMapMarkerForm;
