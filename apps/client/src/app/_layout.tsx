import { ModalProvider } from "@/src/components/modal";
import { Typography } from "@/src/components/typography";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import FlashMessage from "react-native-flash-message";
import { useFcmToken } from "../hooks/useFcmToken";
import { useLocation } from "../hooks/useLocation";
import { useAuthStore } from "../store/authStore";

SplashScreen.preventAutoHideAsync();

const useAppFonts = () => {
  return useFonts({
    "Montserrat-Bold": require("../assets/fonts/Montserrat-Bold.ttf"),
    "Montserrat-SemiBold": require("../assets/fonts/Montserrat-SemiBold.ttf"),
    "Montserrat-Regular": require("../assets/fonts/Montserrat-Regular.ttf"),
    "Karla-Regular": require("../assets/fonts/Karla-Regular.ttf"),
    "Karla-SemiBold": require("../assets/fonts/Karla-SemiBold.ttf"),
    "Karla-Bold": require("../assets/fonts/Karla-Bold.ttf"),
  });
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useAppFonts();
  const { loading } = useAuthStore();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const hasCompletedOnboarding = useAuthStore((s) => s.hasCompletedOnboarding);

  useFcmToken();
  useLocation();

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded && !loading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, loading]);

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Typography variant="body2" tone="secondary" style={styles.loadingText}>
          Завантаження...
        </Typography>
      </View>
    );
  }

  return (
    <ModalProvider>
      <React.Fragment>
        <StatusBar style="auto"></StatusBar>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={isLoggedIn}>
            <Stack.Screen name="(tabs)" />
          </Stack.Protected>
          <Stack.Protected guard={!isLoggedIn && !hasCompletedOnboarding}>
            <Stack.Screen name="(onboarding)/index" />
          </Stack.Protected>
          <Stack.Screen name="(auth)" />
        </Stack>
        <FlashMessage position="top" />
      </React.Fragment>
    </ModalProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 10,
  },
});
