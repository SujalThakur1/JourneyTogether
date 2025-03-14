// import { createClient } from "@supabase/supabase-js";
// import axios from "axios";
// import { setTimeout as sleep } from "timers/promises";

// const supabaseUrl = "https://llzptnukpunhjomflmcs.supabase.co";
// const supabaseAnonKey =
//   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsenB0bnVrcHVuaGpvbWZsbWNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNDY5NTgsImV4cCI6MjA1NTkyMjk1OH0.8f0REMh_0XXwJbty13od9JTvJ5AWbtVd1um4KBo3bl4";
// const GOOGLE_API_KEY = "AIzaSyCsbZUOz1ridK9xRMBhyJylVrfV0lMma2g";

// if (!supabaseUrl || !supabaseAnonKey) {
//   throw new Error("Missing Supabase environment variables");
// }

// if (!GOOGLE_API_KEY) {
//   throw new Error("Missing GOOGLE_API_KEY environment variable");
// }

// // Create a separate Supabase client for the script without AsyncStorage
// const supabase = createClient(supabaseUrl, supabaseAnonKey);

// // Configuration
// const BATCH_SIZE = 50; // Process destinations in batches
// const CONCURRENT_REQUESTS = 10; // Number of concurrent API requests
// const RETRY_LIMIT = 3; // Number of retries for failed requests
// const RETRY_DELAY = 1000; // Delay between retries in ms

// interface GoogleImageItem {
//   link: string;
// }

// async function fetchImagesFromGoogle(destinationName: string) {
//   const placesApiKey = GOOGLE_API_KEY;
  
//   try {
//     // First, search for the place to get its placeId
//     const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(destinationName)}&inputtype=textquery&fields=place_id&key=${placesApiKey}`;
    
//     const searchResponse = await axios.get(searchUrl);
//     if (!searchResponse.data.candidates?.[0]?.place_id) {
//       console.log(`No place found for: ${destinationName}`);
//       return [];
//     }
    
//     const placeId = searchResponse.data.candidates[0].place_id;
    
//     // Then, get place details including photos
//     const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${placesApiKey}`;
    
//     const detailsResponse = await axios.get(detailsUrl);
//     const photos = detailsResponse.data.result?.photos || [];
    
//     // Get photo URLs for up to 5 photos
//     return photos.slice(0, 5).map((photo: { photo_reference: string }) => ({
//       image_url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${placesApiKey}`,
//       source: 'google_places'
//     }));
    
//   } catch (error: any) {
//     console.error(`Error fetching place photos for "${destinationName}":`, error.message);
//     return [];
//   }
// }

// interface Destination {
//   destination_id: number;
//   name: string;
// }

// interface ImageData {
//   image_url: string;
//   source: string;
// }

// async function processDestination(destination: Destination) {
//   console.log(`Processing images for destination: ${destination.name}`);

//   try {
//     // Check if destination already has images
//     const { data: existingImages, error: imageCheckError } = await supabase
//       .from("destinationimages")
//       .select("*")
//       .eq("destination_id", destination.destination_id);

//     if (imageCheckError) {
//       console.error(
//         `Error checking existing images for ${destination.name}:`,
//         imageCheckError
//       );
//       return;
//     }

//     if (existingImages && existingImages.length > 0) {
//       console.log(
//         `Destination ${destination.name} already has ${existingImages.length} images. Skipping.`
//       );
//       return;
//     }

//     // Try Google Images
//     let images = await fetchImagesFromGoogle(destination.name);

//     if (images.length === 0) {
//       console.log(`No images found for: ${destination.name}`);
//       return;
//     }

//     console.log(`Found ${images.length} images for ${destination.name}`);

//     // Add each image to the database
//     for (let i = 0; i < images.length; i++) {
//       const image = images[i];
//       const { error: insertError } = await supabase
//         .from("destinationimages")
//         .insert({
//           destination_id: destination.destination_id,
//           image_url: image.image_url,
//           is_primary: i === 0, // First image is primary
//           source: image.source,
//         });

//       if (insertError) {
//         console.error(
//           `Error adding image for ${destination.name}:`,
//           insertError.message
//         );
//       } else {
//         console.log(
//           `Added ${image.source} image #${i + 1} for ${destination.name}`
//         );
//       }
//     }
//   } catch (error: any) {
//     console.error(`Error processing ${destination.name}:`, error.message);
//   }
// }

// async function processBatch(destinations: Destination[], startIdx: number) {
//   const batch = destinations.slice(startIdx, startIdx + BATCH_SIZE);
//   if (batch.length === 0) return;

//   console.log(
//     `Processing batch starting at index ${startIdx} (${batch.length} destinations)`
//   );

//   // Process destinations concurrently in smaller chunks
//   for (let i = 0; i < batch.length; i += CONCURRENT_REQUESTS) {
//     const chunk = batch.slice(i, i + CONCURRENT_REQUESTS);
//     await Promise.all(
//       chunk.map((destination: Destination) => processDestination(destination))
//     );

//     // Small delay between chunks to avoid overwhelming APIs
//     if (i + CONCURRENT_REQUESTS < batch.length) {
//       await sleep(1000);
//     }
//   }
// }

// async function populateImages() {
//   try {
//     console.log("Starting image population process...");

//     // Get all destinations from the database
//     const { data: destinations, error: destError } = await supabase
//       .from("destinations")
//       .select("destination_id, name");

//     if (destError) {
//       console.error("Error fetching destinations:", destError);
//       return;
//     }

//     if (!destinations || destinations.length === 0) {
//       console.log("No destinations found in the database.");
//       return;
//     }

//     console.log(`Found ${destinations.length} destinations to process.`);

//     // Process destinations in batches
//     for (let i = 0; i < destinations.length; i += BATCH_SIZE) {
//       await processBatch(destinations, i);
//       console.log(
//         `Completed batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(
//           destinations.length / BATCH_SIZE
//         )}`
//       );
//     }

//     console.log("Image population completed successfully!");
//   } catch (error: any) {
//     console.error("Error populating images:", error);
//     if (error.response) {
//       console.error("API Error Response:", error.response.data);
//     }
//   }
// }

// // Check environment variables
// console.log("Environment variables check:");
// console.log("Supabase URL exists:", !!process.env.EXPO_PUBLIC_SUPABASE_URL);
// console.log(
//   "Supabase Anon Key exists:",
//   !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
// );
// console.log("Google API Key exists:", !!process.env.API);

// // Execute the population
// populateImages();
