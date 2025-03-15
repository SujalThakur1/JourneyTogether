// import { useState, useEffect, useRef } from "react";
// import { supabase } from "@/lib/supabase";
// import { useDebounce } from "@/hooks/useDebounce";
// import { Search } from "lucide-react";

// interface DestinationSearchProps {
//   onSearch: (query: string) => void;
// }

// export default function DestinationSearch({
//   onSearch,
// }: DestinationSearchProps) {
//   const [searchQuery, setSearchQuery] = useState("");
//   const [suggestions, setSuggestions] = useState<any[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const debouncedSearchQuery = useDebounce(searchQuery, 300);
//   const searchInputRef = useRef<HTMLInputElement>(null);

//   useEffect(() => {
//     if (debouncedSearchQuery.length > 2) {
//       fetchGoogleSuggestions(debouncedSearchQuery);
//     } else {
//       setSuggestions([]);
//     }
//   }, [debouncedSearchQuery]);

//   const fetchGoogleSuggestions = async (query: string) => {
//     setIsLoading(true);
//     try {
//       // Replace with your actual Google Places API endpoint
//       const response = await fetch(
//         `/api/places/autocomplete?input=${encodeURIComponent(query)}`
//       );
//       const data = await response.json();
//       console.log("Google API response:", data);

//       if (data.predictions) {
//         setSuggestions(data.predictions);
//       }
//     } catch (error) {
//       console.error("Error fetching suggestions:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleSearch = () => {
//     if (searchQuery.trim()) {
//       onSearch(searchQuery);
//     }
//   };

//   const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     if (e.key === "Enter") {
//       handleSearch();
//     }
//   };

//   const handleSuggestionClick = (suggestion: any) => {
//     setSearchQuery(suggestion.description);
//     setSuggestions([]);
//     onSearch(suggestion.description);
//   };

//   return (
//     <div className="relative w-full">
//       <div className="relative flex items-center">
//         <input
//           ref={searchInputRef}
//           type="text"
//           value={searchQuery}
//           onChange={(e) => setSearchQuery(e.target.value)}
//           onKeyDown={handleKeyDown}
//           placeholder="Search destinations..."
//           className="w-full p-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//         />
//         <button
//           onClick={handleSearch}
//           className="absolute right-2 text-gray-500 hover:text-gray-700"
//         >
//           <Search size={20} />
//         </button>
//       </div>

//       {suggestions.length > 0 && (
//         <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
//           {suggestions.map((suggestion, index) => (
//             <div
//               key={index}
//               className="p-2 hover:bg-gray-100 cursor-pointer"
//               onClick={() => handleSuggestionClick(suggestion)}
//             >
//               {suggestion.description}
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }
