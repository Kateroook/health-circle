import { Button } from "@/src/components/Button";
import { Typography } from "@/src/components/typography";
import { theme } from "@/src/theme/theme";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useRef, useState } from "react";
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
const PAGE_HORIZONTAL_PADDING = 16;
const COPY_BLOCK_WIDTH = Math.min(361, SCREEN_WIDTH - PAGE_HORIZONTAL_PADDING * 2);
const COPY_BLOCK_MIN_HEIGHT = 150;
const SLIDE_TOP_PADDING = IS_COMPACT_HEIGHT ? 48 : 58;
const COPY_TO_ARTWORK_GAP = 28;
const PHONE_ART_WIDTH = 247;
const PHONE_ART_HEIGHT = 500;
const REFERENCE_SCREEN_WIDTH = 390;
const REFERENCE_PHONE_TOP = 247;
const REFERENCE_PHONE_LEFT = (REFERENCE_SCREEN_WIDTH - PHONE_ART_WIDTH) / 2;

const onboardingDecorations = {
  arrowLeft: require("@/src/assets/images/onboarding/arrow-left.png"),
  arrowRight: require("@/src/assets/images/onboarding/arrow-right.png"),
  arrowUp: require("@/src/assets/images/onboarding/arrow-up.png"),
  burst: require("@/src/assets/images/onboarding/burst.png"),
  dashedLineDown: require("@/src/assets/images/onboarding/dashed-line-down.png"),
  dashedLine: require("@/src/assets/images/onboarding/dashed-line.png"),
  sparkles: require("@/src/assets/images/onboarding/sparkles.png"),
} as const;

type SlideKey = "status" | "mood" | "circles";

type SlideDecoration = {
  key: string;
  source: number;
  width: number;
  height: number;
  top: number;
  left: number;
  rotation: number;
};

type Slide = {
  key: SlideKey;
  title: string;
  subtitle: string;
  image: number;
  decorations: SlideDecoration[];
};

const roundToTenth = (value: number) => Math.round(value * 10) / 10;

const createDecoration = ({
  key,
  source,
  width,
  height,
  top,
  left,
  rotation,
}: Omit<SlideDecoration, "top" | "left"> & { top: number; left: number }): SlideDecoration => ({
  key,
  source,
  width: roundToTenth(width),
  height: roundToTenth(height),
  top: roundToTenth(top - REFERENCE_PHONE_TOP),
  left: roundToTenth(left - REFERENCE_PHONE_LEFT),
  rotation: roundToTenth(rotation),
});

const slides: Slide[] = [
  {
    key: "status",
    title: "Один дотик,\nі близькі знають",
    subtitle:
      "Познач, що з тобою все гаразд під час тривоги. Близькі миттєво отримають сповіщення, навіть без інтернету.",
    image: require("@/src/assets/images/onboarding/onbord-mob1.png"),
    decorations: [
      createDecoration({
        key: "status-arrow",
        source: onboardingDecorations.arrowLeft,
        width: 92,
        height: 86.5,
        top: 388,
        left: 252,
        rotation: 0,
      }),
      createDecoration({
        key: "status-dashed-line",
        source: onboardingDecorations.dashedLine,
        width: 35.5,
        height: 35.3,
        top: 727,
        left: 46,
        rotation: 0,
      }),
    ],
  },
  {
    key: "mood",
    title: "Відстежуй настрій",
    subtitle:
      "Зрозумій як твій настрій змінюється з часом, помічай важливі інсайти в собі та інших",
    image: require("@/src/assets/images/onboarding/onbord-mob2.png"),
    decorations: [
      createDecoration({
        key: "mood-arrow",
        source: onboardingDecorations.arrowRight,
        width: 96,
        height: 52.4,
        top: 485,
        left: 25,
        rotation: 0,
      }),
      createDecoration({
        key: "mood-left-sparkles",
        source: onboardingDecorations.sparkles,
        width: 73.6,
        height: 64.9,
        top: 344,
        left: 0,
        rotation: -24.9,
      }),
      createDecoration({
        key: "mood-right-sparkles",
        source: onboardingDecorations.sparkles,
        width: 87.8,
        height: 77.4,
        top: 321,
        left: 298.5,
        rotation: -174.6,
      }),
      createDecoration({
        key: "mood-burst-top",
        source: onboardingDecorations.burst,
        width: 15.9,
        height: 17.7,
        top: 317,
        left: 41,
        rotation: -2.3,
      }),
      createDecoration({
        key: "mood-burst-bottom",
        source: onboardingDecorations.burst,
        width: 15.9,
        height: 17.7,
        top: 335,
        left: 25,
        rotation: -2.3,
      }),
    ],
  },
  {
    key: "circles",
    title: "Створюй свої Кола",
    subtitle: "Додавай найближчих до нового або приєднуйся до існуючого кола за кодом",
    image: require("@/src/assets/images/onboarding/onbord-mob3.png"),
    decorations: [
      createDecoration({
        key: "circles-arrow",
        source: onboardingDecorations.arrowUp,
        width: 50,
        height: 83.6,
        top: 314.1,
        left: 295.5,
        rotation: 0,
      }),
      createDecoration({
        key: "circles-dashed-line",
        source: onboardingDecorations.dashedLineDown,
        width: 33.2,
        height: 33.2,
        top: 743,
        left: 153,
        rotation: 0,
      }),
    ],
  },
];

