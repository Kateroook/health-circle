import { apiFetch, initiatePersonalRollCall, updateMyStatus } from "@/src/api/api";
import { setContactAlias } from "@/src/api/contacts";
import { blockUser } from "@/src/api/groups";
import { UserStatus } from "@/src/components/StatusBadge";
import { Typography } from "@/src/components/typography";
import { useSyncSignal } from "@/src/hooks/useSyncSignal";
import { useAuthStore } from "@/src/store/authStore";
import { useLocationStore } from "@/src/store/locationStore";
import { theme } from "@/src/theme/theme";
import { ScreenIds } from "@/src/utils/testIDs";
import { useFocusEffect } from "expo-router";
import { useAnalytics } from "../../hooks/useAnalytics";
import { useLoadingState } from "../../hooks/useLoadingState";
import { useToast } from "../../hooks/useToast";

import { MemberProfileModal } from "@/src/components/dashboard/MemberProfileModal";
import { DashboardSkeleton } from "@/src/components/skeleton";
import { Circle, Member, MyAlertStatus } from "@/src/types";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AlertBanner } from "../../components/dashboard/AlertBanner";
import { DashboardHeader } from "../../components/dashboard/DashboardHeader";
import { GroupFilters } from "../../components/dashboard/GroupFilters";
import { MainStatusButton } from "../../components/dashboard/MainStatusButton";
import { MemberList } from "../../components/dashboard/MemberList";

