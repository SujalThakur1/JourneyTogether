import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { useColorModeContext } from "./ColorModeContext";
import { getGroupMembersLocations } from "../lib/locationService";
import { useApp } from "./AppContext";
import { User, Location } from "../components/groups/types";
import { supabase } from "../lib/supabase";
import { useRouter } from "expo-router";
import { useColors } from "./ColorContext";

interface GroupsContextType {
  // (Existing interface remains unchanged)
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

  filteredLeaders: User[];
  filteredFriends: User[];

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

  handleJoinGroup: () => void;
  handleCreateGroup: () => void;
  handleTypeChange: (value: string) => void;
  addMember: (user: User) => void;
  selectLeader: (user: User) => void;
  removeMember: (userId: string) => void;
  getInitials: (name: string) => string;
}

const GroupsContext = createContext<GroupsContextType | undefined>(undefined);

export const GroupsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // State (unchanged)
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

  const {
    userDetails,
    userLocation,
    users,
    fetchAllUsers,
    hasAttemptedFetch,
    isUsersLoading,
  } = useApp(); // Added fetchAllUsers
  const router = useRouter();

  const colors = useColors();

  // Fetch group members locations (unchanged)
  const fetchGroupMembersLocations = async () => {
    if (!groupMembers.length) return;

    const memberIds = groupMembers.map((member) => member.id);
    const locations = await getGroupMembersLocations(memberIds);
    setMembersLocations(locations);
  };

  useEffect(() => {
    if (
      (!users || users.length === 0) &&
      !hasAttemptedFetch &&
      !isUsersLoading
    ) {
      // console.log(
      //   "Users array is empty and no fetch attempted, fetching all users..."
      // );
      fetchAllUsers();
    }
  }, [users, hasAttemptedFetch, isUsersLoading, fetchAllUsers]);

  // NEW: Fetch users if users array is empty
  useEffect(() => {
    if (!users || users.length === 0) {
      //console.log("Users array is empty, fetching all users...");
      fetchAllUsers(); // Trigger fetchAllUsers from AppContext
    }
  }, [users, fetchAllUsers]);

  // Filtered users for suggestions (modified to log when users is empty)
  const filteredLeaders = useMemo(() => {
    //console.log("Filtering leaders based on searchLeader:", searchLeader);
    if (!users || users.length === 0) {
      //console.log("Users array is empty in filteredLeaders.");
      return [];
    }

    const filtered = users.filter(
      (user) =>
        user.id !== userDetails?.id &&
        !groupMembers.some((member) => member.id === user.id) &&
        (user.username?.toLowerCase().includes(searchLeader.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchLeader.toLowerCase()))
    );
    //console.log("Filtered leaders:", filtered);
    return filtered;
  }, [users, searchLeader, groupMembers, userDetails]);

  const filteredFriends = useMemo(() => {
    if (!users || users.length === 0) {
      //console.log("Users array is empty in filteredFriends.");
      return [];
    }

    return users.filter(
      (user) =>
        user.id !== userDetails?.id &&
        !groupMembers.some((member) => member.id === user.id) &&
        (user.username?.toLowerCase().includes(searchFriend.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchFriend.toLowerCase()))
    );
  }, [users, searchFriend, groupMembers, userDetails]);

  // Helper functions (unchanged)
  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Action handlers (unchanged)
  const handleJoinGroup = async () => {
    try {
      if (!userDetails?.id) {
        throw new Error("User not authenticated");
      }

      if (!groupCode || groupCode.trim().length !== 6) {
        throw new Error("Invalid group code");
      }

      // Check if the group exists
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .select("*")
        .eq("group_code", groupCode.toUpperCase())
        .single();

      if (groupError) {
        if (groupError.code === "PGRST116") {
          throw new Error(
            "Group not found. Please check the code and try again."
          );
        }
        throw new Error(groupError.message);
      }

      if (!groupData) {
        throw new Error(
          "Group not found. Please check the code and try again."
        );
      }

      // Check if user is already a member
      if (groupData.group_members.includes(userDetails.id)) {
        // User is already a member, just navigate to the group
        router.push({
          pathname: "/group/[code]",
          params: { code: groupCode.toUpperCase() },
        });
        return;
      }

      // Add user to the group members
      const updatedMembers = [...groupData.group_members, userDetails.id];

      // Update the group with the new member
      const { error: updateError } = await supabase
        .from("groups")
        .update({ group_members: updatedMembers })
        .eq("group_id", groupData.group_id);

      if (updateError) {
        throw new Error(updateError.message || "Failed to join group");
      }

      // Navigate to the group page
      router.push({
        pathname: "/group/[code]",
        params: { code: groupCode.toUpperCase() },
      });

      return groupData;
    } catch (error: any) {
      console.error("Error joining group:", error);
      throw error;
    }
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
          created_by: userDetails.id,
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

  const value: GroupsContextType = {
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
    filteredLeaders,
    filteredFriends,
    isDark: colors.isDark,
    bgColor: colors.bgColor,
    borderColor: colors.borderColor,
    textColor: colors.textColor,
    inputTextColor: colors.inputTextColor,
    inputBorderColor: colors.inputBorderColor,
    buttonBgColor: colors.buttonBgColor,
    buttonTextColor: colors.buttonTextColor,
    buttonPressedBgColor: colors.buttonPressedBgColor,
    focusedBorderColor: colors.focusedBorderColor,
    dropdownBgColor: colors.dropdownBgColor,
    hoverBgColor: colors.hoverBgColor,
    activeTabBorderColor: colors.activeTabBorderColor,
    tabTextColor: colors.tabTextColor,
    destinationCoordinates,
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
