import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColors } from "@/contexts/ColorContext"; // Assuming this is your color context

export default function ComingSoon() {
  const router = useRouter();
  const colors = useColors(); // Use the same color context as ProfileSettings

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.bgColor }]}
    >
      {/* Header with Back Button */}
      <View style={[styles.header, { borderBottomColor: colors.borderColor }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textColor} />
        </TouchableOpacity>
        <Text style={[styles.heading, { color: colors.textColor }]}>
          Coming Soon
        </Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <View
          style={[
            styles.messageCard,
            {
              backgroundColor: colors.cardBgColor,
              borderColor: colors.cardBorderColor,
            },
          ]}
        >
          <Text style={[styles.message, { color: colors.textColor }]}>
            This Feature is Coming Soon!
          </Text>
          <Text style={[styles.subMessage, { color: colors.subTextColor }]}>
            Check back soon for updates.
          </Text>
        </View>

        {/* Optional Button (Styled like Save Button) */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={[
            styles.backHomeButton,
            { backgroundColor: colors.buttonBgColor },
          ]}
        >
          <Text
            style={[
              styles.backHomeButtonText,
              { color: colors.buttonTextColor },
            ]}
          >
            Go Back Home
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  messageCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: "center",
  },
  message: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subMessage: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.7,
  },
  backHomeButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
    width: "80%",
  },
  backHomeButtonText: {
    fontWeight: "bold",
    fontSize: 16,
  },
});
