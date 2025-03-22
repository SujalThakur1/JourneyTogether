# Journey - Group Travel Made Easy

Journey is a mobile application designed to simplify group travel coordination by allowing users to share real-time locations, discover destinations, and manage travel groups. Whether you're exploring a new city with friends or coordinating a family trip, Journey keeps everyone connected.

## App Screenshots

### Discover Screen

![Discover Screen](https://github.com/SujalThakur1/journey/raw/main/screenshots/discover.png)

Browse popular destinations categorized by Jungle, Beach, Mountain, and Water. Explore featured locations like the Butterfly Rainforest at the Florida Museum of Natural History or Kirstenbosch Botanical Garden, complete with ratings and location details. You can view a homepage photo, as well as detailed images and information for each destination when you click on them.

### Groups Management

![Groups Screen](https://github.com/SujalThakur1/journey/raw/main/screenshots/groups.png)

In the Groups Management section, you can view your current travel groups with details about group members and destinations, along with a map preview of your journey. To Join an Existing Group, simply enter the 6-digit group code provided by the group admin and join your friends' adventures. If you prefer to Create a New Group, you have two options: either travel to a specific destination as a group or follow a group member to stay together by following their lead.

### Travel History

![History Screen](https://github.com/SujalThakur1/journey/raw/main/screenshots/history.png)

Keep track of your saved places and past trips. Easily create new groups for favorite destinations or view detailed information about previously visited locations.

### User Settings

![Settings Screen](https://github.com/SujalThakur1/journey/raw/main/screenshots/settings.png)

Customize your app experience with appearance settings (Light/Dark/System modes), manage notification preferences, and control location sharing permissions.

### Live Location Sharing

![Map View](https://github.com/SujalThakur1/journey/raw/main/screenshots/map_view.png)

See the real-time location of all group members on an interactive map. View distance information showing how far members are from you and from the destination.

### Map Interaction

![Map Interaction](https://github.com/SujalThakur1/journey/raw/main/screenshots/map_interaction.png)

Add custom markers on the map using the "Tap anywhere on the map to add a marker" feature, helping you mark stop points or important locations along your journey. You can also create detailed waypoints with custom titles and descriptions to highlight key stops or locations for your travel companions.

### Group Members View

![Group Members](https://github.com/SujalThakur1/journey/raw/main/screenshots/group_members.png)

See all members in your group with their distance from the destination. The leader can add or remove group members, identify the group leader, and track everyone's progress toward the destination.

## Features

### 🗺️ Real-time Location Sharing

- Share your location with group members in real-time
- View the location of all group members on an interactive map
- Track distances between members and to destinations
- Add custom waypoints and markers to coordinate meetups

### 👥 Group Management

- Create travel groups with custom names and destinations
- Join existing groups using unique 6-digit codes
- Choose between "Travel to Destination" or "Follow Member" group types
- View group details including member count and leader

### 🔍 Destination Discovery

- Browse popular destinations by category (Jungle, Beach, Mountain, Water)
- View top-rated destinations with photos and ratings
- Get detailed location information including addresses
- Save favorite destinations for future trips

### 📋 Travel History

- Access your saved destinations
- View past trips and locations
- Quickly create new groups for favorite places
- View detailed information about previously visited locations

### ⚙️ Customization

- Toggle between Light and Dark mode
- Manage notification preferences
- Control location services permissions
- Customize profile settings and privacy options

## Technology Stack

- **Frontend**: React Native with Expo
- **Navigation**: Expo Router with file-based routing
- **Maps**: React Native Maps with Apple Maps integration
- **State Management**: React Context API
- **Authentication**: Supabase Auth
- **Database**: Supabase
- **Location Services**: Expo Location
- **Places API**: Google Places API
- **Storage**: AsyncStorage for local caching

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (for local development)

### Installation

1. Clone the repository

   ```bash
   git clone [https://github.com/SujalThakur1/JourneyTogether.git]
   cd JourneyTogether
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Set up environment variables
   Create a `.env` file in the root directory with the following variables:

   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   GOOGLE_PLACES_API_KEY=your_google_places_api_key
   ```

4. Start the development server

   ```bash
   npx expo start
   ```

5. Launch the app on your preferred platform:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan the QR code with Expo Go app on your physical device

## Project Structure

- `/app`: Main application screens organized by routing structure
- `/components`: Reusable UI components
- `/contexts`: React context providers for state management
- `/hooks`: Custom React hooks
- `/lib`: Utility functions and services
- `/types`: TypeScript type definitions
