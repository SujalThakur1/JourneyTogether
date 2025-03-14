import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { useColorScheme } from "react-native";
import { getGroupMembersLocations } from "../lib/locationService";
import { useApp } from "./AppContext";
import { User, Location } from "../components/groups/types";
import { supabase } from "../lib/supabase";
import { useRouter } from "expo-router";

interface GroupsContextType {
  // Group data
  groupType: string;
  groupCode: string;
  groupName: string;
  destination: string;
  searchFriend: string;
  searchLeader: string;
  focusedInput: string | null;
  groupMembers: User[];
  selectedLeader: User | null;
  membersLocations: Record<string, Location>;
  showLeaderSuggestions: boolean;
  showFriendSuggestions: boolean;

  // Filtered data
  filteredLeaders: User[];
  filteredFriends: User[];

  // UI colors
  isDark: boolean;
  bgColor: string;
  borderColor: string;
  textColor: string;
  inputTextColor: string;
  inputBorderColor: string;
  buttonBgColor: string;
  buttonTextColor: string;
  buttonPressedBgColor: string;
  focusedBorderColor: string;
  dropdownBgColor: string;
  hoverBgColor: string;
  activeTabBorderColor: string;
  tabTextColor: string;
  destinationCoordinates: Location | null;

  // Setters
  setGroupType: (value: string) => void;
  setGroupCode: (value: string) => void;
  setGroupName: (value: string) => void;
  setDestination: (value: string) => void;
  setSearchFriend: (value: string) => void;
  setSearchLeader: (value: string) => void;
  setFocusedInput: (input: string | null) => void;
  setGroupMembers: (members: User[]) => void;
  setSelectedLeader: (user: User | null) => void;
  setShowLeaderSuggestions: (show: boolean) => void;
  setShowFriendSuggestions: (show: boolean) => void;
  setDestinationCoordinates: (coordinates: Location | null) => void;

  // Actions
  handleJoinGroup: () => void;
  handleCreateGroup: () => void;
  handleTypeChange: (value: string) => void;
  addMember: (user: User) => void;
  selectLeader: (user: User) => void;
  removeMember: (userId: string) => void;
  getInitials: (name: string) => string;
}

const GroupsContext = createContext<GroupsContextType | undefined>(undefined);

// Custom hook for theming
const useThemeColors = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return {
    isDark,
    bgColor: isDark ? "#1F2937" : "white",
    borderColor: isDark ? "#4B5563" : "#E5E7EB",
    textColor: isDark ? "#F9FAFB" : "#1F2937",
    inputTextColor: isDark ? "white" : "#1F2937",
    inputBorderColor: isDark ? "#6B7280" : "#D1D5DB",
    buttonBgColor: isDark ? "white" : "black",
    buttonTextColor: isDark ? "black" : "white",
    buttonPressedBgColor: isDark ? "#D1D5DB" : "#4B5563",
    focusedBorderColor: isDark ? "white" : "black",
    dropdownBgColor: isDark ? "#374151" : "white",
    hoverBgColor: isDark ? "#4B5563" : "#F3F4F6",
    activeTabBorderColor: isDark ? "#FFFFFF" : "#000000",
    tabTextColor: isDark ? "#F3F4F6" : "#111827",
  };
};

