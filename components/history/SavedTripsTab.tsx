import React, { useEffect, useState } from "react";
import { View, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { useColors } from "../../contexts/ColorContext";
import { Destination, Trip } from "./types";
import TripCard from "./TripCard";
import EmptyState from "./EmptyState";
import { supabase } from "../../lib/supabase";
import { useUser } from "../../contexts/UserContext";

export default function SavedTripsTab() {
  const { user } = useUser();
  const colors = useColors();
  const [savedTrips, setSavedTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchSavedTrips() {
      try {
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("savedtrips")
          .eq("id", user?.id)
          .single();

        if (userError) throw userError;
        if (!userData?.savedtrips?.length) {
          setSavedTrips([]);
          return;
        }

        const { data: destinationsData, error: destinationsError } =
          await supabase
            .from("destination")
            .select("*")
            .in("destination_id", userData.savedtrips);

        if (destinationsError) throw destinationsError;

        const formattedTrips = destinationsData.map((dest: Destination) => ({
          id: dest.destination_id,
          status: "Saved",
          image: dest.primary_image || dest.images?.[0] || "",
          title: dest.name,
          location: dest.location,
          tags: [],
        }));

        setSavedTrips(formattedTrips as any);
      } catch (err) {
        console.error("Error fetching saved trips:", err);
        setSavedTrips([]);
      } finally {
        setLoading(false);
      }
    }

    fetchSavedTrips();
  }, [user]);

  const handleCreateGroup = () => {
    // Add your logic here for creating a group, e.g., navigation to a create group screen
    console.log("Create Group button pressed");
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bgColor }]}>
        <ActivityIndicator size="large" color={colors.accentColor} />
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.content}>
        {savedTrips.length ? (
          savedTrips.map((trip) => <TripCard key={trip.id} trip={trip} />)
        ) : (
          <EmptyState
            icon="bookmark-outline"
            title="No Saved Destinations"
            description="Save your favorite destinations or create a group to plan with others!"
            buttonText="Create Group"
            onButtonPress={handleCreateGroup}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 45,
  },
  content: {
    flex: 1,
  },
});