// --- DashboardScreen ---
export default function DashboardScreen() {
  const { loading, withLoading } = useLoadingState(true);
  const { showToast } = useToast();
  const { logEvent } = useAnalytics();
  const user = useAuthStore((s) => s.user);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [groups, setGroups] = useState<Circle[]>([]);
  const [myAlertStatus, setMyAlertStatus] = useState<MyAlertStatus | null>(null);
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

  /** Only the first load toggles `loading` / skeleton; refetches stay silent (avoids flicker from focus + Firestore sync). */
  const hasLoadedGroupsOnceRef = useRef(false);

  const fetchGroups = useCallback(async () => {
    if (!hasLoadedGroupsOnceRef.current) {
      try {
        await withLoading(async () => {
          const data = await apiFetch("/groups", { method: "GET" });
          setGroups(data);
        });
      } finally {
        hasLoadedGroupsOnceRef.current = true;
      }
      return;
    }
    try {
      const data = await apiFetch("/groups", { method: "GET" });
      setGroups(data);
    } catch (error) {
      console.error("Error loading groups:", error);
    }
  }, [withLoading]);

  const fetchMyAlertStatus = useCallback(async () => {
    try {
      const data = (await apiFetch("/alerts/status", { method: "GET" })) as MyAlertStatus;
      setMyAlertStatus(data);
    } catch (error) {
      console.error("Error loading alert status:", error);
    }
  }, []);

  const syncDashboardData = useCallback(() => {
    void Promise.all([refreshProfile(), fetchGroups(), fetchMyAlertStatus()]);
  }, [fetchGroups, fetchMyAlertStatus, refreshProfile]);

  useSyncSignal(syncDashboardData);

  useFocusEffect(
    useCallback(() => {
      syncDashboardData();
    }, [syncDashboardData]),
  );

  const handleStatusUpdate = async (newStatus: UserStatus) => {
    try {
      await updateMyStatus(newStatus);
      logEvent("update_status", { status: newStatus });
      updateUser({ status: newStatus as any });
      if (newStatus === "SAFE") {
        showToast({ type: "success", title: "Статус: у безпеці", compact: true });
      } else if (newStatus === "DANGER") {
        showToast({
          type: "warning",
          title: "Сигнал надіслано",
          subtitle: "Учасники ваших кіл отримали сповіщення",
        });
      } else {
        showToast({ type: "success", title: "Статус оновлено", compact: true });
      }
    } catch (e) {
      showToast({
        type: "error",
        title: "Помилка",
        subtitle: "Не вдалося оновити статус. Перевірте інтернет.",
      });
    }
  };

  const { canRollCall, isOwner, blockGroupId } = useMemo(() => {
    if (!selectedMember || !user) return { canRollCall: false, isOwner: false, blockGroupId: null };
    const sharedGroup = groups.find((g) => g.members.some((m) => m.id === selectedMember.id));
    return {
      canRollCall: !!sharedGroup,
      isOwner: sharedGroup?.owner.id === user.id,
      blockGroupId: sharedGroup?.id || null,
    };
  }, [selectedMember, groups, user]);

  const handleRollCall = async () => {
    if (!selectedMember) return;
    try {
      await initiatePersonalRollCall(selectedMember.id);
      logEvent("initiate_personal_roll_call", { type: "individual" });
      syncDashboardData(); // Refresh data to show updated rollcall status
      showToast({ type: "success", title: "Запит на перекличку надіслано" });
    } catch {
      showToast({
        type: "error",
        title: "Помилка",
        subtitle: "Не вдалося надіслати запит",
      });
    }
  };

  const handleBlock = async () => {
    if (!selectedMember || !blockGroupId) return;
    try {
      await blockUser(blockGroupId, selectedMember.id);
      logEvent("block_user");
      syncDashboardData();
      handleCloseModal();
      showToast({ type: "success", title: "Користувача заблоковано" });
    } catch {
      showToast({
        type: "error",
        title: "Помилка",
        subtitle: "Не вдалося заблокувати користувача",
      });
    }
  };

  const handleRename = async (newName: string) => {
    if (!selectedMember) return;
    try {
      await setContactAlias(selectedMember.id, newName);
      logEvent("rename_member");
      syncDashboardData();
      handleCloseModal();
      showToast({ type: "success", title: "Ім'я оновлено" });
    } catch {
      showToast({
        type: "error",
        title: "Помилка",
        subtitle: "Не вдалося оновити ім'я",
      });
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
    <SafeAreaView
      style={styles.screen}
      edges={["top", "left", "right"]}
      testID={ScreenIds.dashboard}
      accessibilityLabel={ScreenIds.dashboard}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <DashboardHeader
          firstName={user?.firstName}
          coords={coords}
          region={region}
          district={district}
          locationError={locationError}
          locationLoading={locationLoading}
          onUpdateLocation={updateCurrentLocation}
        />

        {myAlertStatus?.active && myAlertStatus.alert ? (
          <AlertBanner alert={myAlertStatus.alert} testId="dashboard:activeAlert:banner" />
        ) : null}

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            <MainStatusButton
              currentStatus={user?.status || "UNKNOWN"}
              onUpdateStatus={handleStatusUpdate}
              testId="dashboard:mainStatus:button"
            />
            <View style={styles.statusCircleSection}>
              <Typography variant="subtitle2" tone="secondary" style={styles.sectionHeader}>
                СТАТУС КОЛА
              </Typography>

              <GroupFilters
                groups={groups}
                selectedGroupId={selectedGroupId}
                onSelectGroup={setSelectedGroupId}
              />

              <MemberList
                members={displayedMembers}
                hasGroups={groups.length > 0}
                onMemberPress={handleMemberPress}
              />
            </View>
          </>
        )}
      </ScrollView>

      <MemberProfileModal
        member={selectedMember}
        visible={modalVisible}
        onClose={handleCloseModal}
        onRollCall={handleRollCall}
        canRollCall={canRollCall}
        isOwner={isOwner}
        onBlock={isOwner ? handleBlock : undefined}
        onRename={handleRename}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing[16],
    paddingBottom: 140,
  },
  statusCircleSection: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius.xl,
    padding: theme.spacing[16],
    gap: theme.spacing[8],
  },
  sectionHeader: {
    marginBottom: theme.spacing[8],
    letterSpacing: 0.5,
  },
});
