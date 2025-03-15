import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useGroups } from "../../contexts/GroupsContext";
import GroupTypeSelector from "./GroupTypeSelector";
import UserSearchInput from "./UserSearchInput";
import SelectedLeaderDisplay from "./SelectedLeaderDisplay";
import GroupMembersList from "./GroupMembersList";
import DestinationSearchInput from "./DestinationSearchInput";

// Define error type
interface FormErrors {
  groupName?: string;
  destination?: string;
  leader?: string;
  members?: string;
}

const CreateGroupSection = () => {
  const {
    groupName,
    setGroupName,
    groupType,
    setGroupType,
    destination,
    setDestination,
    searchLeader,
    setSearchLeader,
    searchFriend,
    setSearchFriend,
    focusedInput,
    setFocusedInput,
    selectedLeader,
    setSelectedLeader,
    groupMembers,
    showLeaderSuggestions,
    setShowLeaderSuggestions,
    showFriendSuggestions,
    setShowFriendSuggestions,
    filteredLeaders,
    filteredFriends,
    isDark,
    textColor,
    inputTextColor,
    inputBorderColor,
    focusedBorderColor,
    buttonBgColor,
    buttonTextColor,
    buttonPressedBgColor,
    handleCreateGroup,
    selectLeader,
    addMember,
    removeMember,
  } = useGroups();

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!groupName.trim()) {
      newErrors.groupName = "Group name is required";
    }

    if (!groupType) {
      newErrors.groupName = "Please select a group type";
    }

    if (groupType === "destination" && !destination?.trim()) {
      newErrors.destination = "Destination is required for destination groups";
    }

    if (groupType !== "destination" && !selectedLeader) {
      newErrors.leader =
        "A group leader is required for non-destination groups";
    }

    return newErrors;
  };

  const handleCreateWithFeedback = async () => {
    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setIsLoading(true);
      setErrors({});
      await handleCreateGroup();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create group. Please try again.";
      setErrors({ groupName: errorMessage });
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDark ? "#1a1a1a" : "#fff" },
      ]}
    >
      <View style={styles.headerContainer}>
        <Text style={[styles.header, { color: textColor }]}>
          Create New Group
        </Text>
      </View>

      {/* Group Name Input */}
      <View style={styles.formSection}>
        <Text style={[styles.label, { color: textColor }]}>Group Name</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: isDark ? "#27272a" : "white",
              borderColor:
                focusedInput === "groupName"
                  ? focusedBorderColor
                  : errors.groupName
                  ? "red"
                  : inputBorderColor,
              color: inputTextColor,
            },
          ]}
          placeholder="Enter group name"
          placeholderTextColor="gray"
          value={groupName}
          onChangeText={(text) => {
            setGroupName(text);
            if (errors.groupName)
              setErrors({ ...errors, groupName: undefined });
          }}
          selectionColor={inputTextColor}
          onFocus={() => setFocusedInput("groupName")}
          onBlur={() => setFocusedInput(null)}
        />
        {errors.groupName ? (
          <Text style={styles.errorText}>{errors.groupName}</Text>
        ) : (
          <Text
            style={[styles.helperText, { color: isDark ? "#9ca3af" : "#666" }]}
          >
            Choose a name for your group
          </Text>
        )}
      </View>

      {/* Group Type Selection */}
      <View style={styles.formSection}>
        <GroupTypeSelector />
      </View>

      {/* Destination/Leader Section */}
      <View style={styles.formSection}>
        {groupType === "destination" ? (
          <View>
            <DestinationSearchInput placeholder="Search for a destination" />
            {errors.destination && (
              <Text style={styles.errorText}>{errors.destination}</Text>
            )}
          </View>
        ) : groupType ? (
          <View>
            <Text style={[styles.label, { color: textColor }]}>
              Group Leader
            </Text>
            <UserSearchInput
              placeholder="Search Group Leader"
              searchValue={searchLeader}
              setSearchValue={setSearchLeader}
              showSuggestions={showLeaderSuggestions}
              setShowSuggestions={setShowLeaderSuggestions}
              filteredUsers={filteredLeaders}
              onSelectUser={(user) => {
                selectLeader(user);
                if (errors.leader) setErrors({ ...errors, leader: undefined });
              }}
              inputName="searchLeader"
            />
            {selectedLeader && (
              <SelectedLeaderDisplay
                leader={selectedLeader}
                onRemove={() => setSelectedLeader(null)}
              />
            )}
            {errors.leader && (
              <Text style={styles.errorText}>{errors.leader}</Text>
            )}
          </View>
        ) : null}
      </View>

      {/* Group Members Section */}
      <View style={styles.formSection}>
        <Text style={[styles.label, { color: textColor }]}>Group Members</Text>
        <UserSearchInput
          placeholder="Search friends to add"
          searchValue={searchFriend}
          setSearchValue={setSearchFriend}
          showSuggestions={showFriendSuggestions}
          setShowSuggestions={setShowFriendSuggestions}
          filteredUsers={filteredFriends}
          onSelectUser={(user) => {
            addMember(user);
            if (errors.members) setErrors({ ...errors, members: undefined });
          }}
          inputName="searchFriend"
        />
        <GroupMembersList
          members={groupMembers}
          onRemoveMember={removeMember}
        />
        {errors.members && (
          <Text style={styles.errorText}>{errors.members}</Text>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: isLoading ? "#gray" : buttonBgColor },
        ]}
        onPress={handleCreateWithFeedback}
        disabled={isLoading}
      >
        {isLoading ? (
          <Text style={[styles.buttonText, { color: buttonTextColor }]}>
            Creating...
          </Text>
        ) : (
          <>
            <MaterialIcons
              name="group-add"
              size={20}
              color={buttonTextColor}
              style={styles.buttonIcon}
            />
            <Text style={[styles.buttonText, { color: buttonTextColor }]}>
              Create Group
            </Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    borderRadius: 12,
  },
  headerContainer: {
    marginBottom: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
  },
  formSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonIcon: {
    marginRight: 8,
  },
});

export default CreateGroupSection;