export default function OnboardingScreen() {
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const authPageIndex = slides.length;
  const pageCount = authPageIndex + 1;
  const isAuthPage = activeIndex === authPageIndex;

  const scrollToPage = (index: number) => {
    const nextIndex = Math.max(0, Math.min(index, pageCount - 1));
    scrollRef.current?.scrollTo({ x: nextIndex * SCREEN_WIDTH, animated: true });
    setActiveIndex(nextIndex);
  };

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(nextIndex);
  };

  const handleSkipToAuth = () => {
    scrollToPage(authPageIndex);
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
            testID="onboarding:close:button"
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
            <OnboardingSlidePage
              key={slide.key}
              slide={slide}
              index={index}
              activeIndex={activeIndex}
              pageCount={pageCount}
              onScrollToPage={scrollToPage}
            />
          ))}

          <OnboardingAuthPage onNavigate={handleNavigate} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function OnboardingSlidePage({
  slide,
  index,
  activeIndex,
  pageCount,
  onScrollToPage,
}: {
  slide: Slide;
  index: number;
  activeIndex: number;
  pageCount: number;
  onScrollToPage: (index: number) => void;
}) {
  return (
    <View style={styles.page}>
      <View style={styles.slideContent}>
        <View style={styles.copyBlock}>
          <Typography variant="h1" style={styles.centeredText}>
            {slide.title}
          </Typography>

          <Typography
            variant="subtitle1"
            weight="regular"
            tone="secondary"
            style={styles.centeredText}
          >
            {slide.subtitle}
          </Typography>
        </View>

        <View style={styles.artworkStage}>
          <View style={styles.phoneArtwork} pointerEvents="none">
            <Image source={slide.image} style={styles.onboardingImage} resizeMode="contain" />

            {slide.decorations.map((decoration) => (
              <Image
                key={decoration.key}
                source={decoration.source}
                style={[
                  styles.decoration,
                  {
                    width: decoration.width,
                    height: decoration.height,
                    top: decoration.top,
                    left: decoration.left,
                    transform: [{ rotate: `${decoration.rotation}deg` }],
                  },
                ]}
                resizeMode="contain"
              />
            ))}
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.tapActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Попередній слайд"
            disabled={index === 0}
            onPress={() => onScrollToPage(index - 1)}
            style={[styles.navTapZone, index === 0 && styles.navTapZoneDisabled]}
            testID="onboarding:prevSlide:button"
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Наступний слайд"
            onPress={() => onScrollToPage(index + 1)}
            style={styles.navTapZone}
            testID="onboarding:nextSlide:button"
          />
        </View>

        <PaginationDots count={pageCount} activeIndex={activeIndex} onDotPress={onScrollToPage} />
      </View>
    </View>
  );
}

function OnboardingAuthPage({
  onNavigate,
}: {
  onNavigate: (path: "/Register" | "/Login") => void;
}) {
  return (
    <View style={styles.page}>
      <View style={styles.authPage}>
        <View style={styles.authHero}>
          <Image
            source={require("@/src/assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <View style={styles.authCopy}>
            <Typography variant="h1" style={styles.centeredText}>
              Ласкаво просимо до HealthCircle
            </Typography>

            <Typography
              variant="subtitle1"
              weight="regular"
              tone="secondary"
              style={styles.centeredText}
            >
              Твій простір для зв&apos;язку і підтримки
            </Typography>
          </View>
        </View>

        <View style={styles.authButtons}>
          <Button
            label="Зареєструватися"
            onPress={() => onNavigate("/Register")}
            style={styles.authButton}
            testId="onboarding:register:button"
          />

          <Button
            label="Увійти"
            hierarchy="secondary"
            onPress={() => onNavigate("/Login")}
            style={styles.authButton}
            testId="onboarding:login:button"
          />
        </View>
      </View>
    </View>
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
    backgroundColor: theme.colors.background.secondary,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
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
    width: COPY_BLOCK_WIDTH,
    minHeight: COPY_BLOCK_MIN_HEIGHT,
    gap: 10,
    marginBottom: COPY_TO_ARTWORK_GAP,
  },
  centeredText: {
    textAlign: "center",
  },
  artworkStage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
    overflow: "visible",
  },
  phoneArtwork: {
    width: PHONE_ART_WIDTH,
    height: PHONE_ART_HEIGHT,
    position: "relative",
    overflow: "visible",
  },
  onboardingImage: {
    width: PHONE_ART_WIDTH,
    height: PHONE_ART_HEIGHT,
  },
  decoration: {
    position: "absolute",
  },
  footer: {
    paddingBottom: 8,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  pagination: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    width: 56,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.background.tertiary,
  },
  dotActive: {
    backgroundColor: theme.colors.content.secondary,
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
  },
  authCopy: {
    width: COPY_BLOCK_WIDTH,
    alignItems: "center",
    gap: theme.spacing[12],
  },
  logo: {
    width: 108,
    height: 108,
    marginBottom: theme.spacing[10],
  },
  authButtons: {
    width: COPY_BLOCK_WIDTH,
    gap: theme.spacing[10],
    alignSelf: "center",
  },
  authButton: {
    width: "100%",
  },
});
