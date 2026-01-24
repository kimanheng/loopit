# LoopIt

LoopIt is a sustainable food marketplace mobile application built with React Native (Expo) and Convex. It connects businesses with surplus food to consumers who can purchase it at a discounted price, reducing food waste.

## Features

-   **Browse Stores**: Discover local businesses offering surplus food.
-   **Categories**: Filter by Meals, Baked Goods, Groceries, and Vegan options.
-   **Orders**: Reserve "Magic Bags" or specific items for pickup.
-   **Business Dashboard**: Businesses can manage their store profile, inventory, and view analytics.
-   **Localization**: Full support for English, Khmer, and Chinese.
-   **Favorites**: Save favorite stores for quick access.
-   **Map View**: Find stores near you using the integrated map.

## Tech Stack

-   **Frontend**: React Native, Expo, Expo Router
-   **Backend**: Convex (Real-time database and backend functions)
-   **Language**: TypeScript
-   **State Management**: React Context (Auth, Favorites, Language, Orders)
-   **Maps**: `react-native-maps`, `open-location-code`

## Prerequisites

-   Node.js (LTS recommended)
-   npm or yarn
-   Expo Go app on your mobile device (or Android Studio/Xcode for simulation)

## Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd LoopIt
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

## Backend Setup (Convex)

1.  Initialize Convex:
    ```bash
    npx convex dev
    ```
    This will set up your backend deployment and generate the necessary API types.

## Running the App

1.  Start the Expo development server:
    ```bash
    npx expo start
    ```

2.  Scan the QR code with:
    -   **Android**: Expo Go app.
    -   **iOS**: Camera app (if using Expo Go).

## Localization

The app supports multiple languages. Translation files and context are located in:
-   `context/LanguageContext.tsx`
-   `constants/Translations.ts`

## Folder Structure

-   `app/`: Expo Router pages and layouts.
-   `components/`: Reusable UI components.
-   `convex/`: Backend schema and functions.
-   `constants/`: App constants (Colors, Translations).
-   `context/`: React Context providers.
-   `utils/`: Utility functions.
