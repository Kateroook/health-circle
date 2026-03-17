import { apiFetch, updateMyStatus } from "@/src/api/api";
import { initiatePersonalRollCall } from "@/src/api/groups";
import { Avatar } from "@/src/components/Avatar";
import { Button } from "@/src/components/Button";
import { ListItem } from "@/src/components/ListItem";
import { STATUS_CONFIG, StatusBadge, UserStatus } from "@/src/components/StatusBadge";
import { Typography } from "@/src/components/typography";
import { useSyncSignal } from "@/src/hooks/useSyncSignal";
import { useAuthStore } from "@/src/store/authStore";
import { useLocationStore } from "@/src/store/locationStore";
import { theme } from "@/src/theme/theme";
import AntDesign from "@expo/vector-icons/build/AntDesign";
import { useAnalytics } from "../../hooks/useAnalytics";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Vibration, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  avatarUpdatedAt?: string;
  status: UserStatus;
  active: boolean;
}

interface Group {
  id: string;
  name: string;
  owner?: { id: string };
  members: Member[];
}

const PRIMARY_COLOR = theme.colors.accent;

// --- MainStatusIndicator ---
const MainStatusIndicator = ({
  currentStatus,
  onUpdateStatus,
}: {
  currentStatus: UserStatus;
  onUpdateStatus: (s: UserStatus) => void;
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const getBackgroundColor = () => {
    switch (currentStatus) {
      case "SAFE":
        return theme.colors.state.safe;
      case "DANGER":
        return theme.colors.state.emergency;
      case "WAS_SAFE":
        return theme.colors.state.safe; // Or a variation if we have a specific color for WAS_SAFE
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

// --- MemberProfileModal ---
const MemberProfileModal = ({
  member,
  visible,
  onClose,
  onRollCall,
  canRollCall,
}: {
  member: Member | null;
  visible: boolean;
  onClose: () => void;
  onRollCall: () => void;
  canRollCall: boolean;
}) => {
  if (!member) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={modalStyles.overlay} onPress={onClose}>
        <Pressable style={modalStyles.card} onPress={(e) => e.stopPropagation()}>
          {/* Close button */}
          <Button
            shape="round"
            hierarchy="tertiary"
            size="medium"
            leadingIcon={<AntDesign name="close" size={16} color={theme.colors.content.primary} />}
            onPress={onClose}
            style={{ alignSelf: "flex-start" }}
          />
          {/* Avatar */}
          <Avatar userId={member.id} avatarUpdatedAt={member.avatarUpdatedAt} size="xl" />

          {/* Name */}
          <Typography variant="h2" tone="primary" style={modalStyles.name}>
            {member.firstName} {member.lastName}
          </Typography>

          {/* Status row */}
          <StatusBadge variant="pill" status={member.status} />

          {/* Buttons — one under another */}
          <View style={modalStyles.buttonsColumn}>
            <Button
              label="Написати"
              hierarchy="secondary"
              shape="rectangle"
              size="medium"
              onPress={() => {}}
            />
            {canRollCall && (
              <Button
                label="Перекличка"
                hierarchy="secondary"
                shape="rectangle"
                size="medium"
                onPress={onRollCall}
              />
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// --- DashboardScreen ---
export default function DashboardScreen() {
  const { logEvent } = useAnalytics();
  const user = useAuthStore((s) => s.user);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("ALL");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const {
    coords,
    region,
    district,
    error: locationError,
    updateCurrentLocation,
    loading: locationLoading,
  } = useLocationStore();

  const fetchGroups = useCallback(async () => {
    try {
      const data = await apiFetch("/groups", { method: "GET" });
      setGroups(data);
    } catch (error) {
      console.error("Error loading groups:", error);
    }
  }, []);

  useSyncSignal(fetchGroups);

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [fetchGroups]),
  );

  const handleStatusUpdate = async (newStatus: UserStatus) => {
    try {
      await updateMyStatus(newStatus);
      logEvent("update_status", { status: newStatus });
      useAuthStore.setState((state) => {
        if (!state.user) return state;
        return { user: { ...state.user, status: newStatus as any } };
      });
    } catch (e) {
      Alert.alert("Помилка", "Не вдалося оновити статус. Перевірте інтернет.");
    }
  };

  const { canRollCall, rollCallGroupId } = useMemo(() => {
    if (!selectedMember || !user) return { canRollCall: false, rollCallGroupId: null };
    // Find a group where current user is owner AND selectedMember is a member
    const ownedGroup = groups.find(
      (g) => g.owner?.id === user.id && g.members.some((m) => m.id === selectedMember.id),
    );
    return {
      canRollCall: !!ownedGroup,
      rollCallGroupId: ownedGroup?.id || null,
    };
  }, [selectedMember, groups, user]);

  const handleRollCall = async () => {
    if (!selectedMember || !rollCallGroupId) return;
    try {
      await initiatePersonalRollCall(rollCallGroupId, selectedMember.id);
      logEvent("initiate_personal_roll_call", { type: "individual" });
      Alert.alert("Успіх", "Запит на перекличку надіслано");
      handleCloseModal();
    } catch (e) {
      Alert.alert("Помилка", "Не вдалося надіслати запит");
    }
  };

  const handleMemberPress = (member: Member) => {
    setSelectedMember(member);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedMember(null);
  };

  const displayedMembers = useMemo(() => {
    if (selectedGroupId === "ALL") {
      const allMembers: Member[] = [];
      const seenIds = new Set<string>();
      groups.forEach((g) => {
        g.members.forEach((m) => {
          if (m.id !== user?.id && !seenIds.has(m.id)) {
            seenIds.add(m.id);
            allMembers.push(m);
          }
        });
      });
      return allMembers;
    } else {
      const group = groups.find((g) => g.id === selectedGroupId);
      if (!group) return [];
      return group.members.filter((m) => m.id !== user?.id);
    }
  }, [groups, selectedGroupId, user?.id]);

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Typography variant="h2" tone="primary" style={styles.greeting} numberOfLines={1}>
          Привіт, {user?.firstName || "Користувач"}!
        </Typography>

        {coords ? (
          <View style={styles.locationInfo}>
            <Typography variant="caption" tone="secondary">
              Локація: {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
              {region ? ` (${region}${district ? `, ${district}` : ""})` : ""}
            </Typography>
          </View>
        ) : locationError ? (
          <Pressable onPress={updateCurrentLocation} style={styles.locationInfo}>
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

        <MainStatusIndicator
          currentStatus={user?.status || "UNKNOWN"}
          onUpdateStatus={handleStatusUpdate}
        />
        <View style={styles.statusCircleSection}>
          <Typography variant="subtitle2" tone="secondary" style={styles.sectionHeader}>
            СТАТУС КОЛА
          </Typography>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.statusFilters}
            contentContainerStyle={{ paddingRight: 16 }}
          >
            <Button
              label="Усі"
              hierarchy={selectedGroupId === "ALL" ? "primary" : "secondary"}
              shape="pill"
              size="small"
              onPress={() => setSelectedGroupId("ALL")}
              style={{ marginRight: theme.spacing[8] }}
            />

            {groups.map((group) => (
              <Button
                key={group.id}
                label={group.name}
                hierarchy={selectedGroupId === group.id ? "primary" : "secondary"}
                shape="pill"
                size="small"
                onPress={() => setSelectedGroupId(group.id)}
                style={{ marginRight: theme.spacing[8] }}
              />
            ))}
          </ScrollView>

          <View style={styles.contactList}>
            {displayedMembers.length === 0 ? (
              <View style={styles.emptyState}>
                <Typography variant="body2" tone="secondary" style={styles.emptyStateText}>
                  {groups.length === 0 ? "У вас ще немає кіл" : "Немає контактів у цьому колі"}
                </Typography>
              </View>
            ) : (
              displayedMembers.map((member) => (
                <ListItem
                  key={member.id}
                  layout="stateBadge"
                  artworkSize="small"
                  label={`${member.firstName} ${member.lastName}`}
                  subLabel={STATUS_CONFIG[member.status]?.label ?? "Невідомо"}
                  status={member.status}
                  onPress={() => handleMemberPress(member)}
                  renderAvatar={() => (
                    <Avatar userId={member.id} avatarUpdatedAt={member.avatarUpdatedAt} size="sm" />
                  )}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <MemberProfileModal
        member={selectedMember}
        visible={modalVisible}
        onClose={handleCloseModal}
        onRollCall={handleRollCall}
        canRollCall={canRollCall}
      />
    </SafeAreaView>
  );
}

// --- Stylesheets ---
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.background.overlay,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing[16],
  },
  card: {
    width: "100%",
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius.xl,
    paddingTop: theme.spacing[16],
    paddingBottom: theme.spacing[24],
    paddingHorizontal: theme.spacing[16],
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  name: {
    marginTop: theme.spacing[8],
    marginBottom: theme.spacing[16],
  },
  buttonsColumn: {
    width: "100%",
    marginTop: theme.spacing[32],
    gap: theme.spacing[8],
  },
  actionButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 50,
    backgroundColor: theme.colors.background.tertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    color: theme.colors.content.primary,
    fontSize: 15,
    fontWeight: "600",
  },
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing[16],
    paddingBottom: 140,
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
  statusCircleSection: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius.xl,
    padding: theme.spacing[16],
  },
  statusFilters: {
    flexDirection: "row",
    gap: theme.spacing[8],
  },
  sectionHeader: {
    marginBottom: theme.spacing[16],
    letterSpacing: 0.5,
  },
  contactList: {
    backgroundColor: theme.colors.background.secondary,
    minHeight: 50,
    marginTop: theme.spacing[8],
  },
  emptyState: {
    padding: theme.spacing[20],
    alignItems: "center",
  },
  emptyStateText: {
    color: theme.colors.content.secondary,
    fontStyle: "italic",
  },
});
