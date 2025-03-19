import React from "react";
import { View, StyleSheet } from "react-native";
import { Polyline } from "react-native-maps";
import { MemberRoute } from "../../types/group";

interface RouteLinesProps {
  routes: MemberRoute[];
  currentUserId: string;
}

const RouteLines: React.FC<RouteLinesProps> = ({ routes, currentUserId }) => {
  // Route colors based on relationship to current user
  const getRouteColor = (route: MemberRoute): string => {
    if (route.memberId === currentUserId) {
      return "#3B82F6"; // Blue for current user
    } else if (route.destMemberId) {
      return "#F59E0B"; // Amber for follow member routes
    } else {
      return "#10B981"; // Green for destination routes
    }
  };

  return (
    <View style={styles.container}>
      {routes.map((route, index) => {
        if (
          !route.route.polylineCoords ||
          route.route.polylineCoords.length < 2
        ) {
          return null;
        }

        return (
          <Polyline
            key={`${route.memberId}-${index}`}
            coordinates={route.route.polylineCoords}
            strokeWidth={4}
            strokeColor={getRouteColor(route)}
            lineDashPattern={[0]}
            lineCap="round"
            lineJoin="round"
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // This is a transparent view just for containing the polylines
  },
});

export default RouteLines;
