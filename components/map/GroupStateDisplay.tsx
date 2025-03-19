import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface GroupStateDisplayProps {
  loading: boolean;
  error: string | null;
  notFound: boolean;
  bgColor: string;
  textColor: string;
  buttonColor: string;
  onGoBack: () => void;
}

const GroupStateDisplay: React.FC<GroupStateDisplayProps> = ({
  loading,
  error,
  notFound,
  bgColor,
  textColor,
  buttonColor,
  onGoBack,
}) => {
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color={buttonColor} />
        <Text style={{ color: textColor, marginTop: 16 }}>
          Loading group map...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <MaterialIcons name="error-outline" size={64} color="#EF4444" />
        <Text style={[styles.errorText, { color: textColor }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: buttonColor }]}
          onPress={onGoBack}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (notFound) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <MaterialIcons name="group-off" size={64} color="#9CA3AF" />
        <Text style={[styles.errorText, { color: textColor }]}>
          Group not found
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: buttonColor }]}
          onPress={onGoBack}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    margin: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default GroupStateDisplay;
