import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "../../contexts/ColorContext";
import { useGroups } from "../../contexts/GroupsContext";
import { useRouter } from "expo-router";
import UserSearchInput from "../groups/createGroup/UserSearchInput";
import GroupMembersList from "../groups/createGroup/GroupMembersList";
import { User } from "../groups/types";
import { useApp } from "../../contexts/AppContext";

interface CreateGroupBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  destinationName: string;
  destinationId: number;
  maxHeight: number;
  mb: number;
}

const { height: screenHeight } = Dimensions.get("window");

const CreateGroupBottomSheet = ({
  isVisible,
  onClose,
  destinationName,
  destinationId,
  maxHeight,
  mb,
}: CreateGroupBottomSheetProps) => {
  const colors = useColors();
  const router = useRouter();
  const { userDetails } = useApp();
  const {
    setDestinationId,
    setDestination: setContextDestination,
    setGroupName,
    setGroupType,
    setGroupMembers,
    groupMembers,
    handleCreateGroup,
    addMember,
    removeMember,
    searchFriend,
    setSearchFriend,
    showFriendSuggestions,
    setShowFriendSuggestions,
    filteredFriends,
  } = useGroups();

  const [localGroupName, setLocalGroupName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;

  // Listen for keyboard events
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (isVisible) {
      // Reset form when opening
      setGroupType("destination");
      const defaultName = `${destinationName} Trip`;
      setLocalGroupName(defaultName);
      setGroupName(defaultName);
      setDestinationId(destinationId);
      setContextDestination(destinationName);

      // Slide in animation
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Slide out animation
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, destinationName, destinationId]);

  const handleCreateGroupNow = async () => {
    if (!localGroupName.trim() || !userDetails) {
      return;
    }

    setIsLoading(true);
    try {
      // Make sure the group name in context is synced with local state
      setGroupName(localGroupName);

      // Set destination to be used in the group creation
      setContextDestination(destinationName);
      setDestinationId(destinationId);

      // Make sure group type is set to destination
      setGroupType("destination");

      // Create the group using the context function - this will now handle notifications
      // for any members that have been added through the addMember function
      await handleCreateGroup();

      // Dismiss keyboard if it's open
      Keyboard.dismiss();

      // Close the bottom sheet
      onClose();
    } catch (error) {
      console.error("Error creating group:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [maxHeight, 0],
  });

  const handleSelectUser = (user: User) => {
    addMember(user);
  };

  // Determine the actual height based on keyboard visibility
  const actualMaxHeight = keyboardVisible
    ? Math.min(screenHeight * 0.9, maxHeight + 200)
    : maxHeight;

  return (
    <>
      {isVisible && (
        <TouchableOpacity
          style={[styles.overlay, { backgroundColor: colors.overlayBgColor }]}
          activeOpacity={1}
          onPress={() => {
            Keyboard.dismiss();
            onClose();
          }}
        />
      )}
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: colors.bgColor,
            transform: [{ translateY }],
            maxHeight: actualMaxHeight,
          },
        ]}
      >
        <View
          style={[
            styles.handle,
            { backgroundColor: colors.bottomSheetHandleColor },
          ]}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.content}
          keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textColor }]}>
              Create a Group Trip
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textColor} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
          >
            {/* Destination Display */}
            <View style={[styles.section, { borderColor: colors.borderColor }]}>
              <Text style={[styles.sectionTitle, { color: colors.textColor }]}>
                Location
              </Text>
              <View
                style={[
                  styles.selectedLocation,
                  { backgroundColor: colors.cardBgColor },
                ]}
              >
                <View
                  style={[
                    styles.locationIcon,
                    { backgroundColor: colors.accentColor },
                  ]}
                >
                  <Ionicons name="location" size={20} color="white" />
                </View>
                <Text
                  style={[styles.locationText, { color: colors.textColor }]}
                >
                  {destinationName}
                </Text>
              </View>
            </View>

            {/* Group Name Input */}
            <View style={[styles.section, { borderColor: colors.borderColor }]}>
              <Text style={[styles.sectionTitle, { color: colors.textColor }]}>
                Group Name
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.userSearchInputBgColor,
                    borderColor: colors.inputBorderColor,
                    color: colors.textColor,
                  },
                ]}
                placeholder="Enter group name"
                placeholderTextColor={colors.mutedTextColor}
                value={localGroupName}
                onChangeText={(text) => {
                  setLocalGroupName(text);
                  setGroupName(text);
                }}
              />
            </View>

            {/* Members Selection */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textColor }]}>
                Invite Members
              </Text>
              <UserSearchInput
                placeholder="Search users to add..."
                searchValue={searchFriend}
                setSearchValue={setSearchFriend}
                showSuggestions={showFriendSuggestions}
                setShowSuggestions={setShowFriendSuggestions}
                filteredUsers={filteredFriends}
                onSelectUser={handleSelectUser}
                inputName="friendSearch"
                zIndex={100}
              />

              {/* Display selected members using GroupMembersList */}
              {groupMembers.length > 0 && (
                <GroupMembersList
                  members={groupMembers}
                  onRemoveMember={removeMember}
                />
              )}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.createButton,
                { marginBottom: mb },
                { backgroundColor: colors.accentColor },
                (isLoading || !localGroupName.trim()) && { opacity: 0.7 },
              ]}
              onPress={handleCreateGroupNow}
              disabled={isLoading || !localGroupName.trim()}
            >
              {isLoading ? (
                <Text style={styles.buttonText}>Creating...</Text>
              ) : (
                <>
                  <Ionicons name="people" size={20} color="white" />
                  <Text style={styles.buttonText}>Create Group</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          {/* Extra padding when keyboard is visible */}
          {keyboardVisible && <View style={{ height: 100 }} />}
        </KeyboardAvoidingView>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
    zIndex: 1000,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
  },
  scrollContent: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  selectedLocation: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
  },
  locationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  locationText: {
    fontSize: 16,
    fontWeight: "500",
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  footer: {
    paddingVertical: 20,
  },
  createButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default CreateGroupBottomSheet;
