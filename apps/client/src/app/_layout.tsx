import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useFcmToken } from "../hooks/useFcmToken";
import { useAuthStore } from "../store/authStore";

SplashScreen.preventAutoHideAsync();

const useAppFonts = () => {
  return useFonts({
    "Montserrat-Bold": require("../assets/fonts/Montserrat-Bold.ttf"),
    "Montserrat-SemiBold": require("../assets/fonts/Montserrat-SemiBold.ttf"),
    "Montserrat-Regular": require("../assets/fonts/Montserrat-Regular.ttf"),
  });
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useAppFonts();
  const { loading } = useAuthStore();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const hasCompletedOnboarding = useAuthStore((s) => s.hasCompletedOnboarding);

  useFcmToken();

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
        <Text style={styles.loadingText}>Завантаження...</Text>
      </View>
    );
  }

  return (
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
    </React.Fragment>
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
    fontSize: 16,
    color: "#666",
  },
});
