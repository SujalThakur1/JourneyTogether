# Journey - Group Travel Made Easy

Journey is a mobile application designed to simplify group travel planning and coordination. With real-time location sharing, destination discovery, and group management features, Journey keeps everyone on the same page during your adventures.

## Features

### 🗺️ Real-time Location Sharing

- Share your location with group members in real-time
- View the location of all group members on an interactive map
- Navigate to specific members with a single tap

![Real-time Location Sharing](https://github.com/SujalThakur1/JourneyTogether/blob/main/images/real_time_location_sharing.png)
[![Real-time Location Sharing](https://github.com/SujalThakur1/JourneyTogether/blob/main/images/real_time_location_sharing.png)](https://link.to/full_image_1)

### 👥 Group Management

- Create travel groups for specific destinations or to follow a leader
- Join existing groups using unique group codes
- Invite friends to join your travel groups
- Set group types: "Travel to Destination" or "Follow Member"

![Group Management](https://github.com/SujalThakur1/JourneyTogether/blob/main/images/group_management.png)
[![Group Management](https://github.com/SujalThakur1/JourneyTogether/blob/main/images/group_management.png)](https://link.to/full_image_2)

### 🔍 Destination Discovery

- Browse and search for popular destinations
- Filter destinations by categories
- View detailed information about each destination including ratings and images
- Add custom destinations using Google Places integration

![Destination Discovery](https://github.com/SujalThakur1/JourneyTogether/blob/main/images/destination_discovery.png)
[![Destination Discovery](https://github.com/SujalThakur1/JourneyTogether/blob/main/images/destination_discovery.png)](https://link.to/full_image_3)

### 📱 User-Friendly Interface

- Intuitive navigation with tab-based layout
- Dark/Light mode support
- Real-time notifications
- Clean, modern UI design

![User Interface](https://github.com/SujalThakur1/JourneyTogether/blob/main/images/user_interface.png)
[![User Interface](https://github.com/SujalThakur1/JourneyTogether/blob/main/images/user_interface.png)](https://link.to/full_image_4)


## Technology Stack

- **Frontend**: React Native with Expo
- **Navigation**: Expo Router with file-based routing
- **Maps**: React Native Maps
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

## Features in Detail

### Authentication

The app provides a complete authentication system with:

- User registration
- Login
- Profile management
- Password reset

### Location Tracking

Users can:

- Enable/disable location tracking
- Share their location with group members
- View real-time locations of other group members
- Navigate to specific members

### Group Management

Create two types of groups:

1. **Travel to Destination**: All members navigate to a common destination
2. **Follow Member**: Members follow a designated leader

### Map Interface

The map view provides:

- Current locations of all group members
- Destination markers
- Navigation options
- Location history
