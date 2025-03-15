import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useColors } from "../../contexts/ColorContext";

interface GroupFiltersProps {
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
}

const GroupFilters: React.FC<GroupFiltersProps> = ({
  activeFilter,
  setActiveFilter,
}) => {
  const colors = useColors();

  const filters = [
    { id: "all", label: "All Groups" },
    { id: "created", label: "Created by Me" },
    { id: "joined", label: "Joined Groups" },
    { id: "destination", label: "Destination" },
    { id: "follow", label: "Follow" },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterButton,
              {
                backgroundColor:
                  activeFilter === filter.id
                    ? colors.buttonBgColor
                    : colors.filterBgColor,
              },
            ]}
            onPress={() => setActiveFilter(filter.id)}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color:
                    activeFilter === filter.id
                      ? colors.buttonTextColor
                      : colors.filterTextColor,
                  fontWeight: activeFilter === filter.id ? "600" : "normal",
                },
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 4,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
  },
});

export default GroupFilters;
