import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Image as RNImage,
  Text,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useColorModeContext } from "../contexts/ColorModeContext";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  size: number;
  url: string | null;
  onUpload: (filePath: string) => void;
}

export default function Avatar({ url, size = 150, onUpload }: Props) {
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const avatarSize = { height: size, width: size };

  // Theme colors using useColorModeContext
  const { effectiveColorMode } = useColorModeContext();
  const isDark = effectiveColorMode === "dark";
  const themeColors = {
    borderColor: isDark ? "#4B5563" : "#E5E7EB",
    avatarBgColor: isDark ? "#374151" : "#F3F4F6",
    placeholderIconColor: isDark ? "#6B7280" : "#9CA3AF",
    textColor: isDark ? "white" : "black",
    cameraIconColor: isDark ? "white" : "black",
    cameraIconBgColor: isDark ? "#374151" : "white",
    uploadingOverlayColor: isDark ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.7)",
  };

  useEffect(() => {
    // Set initial avatar URL from props
    setAvatarUrl(url);
  }, [url]);

  async function uploadAvatar() {
    try {
      setUploading(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        allowsEditing: true,
        quality: 1,
        aspect: [1, 1], // Enforce square aspect ratio for avatar
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log("User cancelled image picker.");
        return;
      }

      const image = result.assets[0];
      console.log("Selected image:", image);

      if (!image.uri) {
        console.error(
          "Upload failed: No image URI available in selected asset"
        );
        throw new Error("No image uri!");
      }

      // Set temporary preview immediately
      setAvatarUrl(image.uri);

      const arraybuffer = await fetch(image.uri)
        .then((res) => res.arrayBuffer())
        .catch((error) => {
          console.error(
            "Failed to fetch and convert image to array buffer:",
            error
          );
          throw error;
        });

      const fileExt = image.uri?.split(".").pop()?.toLowerCase() ?? "jpeg";
      const fileName = `${Date.now()}.${fileExt}`;
      console.log("Attempting upload with filename:", fileName);

      // Upload the file to Supabase
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, arraybuffer, {
          contentType: image.mimeType ?? "image/jpeg",
        });

      if (uploadError) {
        console.error("Supabase storage upload failed:", uploadError);
        throw uploadError;
      }

      console.log("File uploaded successfully to Supabase storage");

      // Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      if (!publicUrl) {
        console.error("Failed to generate public URL for uploaded file");
        throw new Error("Could not generate public URL");
      }

      console.log("Generated public URL:", publicUrl);

      // Pass the complete public URL to onUpload
      onUpload(publicUrl);
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error uploading avatar:", error.message);
      } else {
        console.error("Unknown error during avatar upload:", error);
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatarWrapper}>
        <TouchableOpacity onPress={uploadAvatar} disabled={uploading}>
          <View
            style={[
              styles.avatarBox,
              {
                borderColor: themeColors.borderColor,
                backgroundColor: themeColors.avatarBgColor,
                ...avatarSize,
              },
            ]}
          >
            {avatarUrl ? (
              <RNImage
                source={{ uri: avatarUrl }}
                style={[avatarSize, styles.image]}
              />
            ) : (
              <View style={[avatarSize, styles.placeholder]}>
                <Ionicons
                  name="person"
                  size={size * 0.5}
                  color={themeColors.placeholderIconColor}
                />
              </View>
            )}

            {/* Uploading overlay */}
            {uploading && (
              <View
                style={[
                  styles.uploadingOverlay,
                  { backgroundColor: themeColors.uploadingOverlayColor },
                ]}
              >
                {/* Simple spinner replacement */}
                <Ionicons
                  name="refresh"
                  size={size * 0.3}
                  color={themeColors.textColor}
                  style={styles.spinner}
                />
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Camera icon */}
        <View
          style={[
            styles.cameraIconContainer,
            {
              backgroundColor: themeColors.cameraIconBgColor,
              borderColor: themeColors.borderColor,
            },
          ]}
        >
          <TouchableOpacity onPress={uploadAvatar} disabled={uploading}>
            <Ionicons
              name="camera"
              size={size * 0.15}
              color={themeColors.cameraIconColor}
            />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        onPress={uploadAvatar}
        disabled={uploading}
        style={styles.textButton}
      >
        <Text
          style={[
            styles.uploadText,
            {
              color: themeColors.textColor,
              opacity: uploading ? 0.6 : 1,
            },
          ]}
        >
          {uploading
            ? "Uploading..."
            : avatarUrl
            ? "Change Photo"
            : "Add Photo"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  avatarWrapper: {
    position: "relative",
  },
  avatarBox: {
    borderRadius: 999,
    borderWidth: 2,
    overflow: "hidden",
  },
  image: {
    objectFit: "cover",
  },
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  spinner: {
    transform: [{ rotate: "45deg" }],
  },
  cameraIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    borderRadius: 999,
    padding: 8,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
    transform: [{ translateX: -5 }, { translateY: -1 }],
  },
  textButton: {
    marginTop: 8,
  },
  uploadText: {
    fontWeight: "500",
    fontSize: 14,
  },
});
