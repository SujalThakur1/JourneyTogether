import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useGroups } from "../../../contexts/GroupsContext";
import { useColors } from "../../../contexts/ColorContext"; // Import the color context
import GroupTypeSelector from "./GroupTypeSelector";
import UserSearchInput from "./UserSearchInput";
import SelectedLeaderDisplay from "./SelectedLeaderDisplay";
import GroupMembersList from "./GroupMembersList";
import DestinationManager from "./DestinationManager";
import MapView, { Marker } from "react-native-maps";
import { checkAndRequestLocationPermission } from "../../../lib/locationService";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

// Define error type
interface FormErrors {
  groupName?: string;
  destination?: string;
  leader?: string;
  members?: string;
}

interface CreateGroupSectionProps {
  onClose?: () => void;
}

const CreateGroupSection: React.FC<CreateGroupSectionProps> = ({ onClose }) => {
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
    handleCreateGroup,
    selectLeader,
    addMember,
    removeMember,
    destinationCoordinates,
    setDestinationId,
    resetGroupForms,
  } = useGroups();

  // Get colors from context
  const colors = useColors();
  const navigation = useNavigation();

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Reset form when component unmounts or loses focus
  useEffect(() => {
    return () => {
      // Reset form when component unmounts
      resetGroupForms();
    };
  }, []);

  // Reset form when screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      // Reset form when screen comes into focus
      resetGroupForms();
      return () => {
        // This runs when screen loses focus
      };
    }, [])
  );

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

      // Check location permission before creating group
      const hasLocationPermission = await checkAndRequestLocationPermission(
        // Success callback
        async () => {
          try {
            await handleCreateGroup();
            // Reset the form after successful creation
            resetGroupForms();
            // Close the bottom sheet if onClose prop is provided
            if (onClose) {
              onClose();
            }
            setIsLoading(false);
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Failed to create group. Please try again.";
            setErrors({ groupName: errorMessage });
            setIsLoading(false);
          }
        },
        // Cancel callback
        () => {
          setIsLoading(false);
          setErrors({
            groupName: "Location permission is required to create a group",
          });
        }
      );

      // If permission check is handling the flow, we don't need to continue
      if (hasLocationPermission) {
        // The success callback will handle this case
        return;
      }

      setIsLoading(false);
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
      keyboardShouldPersistTaps="always"
      style={[styles.container, { backgroundColor: colors.bgColor }]}
    >
      <View style={styles.headerContainer}>
        <Text style={[styles.header, { color: colors.textColor }]}>
          Create New Group
        </Text>
      </View>

      {/* Group Name Input */}
      <View style={styles.formSection}>
        <Text style={[styles.label, { color: colors.textColor }]}>
          Group Name
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.userSearchInputBgColor,
              borderColor:
                focusedInput === "groupName"
                  ? colors.focusedBorderColor
                  : errors.groupName
                  ? colors.dangerColor
                  : colors.inputBorderColor,
              color: colors.inputTextColor,
            },
          ]}
          placeholder="Enter group name"
          placeholderTextColor={colors.mutedTextColor}
          value={groupName}
          onChangeText={(text) => {
            setGroupName(text);
            if (errors.groupName)
              setErrors({ ...errors, groupName: undefined });
          }}
          selectionColor={colors.accentColor}
          onFocus={() => setFocusedInput("groupName")}
          onBlur={() => setFocusedInput(null)}
        />
        {errors.groupName ? (
          <Text style={[styles.errorText, { color: colors.dangerColor }]}>
            {errors.groupName}
          </Text>
        ) : (
          <Text style={[styles.helperText, { color: colors.subTextColor }]}>
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
            <DestinationManager
              onDestinationSelect={(id) => {
                console.log("Selected destination ID:", id);
                setDestinationId(id);
              }}
            />
            {errors.destination && (
              <Text style={[styles.errorText, { color: colors.dangerColor }]}>
                {errors.destination}
              </Text>
            )}

            {/* Map to display selected destination */}
            {destinationCoordinates && (
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: destinationCoordinates.latitude,
                    longitude: destinationCoordinates.longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                  }}
                  region={{
                    latitude: destinationCoordinates.latitude,
                    longitude: destinationCoordinates.longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                  }}
                >
                  <Marker
                    coordinate={{
                      latitude: destinationCoordinates.latitude,
                      longitude: destinationCoordinates.longitude,
                    }}
                    title={destination}
                    pinColor={colors.accentColor}
                  />
                </MapView>
              </View>
            )}
          </View>
        ) : groupType ? (
          <View>
            <Text style={[styles.label, { color: colors.textColor }]}>
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
              <Text style={[styles.errorText, { color: colors.dangerColor }]}>
                {errors.leader}
              </Text>
            )}
          </View>
        ) : null}
      </View>

      {/* Group Members Section */}
      <View style={styles.formSection}>
        <Text style={[styles.label, { color: colors.textColor }]}>
          Group Members
        </Text>
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
          <Text style={[styles.errorText, { color: colors.dangerColor }]}>
            {errors.members}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: isLoading
              ? colors.pressedBgColor
              : colors.buttonBgColor,
          },
        ]}
        onPress={handleCreateWithFeedback}
        disabled={isLoading}
        activeOpacity={0.7}
      >
        {isLoading ? (
          <Text style={[styles.buttonText, { color: colors.buttonTextColor }]}>
            Creating...
          </Text>
        ) : (
          <>
            <MaterialIcons
              name="group-add"
              size={20}
              color={colors.buttonTextColor}
              style={styles.buttonIcon}
            />
            <Text
              style={[styles.buttonText, { color: colors.buttonTextColor }]}
            >
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
  mapContainer: {
    height: 200,
    marginTop: 16,
  },
  map: {
    flex: 1,
  },
});

export default CreateGroupSection;
