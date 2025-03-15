import React, { createContext, useContext } from "react";
import { useColorModeContext } from "./ColorModeContext";

// Define all the color types that our app will use
interface ThemeColors {
  // Nav colors
  navBgColor: string;

  // Base colors
  bgColor: string;
  textColor: string;
  borderColor: string;

  // Input colors
  inputTextColor: string;
  inputBorderColor: string;
  focusedBorderColor: string;

  // Button colors
  buttonBgColor: string;
  buttonTextColor: string;
  buttonPressedBgColor: string;

  // Card colors
  cardBgColor: string;
  cardBorderColor: string;
  cardShadowColor: string;

  // Tab colors
  activeTabBorderColor: string;
  tabTextColor: string;

  // Dropdown colors
  dropdownBgColor: string;
  hoverBgColor: string;

  // Status colors
  dangerColor: string;
  successColor: string;
  warningColor: string;
  infoColor: string;

  // Text variants
  subTextColor: string;
  mutedTextColor: string;

  // Misc colors
  accentColor: string;
  chevronColor: string;
  switchTrackColor: string;
  pressedBgColor: string;
  whiteColor: string;
  quickActionBgColor: string;
  toggleBgColor: string;
  filterBgColor: string;
  filterTextColor: string;
  iconColor: string;

  // Status indicators
  onlineStatusColor: string;
  offlineStatusColor: string;

  // Group type colors
  destinationGroupColor: string;
  followGroupColor: string;

  // Empty state colors
  emptyStateIconColor: string;

  // Bottom sheet colors
  bottomSheetBgColor: string;
  bottomSheetHandleColor: string;

  // Overlay colors
  overlayBgColor: string;

  // Helper property
  isDark: boolean;
}

interface ColorContextType {
  colors: ThemeColors;
}

const ColorContext = createContext<ColorContextType | undefined>(undefined);

export function ColorProvider({ children }: { children: React.ReactNode }) {
  const { effectiveColorMode } = useColorModeContext();
  const isDark = effectiveColorMode === "dark";

  // Centralized color definitions
  const colors: ThemeColors = {
    // Nav colors
    navBgColor: isDark ? "black" : "white",

    // Base colors
    bgColor: isDark ? "#1c1917" : "white",
    textColor: isDark ? "#F9FAFB" : "#1F2937",
    borderColor: isDark ? "#4B5563" : "#E5E7EB",

    // Input colors
    inputTextColor: isDark ? "white" : "#1F2937",
    inputBorderColor: isDark ? "#6B7280" : "#D1D5DB",
    focusedBorderColor: isDark ? "white" : "black",

    // Button colors
    buttonBgColor: isDark ? "white" : "black",
    buttonTextColor: isDark ? "black" : "white",
    buttonPressedBgColor: isDark ? "#D1D5DB" : "#4B5563",

    // Card colors
    cardBgColor: isDark ? "#292524" : "#F9FAFB",
    cardBorderColor: isDark ? "#44403c" : "#E5E7EB",
    cardShadowColor: isDark ? "#000000" : "#00000020",

    // Tab colors
    activeTabBorderColor: isDark ? "#FFFFFF" : "#000000",
    tabTextColor: isDark ? "#F3F4F6" : "#111827",

    // Dropdown colors
    dropdownBgColor: isDark ? "#374151" : "white",
    hoverBgColor: isDark ? "#4B5563" : "#F3F4F6",

    // Status colors
    dangerColor: isDark ? "#EF4444" : "#B91C1C",
    successColor: isDark ? "#10B981" : "#059669",
    warningColor: isDark ? "#F59E0B" : "#D97706",
    infoColor: isDark ? "#3B82F6" : "#2563EB",

    // Text variants
    subTextColor: isDark ? "#9CA3AF" : "#6B7280",
    mutedTextColor: isDark ? "#9CA3AF" : "#6B7280",

    // Misc colors
    accentColor: "#ED851B", // Warm brown/gold accent (unchanged)
    chevronColor: isDark ? "#9CA3AF" : "#666",
    switchTrackColor: isDark ? "#3F3F46" : "#E4E4E7",
    pressedBgColor: isDark ? "#4B5563" : "#F3F4F6",
    whiteColor: isDark ? "#F7F5F2" : "#FFFFFF",
    quickActionBgColor: isDark ? "#333333" : "#F0EDE8",
    toggleBgColor: isDark ? "#333333" : "#F0EDE8",
    filterBgColor: isDark ? "#44403c" : "#e7e5e4",
    filterTextColor: isDark ? "#D1D5DB" : "#666666",
    iconColor: isDark ? "#D1D5DB" : "#666666",

    // Status indicators
    onlineStatusColor: "#10B981", // Green for online
    offlineStatusColor: "#9CA3AF", // Gray for offline

    // Group type colors
    destinationGroupColor: "#3B82F6", // Blue for destination groups
    followGroupColor: "#10B981", // Green for follow groups

    // Empty state colors
    emptyStateIconColor: isDark ? "#6B7280" : "#D1D5DB",

    // Bottom sheet colors
    bottomSheetBgColor: isDark ? "#1F2937" : "#FFFFFF",
    bottomSheetHandleColor: isDark ? "#4B5563" : "#E5E7EB",

    // Overlay colors
    overlayBgColor: isDark ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.3)",

    // Helper property
    isDark,
  };

  return (
    <ColorContext.Provider value={{ colors }}>{children}</ColorContext.Provider>
  );
}

export const useColors = () => {
  const context = useContext(ColorContext);
  if (!context) {
    throw new Error("useColors must be used within a ColorProvider");
  }
  return context.colors;
};
