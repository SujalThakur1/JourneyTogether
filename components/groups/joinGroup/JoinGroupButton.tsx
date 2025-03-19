import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface JoinGroupButtonProps {
  onJoin: () => void;
  buttonColor: string;
}

const JoinGroupButton: React.FC<JoinGroupButtonProps> = ({
  onJoin,
  buttonColor,
}) => {
  return (
    <View style={styles.joinButtonContainer}>
      <TouchableOpacity
        style={[styles.joinButton, { backgroundColor: buttonColor }]}
        onPress={onJoin}
      >
        <MaterialIcons name="person-add" size={24} color="white" />
        <Text style={styles.joinButtonText}>Join Group</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  joinButtonContainer: {
    padding: 16,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  joinButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  joinButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default JoinGroupButton;
