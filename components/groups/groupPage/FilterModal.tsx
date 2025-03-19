import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "../../../contexts/ColorContext";

interface FilterOption {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  activeFilter,
  setActiveFilter,
}) => {
  const colors = useColors();

  const filterOptions: FilterOption[] = [
    { id: "all", label: "All Groups", icon: "people" },
    { id: "created", label: "Created by Me", icon: "create" },
    { id: "joined", label: "Joined Groups", icon: "log-in" },
    { id: "destination", label: "Destination Groups", icon: "location" },
    { id: "follow", label: "Follow Groups", icon: "navigate" },
  ];

  const handleSelect = (filterId: string) => {
    setActiveFilter(filterId);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View
          style={[styles.overlay, { backgroundColor: colors.overlayBgColor }]}
        >
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalContainer,
                { backgroundColor: colors.cardBgColor },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.textColor }]}>
                  Filter Groups
                </Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color={colors.iconColor} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.optionsContainer}>
                {filterOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.optionItem,
                      activeFilter === option.id && {
                        backgroundColor: colors.hoverBgColor,
                      },
                    ]}
                    onPress={() => handleSelect(option.id)}
                  >
                    <View style={styles.optionContent}>
                      <View
                        style={[
                          styles.iconContainer,
                          {
                            backgroundColor:
                              activeFilter === option.id
                                ? colors.buttonBgColor
                                : colors.filterBgColor,
                          },
                        ]}
                      >
                        <Ionicons
                          name={option.icon}
                          size={18}
                          color={
                            activeFilter === option.id
                              ? colors.buttonTextColor
                              : colors.iconColor
                          }
                        />
                      </View>
                      <Text
                        style={[
                          styles.optionLabel,
                          {
                            color: colors.textColor,
                            fontWeight:
                              activeFilter === option.id ? "bold" : "normal",
                          },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </View>
                    {activeFilter === option.id && (
                      <Ionicons
                        name="checkmark"
                        size={22}
                        color={colors.buttonBgColor}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    maxHeight: "70%",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  optionsContainer: {
    paddingVertical: 8,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 16,
  },
});

export default FilterModal;
