import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Group } from "../../types/group";

interface GroupStatsProps {
  group: Group;
  onlineCount: number;
  pendingCount: number;
  showPending: boolean;
  textColor: string;
  bgColor: string;
  borderColor: string;
}

const GroupStats: React.FC<GroupStatsProps> = ({
  group,
  onlineCount,
  pendingCount,
  showPending,
  textColor,
  bgColor,
  borderColor,
}) => {
  return (
    <View
      style={[styles.statsContainer, { backgroundColor: bgColor, borderColor }]}
    >
      <View style={styles.statsItem}>
        <Text style={[styles.statsValue, { color: textColor }]}>
          {group.group_members.length}
        </Text>
        <Text style={[styles.statsLabel, { color: textColor }]}>Members</Text>
      </View>

      {showPending && (
        <>
          <View style={[styles.divider, { backgroundColor: borderColor }]} />
          <View style={styles.statsItem}>
            <Text style={[styles.statsValue, { color: textColor }]}>
              {pendingCount}
            </Text>
            <Text style={[styles.statsLabel, { color: textColor }]}>
              Pending
            </Text>
          </View>
        </>
      )}

      <View style={[styles.divider, { backgroundColor: borderColor }]} />
      <View style={styles.statsItem}>
        <Text style={[styles.statsValue, { color: textColor }]}>
          {onlineCount}
        </Text>
        <Text style={[styles.statsLabel, { color: textColor }]}>Online</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: "row",
    position: "absolute",
    top: 75, // Below header
    left: 16,
    right: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "space-around",
    alignItems: "center",
    zIndex: 10,
  },
  statsItem: {
    alignItems: "center",
    flex: 1,
  },
  statsValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  statsLabel: {
    fontSize: 12,
    opacity: 0.8,
  },
  divider: {
    width: 1,
    height: 30,
  },
});

export default GroupStats;
