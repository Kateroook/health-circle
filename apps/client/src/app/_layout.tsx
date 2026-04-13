import { ModalProvider } from "@/src/components/modal";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, StyleSheet, View } from "react-native";
import FlashMessage from "react-native-flash-message";
import { SafeAreaView } from "react-native-safe-area-context";
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

const TEXT_IN_MS = 300;
const EXIT_PAUSE_MIN_MS = 800;
const EXIT_PAUSE_MAX_MS = 1200;

function CustomLoader({
  fontsLoaded,
  authLoading,
  onFinish,
}: {
  fontsLoaded: boolean;
  authLoading: boolean;
  onFinish: () => void;
}) {
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const fontsLoadedRef = useRef(fontsLoaded);
  fontsLoadedRef.current = fontsLoaded;
  const authLoadingRef = useRef(authLoading);
  authLoadingRef.current = authLoading;

  const iconScale = useRef(new Animated.Value(0)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;

  const titleTranslateY = useRef(new Animated.Value(12)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(8)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  const screenOpacity = useRef(new Animated.Value(1)).current;
  const screenScale = useRef(new Animated.Value(1)).current;

  function pulseDot(anim: Animated.Value, delay: number) {
    return Animated.loop(
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
  }

  const textEntranceDoneRef = useRef(false);
  const exitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dotLoopsRef = useRef<ReturnType<typeof pulseDot>[]>([]);

  const scheduleExitIfReady = () => {
    if (!fontsLoadedRef.current || authLoadingRef.current || !textEntranceDoneRef.current) return;
    if (exitTimeoutRef.current !== null) return;

    const pauseMs =
      EXIT_PAUSE_MIN_MS + Math.round(Math.random() * (EXIT_PAUSE_MAX_MS - EXIT_PAUSE_MIN_MS));
    exitTimeoutRef.current = setTimeout(() => {
      exitTimeoutRef.current = null;
      Animated.parallel([
        Animated.timing(screenOpacity, {
          toValue: 0,
          duration: 550,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(screenScale, {
          toValue: 1.06,
          duration: 550,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => onFinishRef.current());
    }, pauseMs);
  };

  const scheduleExitIfReadyRef = useRef(scheduleExitIfReady);
  scheduleExitIfReadyRef.current = scheduleExitIfReady;

  useEffect(() => {
    let cancelled = false;

    Animated.parallel([
      Animated.spring(iconScale, {
        toValue: 1,
        tension: 60,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(iconOpacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished || cancelled) return;
      dotLoopsRef.current = [pulseDot(dot1, 0), pulseDot(dot2, 180), pulseDot(dot3, 360)];
      dotLoopsRef.current.forEach((l) => l.start());
    });

    return () => {
      cancelled = true;
      dotLoopsRef.current.forEach((l) => l.stop());
      dotLoopsRef.current = [];
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
        exitTimeoutRef.current = null;
      }
    };
  }, [dot1, dot2, dot3, iconOpacity, iconScale]);

  useEffect(() => {
    if (!fontsLoaded) return;

    let cancelled = false;

    titleTranslateY.setValue(12);
    titleOpacity.setValue(0);
    taglineTranslateY.setValue(8);
    taglineOpacity.setValue(0);
    textEntranceDoneRef.current = false;

    Animated.parallel([
      Animated.timing(titleTranslateY, {
        toValue: 0,
        duration: TEXT_IN_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: TEXT_IN_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(taglineTranslateY, {
        toValue: 0,
        duration: TEXT_IN_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: TEXT_IN_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished || cancelled) return;
      textEntranceDoneRef.current = true;
      scheduleExitIfReadyRef.current();
    });

    return () => {
      cancelled = true;
    };
  }, [fontsLoaded]);

  useEffect(() => {
    scheduleExitIfReadyRef.current();
  }, [fontsLoaded, authLoading]);

  return (
    <Animated.View
      style={[styles.loaderRoot, { opacity: screenOpacity, transform: [{ scale: screenScale }] }]}
    >
      <SafeAreaView style={styles.loaderSafe} edges={["top", "bottom"]}>
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

        <View style={styles.loaderTextColumn}>
          {fontsLoaded ? (
            <>
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
              <Animated.Text
                style={[
                  styles.tagline,
                  {
                    opacity: taglineOpacity,
                    transform: [{ translateY: taglineTranslateY }],
                  },
                ]}
              >
                {/* твій простір для спокою */}
                завжди будьте на зв’язку з близькими
              </Animated.Text>
            </>
          ) : null}
        </View>

        {/* Breathing dots */}
        <View style={styles.dotsRow}>
          {[dot1, dot2, dot3].map((anim, i) => (
            <Animated.View key={i} style={[styles.dot, { opacity: anim }]} />
          ))}
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default function RootLayout() {
  const [fontsLoaded, fontError] = useAppFonts();
  const { loading: authLoading, user } = useAuthStore();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const hasCompletedOnboarding = useAuthStore((s) => s.hasCompletedOnboarding);

  const [loaderDone, setLoaderDone] = useState(false);
  const handleLoaderFinish = useCallback(() => setLoaderDone(true), []);

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
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const showLoader = !loaderDone;

  if (showLoader) {
    return (
      <CustomLoader
        fontsLoaded={fontsLoaded}
        authLoading={authLoading}
        onFinish={handleLoaderFinish}
      />
    );
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
  },
  loaderSafe: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  loaderTextColumn: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    marginBottom: 40,
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
    textAlign: "center",
  },
  tagline: {
    fontFamily: "Karla-Regular",
    fontSize: 14,
    color: TEXT_MUTED,
    letterSpacing: 0.3,
    textAlign: "center",
    lineHeight: 22,
    width: "100%",
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
