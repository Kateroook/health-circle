import { apiFetch } from "@/src/api/api";
import { initiateRollCall } from "@/src/api/groups";
import { Button } from "@/src/components/Button";
import CircleActionsModal from "@/src/components/circle/actions/CircleActionsModal";
import { ConfirmRollCallModal } from "@/src/components/circle/actions/ConfirmRollCallModal";

import AddCircleModal from "@/src/components/circle/AddCircleModal";
import CircleItem from "@/src/components/circle/CircleItem";
import { MemberList } from "@/src/components/dashboard/MemberList";
import MemberDetailModal from "@/src/components/MemberDetailModal";
import { Typography } from "@/src/components/typography";
import { useSyncSignal } from "@/src/hooks/useSyncSignal";
import { useAuthStore } from "@/src/store/authStore";
import { theme } from "@/src/theme/theme";
import { Circle, Member } from "@/src/types";
import { AntDesign, Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";

import {
  Alert,
  BackHandler,
  Platform,
  ScrollView,
  StyleSheet,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function CirclesScreen() {
  const user = useAuthStore().user;

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isActionsVisible, setIsActionsVisible] = useState(false);
  const [activeCircle, setActiveCircle] = useState<Circle | null>(null);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [showCircleDetail, setShowCircleDetail] = useState(false);

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isMemberModalVisible, setIsMemberModalVisible] = useState(false);

  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const [isRollCallModalVisible, setIsRollCallModalVisible] = useState(false);

  useEffect(() => {
    if (activeCircle) {
      const updated = circles.find((c) => c.id === activeCircle.id);
      if (updated) setActiveCircle(updated);
    }
  }, [circles]);

  const fetchCircles = useCallback(async () => {
    try {
      const data = await apiFetch("/groups", { method: "GET" });
      const circlesWithStatus = data.map((circle: any) => ({
        ...circle,
        members: circle.members.map((m: any) => ({
          ...m,
          status: m.status || "UNKNOWN",
        })),
      }));
      setCircles(circlesWithStatus);
    } catch (error) {
      console.error("Error loading circles:", error);
    }
  }, []);

  useSyncSignal(fetchCircles);

  useFocusEffect(
    useCallback(() => {
      fetchCircles();
    }, [fetchCircles]),
  );

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isRenameModalVisible) {
        setIsRenameModalVisible(false);
        return true;
      }
      if (isAddModalVisible) {
        setIsAddModalVisible(false);
        return true;
      }
      if (isActionsVisible) {
        setIsActionsVisible(false);
        return true;
      }
      if (showCircleDetail) {
        setShowCircleDetail(false);
        setActiveCircle(null);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [isAddModalVisible, isActionsVisible, showCircleDetail, isRenameModalVisible]);

  function openActionsModal(circle: Circle | null) {
    setActiveCircle(circle);
    setIsActionsVisible(true);
  }

  function openCircleDetail(circle: Circle) {
    setActiveCircle(circle);
    setShowCircleDetail(true);
  }

  const isOwner = activeCircle && user?.id === activeCircle.owner.id;

  const handleLeave = () => {
    Alert.alert("Покинути коло?", "Ви впевнені?", [
      { text: "Скасувати", style: "cancel" },
      {
        text: "Покинути",
        style: "destructive",
        onPress: async () => {
          if (!activeCircle) return;
          try {
            await apiFetch(`/groups/${activeCircle.id}/leave`, { method: "POST" });
            setShowCircleDetail(false);
            fetchCircles();
          } catch {
            Alert.alert("Помилка", "Не вдалося покинути");
          }
        },
      },
    ]);
  };

  const handleRenameSubmit = async () => {
    if (!renameValue.trim() || !activeCircle) return;
    try {
      await apiFetch("/groups", {
        method: "PUT",
        body: JSON.stringify({ id: activeCircle.id, name: renameValue.trim() }),
      });
      setIsRenameModalVisible(false);
      fetchCircles();
    } catch {
      Alert.alert("Помилка", "Не вдалося перейменувати");
    }
  };

  const handleRollCall = () => {
    setIsRollCallModalVisible(true);
  };

  const handleRollCallConfirmed = async () => {
    if (!activeCircle) return;
    try {
      await initiateRollCall(activeCircle.id);
      Alert.alert("Успіх", "Перекличку розпочато");
      fetchCircles();
    } catch (error) {
      console.error("Failed to initiate roll call:", error);
      Alert.alert("Помилка", "Не вдалося розпочати перекличку");
    }
  };

  const unknownCount =
    activeCircle?.members.filter((m) => m.status === "UNKNOWN" || !m.status).length ?? 0;
  const safeCount = activeCircle?.members.filter((m) => m.status === "SAFE").length ?? 0;
  const wasSafeCount = activeCircle?.members.filter((m) => m.status === "WAS_SAFE").length ?? 0;

  return (
    <SafeAreaView style={styles.screen}>
      {/* Roll Call Modal  */}
      <ConfirmRollCallModal
        isVisible={isRollCallModalVisible}
        onCancel={() => setIsRollCallModalVisible(false)}
        onConfirm={async () => {
          setIsRollCallModalVisible(false);
          await handleRollCallConfirmed();
        }}
      />
      {showCircleDetail && activeCircle ? (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Button
              shape="round"
              hierarchy="tertiary"
              size="small"
              leadingIcon={
                <MaterialIcons
                  name="keyboard-arrow-left"
                  size={24}
                  color={theme.colors.content.primary}
                />
              }
              onPress={() => {
                setShowCircleDetail(false);
                setActiveCircle(null);
              }}
            />
            <View style={styles.detailTitleBlock}>
              <Typography variant="h1" tone="primary">
                {activeCircle.name}
              </Typography>
              {activeCircle.inviteCode && (
                <Button
                  label={`Код: ${activeCircle.inviteCode}`}
                  hierarchy="secondary"
                  shape="pill"
                  size="small"
                  trailingIcon={
                    <Ionicons name="copy" size={14} color={theme.colors.content.secondary} />
                  }
                  onPress={async () => {
                    await Clipboard.setStringAsync(activeCircle.inviteCode);
                  }}
                  style={{ alignSelf: "flex-start" }}
                />
              )}
            </View>
            <Button
              shape="round"
              hierarchy="accent"
              size="medium"
              leadingIcon={
                <MaterialIcons name="edit" size={20} color={theme.colors.content.onColor} />
              }
              onPress={() => setIsActionsVisible(true)}
            />
          </View>

          <ScrollView contentContainerStyle={styles.detailContent}>
            <View style={styles.statsCard}>
              <View style={styles.statsHeader}>
                <Typography variant="subtitle1">{activeCircle.members.length} учасників</Typography>
                <Button
                  label="Перекличка"
                  hierarchy="accent"
                  shape="pill"
                  size="small"
                  trailingIcon={
                    <Feather name="rss" size={16} color={theme.colors.content.onColor} />
                  }
                  onPress={handleRollCall}
                />
              </View>
              <Typography variant="body2">
                {unknownCount} не відповіли,{"\n"}
                {wasSafeCount} нещодавно в безпеці, {safeCount} в безпеці
              </Typography>
            </View>

            <View style={styles.membersList}>
              <MemberList
                members={activeCircle.members}
                hasGroups={circles.length > 0}
                onMemberPress={(member) => {
                  setSelectedMember(member);
                  setIsMemberModalVisible(true);
                }}
              />
            </View>
          </ScrollView>

          <CircleActionsModal
            visible={isActionsVisible}
            onClose={() => setIsActionsVisible(false)}
            circleId={activeCircle?.id || ""}
            ownerId={activeCircle?.owner.id || ""}
            currentName={activeCircle?.name || ""}
            inviteCode={activeCircle?.inviteCode || ""}
            members={activeCircle?.members || []}
            onSaveMembers={async (updatedMembers) => {
              if (!activeCircle) return;
              await apiFetch("/groups", {
                method: "PUT",
                body: JSON.stringify({ id: activeCircle.id, members: updatedMembers }),
              });
              setIsActionsVisible(false);
              fetchCircles();
            }}
            onRename={async (newName) => {
              if (!activeCircle) return;
              await apiFetch("/groups", {
                method: "PUT",
                body: JSON.stringify({ id: activeCircle.id, name: newName }),
              });
              setIsActionsVisible(false);
              fetchCircles();
            }}
            onDelete={async () => {
              if (!activeCircle) return;
              await apiFetch(`/groups/${activeCircle.id}`, { method: "DELETE" });
              setIsActionsVisible(false);
              setShowCircleDetail(false);
              fetchCircles();
            }}
            onLeave={async () => {
              if (!activeCircle) return;
              await apiFetch(`/groups/${activeCircle.id}/leave`, { method: "POST" });
              setIsActionsVisible(false);
              setShowCircleDetail(false);
              fetchCircles();
            }}
            onRegenerateInvite={async () => {
              if (!activeCircle) return;
              const { code } = await apiFetch(`/groups/${activeCircle.id}/invite`, {
                method: "POST",
              });
              setActiveCircle((prev) => (prev ? { ...prev, inviteCode: code } : prev));
              fetchCircles();
            }}
            onRollCall={handleRollCallConfirmed}
          />

          <MemberDetailModal
            member={selectedMember}
            visible={isMemberModalVisible}
            onClose={() => {
              setIsMemberModalVisible(false);
              setSelectedMember(null);
            }}
          />
        </ScrollView>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.header}>
              <Typography variant="h1" tone="primary">
                Кола
              </Typography>
              <Button
                shape="round"
                hierarchy="accent"
                size="medium"
                leadingIcon={
                  <AntDesign name="plus" size={24} color={theme.colors.content.onColor} />
                }
                onPress={() => setIsAddModalVisible(true)}
              />
            </View>

            {circles.length === 0 ? (
              <Typography variant="body1" tone="secondary" style={styles.emptyText}>
                Кола не знайдені
              </Typography>
            ) : (
              <View style={styles.listContainer}>
                {circles.map((circle) => (
                  <CircleItem
                    key={circle.id}
                    title={circle.name}
                    members={circle.members}
                    onMenuPress={() => openActionsModal(circle)}
                    onPress={() => openCircleDetail(circle)}
                  />
                ))}
              </View>
            )}
          </ScrollView>

          <AddCircleModal
            visible={isAddModalVisible}
            onClose={() => setIsAddModalVisible(false)}
            onUpdated={fetchCircles}
          />

          <CircleActionsModal
            visible={isActionsVisible}
            onClose={() => setIsActionsVisible(false)}
            circleId={activeCircle?.id || ""}
            ownerId={activeCircle?.owner.id || ""}
            currentName={activeCircle?.name || ""}
            inviteCode={activeCircle?.inviteCode || ""}
            members={activeCircle?.members || []}
            onSaveMembers={async (updatedMembers) => {
              if (!activeCircle) return;
              await apiFetch("/groups", {
                method: "PUT",
                body: JSON.stringify({ id: activeCircle.id, members: updatedMembers }),
              });
              setIsActionsVisible(false);
              fetchCircles();
            }}
            onRename={async (newName) => {
              if (!activeCircle) return;
              await apiFetch("/groups", {
                method: "PUT",
                body: JSON.stringify({ id: activeCircle.id, name: newName }),
              });
              setIsActionsVisible(false);
              fetchCircles();
            }}
            onDelete={async () => {
              if (!activeCircle) return;
              await apiFetch(`/groups/${activeCircle.id}`, { method: "DELETE" });
              setIsActionsVisible(false);
              fetchCircles();
            }}
            onLeave={async () => {
              if (!activeCircle) return;
              await apiFetch(`/groups/${activeCircle.id}/leave`, { method: "POST" });
              setIsActionsVisible(false);
              fetchCircles();
            }}
            onRegenerateInvite={async () => {
              if (!activeCircle) return;
              const { code } = await apiFetch(`/groups/${activeCircle.id}/invite`, {
                method: "POST",
              });
              setActiveCircle((prev) => (prev ? { ...prev, inviteCode: code } : prev));
              fetchCircles();
            }}
            onRollCall={handleRollCallConfirmed}
          />
        </>
      )}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background.primary },
  content: { paddingHorizontal: theme.spacing[16], paddingBottom: 140 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: theme.spacing[20],
    gap: theme.spacing[8],
  },
  emptyText: {
    textAlign: "center",
    marginTop: theme.spacing[20],
  },
  listContainer: {
    marginTop: theme.spacing[16],
  },
  // Detail view
  detailHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: theme.spacing[8],
    paddingVertical: theme.spacing[8],
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.opaque,
    gap: theme.spacing[8],
  },
  detailTitleBlock: {
    flex: 1,
    gap: theme.spacing[4],
  },
  inlineInviteRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing[2],
  },
  detailContent: {
    paddingTop: theme.spacing[16],
    gap: theme.spacing[8],
  },
  statsCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius.xl,
    padding: theme.spacing[16],
    gap: theme.spacing[8],
  },
  statsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  membersCount: {
    marginBottom: theme.spacing[16],
  },
  membersList: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius.xl,
    padding: theme.spacing[8],
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing[10],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.opaque,
  },
  memberInfo: {
    marginLeft: theme.spacing[12],
    flex: 1,
  },
  leaveButton: {
    marginTop: theme.spacing[24],
  },
  rcMessageBubble: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: theme.spacing[12],
    borderRadius: theme.radius.xl,
    width: "100%",

    backgroundColor: "rgba(255,255,255,0.6)",
    borderWidth: 1,
    borderColor: theme.colors.primaryA,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  rcMessageTextContainer: {
    marginLeft: theme.spacing[8],
  },
  rcTimeText: {
    color: theme.colors.content.secondary,
    marginLeft: "auto",
  },
});
