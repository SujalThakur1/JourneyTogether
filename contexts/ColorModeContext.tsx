import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";

type ColorModeType = "light" | "dark" | "system";

interface ColorModeContextType {
  colorMode: ColorModeType;
  setColorMode: (mode: ColorModeType) => void;
  toggleColorMode: () => void;
  effectiveColorMode: "light" | "dark";
}

const ColorModeContext = createContext<ColorModeContextType | undefined>(
  undefined
);

export function ColorModeProvider({ children }: { children: React.ReactNode }) {
  const [colorMode, setColorMode] = useState<ColorModeType>("system");
  const systemColorScheme = useColorScheme();

  const effectiveColorMode =
    colorMode === "system" ? systemColorScheme || "light" : colorMode;

  useEffect(() => {
    // Load saved color mode preference on mount
    loadColorMode();
  }, []);

  useEffect(() => {
    // Persist color mode to AsyncStorage when it changes
    AsyncStorage.setItem("colorMode", colorMode).catch((error) =>
      console.error("Error saving color mode:", error)
    );

    // Log the color mode change for debugging
    console.log("Color mode changed to:", colorMode);
    console.log("Effective color mode:", effectiveColorMode);
  }, [colorMode, effectiveColorMode]);

  const loadColorMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem("colorMode");
      if (savedMode) {
        setColorMode(savedMode as ColorModeType);
        console.log("Loaded saved color mode:", savedMode);
      }
    } catch (error) {
      console.error("Error loading color mode:", error);
    }
  };

  const toggleColorMode = () => {
    const newMode = effectiveColorMode === "light" ? "dark" : "light";
    setColorMode(newMode);
  };

  const handleSetColorMode = (mode: ColorModeType) => {
    console.log("Setting color mode to:", mode);
    setColorMode(mode);
  };

  return (
    <ColorModeContext.Provider
      value={{
        colorMode,
        setColorMode: handleSetColorMode,
        toggleColorMode,
        effectiveColorMode,
      }}
    >
      {children}
    </ColorModeContext.Provider>
  );
}

export const useColorModeContext = () => {
  const context = useContext(ColorModeContext);
  if (!context) {
    throw new Error(
      "useColorModeContext must be used within a ColorModeProvider"
    );
  }
  return context;
};
