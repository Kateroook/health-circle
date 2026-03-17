import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Typography } from "@/src/components/typography";
import { theme } from "@/src/theme/theme";

interface DashboardHeaderProps {
  firstName?: string;
  coords: { latitude: number; longitude: number } | null;
  region: string | null;
  district: string | null;
  locationError: any;
  locationLoading: boolean;
  onUpdateLocation: () => void;
}

export const DashboardHeader = ({
  firstName,
  coords,
  region,
  district,
  locationError,
  locationLoading,
  onUpdateLocation,
}: DashboardHeaderProps) => {
  return (
    <View style={styles.container}>
      <Typography variant="h2" tone="primary" style={styles.greeting} numberOfLines={1}>
        Привіт, {firstName || "Користувач"}!
      </Typography>

      {coords ? (
        <View style={styles.locationInfo}>
          <Typography variant="caption" tone="secondary">
            Локація: {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
            {region ? ` (${region}${district ? `, ${district}` : ""})` : ""}
          </Typography>
        </View>
      ) : locationError ? (
        <Pressable onPress={onUpdateLocation} style={styles.locationInfo}>
          <Typography variant="caption" style={{ color: theme.colors.state.emergency }}>
            Помилка геолокації. Натисніть для повтору.
          </Typography>
        </Pressable>
      ) : locationLoading ? (
        <View style={styles.locationInfo}>
          <Typography variant="caption" tone="secondary">
            Визначаємо місцезнаходження...
          </Typography>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing[8],
  },
  greeting: {
    marginTop: theme.spacing[24],
    marginBottom: theme.spacing[8],
  },
  locationInfo: {
    marginBottom: theme.spacing[24],
    flexDirection: "row",
    alignItems: "center",
  },
});
