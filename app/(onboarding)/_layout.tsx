import React, { useEffect } from "react";
import { Stack } from "expo-router";

export default function OnboardingLayout() {

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: "horizontal",
      }}
    >
      <Stack.Screen
        name="Account"
        options={{ animation: "slide_from_left", title: "Account Details" }}
      />
    </Stack>
  );
}
