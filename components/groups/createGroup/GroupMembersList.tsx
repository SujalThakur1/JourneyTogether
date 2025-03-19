import React from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGroups } from "@/contexts/GroupsContext";
import { User } from "../types";

interface GroupMembersListProps {
  members: User[];
  onRemoveMember: (userId: string) => void;
}

const GroupMembersList = ({
  members,
  onRemoveMember,
}: GroupMembersListProps) => {
  const { isDark, textColor, getInitials } = useGroups();

  if (members.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text
        style={[styles.countText, { color: isDark ? "#9CA3AF" : "#6B7280" }]}
      >
        Added Friends ({members.length})
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.membersContainer}>
          {members.map((member) => (
            <TouchableOpacity
              key={member.id}
              onPress={() => onRemoveMember(member.id)}
              style={styles.memberItem}
            >
              <View style={styles.memberContent}>
                <View
                  style={[
                    styles.avatarContainer,
                    { backgroundColor: isDark ? "#2563EB" : "#3B82F6" },
                  ]}
                >
                  {member.avatar_url ? (
                    <Image
                      source={{ uri: member.avatar_url }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Text style={styles.avatarInitials}>
                      {getInitials(member.username || member.email || "")}
                    </Text>
                  )}
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: isDark ? "#1F2937" : "#F3F4F6",
                        borderColor: isDark ? "#1F2937" : "#F3F4F6",
                      },
                    ]}
                  >
                    <Ionicons
                      name="close"
                      size={10}
                      color={isDark ? "white" : "black"}
                    />
                  </View>
                </View>
                <Text
                  style={[styles.memberName, { color: textColor }]}
                  numberOfLines={1}
                >
                  {(member.username || member.email || "User").split("@")[0]}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  countText: {
    fontSize: 14,
    marginBottom: 8,
  },
  membersContainer: {
    flexDirection: "row",
    gap: 8,
  },
  memberItem: {
    alignItems: "center",
  },
  memberContent: {
    alignItems: "center",
    width: 64,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarInitials: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  badge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  memberName: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
    maxWidth: "100%",
  },
});

export default GroupMembersList;
