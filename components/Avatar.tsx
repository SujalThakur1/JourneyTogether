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
import { useColors } from "../contexts/ColorContext";
import { Ionicons } from "@expo/vector-icons";
import * as Animatable from "react-native-animatable";

interface Props {
  size: number;
  url: string | null;
  onUpload: (filePath: string) => void;
}

export default function Avatar({ url, size = 150, onUpload }: Props) {
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const avatarSize = { height: size, width: size };
  const colors = useColors();

  useEffect(() => {
    setAvatarUrl(url);
  }, [url]);

  async function uploadAvatar() {
    try {
      setUploading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
        aspect: [1, 1],
      });

      if (result.canceled || !result.assets?.length) return;

      const image = result.assets[0];
      setAvatarUrl(image.uri);

      const arraybuffer = await fetch(image.uri).then((res) =>
        res.arrayBuffer()
      );
      const fileExt = image.uri.split(".").pop()?.toLowerCase() ?? "jpeg";
      const fileName = `${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, arraybuffer, {
          contentType: image.mimeType ?? "image/jpeg",
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      if (!publicUrl) throw new Error("Could not generate public URL");
      onUpload(publicUrl);
    } catch (error) {
      console.error("Error uploading avatar:", error);
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bgColor }]}>
      <View style={styles.avatarWrapper}>
        <TouchableOpacity
          onPress={uploadAvatar}
          disabled={uploading}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.avatarBox,
              {
                borderColor: colors.accentColor,
                backgroundColor: colors.cardBgColor,
                ...avatarSize,
                shadowColor: colors.cardShadowColor,
              },
            ]}
          >
            {avatarUrl ? (
              <RNImage
                source={{ uri: avatarUrl }}
                style={[avatarSize, styles.image]}
                resizeMode="cover"
              />
            ) : (
              <View style={[avatarSize, styles.placeholder]}>
                <Ionicons
                  name="person"
                  size={size * 0.5}
                  color={colors.emptyStateIconColor}
                />
              </View>
            )}

            {/* Enhanced loading animation without dots */}
            {uploading && (
              <Animatable.View
                animation="pulse"
                iterationCount="infinite"
                style={[
                  styles.uploadingOverlay,
                  { backgroundColor: colors.overlayBgColor },
                ]}
              >
                <Animatable.View
                  animation="rotate"
                  iterationCount="infinite"
                  duration={1000}
                  style={[styles.spinner, { borderColor: colors.accentColor }]}
                />
              </Animatable.View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={uploadAvatar}
          disabled={uploading}
          style={[
            styles.cameraIconContainer,
            {
              backgroundColor: colors.buttonBgColor,
              borderColor: colors.accentColor,
            },
          ]}
        >
          <Ionicons
            name="camera"
            size={size * 0.15}
            color={colors.buttonTextColor}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={uploadAvatar}
        disabled={uploading}
        style={[
          styles.textButton,
          {
            backgroundColor: colors.buttonBgColor,
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 8,
          },
        ]}
      >
        <Text
          style={[
            styles.uploadText,
            {
              color: colors.buttonTextColor,
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
    padding: 16,
    borderRadius: 12,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 12,
  },
  avatarBox: {
    borderRadius: 999,
    borderWidth: 3,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  image: {},
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
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 4,
    borderTopColor: "transparent",
  },
  cameraIconContainer: {
    position: "absolute",
    bottom: 4,
    right: 4,
    borderRadius: 999,
    padding: 6,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  textButton: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  uploadText: {
    fontWeight: "600",
    fontSize: 14,
    textAlign: "center",
  },
});
