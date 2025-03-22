import { Alert } from "react-native";

// Use the existing Google Maps API key from .env
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export interface PlaceDetails {
  description: string;
  activities: string[];
  bestTimeToVisit: string | null;
  averageCost: string | null;
  localTips: string[];
  difficulty: string | null;
  duration: string | null;
  rating: number;
  photos: string[];
  placeId?: string;
  address: string | null;
  website: string | null;
  openingHours: string[] | null;
  reviews:
    | {
        authorName: string;
        rating: number;
        text: string;
        time: number;
      }[]
    | null;
  priceLevel: number | null;
}

/**
 * Find a place ID for a destination by name and location
 */
export const findPlaceId = async (
  name: string,
  location: string
): Promise<string | null> => {
  try {
    // Create a search query combining name and location
    const query = encodeURIComponent(`${name} ${location}`);
    const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${query}&inputtype=textquery&fields=place_id&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (
      data.status !== "OK" ||
      !data.candidates ||
      data.candidates.length === 0
    ) {
      console.log("No place found for query:", query);
      return null;
    }

    return data.candidates[0].place_id;
  } catch (error) {
    console.error("Error finding place ID:", error);
    return null;
  }
};

/**
 * Fetch place details from Google Places API
 */
export const getPlaceDetails = async (
  placeId: string
): Promise<PlaceDetails | null> => {
  try {
    // First, fetch basic place details with more fields
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,formatted_address,photo,editorial_summary,price_level,review,formatted_phone_number,website,opening_hours,address_component,type&key=${GOOGLE_MAPS_API_KEY}`;

    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();

    if (detailsData.status !== "OK") {
      throw new Error(`Place details request failed: ${detailsData.status}`);
    }

    const place = detailsData.result;

    // Extract and process photos
    const photoReferences = place.photos
      ? place.photos.slice(0, 5).map((photo: any) => photo.photo_reference)
      : [];

    const photoUrls = photoReferences.map(
      (ref: string) =>
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1000&photoreference=${ref}&key=${GOOGLE_MAPS_API_KEY}`
    );

    // Process reviews
    const reviews = place.reviews
      ? place.reviews.map((review: any) => ({
          authorName: review.author_name,
          rating: review.rating,
          text: review.text,
          time: review.time,
        }))
      : null;

    // Extract keywords from reviews to create activity suggestions
    const reviewTexts = place.reviews
      ? place.reviews.map((review: any) => review.text).join(" ")
      : "";

    const commonActivities = extractActivities(
      reviewTexts,
      place.name,
      place.types
    );

    // Extract local tips from reviews
    const tips = place.reviews
      ? place.reviews
          .filter((review: any) => review.rating >= 4) // Only use positive reviews for tips
          .slice(0, 3)
          .map((review: any) => {
            const text =
              review.text.length > 120
                ? review.text.substring(0, 120) + "..."
                : review.text;
            return text;
          })
      : [];

    // Get opening hours if available
    const openingHours = place.opening_hours?.weekday_text || null;

    // Determine best time to visit based on types
    const bestTimeToVisit = determineBestTimeToVisit(place.types);

    // Determine difficulty based on place type
    const difficulty = determineDifficulty(place.types);

    // Determine visit duration based on rating, reviews, and place type
    const duration = suggestDuration(place.rating, place.types);

    // Determine average cost based on price_level if available
    const averageCost = determineAverageCost(place.price_level);

    // Compile the description
    const description =
      place.editorial_summary?.overview ||
      compileDescription(place, reviewTexts);

    return {
      description,
      activities: commonActivities,
      bestTimeToVisit,
      averageCost,
      localTips: tips,
      difficulty,
      duration,
      rating: place.rating || 0,

      photos: photoUrls,
      placeId,
      address: place.formatted_address || null,

      website: place.website || null,
      openingHours,
      reviews,
      priceLevel: place.price_level || null,
    };
  } catch (error) {
    console.error("Error fetching place details:", error);
    return null;
  }
};

/**
 * Get place details by destination name and location
 */
export const getPlaceDetailsByName = async (
  name: string,
  location: string
): Promise<PlaceDetails | null> => {
  try {
    const placeId = await findPlaceId(name, location);

    if (!placeId) {
      console.log(`Could not find place ID for ${name} in ${location}`);
      return null;
    }

    return getPlaceDetails(placeId);
  } catch (error) {
    console.error("Error getting place details by name:", error);
    return null;
  }
};

/**
 * Compile a description from place details
 */
const compileDescription = (place: any, reviewText: string): string => {
  let description = `${place.name} is a popular destination`;

  if (place.rating) {
    description += ` with a rating of ${place.rating}/5`;
    if (place.user_ratings_total) {
      description += ` based on ${place.user_ratings_total} reviews`;
    }
  }

  // Add place type information
  if (place.types && place.types.length > 0) {
    const readableTypes = place.types
      .filter(
        (type: string) =>
          !type.includes("_") &&
          type !== "point_of_interest" &&
          type !== "establishment"
      )
      .map((type: string) => type.replace(/_/g, " "));

    if (readableTypes.length > 0) {
      description += `. It's known as a ${readableTypes
        .slice(0, 2)
        .join(", ")}`;
    }
  }

  // Add location context if available
  if (place.formatted_address) {
    description += `. Located in ${place.formatted_address
      .split(",")
      .slice(0, 2)
      .join(",")}`;
  }

  description += ".";

  return description;
};

