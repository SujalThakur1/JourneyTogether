import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Animated,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
// import { DestinationsSection } from "../../components/DestinationsSection/index";
// import { TopDestinationsSection } from "../../components/TopDestinationsSection/index";
import { useApp } from "../../contexts/AppContext";

// Custom hook to handle theme colors
const useThemeColors = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return {
    textColor: isDark ? "white" : "gray.800",
    iconColor: isDark ? "#FFF" : "#000",
    searchBgColor: isDark ? "#27272a" : "#F5F5F5",
    categoryBgColor: isDark ? "#27272a" : "#F5F5F5",
    categoryTextColor: isDark ? "#A1A1AA" : "#666",
    categoryActiveBgColor: isDark ? "#FFFFFF" : "#000000",
    categoryActiveTextColor: isDark ? "#000000" : "#FFFFFF",
    searchInputTextColor: isDark ? "#FFFFFF" : "#000000",
    spinnerColor: isDark ? "#FFFFFF" : "#000000",
    backgroundColor: isDark ? "#18181b" : "#FFFFFF",
  };
};

export default function DiscoverScreen() {
  const { categories, isLoading, selectedCategory, setSelectedCategory } =
    useApp();
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState("");
  const colors = useThemeColors();

  // Animation setup for loading spinner
  const [spinValue] = useState(new Animated.Value(0));

  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [isLoading]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const handleCloseSearch = () => {
    setShowSearch(false);
    setSearchText("");
  };

  const handleCategoryPress = (category: any) => {
    setSelectedCategory(category);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.backgroundColor }]}
    >
      <View style={styles.header}>
        {!showSearch ? (
          <>
            <Text style={[styles.heading, { color: colors.textColor }]}>
              Discover
            </Text>
            <View style={styles.headerIcons}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setShowSearch(true)}
              >
                <Ionicons name="search" size={24} color={colors.iconColor} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color={colors.iconColor}
                />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.searchContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleCloseSearch}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={colors.iconColor}
              />
            </TouchableOpacity>
            <TextInput
              style={[
                styles.searchInput,
                {
                  backgroundColor: colors.searchBgColor,
                  color: colors.searchInputTextColor,
                },
              ]}
              placeholder="Search destinations..."
              placeholderTextColor={colors.categoryTextColor}
              value={searchText}
              onChangeText={setSearchText}
              autoFocus={true}
              selectionColor={colors.iconColor}
            />
            <TouchableOpacity style={styles.searchButton}>
              <Ionicons
                name="search"
                size={20} 
                color={colors.categoryTextColor}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.category_id}
              style={[
                styles.categoryButton,
                { backgroundColor: colors.categoryBgColor },
                selectedCategory?.category_id === category.category_id && {
                  backgroundColor: colors.categoryActiveBgColor,
                },
              ]}
              onPress={() => handleCategoryPress(category)}
            >
              <Text
                style={[
                  styles.categoryText,
                  { color: colors.categoryTextColor },
                  selectedCategory?.category_id === category.category_id && {
                    color: colors.categoryActiveTextColor,
                  },
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Animated.View
              style={[
                styles.spinner,
                {
                  transform: [{ rotate: spin }],
                  borderTopColor: colors.spinnerColor,
                  borderRightColor: colors.spinnerColor,
                  borderBottomColor: colors.spinnerColor,
                },
              ]}
            />
            <Text style={[styles.loadingText, { color: colors.textColor }]}>
              Loading Destinations...
            </Text>
          </View>
        ) : (
          <>
            {/* <DestinationsSection />
            <TopDestinationsSection /> */}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 5,
    marginHorizontal: 16,
    paddingVertical: 12,
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    marginLeft: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingRight: 40,
    fontSize: 16,
  },
  searchButton: {
    position: "absolute",
    right: 12,
    padding: 8,
  },
  categoriesContainer: {
    paddingHorizontal: 5,
    marginVertical: 12,
    marginHorizontal: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: 200,
  },
  spinner: {
    width: 40,
    height: 40,
    borderWidth: 4,
    borderRadius: 20,
    borderColor: "rgba(0, 0, 0, 0.1)",
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
