import { Avatar } from "@/src/components/Avatar";
import { Button } from "@/src/components/Button";
import ConfirmationModal from "@/src/components/ConfirmationModal";
import { ListItem } from "@/src/components/ListItem";
import { Typography } from "@/src/components/typography";
import { theme } from "@/src/theme/theme";
import { ScreenIds } from "@/src/utils/testIDs";
import { Feather as Icon, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch } from "../../../api/api";
import { useToast } from "../../../hooks/useToast";
import { useAuthStore } from "../../../store/authStore";
import { useLocationStore } from "../../../store/locationStore";
import { cleanObj } from "../../../utils/clean.util";

export default function SettingsIndexScreen() {
  const { showToast } = useToast();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const { updateCurrentLocation, loading: locationLoading } = useLocationStore();

  const [isLogoutVisible, setIsLogoutVisible] = useState(false);

  // We rely on user store, no local component states for editing

  const handleLocationUpdate = async () => {
    if (locationLoading) return;
    try {
      const info = await updateCurrentLocation();
      if (info?.region || info?.district) {
        await apiFetch("/users", {
          method: "PUT",
          body: JSON.stringify(
            cleanObj({
              id: user?.id,
              region: info.region,
              district: info.district,
              ...(user?.alertRegionUid != null ? { alertRegionUid: user.alertRegionUid } : {}),
            }),
          ),
        });
        await refreshProfile();
      }
      showToast({ type: "success", title: "Геолокацію оновлено", compact: true });
    } catch (e: any) {
      if (e.message === "LOCATION_PERMISSION_DENIED") {
        showToast({
          type: "warning",
          title: "Доступ заборонено",
          subtitle: "Будь ласка, дозвольте доступ до геолокації в налаштуваннях пристрою.",
        });
      } else {
        showToast({
          type: "error",
          title: "Помилка",
          subtitle: "Не вдалося оновити геолокацію",
        });
      }
    }
  };

  const hasLocationData = user?.region || user?.district || user?.alertRegionName;

  return (
    <SafeAreaView
      style={styles.container}
      testID={ScreenIds.settings}
      accessibilityLabel={ScreenIds.settings}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <Avatar
            userId={user?.id ?? ""}
            avatarUpdatedAt={user?.avatarUpdatedAt}
            size="xl"
            showOuterRing={true}
          />

          <Typography variant="h2" tone="primary" style={styles.profileName}>
            {user?.firstName}
          </Typography>

          {hasLocationData && (
            <View style={styles.locationView}>
              <MaterialCommunityIcons
                name="map-marker"
                size={16}
                color={theme.colors.content.secondary}
              />
              <Typography variant="body2" tone="secondary">
                {user?.alertRegionName
                  ? user.alertRegionName
                  : [user?.region, user?.district].filter(Boolean).join(", ")}
              </Typography>
            </View>
          )}

          <Button
            label="Редагувати"
            hierarchy="accent"
            size="medium"
            shape="rectangle"
            leadingIcon={<Icon name="edit-2" size={18} color={theme.colors.content.onColor} />}
            onPress={() => router.push("/settings/edit-profile")}
            style={{ width: "100%", ...(hasLocationData ? {} : { marginTop: theme.spacing[16] }) }}
            testId="settings:editProfile:button"
          />
        </View>

        <View style={styles.settingsSection}>
          <ListItem
            layout="compact"
            artworkSize="small"
            label="Сповіщення"
            leadingIcon={
              <MaterialCommunityIcons name="bell" size={24} color={theme.colors.content.primary} />
            }
            onPress={() => router.push("/settings/notifications")}
            showDivider={false}
            testId="settings:notifications:button"
          />
        </View>

        <View style={styles.settingsSection}>
          <ListItem
            layout="compact"
            artworkSize="small"
            label="Приватність та безпека"
            leadingIcon={
              <MaterialCommunityIcons
                name="shield-lock"
                size={24}
                color={theme.colors.content.primary}
              />
            }
            onPress={() => router.push("/settings/security")}
            showDivider={false}
            testId="settings:security:button"
          />
        </View>

        <View style={styles.settingsSection}>
          <ListItem
            layout="compact"
            artworkSize="small"
            label={locationLoading ? "Оновлення..." : "Оновити геолокацію"}
            leadingIcon={
              <MaterialCommunityIcons
                name="map-marker-radius"
                size={24}
                color={theme.colors.content.primary}
              />
            }
            onPress={handleLocationUpdate}
            hideChevron={true}
            showDivider={false}
            testId="settings:updateLocation:button"
          />
        </View>

        <Button
          label="Вихід"
          hierarchy="tertiary"
          size="medium"
          shape="rectangle"
          leadingIcon={
            <MaterialCommunityIcons
              name="door-open"
              size={24}
              color={theme.colors.content.primary}
              style={{ marginRight: 12 }}
            />
          }
          onPress={() => setIsLogoutVisible(true)}
          style={[styles.logoutButton, { justifyContent: "flex-start" }]}
          testId="settings:logout:button"
        />
      </ScrollView>

      <ConfirmationModal
        isVisible={isLogoutVisible}
        onCancel={() => setIsLogoutVisible(false)}
        onConfirm={async () => {
          setIsLogoutVisible(false);
          logout();
        }}
        title="Вийти"
        message="Ти впевнений, що хочеш вийти?"
        confirmText="Вийти"
        cancelText="Назад"
        confirmStyle="default"
        testId="settings:logout:modal"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background.primary },
  scrollContent: { paddingHorizontal: theme.spacing[16], paddingBottom: 120 },
  headerContainer: {
    alignItems: "center",
    paddingTop: theme.spacing[20],
    paddingBottom: theme.spacing[32],
  },
  profileName: { marginTop: theme.spacing[8], marginBottom: theme.spacing[8], textAlign: "center" },
  locationView: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing[4],
    marginBottom: theme.spacing[32],
  },
  settingsSection: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    marginBottom: theme.spacing[8],
  },
  logoutButton: { marginTop: theme.spacing[8], backgroundColor: theme.colors.background.secondary },
});
