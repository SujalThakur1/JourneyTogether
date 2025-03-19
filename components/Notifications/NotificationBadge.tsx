import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "../../contexts/ColorContext";

interface NotificationBadgeProps {
  count: number;
}

const NotificationBadge = ({ count }: NotificationBadgeProps) => {
  const colors = useColors();

  if (count <= 0) {
    return null;
  }

  return (
    <View style={[styles.badge, { backgroundColor: colors.errorColor }]}>
      <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
});

export default NotificationBadge;
