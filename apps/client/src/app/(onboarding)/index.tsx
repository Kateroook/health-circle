import { Button } from "@/src/components/Button";
import { Typography } from "@/src/components/typography";
import { theme } from "@/src/theme/theme";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../../store/authStore";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const IS_COMPACT_HEIGHT = SCREEN_HEIGHT < 760;
const IS_NARROW_SCREEN = SCREEN_WIDTH < 380;
const PAGE_HORIZONTAL_PADDING = IS_NARROW_SCREEN ? 22 : 24;
const SLIDE_TOP_PADDING = IS_COMPACT_HEIGHT ? 52 : 68;
const PHONE_SIZE_MULTIPLIER = 1.26;
const BASE_PHONE_ART_SIZE = Math.min(
  Math.max(SCREEN_WIDTH * (IS_COMPACT_HEIGHT ? 1.03 : 1.12), 352),
  430,
);
const PHONE_ART_SIZE = BASE_PHONE_ART_SIZE * PHONE_SIZE_MULTIPLIER;
const ART_STAGE_HEIGHT = Math.min(
  Math.max(SCREEN_HEIGHT * (IS_COMPACT_HEIGHT ? 0.7 : 0.74), 520),
  680,
);

type SlideKey = "status" | "mood" | "circles";

type Slide = {
  key: SlideKey;
  title: string;
  subtitle: string;
  image: number;
  titleMaxWidth: number;
  subtitleMaxWidth: number;
  imageScale: number;
  imageOffsetY: number;
  imageOffsetX?: number;
};

const slides: Slide[] = [
  {
    key: "status",
    title: "Один дотик,\nі близькі знають",
    subtitle:
      "Познач, що з тобою все гаразд під час тривоги. Близькі миттєво отримають сповіщення, навіть без інтернету.",
    image: require("@/src/assets/images/onboarding/onbord-mob1.png"),
    titleMaxWidth: 274,
    subtitleMaxWidth: 306,
    imageScale: 1.1,
    imageOffsetY: 16,
    imageOffsetX: -4,
  },
  {
    key: "mood",
    title: "Відстежуй настрій",
    subtitle:
      "Зрозумій як твій настрій змінюється з часом, помічай важливі інсайти в собі та інших",
    image: require("@/src/assets/images/onboarding/onbord-mob2.png"),
    titleMaxWidth: 300,
    subtitleMaxWidth: 314,
    imageScale: 1.12,
    imageOffsetY: 12,
  },
  {
    key: "circles",
    title: "Створюй свої Кола",
    subtitle: "Додавай найближчих до нового або приєднуйся до існуючого кола за кодом",
    image: require("@/src/assets/images/onboarding/onbord-mob3.png"),
    titleMaxWidth: 286,
    subtitleMaxWidth: 308,
    imageScale: 1.14,
    imageOffsetY: 8,
    imageOffsetX: 4,
  },
];

