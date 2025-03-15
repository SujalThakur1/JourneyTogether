import { useEffect, useState, useContext } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { supabase } from "../lib/supabase";
import { Session, User } from "@supabase/supabase-js";
import { AppProvider } from "../contexts/AppContext";
import {
  ColorModeProvider,
  useColorModeContext,
} from "@/contexts/ColorModeContext";
import { ColorProvider } from "@/contexts/ColorContext";
import "react-native-get-random-values";
import { GroupsProvider } from "../contexts/GroupsContext";

// Create a StatusBarComponent that uses the ColorModeContext
function StatusBarComponent() {
  const { effectiveColorMode } = useColorModeContext();
  return <StatusBar style={effectiveColorMode === "dark" ? "light" : "dark"} />;
}

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [userDetails, setUserDetails] = useState<any | null>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Fetch the current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserDetails(session.user);
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserDetails(session.user);
      } else {
        setUserDetails(null); // Clear details on logout
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch user details from your Supabase database
  const fetchUserDetails = async (user: User) => {
    const { data, error } = await supabase
      .from("users") // Replace "profiles" with your table name
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (error) {
      console.error("Error fetching user details:", error.message);
    } else {
      setUserDetails(data);
    }
  };

  // Refetch user details when segments change
  useEffect(() => {
    if (session?.user && segments[0] === "(tabs)") {
      fetchUserDetails(session.user);
    }
  }, [segments, session]);

  // Navigation logic based on session and user details
  useEffect(() => {
    const inAuthGroup = segments[0] === "(auth)";
    const inOnboardingGroup = segments[0] === "(onboarding)";

    if (!session) {
      // If no session (not logged in), redirect to auth
      if (!inAuthGroup) {
        router.replace("/(auth)/SignIn");
      }
    } else if (session && !userDetails) {
      // If logged in but no user details yet, wait for details to load
      return;
    } else if (session && userDetails) {
      // User is logged in and we have their details
      if (userDetails.username === null) {
        // If username is not set, send to onboarding
        if (!inOnboardingGroup) {
          router.replace("/(onboarding)/Account");
        }
      } else {
        // If username is set, send to main app
        if (inAuthGroup || inOnboardingGroup) {
          router.replace("/(tabs)");
        }
      }
    }
  }, [session, userDetails, segments]);

  return (
    <ColorModeProvider>
      <ColorProvider>
        <AppProvider>
          <GroupsProvider>
            <StatusBarComponent />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="(onboarding)"
                options={{ headerShown: false }}
              />
            </Stack>
          </GroupsProvider>
        </AppProvider>
      </ColorProvider>
    </ColorModeProvider>
  );
}
