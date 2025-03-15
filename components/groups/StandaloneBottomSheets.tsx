import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { useColors } from "../../contexts/ColorContext";
import CreateGroupSection from "./CreateGroupSection";
import JoinGroupSection from "./JoinGroupSection";

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

  return (
    <>
      {/* Create Group Modal */}
      <Modal
        visible={showCreateSheet}
        transparent
        animationType="slide"
        onRequestClose={onCloseCreateSheet}
      >
        <TouchableWithoutFeedback onPress={onCloseCreateSheet}>
          <View
            style={[styles.overlay, { backgroundColor: colors.overlayBgColor }]}
          >
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.bottomSheet,
                  {
                    backgroundColor: colors.bottomSheetBgColor,
                    borderTopLeftRadius: 15,
                    borderTopRightRadius: 15,
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
                  <CreateGroupSection />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Join Group Modal */}
      <Modal
        visible={showJoinSheet}
        transparent
        animationType="slide"
        onRequestClose={onCloseJoinSheet}
      >
        <TouchableWithoutFeedback onPress={onCloseJoinSheet}>
          <View
            style={[styles.overlay, { backgroundColor: colors.overlayBgColor }]}
          >
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.bottomSheet,
                  {
                    backgroundColor: colors.bottomSheetBgColor,
                    borderTopLeftRadius: 15,
                    borderTopRightRadius: 15,
                    height: "50%",
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
                  <JoinGroupSection />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  bottomSheet: {
    height: "90%",
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
});

export default StandaloneBottomSheets;
