import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "../contexts/ColorContext";

interface DestinationSearchProps {
  onSearch: (query: string) => void;
  onClose: () => void;
  placeholder?: string;
}

const DestinationSearch: React.FC<DestinationSearchProps> = ({
  onSearch,
  onClose,
  placeholder = "Search destinations...",
}) => {
  const [searchText, setSearchText] = useState("");
  const colors = useColors();

  const handleSearch = () => {
    if (searchText.trim()) {
      onSearch(searchText);
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.searchContainer,
          { backgroundColor: colors.cardBgColor },
        ]}
      >
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textColor} />
        </TouchableOpacity>

        <TextInput
          style={[styles.input, { color: colors.textColor }]}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedTextColor}
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearch}
          autoFocus
          returnKeyType="search"
        />

        <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
          <Ionicons name="search" size={24} color={colors.accentColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  closeButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  searchButton: {
    padding: 8,
  },
});

export default DestinationSearch;
