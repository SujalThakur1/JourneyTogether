import React from "react";
import { Stack } from "expo-router";

export default function GroupLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "Back",
        headerTitleAlign: "center",
      }}
    >
      <Stack.Screen
        name="[code]/index"
        options={{
          title: "Group Details",
          animation: "slide_from_right",
        }}
      />
    </Stack>
  );
}
