import { AppState } from "react-native";
import { supabase } from "./supabase";

// Initialize auto-refresh handling
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
