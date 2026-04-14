import { Button } from "@/src/components/Button";
import { Typography } from "@/src/components/typography";
import { theme } from "@/src/theme/theme";
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

const ONBOARDING_SCREEN_TEST_ID = "screen:onboarding:container";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const IS_COMPACT_HEIGHT = SCREEN_HEIGHT < 760;
const PAGE_HORIZONTAL_PADDING = 16;
const COPY_BLOCK_WIDTH = Math.min(361, SCREEN_WIDTH - PAGE_HORIZONTAL_PADDING * 2);
const COPY_BLOCK_MIN_HEIGHT = 150;
const SLIDE_TOP_PADDING = IS_COMPACT_HEIGHT ? 44 : 54;
const COPY_TO_ARTWORK_GAP = 24;
const PHONE_ART_WIDTH = 247;
const PHONE_ART_HEIGHT = 500;
const REFERENCE_SCREEN_WIDTH = 390;
const REFERENCE_PHONE_TOP = 247;
const REFERENCE_PHONE_LEFT = (REFERENCE_SCREEN_WIDTH - PHONE_ART_WIDTH) / 2;

const onboardingDecorations = {
  arrow1: require("@/src/assets/images/onboarding/Arrow 1.png"),
  arrow2: require("@/src/assets/images/onboarding/Arrow 2.png"),
  arrow22: require("@/src/assets/images/onboarding/Arrow 2-2.png"),
  arrow3: require("@/src/assets/images/onboarding/Arrow 3.png"),
  arrow32: require("@/src/assets/images/onboarding/Arrow 3-2.png"),
  sparkVector: require("@/src/assets/images/onboarding/Spark vector.png"),
  vector: require("@/src/assets/images/onboarding/Vector.png"),
} as const;

type SlideKey = "status" | "circles" | "circleDetails" | "rollCall" | "memberProfile";

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
    image: require("@/src/assets/images/onboarding/Main Screen mockup.png"),
    decorations: [
      createDecoration({
        key: "status-arrow",
        source: onboardingDecorations.arrow1,
        width: 90,
        height: 69,
        top: 438,
        left: 260,
        rotation: 0,
      }),
      createDecoration({
        key: "status-spark",
        source: onboardingDecorations.sparkVector,
        width: 34,
        height: 36,
        top: 711,
        left: 43,
        rotation: 0,
      }),
    ],
  },
  {
    key: "circles",
    title: "Створюй свої Кола",
    subtitle: "Додавай найближчих до нового або приєднуйся до існуючого кола за кодом",
    image: require("@/src/assets/images/onboarding/Circles mockup.png"),
    decorations: [
      createDecoration({
        key: "circles-arrow",
        source: onboardingDecorations.arrow2,
        width: 58,
        height: 97,
        top: 303,
        left: 290,
        rotation: 0,
      }),
      createDecoration({
        key: "circles-vector",
        source: onboardingDecorations.vector,
        width: 23,
        height: 17.5,
        top: 752,
        left: 185,
        rotation: 0,
      }),
    ],
  },
  {
    key: "circleDetails",
    title: "Будь в курсі безпеки\nблизьких",
    subtitle:
      "Запускай перекличку, відстежуй статуси учасників Кола та миттєво реагуй на сигнали тривоги",
    image: require("@/src/assets/images/onboarding/Circle Details mockup.png"),
    decorations: [
      createDecoration({
        key: "details-arrow",
        source: onboardingDecorations.arrow3,
        width: 67,
        height: 102,
        top: 286,
        left: 286,
        rotation: 0,
      }),
    ],
  },
  {
    key: "rollCall",
    title: "Перекличка одним\nдотиком",
    subtitle:
      "Не витрачай час на повідомлення кожному. Один тап - і все Коло отримає запит про стан безпеки",
    image: require("@/src/assets/images/onboarding/Circle Rollcall Request mockup.png"),
    decorations: [
      createDecoration({
        key: "rollcall-arrow",
        source: onboardingDecorations.arrow32,
        width: 86,
        height: 46.8,
        top: 487,
        left: 256,
        rotation: 0,
      }),
    ],
  },
  {
    key: "memberProfile",
    title: "Швидкий зв'язок з\nучасником",
    subtitle:
      "Надсилайте персональні повідомлення або миттєві запити статусу, щоб переконатися, що все гаразд",
    image: require("@/src/assets/images/onboarding/Member Profile Modal mockup.png"),
    decorations: [
      createDecoration({
        key: "member-arrow",
        source: onboardingDecorations.arrow22,
        width: 101,
        height: 48,
        top: 591,
        left: 46,
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
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "bottom"]}
      testID={ONBOARDING_SCREEN_TEST_ID}
      accessibilityLabel={ONBOARDING_SCREEN_TEST_ID}
    >
      <StatusBar style="dark" hidden />
      <View style={styles.container}>
        {!isAuthPage && (
          <View style={styles.skipRow}>
            <Button
              label="Пропустити"
              hierarchy="tertiary"
              size="small"
              shape="rectangle"
              onPress={handleSkipToAuth}
              style={styles.skipButton}
              testId="onboarding:close:button"
            />
          </View>
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
              pageCount={slides.length}
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
  skipRow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "flex-end",
    paddingHorizontal: theme.spacing[16],
    paddingTop: theme.spacing[6],
    zIndex: 10,
  },
  skipButton: {
    minHeight: 32,
    paddingHorizontal: theme.spacing[6],
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
    gap: 8,
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
