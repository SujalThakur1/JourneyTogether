import React from "react";
import {
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Image,
} from "react-native";
import { useGroups } from "../../../contexts/GroupsContext";
import { User } from "../types";

interface UserSearchInputProps {
  placeholder: string;
  searchValue: string;
  setSearchValue: (value: string) => void;
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  filteredUsers: User[];
  onSelectUser: (user: User) => void;
  inputName: string;
  zIndex?: number;
}

const UserSearchInput = ({
  placeholder,
  searchValue,
  setSearchValue,
  showSuggestions,
  setShowSuggestions,
  filteredUsers,
  onSelectUser,
  inputName,
  zIndex = 10,
}: UserSearchInputProps) => {
  const {
    focusedInput,
    setFocusedInput,
    isDark,
    inputTextColor,
    inputBorderColor,
    focusedBorderColor,
    dropdownBgColor,
    borderColor,
    hoverBgColor,
    textColor,
    getInitials,
  } = useGroups();

  return (
    <View style={[styles.container, { zIndex }]}>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: isDark ? "#27272a" : "white",
            borderColor:
              focusedInput === inputName
                ? focusedBorderColor
                : inputBorderColor,
            color: inputTextColor,
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor="gray"
        value={searchValue}
        onChangeText={(text) => {
          setSearchValue(text);
          setShowSuggestions(!!text);
        }}
        selectionColor={inputTextColor}
        onFocus={() => {
          setFocusedInput(inputName);
          setShowSuggestions(!!searchValue);
        }}
        onBlur={() => {
          setTimeout(() => {
            setFocusedInput(null);
          }, 200);
        }}
      />

      {showSuggestions && filteredUsers.length > 0 && (
        <View
          style={[
            styles.dropdown,
            {
              backgroundColor: dropdownBgColor,
              borderColor: borderColor,
              elevation: 3, // Android shadow
              shadowColor: "#000", // iOS shadow
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
            },
          ]}
        >
          <ScrollView style={{ maxHeight: 200 }}>
            {filteredUsers.map((user) => (
              <TouchableOpacity
                key={user.id}
                onPress={() => onSelectUser(user)}
                style={[styles.userItem, { borderBottomColor: borderColor }]}
                activeOpacity={0.7}
              >
                <View style={styles.userContent}>
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: isDark ? "#2563EB" : "#3B82F6" },
                    ]}
                  >
                    {user.avatar_url ? (
                      <Image
                        source={{ uri: user.avatar_url }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <Text style={styles.avatarInitials}>
                        {getInitials(user.username || user.email || "")}
                      </Text>
                    )}
                  </View>
                  <View>
                    <Text style={[styles.username, { color: textColor }]}>
                      {user.username || "User"}
                    </Text>
                    {user.email && (
                      <Text style={styles.email}>{user.email}</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  dropdown: {
    position: "absolute",
    bottom: "100%",
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 4,
    zIndex: 1000,
  },
  userItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  userContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarInitials: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  username: {
    fontSize: 16,
    fontWeight: "500",
  },
  email: {
    fontSize: 14,
    color: "#6B7280",
  },
});

export default UserSearchInput;
