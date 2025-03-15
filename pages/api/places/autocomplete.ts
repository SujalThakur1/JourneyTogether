import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { input } = req.query;

  if (!input || typeof input !== "string") {
    return res.status(400).json({ error: "Input parameter is required" });
  }

  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      input
    )}&types=geocode&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    console.log("Google API response:", data);

    return res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching from Google Places API:", error);
    return res.status(500).json({ error: "Failed to fetch suggestions" });
  }
}
