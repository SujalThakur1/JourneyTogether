import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { useColors } from "./ColorContext"; // Assuming this is the correct import
import { getGroupMembersLocations } from "../lib/locationService";
import { useApp } from "./AppContext";
import { User, Location } from "../components/groups/types";
import { supabase } from "../lib/supabase";
import { useRouter } from "expo-router";

// Define Group interface
export interface Group {
  group_id: number;
  group_name: string;
  group_code: string;
  group_type: "TravelToDestination" | "FollowMember";
  destination_id: number | null;
  leader_id: string;
  group_members: string[];
  created_by: string;
  created_at: string;
  group_description?: string;
  destination?: string | null;
}

// Define interface for creating a new group
export interface CreateGroupParams {
  group_name: string;
  group_description?: string;
  group_type: "TravelToDestination" | "FollowMember";
  destination?: string | null;
  created_by: string;
}

interface GroupsContextType {
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
  destinationId: number | null;

  userGroups: Group[];
  isLoadingGroups: boolean;
  groupsError: string | null;

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
  setDestinationId: (id: number | null) => void;

  handleJoinGroup: () => void;
  handleCreateGroup: () => void;
  handleTypeChange: (value: string) => void;
  addMember: (user: User) => void;
  selectLeader: (user: User) => void;
  removeMember: (userId: string) => void;
  getInitials: (name: string) => string;

  fetchUserGroups: () => Promise<void>;
  refreshGroups: () => Promise<void>;

  createGroup: (params: CreateGroupParams) => Promise<Group>;
  joinGroup: (code: string) => Promise<Group>;
  fetchDestinationDetails: (destinationId: number) => Promise<any>;

  resetGroupForms: () => void;
}

const GroupsContext = createContext<GroupsContextType | undefined>(undefined);

