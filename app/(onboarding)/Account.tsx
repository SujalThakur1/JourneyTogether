import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Platform,
  View,
  TouchableOpacity,
  Text as RNText,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { useColors } from "@/contexts/ColorContext";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
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
import Avatar from "@/components/Account/Avatar";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useApp } from "@/contexts/AppContext";
import {
  requestLocationPermission,
  checkAndRequestLocationPermission,
} from "@/lib/locationService";
import Toast from "react-native-toast-message";

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
  const colors = useColors();

  // Combined session handling into single useEffect
  useEffect(() => {
    let subscription: any;
    const initializeSession = async () => {
      const { data: sessionData, error } = await supabase.auth.getSession();
      if (!error && sessionData.session) {
        setSession(sessionData.session);
      }

      const { data: authData } = supabase.auth.onAuthStateChange(
        (_event, newSession) => {
          setSession(newSession);
        }
      );
      subscription = authData.subscription;
    };

    initializeSession();
    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) getProfile();
  }, [session]);

  useEffect(() => {
    if (focusedInput && !showDatePicker) {
      const scrollPositions = {
        username: 150,
        bio: 600,
      };
      setTimeout(() => {
        scrollViewRef.current?.scrollToPosition(
          0,
          scrollPositions[focusedInput as keyof typeof scrollPositions] || 0,
          true
        );
      }, 100);
    }
  }, [focusedInput]);

  const getProfile = async () => {
    if (!session?.user) return;
    try {
      setLoading(true);
      const { data, error, status } = await supabase
        .from("users")
        .select(`username, date_of_birth, gender, bio, avatar_url`)
        .eq("id", session.user.id)
        .single();

      if (error && status !== 406) throw error;

      if (data) {
        setUsername(data.username || "");
        setDateOfBirth(data.date_of_birth || "");
        setGender(data.gender || "");
        setBio(data.bio || "");
        setAvatarUrl(data.avatar_url || "");
      }
    } catch (error) {
      console.error("Profile fetch error:", error);
      alert(error instanceof Error ? error.message : "Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      setLoading(true);
      setSaving(true);

      const newErrors: { [key: string]: string } = {};
      if (!username.trim()) newErrors.username = "Username is required";
      if (!dateOfBirth) newErrors.dateOfBirth = "Date of Birth is required";
      if (!gender) newErrors.gender = "Gender is required";

      if (Object.keys(newErrors).length) {
        setErrors(newErrors);
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

      const { error: updateError, data } = await supabase
        .from("users")
        .update(updates)
        .eq("id", session.user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setUserUpdated(true);
      await handleLocationPermission();
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Profile update error:", error);
      alert(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    } finally {
      setSaving(false);
      setLoading(false);
    }
  };

  const onDateChange = (_event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || new Date(dateOfBirth || new Date());
    const formattedDate = currentDate.toISOString().split("T")[0];

    setDateOfBirth(formattedDate);

    // Add 0.5 second delay before hiding the date picker
    setTimeout(() => {
      setShowDatePicker(false);
    }, 500);

    if (errors.dateOfBirth) {
      setErrors((prev) => ({ ...prev, dateOfBirth: "" }));
    }
  };

  const updateProfileWithAvatar = async (avatarUrl: string) => {
    if (!session?.user) return;
    try {
      const updates = {
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", session.user.id);

      if (error) throw error;
      setAvatarUrl(avatarUrl);
    } catch (error) {
      console.error("Avatar update error:", error);
      alert(error instanceof Error ? error.message : "Error updating avatar");
    }
  };

  const handleLocationPermission = async () => {
    const granted = await checkAndRequestLocationPermission(
      // Success callback
      () => {
        Toast.show({
          type: "success",
          text1: "Location Access Granted",
          text2: "Location services enabled",
          position: "top",
          visibilityTime: 3000,
        });
      },
      // Cancel callback
      () => {
        Toast.show({
          type: "error",
          text1: "Location Access Denied",
          text2: "Some features limited",
          position: "top",
          visibilityTime: 3000,
        });
      }
    );

    return granted;
  };

  const formatDate = (dateString: string) =>
    dateString
      ? new Date(dateString).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Select Date of Birth";

  const handleGenderChange = (value: string) => {
    setGender(value);
    setShowDatePicker(false);
    if (errors.gender) setErrors((prev) => ({ ...prev, gender: "" }));
  };

  const handleInputFocus = (inputName: string) => {
    setShowDatePicker(false);
    setFocusedInput(inputName);
  };

  if (loading) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: colors.bgColor }]}
      >
        <ActivityIndicator size="large" color={colors.accentColor} />
        <Text style={[styles.loadingText, { color: colors.textColor }]}>
          Loading profile...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.bgColor }]}
    >
      <KeyboardAwareScrollView
        ref={scrollViewRef}
        enableOnAndroid
        extraScrollHeight={-60}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Surface
          style={[
            styles.headerContainer,
            { backgroundColor: colors.cardBgColor },
          ]}
        >
          <Headline style={[styles.title, { color: colors.textColor }]}>
            Your Profile
          </Headline>
          <Paragraph style={[styles.subtitle, { color: colors.subTextColor }]}>
            Complete your profile to personalize your experience
          </Paragraph>
        </Surface>

        <View style={styles.avatarContainer}>
          <Avatar
            size={120}
            url={avatarUrl}
            onUpload={(url: string) => updateProfileWithAvatar(url)}
          />
        </View>

        <Surface
          style={[
            styles.formContainer,
            {
              backgroundColor: colors.cardBgColor,
              shadowColor: colors.cardShadowColor,
              borderColor: colors.cardBorderColor,
            },
          ]}
        >
          <View style={styles.formControl}>
            <Text style={[styles.label, { color: colors.textColor }]}>
              Username
            </Text>
            <PaperTextInput
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                if (errors.username)
                  setErrors((prev) => ({ ...prev, username: "" }));
              }}
              mode="outlined"
              placeholder="Enter your name"
              style={[styles.usernameInput, { backgroundColor: "transparent" }]}
              textColor={colors.inputTextColor}
              theme={{
                colors: {
                  primary: colors.focusedBorderColor,
                  placeholder: colors.mutedTextColor,
                  error: colors.dangerColor,
                  outline: colors.inputBorderColor,
                },
              }}
              error={!!errors.username}
              onFocus={() => handleInputFocus("username")}
              onBlur={() => setFocusedInput(null)}
            />
            {errors.username && (
              <Text style={[styles.errorText, { color: colors.dangerColor }]}>
                {errors.username}
              </Text>
            )}
          </View>

          <View style={styles.formControl}>
            <Text style={[styles.label, { color: colors.textColor }]}>
              Date of Birth
            </Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={[
                styles.dateInput,
                { borderColor: colors.inputBorderColor },
              ]}
            >
              <RNText style={{ color: colors.textColor }}>
                {formatDate(dateOfBirth)}
              </RNText>
              <MaterialIcons
                name="calendar-today"
                size={20}
                color={colors.iconColor}
              />
            </TouchableOpacity>
            {errors.dateOfBirth && (
              <Text style={[styles.errorText, { color: colors.dangerColor }]}>
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

          <View style={styles.formControl}>
            <Text style={[styles.label, { color: colors.textColor }]}>
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
                        borderColor: colors.accentColor,
                        backgroundColor:
                          gender === option
                            ? colors.accentColor
                            : "transparent",
                      },
                    ]}
                  >
                    {gender === option && (
                      <View style={styles.radioInnerCircle} />
                    )}
                  </View>
                  <RNText
                    style={[styles.radioText, { color: colors.textColor }]}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </RNText>
                </TouchableOpacity>
              ))}
            </View>
            {errors.gender && (
              <Text style={[styles.errorText, { color: colors.dangerColor }]}>
                {errors.gender}
              </Text>
            )}
          </View>

          <View style={styles.formControl}>
            <Text style={[styles.label, { color: colors.textColor }]}>Bio</Text>
            <PaperTextInput
              value={bio}
              onChangeText={setBio}
              mode="outlined"
              style={[styles.bioInput, { backgroundColor: "transparent" }]}
              textColor={colors.inputTextColor}
              theme={{
                colors: {
                  primary: colors.focusedBorderColor,
                  placeholder: colors.mutedTextColor,
                  outline: colors.inputBorderColor,
                },
              }}
              multiline
              numberOfLines={6}
              maxLength={250}
              placeholder="Tell us about yourself..."
              onFocus={() => handleInputFocus("bio")}
              onBlur={() => setFocusedInput(null)}
            />
            <Text style={[styles.charCount, { color: colors.subTextColor }]}>
              {bio.length}/250
            </Text>
          </View>
        </Surface>

        <Button
          mode="contained"
          onPress={updateProfile}
          loading={saving}
          disabled={saving}
          style={[styles.button, { backgroundColor: colors.buttonBgColor }]}
          labelStyle={[styles.buttonLabel, { color: colors.buttonTextColor }]}
        >
          Save Profile
        </Button>
      </KeyboardAwareScrollView>
      <Toast />
    </SafeAreaView>
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
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
