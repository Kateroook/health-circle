import { ModalProvider } from "@/src/components/modal";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, StyleSheet, View } from "react-native";
import FlashMessage from "react-native-flash-message";
import { useAnalytics } from "../hooks/useAnalytics";
import { useFcmToken } from "../hooks/useFcmToken";
import { useLocation } from "../hooks/useLocation";
import { useAuthStore } from "../store/authStore";
import { theme } from "../theme/theme";

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

// ─── Custom Loader ────────────────────────────────────────────────────────────

function CustomLoader({ onFinish }: { onFinish: () => void }) {
  // Icon entrance
  const iconScale = useRef(new Animated.Value(0)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;

  // Title entrance
  const titleTranslateY = useRef(new Animated.Value(18)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;

  // Tagline entrance
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  // Dots (breathing pulse)
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  // Exit: whole screen fades + scales slightly up
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const screenScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Icon bounce-in
    Animated.sequence([
      Animated.parallel([
        Animated.spring(iconScale, {
          toValue: 1,
          tension: 60,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(iconOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // 2. Title slides up
      Animated.parallel([
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }),
      ]),
      // 3. Tagline fades in
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 4. Pulse dots
      startDotLoop();

      // 5. After a short pause, exit animation
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(screenOpacity, {
            toValue: 0,
            duration: 500,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(screenScale, {
            toValue: 1.06,
            duration: 500,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start(onFinish);
      }, 1400);
    });
  }, []);

  const pulseDot = (anim: Animated.Value, delay: number) =>
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0.3,
          duration: 500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

  const startDotLoop = () => {
    pulseDot(dot1, 0).start();
    pulseDot(dot2, 180).start();
    pulseDot(dot3, 360).start();
  };

  return (
    <Animated.View
      style={[styles.loaderRoot, { opacity: screenOpacity, transform: [{ scale: screenScale }] }]}
    >
      {/* Icon */}
      <Animated.View
        style={{
          opacity: iconOpacity,
          transform: [{ scale: iconScale }],
          marginBottom: 16,
        }}
      >
        <Image
          source={require("../assets/images/icon.png")}
          style={styles.icon}
          resizeMode="contain"
        />
      </Animated.View>

      {/* App name */}
      <Animated.Text
        style={[
          styles.appName,
          {
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }],
          },
        ]}
      >
        HealthCircle
      </Animated.Text>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        {/* твій простір для спокою */}
        завжди будьте на зв’язку з близькими
      </Animated.Text>

      {/* Breathing dots */}
      <View style={styles.dotsRow}>
        {[dot1, dot2, dot3].map((anim, i) => (
          <Animated.View key={i} style={[styles.dot, { opacity: anim }]} />
        ))}
      </View>
    </Animated.View>
  );
}

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default function RootLayout() {
  const [fontsLoaded, fontError] = useAppFonts();
  const { loading, user } = useAuthStore();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const hasCompletedOnboarding = useAuthStore((s) => s.hasCompletedOnboarding);

  const [loaderDone, setLoaderDone] = useState(false);

  useFcmToken();
  useLocation();
  const { setUserId, setUserProperties } = useAnalytics();

  useEffect(() => {
    if (user?.id) {
      setUserId(user.id);
      setUserProperties({
        status: user.status || "UNKNOWN",
        hasCompletedOnboarding: String(hasCompletedOnboarding),
      });
    } else {
      setUserId(null);
      setUserProperties({ status: null });
    }
  }, [user?.id, user?.status, hasCompletedOnboarding, setUserId, setUserProperties]);

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded && !loading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, loading]);

  // Show custom loader while fonts / auth are loading OR loader animation not done
  if (!fontsLoaded || loading || !loaderDone) {
    return <CustomLoader onFinish={() => setLoaderDone(true)} />;
  }

  return (
    <ModalProvider>
      <React.Fragment>
        <StatusBar style="auto" />
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const ACCENT = theme.colors.accent;
const BG = theme.colors.background.primary;
const TEXT_DARK = theme.colors.content.primary;
const TEXT_MUTED = theme.colors.content.secondary;

const styles = StyleSheet.create({
  loaderRoot: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
  },
  glowRing: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: ACCENT,
    opacity: 0.0,
  },
  icon: {
    width: 140,
    height: 140,
    borderRadius: 99,
  },
  appName: {
    fontFamily: "Montserrat-Bold",
    fontSize: 28,
    letterSpacing: 0.5,
    color: TEXT_DARK,
    marginBottom: 8,
  },
  tagline: {
    fontFamily: "Karla-Regular",
    fontSize: 14,
    color: TEXT_MUTED,
    letterSpacing: 0.3,
    marginBottom: 40,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: ACCENT,
  },
});
