import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "../../contexts/ColorContext";

interface EmptyGroupStateProps {
  onCreatePress: () => void;
  onJoinPress: () => void;
  filterType?: string;
}

const EmptyGroupState: React.FC<EmptyGroupStateProps> = ({
  onCreatePress,
  onJoinPress,
  filterType = "all",
}) => {
  const colors = useColors();

  let title = "No Groups Found";
  let message = "You haven't joined or created any groups yet.";
  let iconName: keyof typeof Ionicons.glyphMap = "people-outline";

  switch (filterType) {
    case "created":
      title = "No Created Groups";
      message = "You haven't created any groups yet.";
      iconName = "add-circle-outline";
      break;
    case "joined":
      title = "No Joined Groups";
      message = "You haven't joined any groups yet.";
      iconName = "log-in-outline";
      break;
    case "destination":
      title = "No Destination Groups";
      message = "You don't have any destination groups.";
      iconName = "location-outline";
      break;
    case "follow":
      title = "No Follow Groups";
      message = "You don't have any follow groups.";
      iconName = "navigate-outline";
      break;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBgColor }]}>
      <Ionicons name={iconName} size={64} color={colors.emptyStateIconColor} />
      <Text style={[styles.title, { color: colors.textColor }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.subTextColor }]}>
        {message}
      </Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.buttonBgColor }]}
          onPress={onCreatePress}
        >
          <Text style={[styles.buttonText, { color: colors.buttonTextColor }]}>
            Create Group
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.buttonBgColor }]}
          onPress={onJoinPress}
        >
          <Text style={[styles.buttonText, { color: colors.buttonTextColor }]}>
            Join Group
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default EmptyGroupState;
