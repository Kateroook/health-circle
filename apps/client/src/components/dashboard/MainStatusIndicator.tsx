import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Vibration, View } from "react-native";
import { Typography } from "@/src/components/typography";
import { theme } from "@/src/theme/theme";
import { UserStatus } from "@/src/components/StatusBadge";

const PRIMARY_COLOR = theme.colors.accent;

interface MainStatusIndicatorProps {
  currentStatus: UserStatus;
  onUpdateStatus: (s: UserStatus) => void;
}

export const MainStatusIndicator = ({
  currentStatus,
  onUpdateStatus,
}: MainStatusIndicatorProps) => {
  const [isPressed, setIsPressed] = useState(false);

  const getBackgroundColor = () => {
    switch (currentStatus) {
      case "SAFE":
        return theme.colors.state.safe;
      case "DANGER":
        return theme.colors.state.emergency;
      case "WAS_SAFE":
        return theme.colors.state.safe;
      default:
        return PRIMARY_COLOR;
    }
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
    <View style={styles.mainStatusContainer}>
      <Pressable
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        onPress={handleShortPress}
        onLongPress={handleLongPress}
        delayLongPress={800}
        style={({ pressed }) => [
          styles.mainStatusGlowBackground,
          { backgroundColor: getBackgroundColor() },
          pressed && { transform: [{ scale: 0.96 }] },
        ]}
      >
        <Typography variant="h2" tone="onColor" style={styles.mainStatusText}>
          {currentStatus === "SAFE"
            ? "В безпеці"
            : currentStatus === "DANGER"
              ? "Потрібна допомога!"
              : currentStatus === "WAS_SAFE"
                ? "Був у безпеці"
                : "Невідомо"}
        </Typography>
      </Pressable>
      <Typography variant="caption" tone="secondary" style={styles.mainStatusHelperText}>
        Натисніть — якщо в безпеці{"\n"}
        Затисніть — якщо потрібна допомога
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  mainStatusContainer: {
    alignItems: "center",
    marginTop: theme.spacing[32],
    marginBottom: theme.spacing[40],
  },
  mainStatusGlowBackground: {
    width: 200,
    height: 200,
    borderRadius: theme.radius.circle,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 50,
    elevation: 10,
  },
  mainStatusText: {
    textAlign: "center",
  },
  mainStatusHelperText: {
    marginTop: theme.spacing[20],
    textAlign: "center",
  },
});
