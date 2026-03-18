import { apiFetch } from "@/src/api/api";
import { initiateRollCall } from "@/src/api/groups";
import { Button } from "@/src/components/Button";
import CircleActionsModal from "@/src/components/circle/actions/CircleActionsModal";
import AddCircleModal from "@/src/components/circle/AddCircleModal";
import CircleItem from "@/src/components/circle/CircleItem";
import { TextField } from "@/src/components/fields/TextField";
import { MemberAvatar } from "@/src/components/MemberAvatar";
import MemberDetailModal from "@/src/components/MemberDetailModal";
import { ModalContainer } from "@/src/components/modal/ModalContainer";
import { StatusBadge } from "@/src/components/StatusBadge";
import { Typography } from "@/src/components/typography";
import { useSyncSignal } from "@/src/hooks/useSyncSignal";
import { useAuthStore } from "@/src/store/authStore";
import { theme } from "@/src/theme/theme";
import { Circle, Member } from "@/src/types";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  BackHandler,
  Platform,
  Pressable,
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

  const handleRollCall = async () => {
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

  // ─── Detail view ────────────────────────────────
  if (showCircleDetail && activeCircle) {
    return (
      <SafeAreaView style={styles.screen}>
        {/* Rename Modal */}
        <ModalContainer
          isVisible={isRenameModalVisible}
          onClose={() => setIsRenameModalVisible(false)}
        >
          <Typography variant="h3" tone="primary" style={{ textAlign: "center" }}>
            Перейменувати коло
          </Typography>
          <TextField
            label="Нова назва"
            value={renameValue}
            onChangeText={setRenameValue}
            placeholder="Нова назва"
            returnKeyType="done"
            onSubmitEditing={handleRenameSubmit}
          />
          <View style={styles.renameActions}>
            <Button
              label="Скасувати"
              hierarchy="secondary"
              shape="rectangle"
              size="medium"
              onPress={() => setIsRenameModalVisible(false)}
              style={{ flex: 1 }}
            />
            <Button
              label="Зберегти"
              hierarchy="primary"
              shape="rectangle"
              size="medium"
              onPress={handleRenameSubmit}
              style={{ flex: 1 }}
            />
          </View>
        </ModalContainer>

        {/* Header */}
        <View style={styles.detailHeader}>
          <Button
            shape="round"
            hierarchy="tertiary"
            size="medium"
            leadingIcon={
              <AntDesign name="arrow-left" size={24} color={theme.colors.content.primary} />
            }
            onPress={() => {
              setShowCircleDetail(false);
              setActiveCircle(null);
            }}
          />
          <View style={styles.detailTitleBlock}>
            <Typography variant="h2" tone="primary">
              {activeCircle.name}
            </Typography>
            {activeCircle.inviteCode && (
              <View style={styles.inlineInviteRow}>
                <Typography variant="caption" tone="secondary">
                  Код:{" "}
                </Typography>
                <Typography variant="caption" tone="primary" weight="bold">
                  {activeCircle.inviteCode}
                </Typography>
              </View>
            )}
          </View>
          {isOwner && (
            <Button
              shape="round"
              hierarchy="accent"
              size="small"
              leadingIcon={
                <MaterialIcons name="edit" size={16} color={theme.colors.content.onColor} />
              }
              onPress={() => setIsActionsVisible(true)}
            />
          )}
        </View>

        <ScrollView contentContainerStyle={styles.detailContent}>
          <Typography variant="subtitle1" tone="primary" style={styles.membersCount}>
            Учасників: {activeCircle.members.length}
          </Typography>

          <View style={styles.membersList}>
            {activeCircle.members.map((member) => (
              <Pressable
                key={member.id}
                style={styles.memberRow}
                onPress={() => {
                  setSelectedMember(member);
                  setIsMemberModalVisible(true);
                }}
              >
                <MemberAvatar member={member} />
                <View style={styles.memberInfo}>
                  <Typography variant="subtitle1" tone="primary">
                    {member.firstName} {member.lastName}
                  </Typography>
                  <Typography variant="body2" tone="secondary">
                    {member.status === "SAFE"
                      ? "В безпеці"
                      : member.status === "DANGER"
                        ? "Потрібна допомога!"
                        : member.status === "WAS_SAFE"
                          ? "Був у безпеці"
                          : "Невідомо"}
                  </Typography>
                </View>
                <StatusBadge status={member.status} variant="round" />
              </Pressable>
            ))}
          </View>

          {!isOwner && (
            <Button
              label="Покинути коло"
              hierarchy="secondary"
              shape="rectangle"
              size="medium"
              onPress={handleLeave}
              style={styles.leaveButton}
            />
          )}
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
          onRollCall={handleRollCall}
        />

        <MemberDetailModal
          member={selectedMember}
          visible={isMemberModalVisible}
          onClose={() => {
            setIsMemberModalVisible(false);
            setSelectedMember(null);
          }}
        />
      </SafeAreaView>
    );
  }

  // ─── List view ────────────────────────────────────
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Typography variant="h1" tone="primary">
            Кола
          </Typography>
          <Button
            shape="round"
            hierarchy="accent"
            size="medium"
            leadingIcon={<AntDesign name="plus" size={24} color={theme.colors.content.onColor} />}
            onPress={() => setIsAddModalVisible(true)}
          />
        </View>

        {circles.length === 0 ? (
          <Typography variant="body1" tone="secondary" style={styles.emptyText}>
            Кола не знайдені
          </Typography>
        ) : (
          circles.map((circle) => (
            <CircleItem
              key={circle.id}
              title={circle.name}
              members={circle.members}
              onMenuPress={() => openActionsModal(circle)}
              onPress={() => openCircleDetail(circle)}
            />
          ))
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
          const { code } = await apiFetch(`/groups/${activeCircle.id}/invite`, { method: "POST" });
          setActiveCircle((prev) => (prev ? { ...prev, inviteCode: code } : prev));
          fetchCircles();
        }}
        onRollCall={handleRollCall}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background.primary },
  content: { paddingHorizontal: theme.spacing[16], paddingBottom: 140 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.spacing[20],
    marginBottom: theme.spacing[28],
  },
  emptyText: {
    textAlign: "center",
    marginTop: theme.spacing[20],
  },

  // Detail view
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing[8],
    paddingVertical: theme.spacing[8],
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.opaque,
    gap: theme.spacing[8],
  },
  detailTitleBlock: {
    flex: 1,
  },
  inlineInviteRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing[2],
  },
  detailContent: {
    padding: theme.spacing[16],
  },
  membersCount: {
    marginBottom: theme.spacing[16],
  },
  membersList: {
    gap: theme.spacing[4],
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

  // Rename modal
  renameActions: {
    flexDirection: "row",
    gap: theme.spacing[12],
  },
});
