import { apiFetch, updateMyStatus } from "@/src/api/api";
import { initiatePersonalRollCall } from "@/src/api/groups";
import { UserStatus } from "@/src/components/StatusBadge";
import { Typography } from "@/src/components/typography";
import { useSyncSignal } from "@/src/hooks/useSyncSignal";
import { useAuthStore } from "@/src/store/authStore";
import { useLocationStore } from "@/src/store/locationStore";
import { theme } from "@/src/theme/theme";
import { useFocusEffect } from "expo-router";
import { useAnalytics } from "../../hooks/useAnalytics";

import { MemberProfileModal } from "@/src/components/dashboard/MemberProfileModal";
import { Circle, Member, MyAlertStatus } from "@/src/types";
import React, { useCallback, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AlertBanner } from "../../components/dashboard/AlertBanner";
import { DashboardHeader } from "../../components/dashboard/DashboardHeader";
import { GroupFilters } from "../../components/dashboard/GroupFilters";
import { MainStatusButton } from "../../components/dashboard/MainStatusButton";
import { MemberList } from "../../components/dashboard/MemberList";

// --- DashboardScreen ---
export default function DashboardScreen() {
  const { logEvent } = useAnalytics();
  const user = useAuthStore((s) => s.user);
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

  const fetchGroups = useCallback(async () => {
    try {
      const data = await apiFetch("/groups", { method: "GET" });
      setGroups(data);
    } catch (error) {
      console.error("Error loading groups:", error);
    }
  }, []);

  const fetchMyAlertStatus = useCallback(async () => {
    try {
      const data = (await apiFetch("/alerts/status", { method: "GET" })) as MyAlertStatus;
      setMyAlertStatus(data);
    } catch (error) {
      console.error("Error loading alert status:", error);
    }
  }, []);

  const syncDashboardData = useCallback(() => {
    fetchGroups();
    fetchMyAlertStatus();
  }, [fetchGroups, fetchMyAlertStatus]);

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
    const sharedGroup = groups.find((g) => g.members.some((m) => m.id === selectedMember.id));
    return {
      canRollCall: !!sharedGroup,
      rollCallGroupId: sharedGroup?.id || null,
    };
  }, [selectedMember, groups, user]);

  const handleRollCall = async () => {
    if (!selectedMember || !rollCallGroupId) return;
    try {
      await initiatePersonalRollCall(rollCallGroupId, selectedMember.id);
      logEvent("initiate_personal_roll_call", { type: "individual" });
      Alert.alert("Успіх", "Запит на перекличку надіслано");
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
          <AlertBanner alert={myAlertStatus.alert} />
        ) : null}

        <MainStatusButton
          currentStatus={user?.status || "UNKNOWN"}
          onUpdateStatus={handleStatusUpdate}
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
