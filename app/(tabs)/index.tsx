import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { DestinationsSection } from "../../components/DestinationsSection/index";
import { TopDestinationsSection } from "../../components/TopDestinationsSection/index";
import { useApp } from "../../contexts/AppContext";
import { useColors } from "../../contexts/ColorContext";

export default function DiscoverScreen() {
  const { categories, isLoading, selectedCategory, setSelectedCategory } =
    useApp();
  const colors = useColors(); // Use the centralized color context
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState("");

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
      style={[styles.container, { backgroundColor: colors.bgColor }]}
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
                color={colors.chevronColor}
              />
            </TouchableOpacity>
            <TextInput
              style={[
                styles.searchInput,
                {
                  backgroundColor: colors.quickActionBgColor,
                  color: colors.inputTextColor,
                },
              ]}
              placeholder="Search destinations..."
              placeholderTextColor={colors.mutedTextColor}
              value={searchText}
              onChangeText={setSearchText}
              autoFocus={true}
              selectionColor={colors.accentColor}
            />
            <TouchableOpacity style={styles.searchButton}>
              <Ionicons name="search" size={20} color={colors.iconColor} />
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
                { backgroundColor: colors.filterBgColor },
                selectedCategory?.category_id === category.category_id && {
                  backgroundColor: colors.buttonBgColor,
                },
              ]}
              onPress={() => handleCategoryPress(category)}
            >
              <Text
                style={[
                  styles.categoryText,
                  { color: colors.filterTextColor },
                  selectedCategory?.category_id === category.category_id && {
                    color: colors.buttonTextColor,
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
                  borderTopColor: colors.accentColor,
                  borderRightColor: colors.accentColor,
                  borderBottomColor: colors.accentColor,
                  borderLeftColor: `${colors.accentColor}33`, // 20% opacity
                },
              ]}
            />
            <Text style={[styles.loadingText, { color: colors.textColor }]}>
              Loading Destinations...
            </Text>
          </View>
        ) : (
          <>
            <DestinationsSection />
            <TopDestinationsSection />
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
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