export default function OnboardingScreen() {
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const pages = useMemo(() => [...slides, { key: "auth", title: "", subtitle: "", image: 0 }], []);
  const isAuthPage = activeIndex === pages.length - 1;

  const scrollToPage = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    setActiveIndex(index);
  };

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(nextIndex);
  };

  const handleSkipToAuth = () => {
    scrollToPage(pages.length - 1);
  };

  const handleNavigate = (path: "/Register" | "/Login") => {
    completeOnboarding();
    router.push(path);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar style="dark" hidden />
      <View style={styles.container}>
        {!isAuthPage && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Закрити онбординг"
            onPress={handleSkipToAuth}
            style={styles.closeButton}
          >
            <Feather name="x" size={12} color={theme.colors.content.onColor} />
          </Pressable>
        )}

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onMomentumScrollEnd={handleMomentumEnd}
          contentContainerStyle={styles.scrollContent}
        >
          {slides.map((slide, index) => (
            <View key={slide.key} style={styles.page}>
              <View style={styles.slideContent}>
                <View style={styles.copyBlock}>
                  <Typography
                    variant="h1"
                    style={[styles.title, { maxWidth: slide.titleMaxWidth }]}
                  >
                    {slide.title}
                  </Typography>

                  <Typography
                    variant="subtitle1"
                    weight="regular"
                    tone="secondary"
                    style={[styles.subtitle, { maxWidth: slide.subtitleMaxWidth }]}
                  >
                    {slide.subtitle}
                  </Typography>
                </View>

                <View style={styles.artworkStage}>
                  <View style={styles.artworkCanvas}>
                    <Image
                      source={slide.image}
                      style={[
                        styles.onboardingImage,
                        {
                          transform: [
                            { translateX: slide.imageOffsetX ?? 0 },
                            { translateY: slide.imageOffsetY },
                            { scale: slide.imageScale },
                          ],
                        },
                      ]}
                      resizeMode="contain"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.footer}>
                <PaginationDots
                  count={pages.length}
                  activeIndex={activeIndex}
                  onDotPress={scrollToPage}
                />

                <View style={styles.tapActions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Попередній слайд"
                    disabled={index === 0}
                    onPress={() => scrollToPage(index - 1)}
                    style={[styles.navTapZone, index === 0 && styles.navTapZoneDisabled]}
                  />

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Наступний слайд"
                    onPress={() => scrollToPage(index + 1)}
                    style={styles.navTapZone}
                  />
                </View>
              </View>
            </View>
          ))}

          <View style={styles.page}>
            <View style={styles.authPage}>
              <View style={styles.authHero}>
                <Image
                  source={require("@/src/assets/images/icon.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />

                <Typography variant="h1" style={styles.authTitle}>
                  Ласкаво просимо до HealthCircle
                </Typography>

                <Typography
                  variant="subtitle1"
                  weight="regular"
                  tone="secondary"
                  style={styles.authSubtitle}
                >
                  Твій простір для зв&apos;язку і підтримки
                </Typography>
              </View>

              <View style={styles.authButtons}>
                <Button
                  label="Зареєструватися"
                  hierarchy="primary"
                  size="medium"
                  shape="rectangle"
                  onPress={() => handleNavigate("/Register")}
                  style={styles.authButton}
                />

                <Button
                  label="Увійти"
                  hierarchy="secondary"
                  size="medium"
                  shape="rectangle"
                  onPress={() => handleNavigate("/Login")}
                  style={styles.authButton}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function PaginationDots({
  count,
  activeIndex,
  onDotPress,
}: {
  count: number;
  activeIndex: number;
  onDotPress: (index: number) => void;
}) {
  return (
    <View style={styles.pagination}>
      {Array.from({ length: count }).map((_, index) => {
        const isActive = index === activeIndex;

        return (
          <Pressable
            key={index}
            accessibilityRole="button"
            accessibilityLabel={`Перейти до слайду ${index + 1}`}
            onPress={() => onDotPress(index)}
            style={[styles.dot, isActive && styles.dotActive]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
  },
  closeButton: {
    position: "absolute",
    top: IS_COMPACT_HEIGHT ? 10 : 14,
    right: 12,
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: "#1F2024",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingHorizontal: PAGE_HORIZONTAL_PADDING,
  },
  slideContent: {
    flex: 1,
    alignItems: "center",
    paddingTop: SLIDE_TOP_PADDING,
  },
  copyBlock: {
    alignItems: "center",
    width: "100%",
    gap: 10,
    marginBottom: IS_COMPACT_HEIGHT ? 16 : 22,
  },
  title: {
    textAlign: "center",
    color: theme.colors.content.primary,
    fontSize: IS_NARROW_SCREEN ? 25 : 27,
    lineHeight: IS_NARROW_SCREEN ? 31 : 34,
    letterSpacing: -0.7,
    marginBottom: 0,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 0,
    fontFamily: "Montserrat-Regular",
    fontSize: IS_NARROW_SCREEN ? 14 : 15,
    lineHeight: IS_NARROW_SCREEN ? 20 : 21,
    color: "#5C616B",
  },
  artworkStage: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: IS_COMPACT_HEIGHT ? 2 : 10,
  },
  artworkCanvas: {
    width: SCREEN_WIDTH + 24,
    maxWidth: 456,
    height: ART_STAGE_HEIGHT,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  onboardingImage: {
    width: PHONE_ART_SIZE,
    height: PHONE_ART_SIZE,
  },
  footer: {
    paddingBottom: IS_COMPACT_HEIGHT ? 14 : 18,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  pagination: {
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    justifyContent: "center",
    width: 56,
    marginBottom: 10,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "#D6DBE4",
  },
  dotActive: {
    backgroundColor: "#6D7581",
  },
  tapActions: {
    flexDirection: "row",
    width: 148,
    justifyContent: "space-between",
  },
  navTapZone: {
    width: 68,
    height: 28,
  },
  navTapZoneDisabled: {
    opacity: 0.35,
  },
  authPage: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: IS_COMPACT_HEIGHT ? 96 : 112,
    paddingBottom: theme.spacing[24],
    paddingHorizontal: theme.spacing[14],
  },
  authHero: {
    alignItems: "center",
    paddingHorizontal: theme.spacing[8],
  },
  logo: {
    width: 108,
    height: 108,
    marginBottom: theme.spacing[10],
  },
  authTitle: {
    textAlign: "center",
    fontSize: IS_NARROW_SCREEN ? 25 : 26,
    lineHeight: IS_NARROW_SCREEN ? 30 : 31,
    maxWidth: 310,
    marginBottom: theme.spacing[12],
  },
  authSubtitle: {
    textAlign: "center",
    fontFamily: "Montserrat-Regular",
    fontSize: IS_NARROW_SCREEN ? 14 : 15,
    lineHeight: IS_NARROW_SCREEN ? 20 : 21,
    marginBottom: 0,
  },
  authButtons: {
    width: "100%",
    gap: theme.spacing[10],
  },
  authButton: {
    width: "100%",
    borderRadius: 16,
  },
});
