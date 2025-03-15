import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useGroups } from "../../contexts/GroupsContext";
import { useColors } from "../../contexts/ColorContext"; // Import the color context

const GroupTypeSelector = () => {
  const { groupType, handleTypeChange } = useGroups();
  const colors = useColors(); // Get colors from context

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textColor }]}>
        Group Type
      </Text>
      <View style={styles.radioGroup}>
        <TouchableOpacity
          style={styles.radioItem}
          onPress={() => handleTypeChange("destination")}
        >
          <View
            style={[
              styles.radioCircle,
              {
                borderColor: colors.accentColor,
                backgroundColor:
                  groupType === "destination"
                    ? colors.radioButtonColor
                    : "transparent",
              },
            ]}
          />
          <Text style={[styles.radioText, { color: colors.textColor }]}>
            Travel to a destination
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioItem}
          onPress={() => handleTypeChange("follow")}
        >
          <View
            style={[
              styles.radioCircle,
              {
                borderColor: colors.accentColor,
                backgroundColor:
                  groupType === "follow"
                    ? colors.radioButtonColor
                    : "transparent",
              },
            ]}
          />
          <Text style={[styles.radioText, { color: colors.textColor }]}>
            Follow a group member
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    marginBottom: 12,
  },
  radioGroup: {
    gap: 12,
  },
  radioItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  radioText: {
    fontSize: 16,
  },
});

export default GroupTypeSelector;
