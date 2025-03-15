import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useGroups } from "../../contexts/GroupsContext";

const GroupTypeSelector = () => {
  const { groupType, textColor, isDark, handleTypeChange } = useGroups();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: textColor }]}>Group Type</Text>
      <View style={styles.radioGroup}>
        <TouchableOpacity
          style={styles.radioItem}
          onPress={() => handleTypeChange("destination")}
        >
          <View
            style={[
              styles.radioCircle,
              {
                borderColor: isDark ? "#fff" : "#000",
                backgroundColor:
                  groupType === "destination"
                    ? isDark
                      ? "#fff"
                      : "#000"
                    : "transparent",
              },
            ]}
          />
          <Text style={[styles.radioText, { color: textColor }]}>
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
                borderColor: isDark ? "#fff" : "#000",
                backgroundColor:
                  groupType === "follow"
                    ? isDark
                      ? "#fff"
                      : "#000"
                    : "transparent",
              },
            ]}
          />
          <Text style={[styles.radioText, { color: textColor }]}>
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
