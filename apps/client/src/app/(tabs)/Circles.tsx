import { apiFetch } from "@/src/api/api";
import { Button } from "@/src/components/Button";
import AddCircleModal from "@/src/components/circle/AddCircleModal";
import CircleItem from "@/src/components/circle/CircleItem";
import type { Member as CircleItemMember } from "@/src/components/circle/CircleItem";
import CircleActionsModal from "@/src/components/circle/actions/CircleActionsModal";
//import CircleDetailsModal from "@/src/components/circle/CircleDetailsModal";
import MemberDetailModal from "@/src/components/MemberDetailModal";
import { MemberAvatar } from "@/src/components/MemberAvatar";
import { Typography } from "@/src/components/typography/Typography";
import { useSyncSignal } from "@/src/hooks/useSyncSignal";
import { COLORS } from "@/src/theme/colors";
import { AntDesign, Feather, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  BackHandler,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/src/store/authStore";
import { theme } from "@/src/theme/theme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Member type сумісний з MemberDetailModal (active: boolean, не boolean | undefined)
export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  avatarUpdatedAt?: string;
  status: "SAFE" | "DANGER" | "UNKNOWN";
  active: boolean;
}

interface Circle {
  id: string;
  name: string;
  inviteCode: string;
  owner: { id: string; firstName?: string; lastName?: string };
  members: Member[];
}

// --- StatusBadge (copied from Dashboard) ---
const StatusBadge = ({ status }: { status: Member["status"] }) => {
  let bgColor: string;
  let circleColor: string;
  let symbol: string;

  switch (status) {
    case "SAFE":
      bgColor = "#E8F5E9";
      circleColor = "#4CAF50";
      symbol = "✓";
      break;
    case "DANGER":
      bgColor = "#FFEBEE";
      circleColor = "#F44336";
      symbol = "!";
      break;
    default:
      bgColor = "#FFF3E0";
      circleColor = "#FF9800";
      symbol = "?";
      break;
  }

  return (
    <View
      style={{
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: bgColor,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: circleColor,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 14,
            fontWeight: "bold",
            includeFontPadding: false,
            lineHeight: 20,
          }}
        >
          {symbol}
        </Text>
      </View>
    </View>
  );
};

