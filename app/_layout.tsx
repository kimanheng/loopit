import { Stack } from "expo-router";
import { useFonts } from 'expo-font';
import { useEffect } from "react";
import * as SplashScreen from 'expo-splash-screen';
import { FavoritesProvider } from "../context/FavoritesContext";
import { OrdersProvider } from "../context/OrdersContext";
import { LanguageProvider } from "../context/LanguageContext";
import { AuthProvider } from "../context/AuthContext";
import { ConvexProvider, ConvexReactClient } from "convex/react";

SplashScreen.preventAutoHideAsync();

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'RecoletaBold': require('../assets/fonts/recoleta-bold.otf'), 
    'GoogleSans': require('../assets/fonts/GoogleSans-Regular.ttf'),
    'NotoSerifKhmer': require('../assets/fonts/NotoSerifKhmer-Bold.ttf'), // Placeholder until real files added
    'NotoSansKhmer': require('../assets/fonts/NotoSansKhmer-Regular.ttf'), // Placeholder until real files added
    'NotoSansSCBold': require('../assets/fonts/NotoSansSC-Bold.ttf'), // Placeholder for Chinese Bold
    'NotoSansSCRegular': require('../assets/fonts/NotoSansSC-Regular.ttf'), // Placeholder for Chinese Regular
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  return (
    <ConvexProvider client={convex}>
      <AuthProvider>
        <LanguageProvider>
          <OrdersProvider>
            <FavoritesProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="business-profile" options={{ headerShown: false }} />
                <Stack.Screen name="auth" options={{ headerShown: false }} />
                <Stack.Screen name="store/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="list" options={{ title: 'All Stores', headerShown: true, headerBackTitle: 'Back' }} />
                <Stack.Screen name="order-history" options={{ headerShown: false }} />
              </Stack>
            </FavoritesProvider>
          </OrdersProvider>
        </LanguageProvider>
      </AuthProvider>
    </ConvexProvider>
  );
}