/**
 * Extract potential activities from review text and place types
 */
const extractActivities = (
  reviewText: string,
  placeName: string,
  placeTypes: string[] = []
): string[] => {
  // List of common travel activities
  const commonActivities = [
    "Hiking",
    "Photography",
    "Swimming",
    "Snorkeling",
    "Diving",
    "Shopping",
    "Sightseeing",
    "Cultural Tours",
    "Wildlife Watching",
    "Food Tours",
    "Wine Tasting",
    "Beach",
    "Museums",
    "Historical Sites",
    "Boat Tours",
    "Nature Walks",
    "Camping",
    "Fishing",
    "Cycling",
    "Local Cuisine",
    "Nightlife",
    "Spa",
    "Adventure",
    "Relaxation",
  ];

  // Add activities based on place types
  const typeBasedActivities: string[] = [];
  if (placeTypes) {
    if (placeTypes.includes("beach"))
      typeBasedActivities.push("Swimming", "Sunbathing", "Beach Walking");
    if (placeTypes.includes("natural_feature") || placeTypes.includes("park"))
      typeBasedActivities.push(
        "Nature Walks",
        "Photography",
        "Wildlife Watching"
      );
    if (placeTypes.includes("museum"))
      typeBasedActivities.push("Museum Tours", "Cultural Exploration");
    if (placeTypes.includes("restaurant") || placeTypes.includes("food"))
      typeBasedActivities.push("Food Tasting", "Local Cuisine");
    if (placeTypes.includes("historic"))
      typeBasedActivities.push("Historical Tours", "Cultural Exploration");
  }

  // Check which activities might be mentioned in the reviews
  const suggestedActivities = commonActivities.filter((activity) =>
    reviewText.toLowerCase().includes(activity.toLowerCase())
  );

  // Combine both lists and ensure uniqueness
  const allActivities = [
    ...new Set([...suggestedActivities, ...typeBasedActivities]),
  ];

  // If we couldn't extract at least 3 activities, add some generic ones
  if (allActivities.length < 3) {
    if (!allActivities.includes("Photography"))
      allActivities.push("Photography");
    if (!allActivities.includes("Local Cuisine"))
      allActivities.push("Local Cuisine");
    if (!allActivities.includes("Sightseeing"))
      allActivities.push("Sightseeing");
  }

  // Return up to 5 unique activities
  return allActivities.slice(0, 5);
};

/**
 * Determine best time to visit based on place types
 */
const determineBestTimeToVisit = (types: string[] = []): string | null => {
  if (!types || types.length === 0) return null;

  // Beach destinations
  if (types.includes("beach")) {
    return "Summer months (June to August) for warm weather";
  }

  // Mountain/hiking destinations
  if (types.includes("natural_feature") || types.includes("mountain")) {
    return "Spring (April to June) or Fall (September to October) for mild weather";
  }

  // Historical/cultural sites
  if (
    types.includes("museum") ||
    types.includes("church") ||
    types.includes("historic")
  ) {
    return "Shoulder seasons (Spring/Fall) to avoid crowds";
  }

  // Default for most places - avoid peak tourist seasons
  return "Spring (March to May) or Fall (September to November) for pleasant weather and fewer crowds";
};

/**
 * Determine difficulty level based on place type
 */
const determineDifficulty = (types: string[] = []): string | null => {
  if (!types || types.length === 0) return null;

  // Challenging destinations
  if (
    types.includes("mountain") ||
    types.some((type) => type.includes("wilderness"))
  ) {
    return "Challenging";
  }

  // Moderate difficulty destinations
  if (
    types.includes("natural_feature") ||
    types.includes("park") ||
    types.includes("campground")
  ) {
    return "Moderate";
  }

  // Easy destinations
  if (
    types.includes("museum") ||
    types.includes("restaurant") ||
    types.includes("lodging") ||
    types.includes("shopping_mall")
  ) {
    return "Easy";
  }

  return "Moderate"; // Default
};

/**
 * Suggest a duration based on place rating and type
 */
const suggestDuration = (
  rating: number,
  types: string[] = []
): string | null => {
  if (!rating && (!types || types.length === 0)) return null;

  // Adjust based on place type
  if (types) {
    // Major attractions usually need more time
    if (types.includes("amusement_park") || types.includes("national_park")) {
      return "2-3 days recommended";
    }

    // Cities often need more exploration time
    if (types.includes("locality") || types.includes("political")) {
      return "3-5 days recommended";
    }

    // Single attractions need less time
    if (
      types.includes("museum") ||
      types.includes("church") ||
      types.includes("point_of_interest")
    ) {
      return "1 day recommended";
    }
  }

  // Fall back to rating-based suggestion if type-based doesn't apply
  if (!rating || rating < 3) {
    return "1-2 days recommended";
  } else if (rating < 4) {
    return "2-3 days recommended";
  } else {
    return "3-5 days recommended";
  }
};

/**
 * Determine average cost based on Google's price_level
 */
const determineAverageCost = (
  priceLevel: number | undefined
): string | null => {
  if (priceLevel === undefined) return null;

  switch (priceLevel) {
    case 0:
      return "Under $30 per day";
    case 1:
      return "$30-60 per day";
    case 2:
      return "$60-100 per day";
    case 3:
      return "$100-200 per day";
    case 4:
      return "Over $200 per day";
    default:
      return null;
  }
};
