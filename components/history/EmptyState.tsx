import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "../../contexts/ColorContext";

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  buttonText: string;
  onButtonPress?: () => void;
}

export default function EmptyState({
  icon,
  title,
  description,
  buttonText,
  onButtonPress,
}: EmptyStateProps) {
  const colors = useColors();

  return (
    <View style={[styles.emptyState, { backgroundColor: colors.cardBgColor }]}>
      <Ionicons name={icon} size={48} color={colors.iconColor} />
      <Text style={[styles.emptyTitle, { color: colors.textColor }]}>
        {title}
      </Text>
      <Text style={{ color: colors.textColor, textAlign: "center" }}>
        {description}
      </Text>
      <TouchableOpacity
        style={[
          styles.exploreButton,
          { backgroundColor: colors.buttonBgColor },
        ]}
        onPress={onButtonPress}
      >
        <Text style={[styles.buttonText, { color: colors.buttonTextColor }]}>
          {buttonText}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 12,
    textAlign: "center",
  },
  exploreButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 12,
  },
  buttonText: {
    fontWeight: "bold",
    fontSize: 14,
  },
});
