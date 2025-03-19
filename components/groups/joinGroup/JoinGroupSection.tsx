import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ToastAndroid,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useGroups } from "../../../contexts/GroupsContext";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useColors } from "../../../contexts/ColorContext";
const JoinGroupSection = () => {
  const {
    groupCode,
    setGroupCode,
    focusedInput,
    setFocusedInput,
    isDark,
    inputTextColor,
    inputBorderColor,
    focusedBorderColor,
    buttonBgColor,
    buttonTextColor,
    buttonPressedBgColor,
    textColor,
    handleJoinGroup,
    resetGroupForms,
  } = useGroups();
  const colors = useColors();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(""); // Added error state for better feedback
  const navigation = useNavigation();

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

  const showToast = (title: string, description: string) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(`${title}: ${description}`, ToastAndroid.SHORT);
    }
  };

  const validateGroupCode = () => {
    if (!groupCode.trim()) {
      setError("Please enter a group code");
      showToast("Error", "Please enter a group code");
      return false;
    }
    if (groupCode.length !== 6) {
      setError("Group code must be exactly 6 characters");
      showToast("Error", "Group code must be 6 characters");
      return false;
    }
    if (!/^[A-Za-z0-9]{6}$/.test(groupCode)) {
      setError("Group code must be alphanumeric (letters and numbers only)");
      showToast("Error", "Invalid group code format");
      return false;
    }
    setError(""); // Clear error if all validations pass
    return true;
  };

  const handleJoinWithFeedback = async () => {
    if (isLoading) return;

    // Perform validation
    if (!validateGroupCode()) {
      return;
    }

    try {
      setIsLoading(true);
      await handleJoinGroup();
      showToast("Success", "Successfully joined the group!");
      // No need to clear input as we'll navigate away
    } catch (error: any) {
      setError(error.message || "Failed to join group");
      showToast("Error", error.message || "Failed to join group");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.bgColor },
      ]}
    >
      <View style={styles.headerContainer}>
        <Text style={[styles.header, { color: textColor }]}>
          Join Existing Group
        </Text>
      </View>

      <View style={styles.formSection}>
        <Text style={[styles.label, { color: textColor }]}>Group Code</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: isDark ? "#27272a" : "white",
              borderColor:
                focusedInput === "groupCode"
                  ? focusedBorderColor
                  : error
                  ? "#ef4444" // Red border on error
                  : inputBorderColor,
              color: inputTextColor,
            },
          ]}
          placeholder="Enter 6-digit group code (e.g., ABC123)"
          placeholderTextColor="gray"
          value={groupCode}
          onChangeText={(text) => {
            setGroupCode(text.toUpperCase()); // Force uppercase
            setError(""); // Clear error when typing
          }}
          selectionColor={inputTextColor}
          onFocus={() => setFocusedInput("groupCode")}
          onBlur={() => setFocusedInput(null)}
          maxLength={6}
          autoCapitalize="characters"
        />
        <View style={styles.helperContainer}>
          <Text
            style={[styles.helperText, { color: isDark ? "#9CA3AF" : "#666" }]}
          >
            Ask your group admin for the code
          </Text>
          <Text
            style={[styles.helperText, { color: isDark ? "#9CA3AF" : "#666" }]}
          >
            {groupCode.length}/6 characters
          </Text>
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: isLoading ? "#6B7280" : buttonBgColor,
            opacity: isLoading ? 0.7 : 1, // Slight fade effect when loading
          },
        ]}
        onPress={handleJoinWithFeedback}
        disabled={isLoading}
      >
        {isLoading ? (
          <Text style={[styles.buttonText, { color: buttonTextColor }]}>
            Joining...
          </Text>
        ) : (
          <>
            <MaterialIcons
              name="login"
              size={20}
              color={buttonTextColor}
              style={styles.buttonIcon}
            />
            <Text style={[styles.buttonText, { color: buttonTextColor }]}>
              Join Group
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
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
    marginBottom: 12,
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
  helperContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
  },
  errorText: {
    color: "#ef4444",
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

export default JoinGroupSection;
