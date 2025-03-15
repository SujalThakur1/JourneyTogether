// contexts/AppContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { supabase } from "../lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import {
  UserLocation,
  getCurrentLocation,
  saveUserLocation,
  startLocationTracking,
  stopLocationTracking,
} from "../lib/locationService";

// Define cache keys for storing data in AsyncStorage
export const CACHE_KEYS = {
  DESTINATIONS: "cached_destinations",
  CATEGORIES: "cached_categories",
  CACHE_TIMESTAMP: "cache_timestamp",
  TOP_DESTINATIONS: "cached_top_destinations",
  ALL_DESTINATIONS: "all_destinations",
  // Added keys for users caching
  USERS: "cached_users", // Key for cached users data
  USERS_CACHE_TIMESTAMP: "users_cache_timestamp", // Key for users cache timestamp
};

// Cache durations
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds for other data
const USER_CACHE_DURATION = 24 * 60 * 60 * 1000; // 1 hour in milliseconds for users

// Define the context interface with added users and fetchAllUsers
interface AppContextType {
  userDetails: any | null;
  setUserDetails: (details: any) => void;
  categories: any[];
  setCategories: (categories: any[]) => void;
  destinations: any[];
  setDestinations: (destinations: any[]) => void;
  topDestinations: any[];
  setTopDestinations: (destinations: any[]) => void;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  selectedCategory: any | null;
  setSelectedCategory: (category: any | null) => void;
  userLoading: boolean;
  userUpdated: boolean;
  setUserUpdated: (updated: boolean) => void;
  userLocation: UserLocation | null;
  isTrackingLocation: boolean;
  startTrackingLocation: () => Promise<boolean>;
  stopTrackingLocation: () => void;
  updateLocation: () => Promise<void>;
  // Added properties for users
  users: any[]; // State to hold all users
  fetchAllUsers: () => Promise<void>; // Function to fetch users
  isUsersLoading: boolean;
  usersError: string | null;
  hasAttemptedFetch: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Existing state variables
  const [userDetails, setUserDetails] = useState<any | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [allDestinations, setAllDestinations] = useState<any[]>([]);
  const [allTopDestinations, setAllTopDestinations] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [topDestinations, setTopDestinations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [counter, setCounter] = useState(0);
  const [counter2, setCounter2] = useState(0);
  const [userLoading, setUserLoading] = useState(false);
  const [userUpdated, setUserUpdated] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [locationSubscription, setLocationSubscription] =
    useState<Location.LocationSubscription | null>(null);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

  // Added state for users
  const [users, setUsers] = useState<any[]>([]); // Holds the list of users

  // Check if the general cache (for destinations, etc.) is valid
  const isCacheValid = useCallback(async () => {
    const timestamp = await AsyncStorage.getItem(CACHE_KEYS.CACHE_TIMESTAMP);
    if (!timestamp) return false;
    return Date.now() - parseInt(timestamp) < CACHE_DURATION;
  }, []);

  // Check if the users cache is valid (within 1 hour)
  const isUsersCacheValid = useCallback(async () => {
    const timestamp = await AsyncStorage.getItem(
      CACHE_KEYS.USERS_CACHE_TIMESTAMP
    );
    if (!timestamp) return false;
    return Date.now() - parseInt(timestamp) < USER_CACHE_DURATION;
  }, []);

  // Function to fetch all users, with caching and optional force refresh
  const fetchAllUsers = useCallback(
    async (forceRefresh: boolean = false) => {
      // If already loading, don't start another fetch
      if (isUsersLoading) return;

      // Set loading state
      setIsUsersLoading(true);
      setUsersError(null);

      try {
        // Check cache first if not forcing refresh
        if (!forceRefresh) {
          const cachedUsers = await AsyncStorage.getItem(CACHE_KEYS.USERS);
          if (cachedUsers) {
            const parsedUsers = JSON.parse(cachedUsers);
            if (parsedUsers && parsedUsers.length > 0) {
              // console.log(
              //   "Using cached users data, count:",
              //   parsedUsers.length
              // );
              setUsers(parsedUsers);
              setHasAttemptedFetch(true);
              setIsUsersLoading(false);
              return;
            }
          }
        }

        // If we get here, we need to fetch from Supabase
        console.log("Fetching users from Supabase...");
        const { data, error } = await supabase.from("users").select("*");
        console.log("Fetching2 users from Supabase...");

        if (error) {
          console.error("Supabase fetch error:", error.message);
          throw new Error(`Failed to fetch users: ${error.message}`);
        }

        if (!data || data.length === 0) {
          console.log("No users returned from Supabase");
          setHasAttemptedFetch(true);
          return;
        }

        console.log(
          "Successfully fetched users from Supabase, count:",
          data.length
        );
        setUsers(data);

        // Update cache
        await AsyncStorage.setItem(CACHE_KEYS.USERS, JSON.stringify(data));
        await AsyncStorage.setItem(
          CACHE_KEYS.USERS_CACHE_TIMESTAMP,
          Date.now().toString()
        );

        setHasAttemptedFetch(true);
      } catch (error: any) {
        console.error("Error in fetchAllUsers:", error);
        setUsersError(error.message || "Failed to load users");
        setHasAttemptedFetch(true);
      } finally {
        setIsUsersLoading(false);
      }
    },
    [isUsersLoading]
  );

  // Existing fetchData function (unchanged, included for completeness)
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      if (await isCacheValid()) {
        const [cachedAllDest, cachedAllTop, cachedCat] = await Promise.all([
          AsyncStorage.getItem(CACHE_KEYS.ALL_DESTINATIONS),
          AsyncStorage.getItem(CACHE_KEYS.TOP_DESTINATIONS),
          AsyncStorage.getItem(CACHE_KEYS.CATEGORIES),
        ]);

        if (cachedAllDest && cachedAllTop && cachedCat) {
          const parsedAllDest = JSON.parse(cachedAllDest);
          const parsedAllTop = JSON.parse(cachedAllTop);
          const parsedCat = JSON.parse(cachedCat);

          setAllDestinations(parsedAllDest);
          setAllTopDestinations(parsedAllTop);
          setCategories(parsedCat);

          if (selectedCategory) {
            const filteredDest = parsedAllDest.filter(
              (dest: any) => dest.category_id === selectedCategory.category_id
            );
            const filteredTop = parsedAllTop.filter(
              (dest: any) => dest.category_id === selectedCategory.category_id
            );
            setDestinations(filteredDest);
            setTopDestinations(filteredTop);
          } else {
            setDestinations(parsedAllDest);
            setTopDestinations(parsedAllTop);
          }

          setInitialLoadComplete(true);
          return;
        }
      }

      const fetchCat = supabase
        .from("categories")
        .select("*")
        .then(({ data, error }) => {
          if (!error) {
            setCategories(data || []);
            AsyncStorage.setItem(
              CACHE_KEYS.CATEGORIES,
              JSON.stringify(data || [])
            );
          }
        });

      const fetchAllDest = supabase
        .from("tendestination")
        .select("*, categories(*)")
        .order("rating", { ascending: false })
        .then(({ data, error }) => {
          console.log("fetchDest1" + counter);
          setCounter((prevCounter) => prevCounter + 1); // Increment counter
          if (!error) {
            console.log("fetchDest2" + counter2);
            setCounter2((prevCounter2) => prevCounter2 + 1); // Increment counter
            const transformed = transformDestinations(data);
            setAllDestinations(transformed);
            AsyncStorage.setItem(
              CACHE_KEYS.ALL_DESTINATIONS,
              JSON.stringify(transformed)
            );
            if (selectedCategory) {
              const filtered = transformed.filter(
                (dest) => dest.category_id === selectedCategory.category_id
              );
              setDestinations(filtered);
            } else {
              setDestinations(transformed);
            }
          }
        });

      const fetchAllTop = supabase
        .from("topdestination")
        .select("*, categories(*)")
        .order("rating", { ascending: false })
        .then(({ data, error }) => {
          if (!error) {
            const transformed = transformDestinations(data);
            setAllTopDestinations(transformed);
            AsyncStorage.setItem(
              CACHE_KEYS.TOP_DESTINATIONS,
              JSON.stringify(transformed)
            );
            if (selectedCategory) {
              const filtered = transformed.filter(
                (dest) => dest.category_id === selectedCategory.category_id
              );
              setTopDestinations(filtered);
            } else {
              setTopDestinations(transformed);
            }
          }
        });

      await Promise.all([fetchCat, fetchAllDest, fetchAllTop]);
      await AsyncStorage.setItem(
        CACHE_KEYS.CACHE_TIMESTAMP,
        Date.now().toString()
      );
      setInitialLoadComplete(true);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory]);

  // Set up real-time subscription for users table changes
  useEffect(() => {
    // Create a channel to listen for changes in the users table
    const channel = supabase
      .channel("users_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        (payload) => {
          console.log("Change received in users table!", payload);
          // Force refresh users data when a change is detected
          fetchAllUsers(true);
        }
      )
      .subscribe();

    // Cleanup: Unsubscribe when the component unmounts
    return () => {
      channel.unsubscribe();
    };
  }, [fetchAllUsers]);

  // Fetch users initially when the provider mounts
  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  // Existing useEffect hooks (unchanged, included for completeness)
  useEffect(() => {
    if (selectedCategory && initialLoadComplete) {
      const filteredDestinations = allDestinations.filter(
        (dest) => dest.category_id === selectedCategory.category_id
      );
      setDestinations(filteredDestinations);

      const filteredTopDestinations = allTopDestinations.filter(
        (dest) => dest.category_id === selectedCategory.category_id
      );
      setTopDestinations(filteredTopDestinations);
    }
  }, [
    selectedCategory,
    allDestinations,
    allTopDestinations,
    initialLoadComplete,
  ]);

  const fetchUserDetails = async () => {
    try {
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const { user } = data;
      if (user) {
        const { data: userData, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();
        if (error) throw error;
        setUserDetails(userData);
      } else {
        setUserDetails(null);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      setUserDetails(null);
    } finally {
      setUserUpdated(false);
    }
  };

  useEffect(() => {
    if (userUpdated) {
      fetchUserDetails();
    }
  }, [userUpdated]);

  const transformDestinations = (data: any[]) => {
    return (
      data?.map((dest) => ({
        ...dest,
        destinationimages: [
          {
            image_id: 0,
            destination_id: dest.destination_id,
            image_url: dest.primary_image,
            is_primary: true,
          },
        ],
      })) || []
    );
  };

  const refreshData = useCallback(() => fetchData(), [fetchData]);

  useEffect(() => {
    const defaultCategory = categories.find(
      (c) => c.name.toLowerCase() === "jungle"
    );
    if (categories.length > 0 && defaultCategory && !selectedCategory) {
      setSelectedCategory(defaultCategory);
    }
  }, [categories, selectedCategory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateLocation = async () => {
    if (!userDetails?.id) return;
    const location = await getCurrentLocation();
    if (location) {
      setUserLocation(location);
      await saveUserLocation(userDetails.id, location);
    }
  };

  const startTrackingLocation = async (): Promise<boolean> => {
    if (!userDetails?.id) return false;
    const subscription = await startLocationTracking(
      userDetails.id,
      (location) => {
        setUserLocation(location);
      }
    );
    if (subscription) {
      setLocationSubscription(subscription);
      setIsTrackingLocation(true);
      return true;
    }
    return false;
  };

  const stopTrackingLocation = () => {
    stopLocationTracking(locationSubscription);
    setLocationSubscription(null);
    setIsTrackingLocation(false);
  };

  useEffect(() => {
    return () => {
      stopTrackingLocation();
    };
  }, []);

  // Updated context value with users and fetchAllUsers
  const value = {
    userDetails,
    setUserDetails,
    categories,
    setCategories,
    destinations,
    setDestinations,
    topDestinations,
    setTopDestinations,
    isLoading,
    refreshData,
    selectedCategory,
    setSelectedCategory,
    userLoading,
    userUpdated,
    setUserUpdated,
    userLocation,
    isTrackingLocation,
    startTrackingLocation,
    stopTrackingLocation,
    updateLocation,
    isUsersLoading,
    usersError,
    hasAttemptedFetch,
    users, // Provide users state to consumers
    fetchAllUsers, // Provide fetchAllUsers function to consumers
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
