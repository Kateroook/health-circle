import { UserStatus } from "@/src/components/StatusBadge";
import { Typography } from "@/src/components/typography";
import { theme } from "@/src/theme/theme";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Animated, Pressable, StyleSheet, Vibration, View } from "react-native";

const VIDEO_SOURCE: Record<UserStatus, any> = {
  SAFE: require("@/src/assets/animations/status-safe.mp4"),
  DANGER: require("@/src/assets/animations/status-danger.mp4"),
  WAS_SAFE: require("@/src/assets/animations/status-safe.mp4"),
  UNKNOWN: require("@/src/assets/animations/status-idle.mp4"),
};

const STATUS_LABEL: Record<UserStatus, string> = {
  SAFE: "В безпеці",
  DANGER: "Потрібна допомога!",
  WAS_SAFE: "Був у безпеці",
  UNKNOWN: "Невідомо",
};

const BUTTON_SIZE = 236;

interface VideoLayerProps {
  source: any;
  opacity: Animated.Value;
}

const VideoLayer: React.FC<VideoLayerProps> = ({ source, opacity }) => {
  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]}>
      <VideoView
        player={player}
        style={[StyleSheet.absoluteFill, { transform: [{ scale: 1.05 }] }]}
        contentFit="cover"
        nativeControls={false}
      />
    </Animated.View>
  );
};

interface MainStatusButtonProps {
  currentStatus: UserStatus;
  onUpdateStatus: (s: UserStatus) => void;
}

export const MainStatusButton: React.FC<MainStatusButtonProps> = ({
  currentStatus,
  onUpdateStatus,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const transitionScale = useRef(new Animated.Value(1)).current;

  const [displayedStatus, setDisplayedStatus] = useState(currentStatus);
  const [previousStatus, setPreviousStatus] = useState<UserStatus | null>(null);
  const currentOpacity = useRef(new Animated.Value(1)).current;
  const previousOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (currentStatus === displayedStatus) return;

    setPreviousStatus(displayedStatus);
    previousOpacity.setValue(1);
    setDisplayedStatus(currentStatus);
    currentOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(currentOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(previousOpacity, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(transitionScale, {
          toValue: 0.97,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(transitionScale, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setPreviousStatus(null);
    });
  }, [currentStatus]);

  const handlePressIn = () => {
    Animated.timing(scale, {
      toValue: 0.96,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handleShortPress = () => {
    Vibration.vibrate(50);
    Alert.alert("Оновити статус?", "Ви повідомите іншим, що ви в безпеці.", [
      { text: "Скасувати", style: "cancel" },
      { text: "Так, я в безпеці", onPress: () => onUpdateStatus("SAFE") },
    ]);
  };

  const handleLongPress = () => {
    Vibration.vibrate([0, 100, 50, 100]);
    Alert.alert(
      "🆘 ПОТРІБНА ДОПОМОГА",
      "Ви збираєтесь відправити сигнал тривоги всім учасникам ваших кіл. Продовжити?",
      [
        { text: "Скасувати", style: "cancel" },
        {
          text: "ТАК, ПОТРІБНА ДОПОМОГА",
          style: "destructive",
          onPress: () => onUpdateStatus("DANGER"),
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handleShortPress}
        onLongPress={handleLongPress}
        delayLongPress={800}
      >
        {/* Outer clip wrapper — owns borderRadius clip, prevents iOS aliasing */}
        <View style={styles.clipWrapper}>
          <Animated.View
            style={[
              styles.button,
              {
                transform: [{ scale: Animated.multiply(scale, transitionScale) }],
              },
            ]}
          >
            {previousStatus && (
              <VideoLayer source={VIDEO_SOURCE[previousStatus]} opacity={previousOpacity} />
            )}
            <VideoLayer source={VIDEO_SOURCE[displayedStatus]} opacity={currentOpacity} />
            <Typography variant="h2" tone="onColor" style={styles.label}>
              {STATUS_LABEL[displayedStatus]}
            </Typography>
          </Animated.View>
        </View>
      </Pressable>

      <Typography variant="caption" tone="secondary" style={styles.helperText}>
        Натисніть — якщо в безпеці{"\n"}
        Затисніть — якщо потрібна допомога
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  clipWrapper: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    overflow: "hidden",
    backgroundColor: theme.colors.background.primary,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background.primary,
  },
  label: {
    textAlign: "center",
    paddingHorizontal: theme.spacing[16],
  },
  helperText: {
    textAlign: "center",
    marginTop: theme.spacing[8],
    marginBottom: theme.spacing[48],
  },
});
