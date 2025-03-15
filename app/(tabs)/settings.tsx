import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Switch as RNSwitch,
  StatusBar as RNStatusBar,
  SafeAreaView,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../lib/supabase";
import { useApp } from "../../contexts/AppContext";
import { useColorModeContext } from "../../contexts/ColorModeContext";
import { useColors } from "../../contexts/ColorContext";
import Toast from "react-native-toast-message"; // Toast replacement
import { CACHE_KEYS } from "../../contexts/AppContext";
 
export default function SettingsScreen() {
  const colors = useColors();
  const { colorMode, toggleColorMode, setColorMode } = useColorModeContext();
  const router = useRouter();
  const {
    userDetails,
    userLoading,
    userUpdated,
    setUserUpdated,
    isTrackingLocation,
    startTrackingLocation,
    stopTrackingLocation,
    userLocation,
  } = useApp();
  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(true);

  useEffect(() => {
    if (userDetails === null && !userUpdated) {
      setUserUpdated(true);
    }
  }, [userDetails, userUpdated, setUserUpdated]);

  // Loading state
  if (userLoading) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: colors.bgColor }]}
      >
        <RNStatusBar
          barStyle={colorMode === "dark" ? "light-content" : "dark-content"}
          backgroundColor={colorMode === "dark" ? "#1A1A1A" : "#F7F5F2"}
        />
        <ActivityIndicator size="large" color={colors.accentColor} />
        <Text style={[styles.loadingText, { color: colors.textColor }]}>
          Loading your preferences...
        </Text>
      </View>
    );
  }

  const settingsSections = [
    {
      title: "Account",
      items: [
        {
          icon: "person-outline",
          label: "Profile Settings",
          route: "/settings/profile",
        },
        {
          icon: "lock-closed-outline",
          label: "Privacy & Security",
          route: "/settings/privacy",
        },
        {
          icon: "notifications-outline",
          label: "Notification Preferences",
          route: "/settings/notifications",
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          icon: "help-circle-outline",
          label: "Help Center",
          route: "/settings/help",
        },
        {
          icon: "chatbox-outline",
          label: "Contact Support",
          route: "/settings/support",
        },
        {
          icon: "document-text-outline",
          label: "Terms of Service",
          route: "/settings/terms",
        },
        {
          icon: "shield-outline",
          label: "Privacy Policy",
          route: "/settings/privacy-policy",
        },
      ],
    },
  ];

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      await AsyncStorage.multiRemove([
        CACHE_KEYS.DESTINATIONS,
        CACHE_KEYS.CATEGORIES,
        CACHE_KEYS.TOP_DESTINATIONS,
        CACHE_KEYS.CACHE_TIMESTAMP,
        CACHE_KEYS.ALL_DESTINATIONS,
      ]);
      router.replace("/");
    } catch (error) {
      console.error("Error logging out:", error);
      Toast.show({
        type: "error",
        text1: "Logout Failed",
        text2: "An error occurred while signing out.",
      });
    }
  };

  const appearanceOptions = [
    { mode: "light", icon: "sunny-outline", label: "Light" },
    { mode: "dark", icon: "moon-outline", label: "Dark" },
    { mode: "system", icon: "phone-portrait-outline", label: "System" },
  ];

  const toggleLocationTracking = async () => {
    if (isTrackingLocation) {
      stopTrackingLocation();
    } else {
      await startTrackingLocation();
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.bgColor }]}
    >
      <RNStatusBar
        barStyle={colorMode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={colorMode === "dark" ? "#1A1A1A" : "#F7F5F2"}
      />

      <View style={[styles.header, { borderBottomColor: colors.borderColor }]}>
        <Text style={[styles.heading, { color: colors.textColor }]}>
          Settings
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          {/* Profile Section */}
          <TouchableOpacity
            onPress={() => router.push("/settings/profile")}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.cardBgColor,
                  borderColor: colors.borderColor,
                },
              ]}
            >
              <View style={styles.profileContent}>
                <View
                  style={[
                    styles.avatarContainer,
                    { backgroundColor: colors.accentColor },
                  ]}
                >
                  <Image
                    source={{
                      uri:
                        userDetails?.avatar_url ||
                        "https://via.placeholder.com/150",
                    }}
                    style={styles.avatar}
                  />
                </View>
                <View style={styles.profileDetails}>
                  <Text
                    style={[styles.profileName, { color: colors.textColor }]}
                  >
                    {userDetails?.username || "Loading..."}
                  </Text>
                  <Text style={{ color: colors.subTextColor, fontSize: 14 }}>
                    {userDetails?.email || "Loading..."}
                  </Text>
                  <View style={styles.viewProfile}>
                    <Text style={{ color: colors.accentColor, fontSize: 12 }}>
                      View profile
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.accentColor}
                    />
                  </View>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* Appearance Section */}
          <View>
            <Text style={[styles.sectionTitle, { color: colors.subTextColor }]}>
              APPEARANCE
            </Text>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.cardBgColor,
                  borderColor: colors.borderColor,
                },
              ]}
            >
              <View style={styles.appearanceOptions}>
                {appearanceOptions.map((option) => (
                  <TouchableOpacity
                    key={option.mode}
                    onPress={() => setColorMode(option.mode as any)}
                    style={styles.appearanceButton}
                  >
                    <View
                      style={[
                        styles.appearanceItem,
                        {
                          backgroundColor:
                            colorMode === option.mode
                              ? colors.accentColor
                              : colors.quickActionBgColor,
                        },
                      ]}
                    >
                      <Ionicons
                        name={option.icon as any}
                        size={24}
                        color={
                          colorMode === option.mode
                            ? colors.whiteColor
                            : colors.textColor
                        }
                      />
                      <Text
                        style={{
                          color:
                            colorMode === option.mode
                              ? colors.whiteColor
                              : colors.textColor,
                          fontSize: 12,
                          fontWeight:
                            colorMode === option.mode ? "bold" : "normal",
                        }}
                      >
                        {option.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Preferences Section */}
          <View>
            <Text style={[styles.sectionTitle, { color: colors.subTextColor }]}>
              PREFERENCES
            </Text>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.cardBgColor,
                  borderColor: colors.borderColor,
                },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.preferenceItem}
              >
                <View style={styles.preferenceContent}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: colors.toggleBgColor },
                    ]}
                  >
                    <Ionicons
                      name="notifications-outline"
                      size={16}
                      color={colors.accentColor}
                    />
                  </View>
                  <Text style={{ color: colors.textColor }}>Notifications</Text>
                </View>
                <RNSwitch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{
                    false: colors.switchTrackColor,
                    true: colors.accentColor,
                  }}
                  thumbColor={colors.whiteColor}
                />
              </TouchableOpacity>
              <View
                style={[
                  styles.divider,
                  { backgroundColor: colors.borderColor },
                ]}
              />
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.preferenceItem}
              >
                <View style={styles.preferenceContent}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: colors.toggleBgColor },
                    ]}
                  >
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color={colors.accentColor}
                    />
                  </View>
                  <Text style={{ color: colors.textColor }}>
                    Location Services
                  </Text>
                </View>
                <RNSwitch
                  value={locationServices}
                  onValueChange={setLocationServices}
                  trackColor={{
                    false: colors.switchTrackColor,
                    true: colors.accentColor,
                  }}
                  thumbColor={colors.whiteColor}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Location Tracking Section */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.cardBgColor, marginTop: 16 },
            ]}
          >
            <View style={styles.locationTracking}>
              <View style={styles.locationDetails}>
                <MaterialIcons
                  name="location-on"
                  size={24}
                  color={colors.accentColor}
                />
                <View>
                  <Text
                    style={[styles.locationTitle, { color: colors.textColor }]}
                  >
                    Location Tracking
                  </Text>
                  <Text style={{ color: colors.subTextColor, fontSize: 12 }}>
                    {isTrackingLocation
                      ? "Your location is being tracked"
                      : "Enable to share your location"}
                  </Text>
                </View>
              </View>
              <RNSwitch
                value={isTrackingLocation}
                onValueChange={toggleLocationTracking}
                trackColor={{
                  false: colors.switchTrackColor,
                  true: colors.accentColor,
                }}
                thumbColor={colors.whiteColor}
              />
            </View>
            {userLocation && (
              <View
                style={[
                  styles.locationInfo,
                  { backgroundColor: colors.cardBgColor },
                ]}
              >
                <Text style={{ color: colors.subTextColor, fontSize: 12 }}>
                  Last location: {userLocation.latitude.toFixed(6)},{" "}
                  {userLocation.longitude.toFixed(6)}
                </Text>
                <Text style={{ color: colors.subTextColor, fontSize: 12 }}>
                  Updated:{" "}
                  {new Date(userLocation.timestamp).toLocaleTimeString()}
                </Text>
              </View>
            )}
          </View>

          {/* Settings Sections */}
          {settingsSections.map((section, index) => (
            <View key={index}>
              <Text
                style={[styles.sectionTitle, { color: colors.subTextColor }]}
              >
                {section.title.toUpperCase()}
              </Text>
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.cardBgColor,
                    borderColor: colors.borderColor,
                  },
                ]}
              >
                {section.items.map((item, itemIndex) => (
                  <TouchableOpacity
                    key={itemIndex}
                    onPress={() => router.push(item.route as any)}
                    activeOpacity={0.8}
                    style={styles.settingsItem}
                  >
                    <View style={styles.settingsContent}>
                      <View
                        style={[
                          styles.iconContainer,
                          { backgroundColor: colors.quickActionBgColor },
                        ]}
                      >
                        <Ionicons
                          name={item.icon as any}
                          size={16}
                          color={colors.accentColor}
                        />
                      </View>
                      <Text style={{ color: colors.textColor }}>
                        {item.label}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={colors.chevronColor}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {/* Sign Out Button */}
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.8}
            style={[styles.signOutButton, { borderColor: colors.dangerColor }]}
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color={colors.dangerColor}
            />
            <Text style={[styles.signOutText, { color: colors.dangerColor }]}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 70,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  profileContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  avatarContainer: {
    padding: 2,
    borderRadius: 999,
    opacity: 0.8,
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  viewProfile: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 12,
    marginLeft: 4,
  },
  appearanceOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  appearanceButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  appearanceItem: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    opacity: 0.7,
  },
  preferenceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  preferenceContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    padding: 8,
    borderRadius: 999,
    marginRight: 12,
  },
  divider: {
    height: 1,
  },
  locationTracking: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  locationDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationTitle: {
    fontWeight: "bold",
    marginLeft: 12,
  },
  locationInfo: {
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  settingsItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  settingsContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 16,
  },
  signOutText: {
    fontWeight: "bold",
    marginLeft: 8,
  },
});
