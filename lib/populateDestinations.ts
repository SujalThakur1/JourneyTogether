// import { createClient } from "@supabase/supabase-js";
// import axios from "axios";
// import { setTimeout as sleep } from "timers/promises";

// // Configuration
// const MAX_RESULTS_PER_CATEGORY = 150;
// const MIN_RATING = 4.3;
// const API_RETRY_LIMIT = 5;
// const PAGE_TOKEN_DELAY = 2000;

// // List of country codes for global coverage (example subset)
// const COUNTRY_CODES = [
//   "us",
//   "gb",
//   "fr",
//   "de",
//   "it",
//   "es",
//   "jp",
//   "cn",
//   "in",
//   "br",
//   "au",
//   "ca",
//   "ru",
//   "za",
//   "mx",
// ];

// const supabase = createClient(
//   "https://llzptnukpunhjomflmcs.supabase.co",
//   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsenB0bnVrcHVuaGpvbWZsbWNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNDY5NTgsImV4cCI6MjA1NTkyMjk1OH0.8f0REMh_0XXwJbty13od9JTvJ5AWbtVd1um4KBo3bl4"
// );

// async function fetchCategories() {
//   const { data, error } = await supabase
//     .from("categories")
//     .select("category_id, name");

//   if (error) throw new Error(`Error fetching categories: ${error.message}`);
//   return data;
// }

// async function enhancedGoogleSearch(
//   categoryName: string,
//   region: string,
//   pageToken?: string
// ) {
//   const params = new URLSearchParams({
//     key: "AIzaSyCsbZUOz1ridK9xRMBhyJylVrfV0lMma2g",
//     language: "en",
//     region,
//     type: "tourist_attraction",
//     query: pageToken ? "" : `${categoryName} attractions in ${region}`,
//     rankby: "prominence",
//   });

//   if (pageToken) {
//     params.append("pagetoken", pageToken);
//   }

//   const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`;

//   let retries = API_RETRY_LIMIT;
//   while (retries > 0) {
//     try {
//       const response = await axios.get(url);
//       if (response.data.status === "OK") return response.data;
//       if (response.data.status === "NEXT_PAGE_TOKEN_INVALID") break;
//       throw new Error(`Google API error: ${response.data.status}`);
//     } catch (error) {
//       retries--;
//       if (retries === 0) throw error;
//       await sleep(1000 * (API_RETRY_LIMIT - retries)); // Exponential backoff
//     }
//   }
//   return null;
// }

// async function processCategory(
//   category: {
//     category_id: string;
//     name: string;
//   },
//   region: string
// ) {
//   console.log(`\nProcessing category: ${category.name} for region: ${region}`);

//   try {
//     let pageToken: string | undefined;
//     let resultCount = 0;
//     let uniquePlaces = new Set<string>();

//     do {
//       const data = await enhancedGoogleSearch(category.name, region, pageToken);
//       if (!data || data.status === "ZERO_RESULTS") {
//         console.log(`No results found for ${category.name} in ${region}`);
//         return;
//       }
//       if (!data.results) return;

//       for (const place of data.results) {
//         if (resultCount >= MAX_RESULTS_PER_CATEGORY) break;
//         if (uniquePlaces.has(place.place_id)) continue;

//         // Quality filters
//         if (
//           !place.geometry?.location ||
//           !place.name ||
//           (place.rating || 0) < MIN_RATING ||
//           (place.user_ratings_total || 0) < 500
//         )
//           continue;

//         try {
//           const { data: insertedData, error } = await supabase
//             .from("destinations")
//             .insert({
//               category_id: parseInt(category.category_id), // Convert to integer
//               name: place.name,
//               location: place.formatted_address,
//               latitude: place.geometry.location.lat,
//               longitude: place.geometry.location.lng,
//               rating: place.rating || 0,
//             });

//           if (error) {
//             console.error(`Insertion Error for ${place.name}:`, error);
//           } else {
//             uniquePlaces.add(place.place_id);
//             resultCount++;
//             console.log(`Successfully added: ${place.name} in ${region}`);
//           }
//         } catch (dbError) {
//           console.error(`DB Error for ${place.name}:`, dbError);
//         }
//       }

//       pageToken = data.next_page_token;
//       if (pageToken) {
//         console.log(`Waiting for next page token...`);
//         await sleep(PAGE_TOKEN_DELAY);
//       }
//     } while (pageToken && resultCount < MAX_RESULTS_PER_CATEGORY);
//   } catch (error) {
//     console.error(`Error processing ${category.name} in ${region}:`, error);
//     return;
//   }
// }

// async function populateDestinations() {
//   try {
//     const categories = await fetchCategories();
//     console.log(`Found ${categories.length} categories in database`);

//     for (const category of categories) {
//       for (const region of COUNTRY_CODES) {
//         await processCategory(category, region);
//         await sleep(1000); // Pause between regions to avoid rate limits
//       }
//     }

//     console.log("Global database population completed successfully!");
//   } catch (error) {
//     console.error("Main process error:", error);
//   }
// }

// // Execute the population
// populateDestinations();
