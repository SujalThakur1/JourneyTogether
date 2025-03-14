import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Platform,
  View,
  TouchableOpacity,
  Text as RNText,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { Session } from "@supabase/supabase-js";
import { useColorScheme } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import {
  TextInput as PaperTextInput,
  Button,
  Text,
  Headline,
  Paragraph,
  ActivityIndicator,
  Surface,
} from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import Avatar from "../../components/Avatar";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useApp } from "../../contexts/AppContext";
import { requestLocationPermission } from "../../lib/locationService";
import Toast from "react-native-toast-message"; // Toast replacement

export default function Account() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const { userUpdated, setUserUpdated } = useApp();
  const scrollViewRef = useRef<KeyboardAwareScrollView>(null);

  // Theme colors using useColorScheme
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const themeColors = {
    bgColor: isDark ? "#1F2937" : "white",
    cardBgColor: isDark ? "#374151" : "white",
    primaryColor: isDark ? "#FFFFFF" : "#000000",
    textColor: isDark ? "#F9FAFB" : "#000000",
    labelColor: isDark ? "#F9FAFB" : "#000000",
    inputBorderColor: isDark ? "#6B7280" : "#000000",
    errorColor: "#EF4444",
    subTextColor: isDark ? "#9CA3AF" : "#6B7280",
  };

  // Get session on component mount
  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session:", error);
        return;
      }
      setSession(data.session);
    };

    getSession();

    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session) getProfile();
  }, [session]);

  // Handle input focusing and scrolling
  useEffect(() => {
    if (focusedInput) {
      setShowDatePicker(false);
      setTimeout(() => {
        if (focusedInput === "username") {
          scrollViewRef.current?.scrollToPosition(0, 150, true);
        } else if (focusedInput === "bio") {
          scrollViewRef.current?.scrollToPosition(0, 600, true);
        }
      }, 100);
    }
  }, [focusedInput]);

  async function getProfile() {
    try {
      setLoading(true);
      if (!session?.user) throw new Error("No user on the session!");

      const { data, error, status } = await supabase
        .from("users")
        .select(`username, date_of_birth, gender, bio, avatar_url`)
        .eq("id", session?.user.id)
        .single();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setUsername(data.username || "");
        setDateOfBirth(data.date_of_birth || "");
        setGender(data.gender || "");
        setBio(data.bio || "");
        setAvatarUrl(data.avatar_url || "");
      }
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  const updateProfile = async () => {
    try {
      setLoading(true);
      setSaving(true);

      const newErrors: { [key: string]: string } = {};
      if (!username.trim()) newErrors.username = "Username is required";
      if (!dateOfBirth) newErrors.dateOfBirth = "Date of Birth is required";
      if (!gender) newErrors.gender = "Gender is required";

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setSaving(false);
        setLoading(false);
        return;
      }

      if (!session?.user) throw new Error("No user on the session!");
      const updates = {
        username,
        date_of_birth: dateOfBirth,
        gender,
        bio,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      };

      console.log("Attempting to update profile with:", updates);

      const { error: updateError, data } = await supabase
        .from("users")
        .update(updates)
        .eq("id", session.user.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating profile:", updateError);
        throw new Error(updateError.message || "Failed to update profile");
      }

      console.log("Profile updated successfully:", data);
      setUserUpdated(true);

      const granted = await requestLocationPermission();
      Toast.show({
        type: granted ? "success" : "error",
        text1: granted ? "Location Access Granted" : "Location Access Denied",
        text2: granted
          ? "Location services are now enabled"
          : "Some features may be limited",
        position: "top",
        visibilityTime: 3000,
      });

      router.replace("/(tabs)");
    } catch (error) {
      console.error("Caught error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "An error occurred while updating your profile"
      );
    } finally {
      setSaving(false);
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || new Date(dateOfBirth || new Date());
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setDateOfBirth(currentDate.toISOString().split("T")[0]);
      if (errors.dateOfBirth) setErrors({ ...errors, dateOfBirth: "" });
    }
  };

  const updateProfileWithAvatar = async (avatarUrl: string) => {
    try {
      if (!session?.user) throw new Error("No user on the session!");

      console.log("Updating avatar with URL:", avatarUrl);

      const updates = {
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      };

      const { error, data } = await supabase
        .from("users")
        .update(updates)
        .eq("id", session.user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log("Profile updated with new avatar:", data);
      setAvatarUrl(avatarUrl);
    } catch (error) {
      console.error("Error updating avatar:", error);
      alert(error instanceof Error ? error.message : "Error updating avatar");
    }
  };

  const handleLocationPermission = async () => {
    const granted = await requestLocationPermission();
    Toast.show({
      type: granted ? "success" : "error",
      text1: granted ? "Location Access Granted" : "Location Access Denied",
      text2: granted
        ? "Location services are now enabled"
        : "Some features may be limited",
      position: "top",
      visibilityTime: 3000,
    });
  };

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: themeColors.bgColor },
        ]}
      >
        <ActivityIndicator size="large" color={themeColors.primaryColor} />
        <Text style={[styles.loadingText, { color: themeColors.textColor }]}>
          Loading profile...
        </Text>
      </View>
    );
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Select Date of Birth";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleGenderChange = (value: string) => {
    setShowDatePicker(false);
    setGender(value);
    if (errors.gender) setErrors({ ...errors, gender: "" });
  };

  const handleInputFocus = (inputName: string) => {
    setShowDatePicker(false);
    setFocusedInput(inputName);
    if (Platform.OS === "ios") {
      setTimeout(() => {
        if (inputName === "username") {
          scrollViewRef.current?.scrollToPosition(0, 150, true);
        } else if (inputName === "bio") {
          scrollViewRef.current?.scrollToPosition(0, 400, true);
        }
      }, 100);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bgColor }]}>
      <KeyboardAwareScrollView
        ref={scrollViewRef}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={-60}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        enableResetScrollToCoords={false}
      >
        <Surface
          style={[
            styles.headerContainer,
            { backgroundColor: themeColors.bgColor },
          ]}
          elevation={0}
        >
          <Headline style={[styles.title, { color: themeColors.textColor }]}>
            Your Profile
          </Headline>
          <Paragraph
            style={[styles.subtitle, { color: themeColors.labelColor }]}
          >
            Complete your profile to personalize your experience
          </Paragraph>
        </Surface>

        <View style={styles.avatarContainer}>
          <Avatar
            size={120}
            url={avatarUrl}
            onUpload={(url: string) => {
              console.log("Received new avatar URL:", url);
              setShowDatePicker(false);
              updateProfileWithAvatar(url);
            }}
          />
        </View>

        <Surface
          style={[
            styles.formContainer,
            { backgroundColor: themeColors.cardBgColor },
          ]}
          elevation={1}
        >
          {/* Username */}
          <View style={styles.formControl}>
            <Text style={[styles.label, { color: themeColors.labelColor }]}>
              Username
            </Text>
            <PaperTextInput
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                if (errors.username) setErrors({ ...errors, username: "" });
              }}
              mode="outlined"
              placeholder="Enter your name"
              style={[styles.usernameInput, { backgroundColor: "transparent" }]}
              textColor={themeColors.textColor}
              theme={{
                colors: {
                  primary: themeColors.primaryColor,
                  placeholder: themeColors.subTextColor,
                  error: themeColors.errorColor,
                },
              }}
              error={!!errors.username}
              onFocus={() => handleInputFocus("username")}
              onBlur={() => setFocusedInput(null)}
            />
            {errors.username && (
              <Text
                style={[styles.errorText, { color: themeColors.errorColor }]}
              >
                {errors.username}
              </Text>
            )}
          </View>

          {/* Date of Birth */}
          <View style={styles.formControl}>
            <Text style={[styles.label, { color: themeColors.labelColor }]}>
              Date of Birth
            </Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={[
                styles.dateInput,
                { borderColor: themeColors.inputBorderColor },
              ]}
            >
              <RNText style={{ color: themeColors.textColor }}>
                {formatDate(dateOfBirth)}
              </RNText>
              <MaterialIcons
                name="calendar-today"
                size={20}
                color={themeColors.labelColor}
              />
            </TouchableOpacity>
            {errors.dateOfBirth && (
              <Text
                style={[styles.errorText, { color: themeColors.errorColor }]}
              >
                {errors.dateOfBirth}
              </Text>
            )}
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={dateOfBirth ? new Date(dateOfBirth) : new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          )}

          {/* Gender */}
          <View style={styles.formControl}>
            <Text style={[styles.label, { color: themeColors.labelColor }]}>
              Gender
            </Text>
            <View style={styles.radioGroup}>
              {["male", "female", "other"].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.radioOption}
                  onPress={() => handleGenderChange(option)}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor: themeColors.primaryColor,
                        backgroundColor:
                          gender === option
                            ? themeColors.primaryColor
                            : "transparent",
                      },
                    ]}
                  >
                    {gender === option && (
                      <View style={styles.radioInnerCircle} />
                    )}
                  </View>
                  <RNText
                    style={[styles.radioText, { color: themeColors.textColor }]}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </RNText>
                </TouchableOpacity>
              ))}
            </View>
            {errors.gender && (
              <Text
                style={[styles.errorText, { color: themeColors.errorColor }]}
              >
                {errors.gender}
              </Text>
            )}
          </View>

          {/* Bio */}
          <View style={styles.formControl}>
            <Text style={[styles.label, { color: themeColors.labelColor }]}>
              Bio
            </Text>
            <PaperTextInput
              value={bio}
              onChangeText={setBio}
              mode="outlined"
              style={[styles.bioInput, { backgroundColor: "transparent" }]}
              textColor={themeColors.textColor}
              theme={{
                colors: {
                  primary: themeColors.primaryColor,
                  placeholder: themeColors.subTextColor,
                },
              }}
              multiline
              numberOfLines={6}
              maxLength={250}
              placeholder="Tell us about yourself..."
              onFocus={() => handleInputFocus("bio")}
              onBlur={() => setFocusedInput(null)}
            />
            <Text style={[styles.charCount, { color: themeColors.labelColor }]}>
              {bio.length}/250 characters
            </Text>
          </View>
        </Surface>

        <Button
          mode="contained"
          onPress={updateProfile}
          loading={saving}
          disabled={saving}
          style={[styles.button, { backgroundColor: themeColors.primaryColor }]}
          labelStyle={[
            styles.buttonLabel,
            { color: isDark ? "#000000" : "#FFFFFF" },
          ]}
        >
          Save Profile
        </Button>
      </KeyboardAwareScrollView>
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    flexGrow: 1,
  },
  headerContainer: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.7,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  formContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  formControl: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  usernameInput: {
    height: 45,
  },
  dateInput: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  radioGroup: {
    marginTop: 4,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "white",
  },
  radioText: {
    fontSize: 16,
  },
  bioInput: {
    height: 120,
    textAlignVertical: "top",
  },
  charCount: {
    textAlign: "right",
    marginTop: 4,
    fontSize: 12,
    opacity: 0.7,
  },
  button: {
    marginBottom: 32,
    borderRadius: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "600",
    paddingVertical: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
});
