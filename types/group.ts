import { UserLocation } from "../lib/locationService";
import { DecodedPolyline } from "../lib/directionsService";

export interface Group {
  group_id: number;
  group_name: string;
  group_code: string;
  group_type: "TravelToDestination" | "FollowMember";
  destination_id: number | null;
  leader_id: string;
  group_members: string[];
  created_at: string;
  request?: RequestMember[];
}

export interface RequestMember {
  uuid: string;
  date: string;
  status: "pending" | "accepted" | "rejected";
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

export interface RouteInfo {
  polylineCoords: DecodedPolyline[];
  distance: string;
  duration: string;
  error: string | null;
}

export interface MemberRoute {
  memberId: string;
  destMemberId?: string; // For follow member mode
  route: RouteInfo;
}

export interface CustomMarker {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description: string;
  createdBy: string;
  createdAt: Date;
}

export interface JourneyState {
  isActive: boolean;
  startTime?: number;
  followedMemberId?: string;
  routes: MemberRoute[];
}
