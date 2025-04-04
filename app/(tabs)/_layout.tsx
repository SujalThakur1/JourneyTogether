import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { useColorModeContext } from "../../contexts/ColorModeContext";
import { useColors } from "../../contexts/ColorContext";

export default function TabLayout() {
  const colors = useColors();

  const bgColor = colors.navBgColor;
  const activeTintColor = colors.textColor;
  const inactiveTintColor = colors.mutedTextColor;
  const shadowOpacity = colors.isDark ? 0.2 : 0.1;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: bgColor,
          borderTopWidth: 0,
          position: "absolute",
          height: 85,
          shadowColor: "#000000",
          shadowOffset: {
            width: 0,
            height: -4,
          },
          shadowOpacity,
          shadowRadius: 8,
          elevation: 10,
          paddingBottom: Platform.OS === "ios" ? 20 : 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: activeTintColor,
        tabBarInactiveTintColor: inactiveTintColor,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <MaterialCommunityIcons
              name={focused ? "compass" : "compass-outline"}
              size={35}
              color={color}
              style={{
                marginTop: -4.5,
                marginLeft: -4,
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <MaterialCommunityIcons
              name={focused ? "account-group" : "account-group-outline"}
              size={35}
              color={color}
              style={{
                marginTop: -4.5,
                marginLeft: -4,
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <MaterialCommunityIcons
              name={focused ? "history" : "history"}
              size={35}
              color={color}
              style={{
                marginTop: -4.5,
                marginLeft: -4,
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <MaterialCommunityIcons
              name={focused ? "cog" : "cog-outline"}
              size={35}
              color={color}
              style={{
                marginTop: -4.5,
                marginLeft: -4,
              }}
            />
          ),
        }}
      />
    </Tabs>
  );
}
