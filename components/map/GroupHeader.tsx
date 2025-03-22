import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface GroupHeaderProps {
  groupName: string;
  groupCode: string;
  onBack: () => void;
  textColor: string;
  borderColor: string;
  backgroundColor: string;
  isJourneyActive?: boolean;
  distance?: string;
  duration?: string;
  routeError?: string | null;
}

const GroupHeader: React.FC<GroupHeaderProps> = ({
  groupName,
  groupCode,
  onBack,
  textColor,
  borderColor,
  backgroundColor,
  isJourneyActive = false,
  distance = "",
  duration = "",
  routeError = null,
}) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const hasRouteInfo = isJourneyActive && (distance || duration || routeError);

  return (
    <View
      style={[
        styles.header,
        { borderBottomColor: borderColor, backgroundColor },
      ]}
    >
      <View style={styles.headerLeft}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.groupName, { color: textColor }]}>
            {groupName}
          </Text>

          <View style={styles.infoRow}>
            <Text style={[styles.groupCode, { color: textColor }]}>
              Code: {groupCode}
            </Text>

            {hasRouteInfo && !expanded && !routeError && (
              <>
                <View
                  style={[styles.divider, { backgroundColor: textColor }]}
                />
                <TouchableOpacity
                  style={styles.routeInfoRow}
                  onPress={toggleExpanded}
                >
                  <View style={styles.routeInfoItem}>
                    <MaterialIcons
                      name="straighten"
                      size={14}
                      color={textColor}
                    />
                    <Text
                      style={[styles.routeInfoText, { color: textColor }]}
                      numberOfLines={1}
                    >
                      {distance}
                    </Text>
                  </View>
                  <View style={styles.routeInfoItem}>
                    <MaterialIcons
                      name="schedule"
                      size={14}
                      color={textColor}
                    />
                    <Text
                      style={[styles.routeInfoText, { color: textColor }]}
                      numberOfLines={1}
                    >
                      {duration}
                    </Text>
                  </View>
                  <MaterialIcons
                    name="expand-more"
                    size={16}
                    color={textColor}
                    style={styles.expandIcon}
                  />
                </TouchableOpacity>
              </>
            )}

            {isJourneyActive && routeError && !expanded && (
              <>
                <View
                  style={[styles.divider, { backgroundColor: textColor }]}
                />
                <TouchableOpacity
                  style={styles.routeInfoRow}
                  onPress={toggleExpanded}
                >
                  <View style={styles.errorInfo}>
                    <MaterialIcons
                      name="error-outline"
                      size={14}
                      color="#EF4444"
                    />
                    <Text style={styles.errorText} numberOfLines={1}>
                      Route error
                    </Text>
                  </View>
                  <MaterialIcons
                    name="expand-more"
                    size={16}
                    color={textColor}
                    style={styles.expandIcon}
                  />
                </TouchableOpacity>
              </>
            )}
          </View>

          {hasRouteInfo && expanded && !routeError && (
            <TouchableOpacity
              style={[styles.expandedInfo, { borderColor: borderColor }]}
              onPress={toggleExpanded}
            >
              <View style={styles.expandedInfoRow}>
                <MaterialIcons name="straighten" size={16} color={textColor} />
                <Text style={[styles.expandedInfoText, { color: textColor }]}>
                  {distance}
                </Text>
              </View>
              <View style={styles.expandedInfoRow}>
                <MaterialIcons name="schedule" size={16} color={textColor} />
                <Text style={[styles.expandedInfoText, { color: textColor }]}>
                  {duration}
                </Text>
              </View>
              <MaterialIcons
                name="expand-less"
                size={20}
                color={textColor}
                style={styles.collapseIcon}
              />
            </TouchableOpacity>
          )}

          {isJourneyActive && routeError && expanded && (
            <TouchableOpacity
              style={[styles.expandedInfo, { borderColor: "#EF4444" }]}
              onPress={toggleExpanded}
            >
              <View style={styles.expandedInfoRow}>
                <MaterialIcons name="error-outline" size={16} color="#EF4444" />
                <Text style={styles.expandedErrorText}>{routeError}</Text>
              </View>
              <MaterialIcons
                name="expand-less"
                size={20}
                color={textColor}
                style={styles.collapseIcon}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    width: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  headerContent: {
    flex: 1,
  },
  backButton: {
    marginRight: 12,
    paddingTop: 2,
  },
  groupName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  routeInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  groupCode: {
    fontSize: 14,
    opacity: 0.8,
  },
  divider: {
    width: 1,
    height: 12,
    marginHorizontal: 8,
    opacity: 0.5,
  },
  routeInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 4,
    marginRight: 8,
  },
  routeInfoText: {
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 3,
  },
  errorInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 4,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 3,
    color: "#EF4444",
  },
  expandIcon: {
    marginLeft: "auto",
  },
  expandedInfo: {
    marginTop: 4,
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  expandedInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
  },
  expandedInfoText: {
    fontSize: 14,
    marginLeft: 6,
  },
  expandedErrorText: {
    fontSize: 14,
    marginLeft: 6,
    color: "#EF4444",
    flex: 1,
  },
  collapseIcon: {
    alignSelf: "center",
    marginTop: 2,
  },
});

export default GroupHeader;
