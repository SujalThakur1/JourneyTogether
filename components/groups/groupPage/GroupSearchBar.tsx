import React from "react";
import { View, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "../../../contexts/ColorContext";

interface GroupSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onFilterPress: () => void;
}

const GroupSearchBar: React.FC<GroupSearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  onFilterPress,
}) => {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: colors.quickActionBgColor,
            borderColor: colors.inputBorderColor,
          },
        ]}
      >
        <Ionicons
          name="search"
          size={20}
          color={colors.iconColor}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.input, { color: colors.inputTextColor }]}
          placeholder="Search groups..."
          placeholderTextColor={colors.mutedTextColor}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color={colors.iconColor} />
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity
        style={[styles.filterButton, { backgroundColor: colors.buttonBgColor }]}
        onPress={onFilterPress}
      >
        <Ionicons
          name="options-outline"
          size={20}
          color={colors.buttonTextColor}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default GroupSearchBar;
