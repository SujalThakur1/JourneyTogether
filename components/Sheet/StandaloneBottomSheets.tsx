import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  Keyboard,
  Platform,
  Dimensions,
  KeyboardAvoidingView,
} from "react-native";
import { useColors } from "../../contexts/ColorContext";
import CreateGroupSection from "@/components/groups/createGroup/CreateGroupSection";
import JoinGroupSection from "@/components/groups/joinGroup/JoinGroupSection";
import { useGroups } from "../../contexts/GroupsContext";

interface StandaloneBottomSheetsProps {
  showCreateSheet: boolean;
  showJoinSheet: boolean;
  onCloseCreateSheet: () => void;
  onCloseJoinSheet: () => void;
}

const StandaloneBottomSheets: React.FC<StandaloneBottomSheetsProps> = ({
  showCreateSheet,
  showJoinSheet,
  onCloseCreateSheet,
  onCloseJoinSheet,
}) => {
  const colors = useColors();
  const { resetGroupForms } = useGroups();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const { height: screenHeight } = Dimensions.get("window");

  // Track when keyboard will show/hide
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  // Handle close events with keyboard dismissal
  const handleCloseCreateSheet = () => {
    Keyboard.dismiss();
    resetGroupForms();
    onCloseCreateSheet();
  };

  const handleCloseJoinSheet = () => {
    Keyboard.dismiss();
    resetGroupForms();
    onCloseJoinSheet();
  };

  // Create Group Sheet
  const renderCreateSheet = () => (
    <Modal
      visible={showCreateSheet}
      transparent
      animationType="slide"
      onRequestClose={handleCloseCreateSheet}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <View
          style={[styles.overlay, { backgroundColor: colors.overlayBgColor }]}
        >
          {/* Background overlay touchable */}
          <TouchableWithoutFeedback onPress={handleCloseCreateSheet}>
            <View style={styles.backgroundTouchable} />
          </TouchableWithoutFeedback>

          {/* Content container */}
          <View
            style={[
              styles.bottomSheet,
              {
                backgroundColor: colors.bgColor,
                borderTopLeftRadius: 15,
                borderTopRightRadius: 15,
                // Reduce the height slightly for better proportions
                height: keyboardVisible
                  ? screenHeight * 0.6 // Smaller when keyboard is visible
                  : screenHeight * 0.7, // Larger when keyboard is hidden
              },
            ]}
          >
            <View
              style={[
                styles.handle,
                { backgroundColor: colors.bottomSheetHandleColor },
              ]}
            />
            <ScrollView
              style={styles.scrollContent}
              contentContainerStyle={[
                styles.scrollContentContainer,
                { paddingBottom: keyboardVisible ? 180 : 40 },
              ]}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              <CreateGroupSection onClose={handleCloseCreateSheet} />
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  // Join Group Sheet
  const renderJoinSheet = () => (
    <Modal
      visible={showJoinSheet}
      transparent
      animationType="slide"
      onRequestClose={handleCloseJoinSheet}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <View
          style={[styles.overlay, { backgroundColor: colors.overlayBgColor }]}
        >
          {/* Background overlay touchable */}
          <TouchableWithoutFeedback onPress={handleCloseJoinSheet}>
            <View style={styles.backgroundTouchable} />
          </TouchableWithoutFeedback>

          {/* Content container */}
          <View
            style={[
              styles.bottomSheet,
              {
                backgroundColor: colors.bgColor,
                borderTopLeftRadius: 15,
                borderTopRightRadius: 15,
                // Always use a fixed pixel height for Join sheet
                height: keyboardVisible ? 340 : 350,
              },
            ]}
          >
            <View
              style={[
                styles.handle,
                { backgroundColor: colors.bottomSheetHandleColor },
              ]}
            />
            <View style={styles.content}>
              <JoinGroupSection onClose={handleCloseJoinSheet} />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <>
      {renderCreateSheet()}
      {renderJoinSheet()}
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backgroundTouchable: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bottomSheet: {
    width: "100%",
    alignItems: "center",
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  content: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 16,
  },
  scrollContent: {
    flex: 1,
    width: "100%",
  },
  scrollContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
});

export default StandaloneBottomSheets;