export default function CirclesScreen() {
  const user = useAuthStore().user;

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isActionsVisible, setIsActionsVisible] = useState(false);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [activeCircle, setActiveCircle] = useState<Circle | null>(null);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [showCircleDetail, setShowCircleDetail] = useState(false);

  // Member detail modal state
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isMemberModalVisible, setIsMemberModalVisible] = useState(false);

  // Rename modal state
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<TextInput>(null);

  // Sync activeCircle when circles update
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
  useFocusEffect(useCallback(() => {}, []));

  // BackHandler
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
      if (isDetailsVisible) {
        setIsDetailsVisible(false);
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
  }, [
    isAddModalVisible,
    isActionsVisible,
    isDetailsVisible,
    showCircleDetail,
    isRenameModalVisible,
  ]);

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

  // Opens custom rename modal (works on both iOS and Android)
  const handleRename = () => {
    setRenameValue(activeCircle?.name || "");
    setIsRenameModalVisible(true);
    setTimeout(() => renameInputRef.current?.focus(), 100);
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

  // Opens CircleActionsModal from the detail view to edit members
  const handleEditMembers = () => {
    setIsActionsVisible(true);
  };

  const handleDelete = () => {
    Alert.alert("Видалити коло?", "Дію не можна скасувати", [
      { text: "Скасувати", style: "cancel" },
      {
        text: "Видалити",
        style: "destructive",
        onPress: async () => {
          if (!activeCircle) return;
          try {
            await apiFetch(`/groups/${activeCircle.id}`, { method: "DELETE" });
            setShowCircleDetail(false);
            fetchCircles();
          } catch {
            Alert.alert("Помилка", "Не вдалося видалити");
          }
        },
      },
    ]);
  };

  // ─── Detail view ────────────────────────────────
  if (showCircleDetail && activeCircle) {
    return (
      <SafeAreaView style={styles.screen}>
        {/* Rename Modal */}
        <Modal
          visible={isRenameModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsRenameModalVisible(false)}
        >
          <View style={styles.renameOverlay}>
            <View style={styles.renameCard}>
              <Text style={styles.renameTitle}>Перейменувати коло</Text>
              <TextInput
                ref={renameInputRef}
                style={styles.renameInput}
                value={renameValue}
                onChangeText={setRenameValue}
                placeholder="Нова назва"
                returnKeyType="done"
                onSubmitEditing={handleRenameSubmit}
              />
              <View style={styles.renameActions}>
                <TouchableOpacity
                  style={styles.renameCancelBtn}
                  onPress={() => setIsRenameModalVisible(false)}
                >
                  <Text style={styles.renameCancelText}>Скасувати</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.renameSaveBtn} onPress={handleRenameSubmit}>
                  <Text style={styles.renameSaveText}>Зберегти</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <View style={styles.detailHeader}>
          <TouchableOpacity
            onPress={() => {
              setShowCircleDetail(false);
              setActiveCircle(null);
            }}
            style={styles.backButton}
          >
            <AntDesign name="arrow-left" size={28} color="#000" />
          </TouchableOpacity>
          <View style={styles.detailTitleBlock}>
            <Text style={styles.detailTitle}>{activeCircle.name}</Text>
            {activeCircle.inviteCode && (
              <View
                style={[
                  styles.inlineInviteRow,
                  {
                    backgroundColor: "#F2F2F7",
                    borderRadius: 6,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    alignSelf: "flex-start",
                    marginTop: 4,
                  },
                ]}
              >
                <Text style={styles.inlineInviteLabel}>Код: </Text>
                <Text style={styles.inlineInviteCode}>{activeCircle.inviteCode}</Text>
              </View>
            )}
          </View>
          {isOwner && (
            <TouchableOpacity style={styles.editCircleBtn} onPress={handleEditMembers}>
              <MaterialIcons name="edit" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.detailContent}>
          <View style={styles.membersHeader}>
            <Text style={styles.membersCount}>Учасників: {activeCircle.members.length}</Text>
          </View>

          <View style={styles.membersList}>
            {activeCircle.members.map((member) => (
              <TouchableOpacity
                key={member.id}
                style={styles.memberRow}
                activeOpacity={0.7}
                onPress={() => {
                  setSelectedMember(member);
                  setIsMemberModalVisible(true);
                }}
              >
                <MemberAvatar member={member} />
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {member.firstName} {member.lastName}
                  </Text>
                  <Text
                    style={[
                      styles.memberStatus,
                      {
                        color:
                          member.status === "SAFE"
                            ? "#34C759"
                            : member.status === "DANGER"
                              ? "#FF3B30"
                              : "#FF9500",
                      },
                    ]}
                  >
                    {member.status === "SAFE"
                      ? "В безпеці"
                      : member.status === "DANGER"
                        ? "Потрібна допомога!"
                        : "Невідомо"}
                  </Text>
                </View>
                <StatusBadge status={member.status} />
              </TouchableOpacity>
            ))}
          </View>

          {isOwner ? (
            <View style={styles.ownerActions}></View>
          ) : (
            <TouchableOpacity style={[styles.actionBtn, styles.danger]} onPress={handleLeave}>
              <Text style={styles.dangerText}>Покинути коло</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* CircleActionsModal — доступний і з детального перегляду */}
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
          }}
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
          <Text style={styles.emptyText}>Кола не знайдені</Text>
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
        ownerId={activeCircle?.owner.id || ""}
        currentName={activeCircle?.name || ""}
        inviteCode={activeCircle?.inviteCode || ""}
        members={activeCircle?.members || []}
        circleId={activeCircle ? activeCircle.id : ""}
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
      />

      {/* Circle Details Modal */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background.primary },
  content: { paddingHorizontal: theme.spacing[16], paddingBottom: 140 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: theme.spacing[20],
    marginBottom: theme.spacing[28],
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#666",
    fontSize: 16,
  },

  // Detail view
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: { paddingRight: 12 },
  detailTitleBlock: {
    flex: 1,
    justifyContent: "center",
  },
  detailTitle: { fontSize: 24, fontWeight: "700" },
  inlineInviteRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  inlineInviteLabel: { fontSize: 13, color: "#888" },
  inlineInviteCode: { fontSize: 13, fontWeight: "700", color: "#000000" },
  editCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#5B8DEE",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  detailContent: { padding: 16 },

  membersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  membersCount: { fontSize: 16, fontWeight: "600" },

  membersList: { gap: 12 },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  memberInfo: { marginLeft: 12, flex: 1 },
  memberName: { fontSize: 16, fontWeight: "600" },
  memberStatus: { fontSize: 14, marginTop: 2 },

  ownerActions: { marginTop: 24, gap: 12 },
  actionBtn: {
    paddingVertical: 14,
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    alignItems: "center",
  },
  actionText: { fontSize: 16, color: "#007AFF", fontWeight: "600" },
  danger: { backgroundColor: "#ffebee" },
  dangerText: { color: "#FF3B30", fontWeight: "600" },

  // Rename modal
  renameOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  renameCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  renameTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  renameInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  renameActions: {
    flexDirection: "row",
    gap: 12,
  },
  renameCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    alignItems: "center",
  },
  renameCancelText: { fontSize: 16, color: "#666", fontWeight: "600" },
  renameSaveBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: COLORS.PRIMARY_BLUE,
    borderRadius: 10,
    alignItems: "center",
  },
  renameSaveText: { fontSize: 16, color: "#fff", fontWeight: "600" },
});