export const GroupsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [groupType, setGroupType] = useState("destination");
  const [groupCode, setGroupCode] = useState("");
  const [groupName, setGroupName] = useState("");
  const [destination, setDestination] = useState("");
  const [destinationId, setDestinationId] = useState<number | null>(null);
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

  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [groupsError, setGroupsError] = useState<string | null>(null);

  const {
    userDetails,
    userLocation,
    users,
    fetchAllUsers,
    hasAttemptedFetch,
    isUsersLoading,
  } = useApp();
  const router = useRouter();
  const colors = useColors();

  useEffect(() => {
    if (userDetails?.id) {
      fetchUserGroups();
    }
  }, [userDetails]);

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
      fetchAllUsers();
    }
  }, [users, hasAttemptedFetch, isUsersLoading, fetchAllUsers]);

  useEffect(() => {
    if (!users || users.length === 0) {
      fetchAllUsers();
    }
  }, [users, fetchAllUsers]);

  const filteredLeaders = useMemo(() => {
    if (!users || users.length === 0) {
      return [];
    }

    const filtered = users.filter(
      (user) =>
        user.id !== userDetails?.id &&
        !groupMembers.some((member) => member.id === user.id) &&
        (user.username?.toLowerCase().includes(searchLeader.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchLeader.toLowerCase()))
    );
    return filtered;
  }, [users, searchLeader, groupMembers, userDetails]);

  const filteredFriends = useMemo(() => {
    if (!users || users.length === 0) {
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

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const fetchUserGroups = async () => {
    if (!userDetails?.id) return;

    try {
      setIsLoadingGroups(true);
      setGroupsError(null);

      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .contains("group_members", [userDetails.id])
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching groups:", error);
        setGroupsError(error.message);
        setIsLoadingGroups(false);
        return;
      }

      setUserGroups(data || []);
      setIsLoadingGroups(false);
    } catch (error: any) {
      console.error("Error in fetchUserGroups:", error);
      setGroupsError(error.message || "Failed to fetch groups");
      setIsLoadingGroups(false);
    }
  };

  const refreshGroups = async () => {
    await fetchUserGroups();
  };

  const resetGroupForms = () => {
    // Reset group creation fields
    setGroupType("destination");
    setGroupName("");
    setDestination("");
    setDestinationId(null);
    setDestinationCoordinates(null);
    setSearchLeader("");
    setSearchFriend("");
    setSelectedLeader(null);
    setGroupMembers([]);
    setShowLeaderSuggestions(false);
    setShowFriendSuggestions(false);

    // Reset group joining fields
    setGroupCode("");
  };

  const handleJoinGroup = async () => {
    try {
      if (!userDetails?.id) {
        throw new Error("User not authenticated");
      }

      if (!groupCode || groupCode.trim().length !== 6) {
        throw new Error("Invalid group code");
      }

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

      if (groupData.group_members.includes(userDetails.id)) {
        // Reset form fields before navigation
        resetGroupForms();

        router.push({
          pathname: "/group/[code]",
          params: { code: groupCode.toUpperCase() },
        });
        return;
      }

      const updatedMembers = [...groupData.group_members, userDetails.id];

      const { error: updateError } = await supabase
        .from("groups")
        .update({ group_members: updatedMembers })
        .eq("group_id", groupData.group_id);

      if (updateError) {
        throw new Error(updateError.message || "Failed to join group");
      }

      // Reset form fields after successful join
      resetGroupForms();

      await fetchUserGroups();

      router.push({
        pathname: "/group/[code]",
        params: { code: groupCode.toUpperCase() },
      });

      return groupData;
    } catch (error: any) {
      console.log("Error joining group:", error);
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

      let destId = destinationId;
      if (groupType === "destination" && !destId && destination) {
        destId = parseInt(destination, 10) || null;
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
          destination_id: destId,
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

      // Reset form fields after successful creation
      resetGroupForms();

      await fetchUserGroups();

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

  const createGroup = async (params: CreateGroupParams): Promise<Group> => {
    try {
      if (!userDetails?.id) {
        throw new Error("User not authenticated");
      }

      const newGroupCode = generateGroupCode();
      const memberIds = [userDetails.id];
      const leaderId = userDetails.id;

      const { data, error } = await supabase
        .from("groups")
        .insert({
          group_name: params.group_name,
          group_description: params.group_description || null,
          group_code: newGroupCode,
          group_type: params.group_type,
          destination: params.destination || null,
          leader_id: leaderId,
          group_members: memberIds,
          created_by: params.created_by,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating group:", error);
        throw new Error(error.message || "Failed to create group");
      }

      console.log("Group created successfully:", data);

      await fetchUserGroups();

      return data;
    } catch (error) {
      console.error("Error in createGroup:", error);
      throw error;
    }
  };

  const joinGroup = async (code: string): Promise<Group> => {
    try {
      if (!userDetails?.id) {
        throw new Error("User not authenticated");
      }

      if (!code || code.trim().length !== 6) {
        throw new Error("Invalid group code");
      }

      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .select("*")
        .eq("group_code", code.toUpperCase())
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

      if (groupData.group_members.includes(userDetails.id)) {
        return groupData;
      }

      const updatedMembers = [...groupData.group_members, userDetails.id];

      const { error: updateError } = await supabase
        .from("groups")
        .update({ group_members: updatedMembers })
        .eq("group_id", groupData.group_id);

      if (updateError) {
        throw new Error(updateError.message || "Failed to join group");
      }

      await fetchUserGroups();

      return { ...groupData, group_members: updatedMembers };
    } catch (error: any) {
      console.error("Error joining group:", error);
      throw error;
    }
  };

  // Updated function to fetch destination details
  const fetchDestinationDetails = async (destinationId: number) => {
    try {
      // Fetch destination details including images array and primary_image
      const { data: destination, error: destError } = await supabase
        .from("destination")
        .select("*, images, primary_image") // Select images array and primary_image directly
        .eq("destination_id", destinationId)
        .single();

      if (destError) {
        console.error("Error fetching destination:", destError);
        throw new Error(destError.message);
      }

      if (!destination) {
        throw new Error("Destination not found");
      }

      // The images are already part of the destination object as an array
      // Optionally, structure the response to match the expected format
      return {
        ...destination,
        images: destination.images || [], // Ensure images is an array, default to empty if null
        primary_image: destination.primary_image || null, // Include primary_image
      };
    } catch (error) {
      console.error("Error in fetchDestinationDetails:", error);
      throw error;
    }
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
    destinationId,
    userGroups,
    isLoadingGroups,
    groupsError,
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
    setDestinationId,
    handleJoinGroup,
    handleCreateGroup,
    handleTypeChange,
    addMember,
    selectLeader,
    removeMember,
    getInitials,
    fetchUserGroups,
    refreshGroups,
    createGroup,
    joinGroup,
    fetchDestinationDetails,
    resetGroupForms,
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
