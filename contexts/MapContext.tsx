import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { Share } from "react-native";
import { supabase } from "../lib/supabase";
import { useApp } from "./AppContext";
import { useGroups } from "./GroupsContext";
import {
  getGroupMembersLocations,
  UserLocation,
  checkAndRequestLocationPermission,
} from "../lib/locationService";
import MapView from "react-native-maps";

// Define types
export interface Group {
  group_id: number;
  group_name: string;
  group_code: string;
  group_type: "TravelToDestination" | "FollowMember";
  destination_id: number | null;
  leader_id: string;
  group_members: string[];
  created_at: string;
}

export interface Destination {
  destination_id: number;
  name: string;
  latitude: number;
  longitude: number;
  image_url?: string;
}

export interface User {
  id: string;
  username: string;
  avatar_url?: string;
  email?: string;
}

export interface MemberWithLocation extends User {
  location?: UserLocation;
  isLeader?: boolean;
  isCurrentUser?: boolean;
}

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface MapContextType {
  group: Group | null;
  destination: Destination | null;
  leader: User | null;
  members: User[];
  membersWithLocations: MemberWithLocation[];
  loading: boolean;
  error: string | null;
  showMembersList: boolean;
  initialRegion: Region | null;
  mapRef: React.RefObject<MapView>;

  // Actions
  setShowMembersList: (show: boolean) => void;
  shareGroupCode: () => Promise<void>;
  getInitials: (name: string) => string;
  isUserMember: () => boolean;
  joinGroup: () => Promise<void>;
  fitToMarkers: () => void;
  navigateToMember: (member: MemberWithLocation) => void;

  // Init
  fetchGroupData: (code: string) => Promise<void>;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { userDetails, userLocation, startTrackingLocation } = useApp();
  const { fetchDestinationDetails, resetGroupForms } = useGroups();
  const mapRef = useRef<MapView>(null);

  // State
  const [group, setGroup] = useState<Group | null>(null);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [leader, setLeader] = useState<User | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [membersWithLocations, setMembersWithLocations] = useState<
    MemberWithLocation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMembersList, setShowMembersList] = useState(false);
  const [initialRegion, setInitialRegion] = useState<Region | null>(null);

  // Fetch group data
  const fetchGroupData = async (code: string) => {
    try {
      setLoading(true);

      if (!code) {
        setError("Group code is missing");
        setLoading(false);
        return;
      }

      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .select("*")
        .eq("group_code", code)
        .single();

      if (groupError) throw new Error(groupError.message);
      if (!groupData) {
        setError("Group not found");
        setLoading(false);
        return;
      }

      setGroup(groupData);

      if (groupData.destination_id) {
        try {
          const destinationData = await fetchDestinationDetails(
            groupData.destination_id
          );
          setDestination(destinationData);
        } catch (error) {
          console.error("Error fetching destination details:", error);
        }
      }

      const { data: leaderData, error: leaderError } = await supabase
        .from("users")
        .select("id, username, avatar_url, email")
        .eq("id", groupData.leader_id)
        .single();

      if (!leaderError && leaderData) setLeader(leaderData);

      if (groupData.group_members && groupData.group_members.length > 0) {
        const { data: membersData, error: membersError } = await supabase
          .from("users")
          .select("id, username, avatar_url, email")
          .in("id", groupData.group_members);

        if (!membersError && membersData) setMembers(membersData);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error fetching group data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load group data"
      );
      setLoading(false);
    }
  };

  // Fetch and update member locations
  useEffect(() => {
    if (!group || !members.length) return;

    const fetchMemberLocations = async () => {
      try {
        const memberIds = group.group_members;
        const locationsData = await getGroupMembersLocations(memberIds);

        const membersWithLoc = members.map((member) => ({
          ...member,
          location: locationsData[member.id],
          isLeader: member.id === group.leader_id,
          isCurrentUser: member.id === userDetails?.id,
        }));

        setMembersWithLocations(membersWithLoc);

        const validLocations = membersWithLoc.filter((m) => m.location);
        if (validLocations.length > 0) {
          if (destination) {
            setInitialRegion({
              latitude: destination.latitude,
              longitude: destination.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            });
          } else {
            const firstMember = validLocations[0];
            if (firstMember.location) {
              setInitialRegion({
                latitude: firstMember.location.latitude,
                longitude: firstMember.location.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              });
            }
          }
        } else if (userLocation) {
          setInitialRegion({
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        }
      } catch (error) {
        console.error("Error fetching member locations:", error);
      }
    };

    fetchMemberLocations();
    const intervalId = setInterval(fetchMemberLocations, 10000);
    return () => clearInterval(intervalId);
  }, [group, members, userLocation, destination]);

  // Helper functions
  const shareGroupCode = async () => {
    if (!group) return;
    try {
      await Share.share({
        message: `Join my group "${group.group_name}" with code: ${group.group_code}`,
      });
    } catch (error) {
      console.error("Error sharing group code:", error);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const isUserMember = () => {
    if (!group || !userDetails) return false;
    return group.group_members.includes(userDetails.id);
  };

  const joinGroup = async () => {
    if (!group || !userDetails) return;

    try {
      // Check location permission before joining group
      const hasLocationPermission = await checkAndRequestLocationPermission(
        // Success callback
        async () => {
          const updatedMembers = [...group.group_members, userDetails.id];
          const { error } = await supabase
            .from("groups")
            .update({ group_members: updatedMembers })
            .eq("group_id", group.group_id);

          if (error) throw error;

          setGroup({ ...group, group_members: updatedMembers });
          const { data: membersData } = await supabase
            .from("users")
            .select("id, username, avatar_url, email")
            .in("id", updatedMembers);

          if (membersData) setMembers(membersData);
          startTrackingLocation();

          // Reset group forms after successfully joining
          resetGroupForms();
        },
        // Cancel callback
        () => {
          console.log("User canceled location permission");
        }
      );

      // If permission check is handling the flow, we don't need to continue
      if (!hasLocationPermission) {
        return;
      }
    } catch (error) {
      console.error("Error joining group:", error);
    }
  };

  const fitToMarkers = () => {
    if (!mapRef.current || membersWithLocations.length === 0) return;
    const validMembers = membersWithLocations.filter((m) => m.location);
    if (validMembers.length === 0) return;

    const markers = validMembers
      .map((m) =>
        m.location
          ? { latitude: m.location.latitude, longitude: m.location.longitude }
          : null
      )
      .filter(Boolean) as { latitude: number; longitude: number }[];

    if (destination) {
      markers.push({
        latitude: destination.latitude,
        longitude: destination.longitude,
      });
    }

    mapRef.current.fitToCoordinates(markers, {
      edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
      animated: true,
    });
  };

  const navigateToMember = (member: MemberWithLocation) => {
    if (!mapRef.current || !member.location) return;

    mapRef.current.animateToRegion(
      {
        latitude: member.location.latitude,
        longitude: member.location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      1000
    );

    setShowMembersList(false);
  };

  return (
    <MapContext.Provider
      value={{
        group,
        destination,
        leader,
        members,
        membersWithLocations,
        loading,
        error,
        showMembersList,
        initialRegion,
        mapRef,
        setShowMembersList,
        shareGroupCode,
        getInitials,
        isUserMember,
        joinGroup,
        fitToMarkers,
        navigateToMember,
        fetchGroupData,
      }}
    >
      {children}
    </MapContext.Provider>
  );
};

export const useMap = () => {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error("useMap must be used within a MapProvider");
  }
  return context;
};
