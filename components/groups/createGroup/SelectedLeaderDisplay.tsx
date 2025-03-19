import React from "react";
import { TouchableOpacity, View, Text, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGroups } from "../../../contexts/GroupsContext";
import { User } from "../types";

interface SelectedLeaderDisplayProps {
  leader: User;
  onRemove: () => void;
}

const SelectedLeaderDisplay = ({
  leader,
  onRemove,
}: SelectedLeaderDisplayProps) => {
  const { isDark, textColor, getInitials } = useGroups();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#1F2937" : "#F3F4F6" },
      ]}
    >
      <View
        style={[
          styles.avatarContainer,
          { backgroundColor: isDark ? "#2563EB" : "#3B82F6" },
        ]}
      >
        {leader.avatar_url ? (
          <Image
            source={{ uri: leader.avatar_url }}
            style={styles.avatarImage}
          />
        ) : (
          <Text style={styles.avatarInitials}>
            {getInitials(leader.username || leader.email || "")}
          </Text>
        )}
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.username, { color: textColor }]}>
          {leader.username || "User"}
        </Text>
        {leader.email && (
          <Text style={[styles.email, { color: "#6B7280" }]}>
            {leader.email}
          </Text>
        )}
      </View>
      <TouchableOpacity onPress={onRemove}>
        <Ionicons
          name="close-circle"
          size={24}
          color={isDark ? "white" : "black"}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    padding: 8,
    borderRadius: 6,
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarInitials: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  textContainer: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: "500",
  },
  email: {
    fontSize: 12,
  },
});

export default SelectedLeaderDisplay;
