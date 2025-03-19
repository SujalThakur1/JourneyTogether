import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface GroupHeaderProps {
  groupName: string;
  groupCode: string;
  onBack: () => void;
  textColor: string;
  borderColor: string;
  backgroundColor: string;
}

const GroupHeader: React.FC<GroupHeaderProps> = ({
  groupName,
  groupCode,
  onBack,
  textColor,
  borderColor,
  backgroundColor,
}) => {
  return (
    <View
      style={[
        styles.header,
        { borderBottomColor: borderColor, backgroundColor },
      ]}
    >
      <View style={styles.headerLeft}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.groupName, { color: textColor }]}>
            {groupName}
          </Text>
          <Text style={[styles.groupCode, { color: textColor }]}>
            Code: {groupCode}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    width: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 12,
  },
  groupName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  groupCode: {
    fontSize: 14,
    opacity: 0.8,
  },
});

export default GroupHeader;