export const GroupsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // State
  const [groupType, setGroupType] = useState("destination");
  const [groupCode, setGroupCode] = useState("");
  const [groupName, setGroupName] = useState("");
  const [destination, setDestination] = useState("");
  const [searchFriend, setSearchFriend] = useState("");
  const [searchLeader, setSearchLeader] = useState("");
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<User[]>([]);
  const [selectedLeader, setSelectedLeader] = useState<User | null>(null);
  const [membersLocations, setMembersLocations] = useState<
    Record<string, Location>
  >({});
  const [showLeaderSuggestions, setShowLeaderSuggestions] = useState(false);
  const [showFriendSuggestions, setShowFriendSuggestions] = useState(false);
  const [destinationCoordinates, setDestinationCoordinates] =
    useState<Location | null>(null);

  const { userDetails, userLocation, users = [] } = useApp();
  const router = useRouter();

  // Theme colors
  const themeColors = useThemeColors();

  // Fetch group members locations
  const fetchGroupMembersLocations = async () => {
    if (!groupMembers.length) return;

    const memberIds = groupMembers.map((member) => member.id);
    const locations = await getGroupMembersLocations(memberIds);
    setMembersLocations(locations);
  };

  useEffect(() => {
    if (groupMembers.length) {
      fetchGroupMembersLocations();
      const interval = setInterval(fetchGroupMembersLocations, 10000);
      return () => clearInterval(interval);
    }
  }, [groupMembers]);

  // Filtered users for suggestions
  const filteredLeaders = useMemo(() => {
    if (!users || !searchLeader) return [];

    return users.filter(
      (user) =>
        user.id !== userDetails?.id &&
        !groupMembers.some((member) => member.id === user.id) &&
        (user.username?.toLowerCase().includes(searchLeader.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchLeader.toLowerCase()))
    );
  }, [users, searchLeader, groupMembers, userDetails]);

  const filteredFriends = useMemo(() => {
    if (!users || !searchFriend) return [];

    return users.filter(
      (user) =>
        user.id !== userDetails?.id &&
        !groupMembers.some((member) => member.id === user.id) &&
        (user.username?.toLowerCase().includes(searchFriend.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchFriend.toLowerCase()))
    );
  }, [users, searchFriend, groupMembers, userDetails]);

  // Helper functions
  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Action handlers
  const handleJoinGroup = () => {
    console.log("Joining group with code:", groupCode);
    // Implement join group functionality
  };

  const generateGroupCode = (): string => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    let code = "";
    for (let i = 0; i < 3; i++) {
      code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    for (let i = 0; i < 3; i++) {
      code += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    return code;
  };

  const handleCreateGroup = async () => {
    try {
      if (!userDetails?.id) {
        throw new Error("User not authenticated");
      }

      const newGroupCode = generateGroupCode();
      const dbGroupType =
        groupType === "destination" ? "TravelToDestination" : "FollowMember";
      let destinationId = null;
      if (groupType === "destination" && destination) {
        destinationId = parseInt(destination, 10) || null;
      }
      const leaderId =
        groupType === "follow" && selectedLeader
          ? selectedLeader.id
          : userDetails.id;
      const memberIds = groupMembers.map((member) => member.id);

      if (!memberIds.includes(userDetails.id)) {
        memberIds.push(userDetails.id);
      }

      const { data, error } = await supabase
        .from("groups")
        .insert({
          group_name: groupName,
          group_code: newGroupCode,
          group_type: dbGroupType,
          destination_id: destinationId,
          leader_id: leaderId,
          group_members: memberIds,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating group:", error);
        throw new Error(error.message || "Failed to create group");
      }

      console.log("Group created successfully:", data);
      setGroupCode(newGroupCode);
      router.push({
        pathname: "/group/[code]",
        params: { code: newGroupCode },
      });

      return data;
    } catch (error) {
      console.error("Error in handleCreateGroup:", error);
      throw error;
    }
  };

  const handleTypeChange = (value: string) => {
    setSelectedLeader(null);
    setDestination("");
    setGroupType(value);
  };

  const addMember = (user: User) => {
    setGroupMembers([...groupMembers, user]);
    setSearchFriend("");
    setShowFriendSuggestions(false);
  };

  const selectLeader = (user: User) => {
    setSelectedLeader(user);
    setSearchLeader("");
    setShowLeaderSuggestions(false);
  };

  const removeMember = (userId: string) => {
    setGroupMembers(groupMembers.filter((member) => member.id !== userId));
  };

  const value = {
    // Group data
    groupType,
    groupCode,
    groupName,
    destination,
    searchFriend,
    searchLeader,
    focusedInput,
    groupMembers,
    selectedLeader,
    membersLocations,
    showLeaderSuggestions,
    showFriendSuggestions,

    // Filtered data
    filteredLeaders,
    filteredFriends,

    // UI colors
    ...themeColors, // Spread theme colors directly
    destinationCoordinates,

    // Setters
    setGroupType,
    setGroupCode,
    setGroupName,
    setDestination,
    setSearchFriend,
    setSearchLeader,
    setFocusedInput,
    setGroupMembers,
    setSelectedLeader,
    setShowLeaderSuggestions,
    setShowFriendSuggestions,
    setDestinationCoordinates,

    // Actions
    handleJoinGroup,
    handleCreateGroup,
    handleTypeChange,
    addMember,
    selectLeader,
    removeMember,
    getInitials,
  };

  return (
    <GroupsContext.Provider value={value}>{children}</GroupsContext.Provider>
  );
};

export const useGroups = () => {
  const context = useContext(GroupsContext);
  if (context === undefined) {
    throw new Error("useGroups must be used within a GroupsProvider");
  }
  return context;
};
