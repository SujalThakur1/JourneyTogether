import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/lib/supabase";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { TextInput as PaperTextInput } from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import Avatar from "@/components/Account/Avatar";
import { useColorModeContext } from "@/contexts/ColorModeContext";

export default function ProfileSettings() {
  const router = useRouter();
  const { userDetails, setUserUpdated } = useApp();
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    username: userDetails?.username || "",
    email: userDetails?.email || "",
    date_of_birth: userDetails?.date_of_birth || "",
    gender: userDetails?.gender || "",
    bio: userDetails?.bio || "",
    avatar_url: userDetails?.avatar_url || "",
  });

  // Theme colors using useColorModeContext
  const { effectiveColorMode } = useColorModeContext();
  const isDark = effectiveColorMode === "dark";
  const themeColors = {
    bgColor: isDark ? "#1F2937" : "white",
    cardBgColor: isDark ? "#374151" : "#F9FAFB",
    borderColor: isDark ? "#4B5563" : "#E5E7EB",
    textColor: isDark ? "#F9FAFB" : "black",
    subTextColor: isDark ? "#9CA3AF" : "#6B7280",
    accentColor: "#ED851B", // Consistent across modes
    inputBgColor: isDark ? "#374151" : "white",
    primaryColor: isDark ? "#FFFFFF" : "#000000",
    labelColor: isDark ? "#FFFFFF" : "#000000",
    pressedAccentColor: isDark ? "#F09A3A" : "#D67A18",
    genderOptionBg: isDark ? "#333333" : "#F0EDE8",
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  const handleDateChange = (event: any, selectedDate: any) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData((prev) => ({
        ...prev,
        date_of_birth: formatDate(selectedDate),
      }));
    }
  };

  const handleAvatarUpload = (url: string) => {
    setFormData((prev) => ({ ...prev, avatar_url: url }));
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from("users")
        .update({
          username: formData.username,
          date_of_birth: formData.date_of_birth,
          gender: formData.gender,
          bio: formData.bio,
          avatar_url: formData.avatar_url,
        })
        .eq("id", userDetails.id);

      if (error) throw error;

      setUserUpdated(true);

      Toast.show({
        type: "success",
        text1: "Profile Updated",
        text2: "Profile updated successfully",
        position: "top",
        visibilityTime: 3000,
      });

      router.replace("/(tabs)");
    } catch (error) {
      console.error("Error updating profile:", error);
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: "Failed to update profile",
        position: "top",
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bgColor }]}>
      <View
        style={[styles.header, { borderBottomColor: themeColors.borderColor }]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={themeColors.textColor} />
        </TouchableOpacity>
        <Text style={[styles.heading, { color: themeColors.textColor }]}>
          Profile Settings
        </Text>
      </View>

      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          {/* Avatar Section */}
          <View style={styles.avatarContainer}>
            <Avatar
              url={formData.avatar_url}
              size={120}
              onUpload={handleAvatarUpload}
            />
          </View>

          {/* Profile Form */}
          <View
            style={[
              styles.formCard,
              {
                backgroundColor: themeColors.cardBgColor,
                borderColor: themeColors.borderColor,
              },
            ]}
          >
            {/* Username */}
            <View style={styles.formControl}>
              <Text style={[styles.label, { color: themeColors.labelColor }]}>
                Username
              </Text>
              <PaperTextInput
                value={formData.username}
                onChangeText={(value) =>
                  setFormData((prev) => ({ ...prev, username: value }))
                }
                mode="outlined"
                style={styles.input}
                textColor={themeColors.textColor}
                theme={{
                  colors: {
                    primary: themeColors.primaryColor,
                    placeholder: isDark ? "#9CA3AF" : "#6B7280",
                  },
                }}
              />
            </View>

            {/* Email - Read Only */}
            <View style={styles.formControl}>
              <Text style={[styles.label, { color: themeColors.labelColor }]}>
                Email
              </Text>
              <PaperTextInput
                value={formData.email}
                mode="outlined"
                style={styles.input}
                textColor={themeColors.textColor}
                disabled
                theme={{
                  colors: {
                    primary: themeColors.primaryColor,
                    placeholder: isDark ? "#9CA3AF" : "#6B7280",
                  },
                }}
              />
              <Text
                style={[styles.helperText, { color: themeColors.subTextColor }]}
              >
                Email cannot be changed
              </Text>
            </View>

            {/* Date of Birth */}
            <View style={styles.formControl}>
              <Text style={[styles.label, { color: themeColors.labelColor }]}>
                Date of Birth
              </Text>
              <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                <PaperTextInput
                  value={formData.date_of_birth}
                  mode="outlined"
                  style={styles.input}
                  textColor={themeColors.textColor}
                  editable={false}
                  right={
                    <PaperTextInput.Icon
                      icon="calendar"
                      color={themeColors.primaryColor}
                      onPress={() => setShowDatePicker(true)}
                    />
                  }
                  theme={{
                    colors: {
                      primary: themeColors.primaryColor,
                      placeholder: isDark ? "#9CA3AF" : "#6B7280",
                    },
                  }}
                />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={
                    formData.date_of_birth
                      ? new Date(formData.date_of_birth)
                      : new Date()
                  }
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleDateChange}
                />
              )}
            </View>

            {/* Gender */}
            <View style={styles.formControl}>
              <Text style={[styles.label, { color: themeColors.labelColor }]}>
                Gender
              </Text>
              <View style={styles.genderOptions}>
                {["male", "female", "other"].map((gender) => (
                  <TouchableOpacity
                    key={gender}
                    onPress={() => setFormData((prev) => ({ ...prev, gender }))}
                    style={styles.genderButton}
                  >
                    <View
                      style={[
                        styles.genderOption,
                        {
                          backgroundColor:
                            formData.gender === gender
                              ? themeColors.accentColor
                              : themeColors.genderOptionBg,
                          opacity: formData.gender === gender ? 1 : 0.7,
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          gender === "male"
                            ? "male-outline"
                            : gender === "female"
                            ? "female-outline"
                            : "person-outline"
                        }
                        size={24}
                        color={
                          formData.gender === gender
                            ? "white"
                            : themeColors.textColor
                        }
                      />
                      <Text
                        style={{
                          color:
                            formData.gender === gender
                              ? "white"
                              : themeColors.textColor,
                          marginTop: 4,
                          fontSize: 12,
                          fontWeight:
                            formData.gender === gender ? "bold" : "normal",
                        }}
                      >
                        {gender.charAt(0).toUpperCase() + gender.slice(1)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Bio */}
            <View style={styles.formControl}>
              <Text style={[styles.label, { color: themeColors.labelColor }]}>
                Bio
              </Text>
              <PaperTextInput
                value={formData.bio}
                onChangeText={(value) =>
                  setFormData((prev) => ({ ...prev, bio: value }))
                }
                mode="outlined"
                style={[styles.input, styles.bioInput]}
                textColor={themeColors.textColor}
                theme={{
                  colors: {
                    primary: themeColors.primaryColor,
                    placeholder: isDark ? "#9CA3AF" : "#6B7280",
                  },
                }}
                multiline
                numberOfLines={6}
                maxLength={250}
                placeholder="Tell us about yourself..."
              />
              <Text
                style={[styles.charCount, { color: themeColors.labelColor }]}
              >
                {formData.bio.length}/250 characters
              </Text>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleUpdate}
            disabled={loading}
            style={[
              styles.saveButton,
              {
                backgroundColor: loading
                  ? themeColors.pressedAccentColor
                  : themeColors.accentColor,
              },
            ]}
          >
            <Text style={styles.saveButtonText}>
              {loading ? "Saving..." : "Save Changes"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  content: {
    flex: 1,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  formCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  formControl: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "transparent",
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  genderOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  genderButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  genderOption: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  bioInput: {
    height: 120,
    textAlignVertical: "top",
  },
  charCount: {
    textAlign: "right",
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  saveButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
    marginTop: 16,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
