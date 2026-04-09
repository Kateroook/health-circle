import { apiFetch } from "@/src/api/api";
import { setContactAlias } from "@/src/api/contacts";
import { blockUser, initiatePersonalRollCall, initiateRollCall } from "@/src/api/groups";
import { Button } from "@/src/components/Button";
import CircleActionsModal from "@/src/components/circle/actions/CircleActionsModal";
import { ConfirmRollCallModal } from "@/src/components/circle/actions/ConfirmRollCallModal";

import AddCircleModal from "@/src/components/circle/AddCircleModal";
import CircleItem from "@/src/components/circle/CircleItem";
import { MemberList } from "@/src/components/dashboard/MemberList";
import { MemberProfileModal } from "@/src/components/dashboard/MemberProfileModal";
import { Typography } from "@/src/components/typography";
import { useSyncSignal } from "@/src/hooks/useSyncSignal";
import { useAuthStore } from "@/src/store/authStore";
import { theme } from "@/src/theme/theme";
import { Circle, Member } from "@/src/types";
import { ScreenIds } from "@/src/utils/testIDs";
import { AntDesign, Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAnalytics } from "../../hooks/useAnalytics";

import {
  Alert,
  Animated,
  BackHandler,
  Easing,
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

// ─── Skeleton loader for circle items ────────────────────────────────────────

function SkeletonCircleItem() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  return (
    <Animated.View style={[styles.skeletonCard, { opacity }]}>
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonMenu} />
      </View>

      {/* Імітація Members (Аватари що накладаються) */}
      <View style={styles.skeletonMembersRow}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[styles.skeletonAvatarCircle, { marginLeft: i === 0 ? 0 : -12, zIndex: 5 - i }]}
          />
        ))}
      </View>
    </Animated.View>
  );
}
function CirclesSkeletonList() {
  return (
    <View style={styles.listContainer}>
      {[0, 1, 2].map((i) => (
        <SkeletonCircleItem key={i} />
      ))}
    </View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyCircles({ onAdd }: { onAdd: () => void }) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
      <Animated.Image
        source={require("../../assets/images/sad-penguin.png")}
        style={[styles.emptyImage, { transform: [{ translateY: floatAnim }] }]}
        resizeMode="contain"
      />
      <Typography variant="h2" tone="primary" style={styles.emptyTitle}>
        Кіл поки немає
      </Typography>
      <Typography variant="body1" tone="secondary" style={styles.emptySubtitle}>
        Створи своє перше коло або приєднайся до існуючого
      </Typography>
      <Button
        label="Створити коло"
        hierarchy="accent"
        shape="pill"
        size="medium"
        leadingIcon={<AntDesign name="plus" size={18} color={theme.colors.content.onColor} />}
        onPress={onAdd}
        style={styles.emptyButton}
      />
    </Animated.View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function CirclesScreen() {
  const user = useAuthStore().user;
  const { logEvent } = useAnalytics();

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isActionsVisible, setIsActionsVisible] = useState(false);
  const [activeCircle, setActiveCircle] = useState<Circle | null>(null);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [showCircleDetail, setShowCircleDetail] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isMemberModalVisible, setIsMemberModalVisible] = useState(false);

  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const [isRollCallModalVisible, setIsRollCallModalVisible] = useState(false);
  const canRollCall = !!selectedMember && !!activeCircle;

  useEffect(() => {
    setActiveCircle((current) => {
      if (!current) return current;
      const updated = circles.find((c) => c.id === current.id);
      return updated ?? current;
    });
  }, [circles]);

  const fetchCircles = useCallback(async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
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

  const handlePersonalRollCall = async (member: Member) => {
    if (!activeCircle) return;
    try {
      await initiatePersonalRollCall(activeCircle.id, member.id);
      logEvent("initiate_personal_roll_call", { type: "individual" });
      setActiveCircle((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          members: prev.members.map((m) =>
            m.id === member.id ? { ...m, lastPersonalRollCallAt: new Date().toISOString() } : m,
          ),
        };
      });
      Alert.alert("Успіх", "Запит на перекличку надіслано");
    } catch {
      Alert.alert("Помилка", "Не вдалося надіслати запит");
    }
  };

  const handleBlockUser = async () => {
    if (!activeCircle || !selectedMember) return;
    try {
      await blockUser(activeCircle.id, selectedMember.id);
      logEvent("block_user");
      setIsMemberModalVisible(false);
      setSelectedMember(null);
      fetchCircles();
      Alert.alert("Успіх", "Користувача заблоковано");
    } catch {
      Alert.alert("Помилка", "Не вдалося заблокувати користувача");
    }
  };

  const handleMemberRename = async (newName: string) => {
    if (!selectedMember) return;
    try {
      await setContactAlias(selectedMember.id, newName);
      setIsMemberModalVisible(false);
      setSelectedMember(null);
      fetchCircles();
      Alert.alert("Успіх", "Ім'я оновлено");
    } catch {
      Alert.alert("Помилка", "Не вдалося оновити ім'я");
    }
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
    <SafeAreaView
      style={styles.screen}
      testID={ScreenIds.circles}
      accessibilityLabel={ScreenIds.circles}
    >
      {/* Roll Call Modal  */}
      <ConfirmRollCallModal
        isVisible={isRollCallModalVisible}
        onCancel={() => setIsRollCallModalVisible(false)}
        onConfirm={async () => {
          setIsRollCallModalVisible(false);
          await handleRollCallConfirmed();
        }}
        testId="circles:confirmRollCall:modal"
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
              testId="circleDetail:back:button"
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
                  testId="circleDetail:copyCode:button"
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
              testId="circleDetail:actions:button"
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
                  testId="circleDetail:rollCall:button"
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

          <MemberProfileModal
            member={selectedMember}
            visible={isMemberModalVisible}
            onClose={() => {
              setIsMemberModalVisible(false);
              setSelectedMember(null);
            }}
            onRollCall={() => selectedMember && handlePersonalRollCall(selectedMember)}
            canRollCall={canRollCall}
            isOwner={!!isOwner}
            onRemove={async () => {
              if (!activeCircle || !selectedMember) return;
              try {
                const updatedMembers = activeCircle.members
                  .filter((m) => m.id !== selectedMember.id)
                  .map((m) => ({ id: m.id }));
                await apiFetch("/groups", {
                  method: "PUT",
                  body: JSON.stringify({ id: activeCircle.id, members: updatedMembers }),
                });
                setIsMemberModalVisible(false);
                setSelectedMember(null);
                fetchCircles();
              } catch {
                Alert.alert("Помилка", "Не вдалося видалити учасника");
              }
            }}
            onBlock={handleBlockUser}
            onRename={handleMemberRename}
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
                testId="circles:addCircle:button"
              />
            </View>

            {isLoading ? (
              <CirclesSkeletonList />
            ) : circles.length === 0 ? (
              <EmptyCircles onAdd={() => setIsAddModalVisible(true)} />
            ) : (
              <View style={styles.listContainer}>
                {circles.map((circle) => (
                  <CircleItem
                    key={circle.id}
                    title={circle.name}
                    members={circle.members}
                    onMenuPress={() => openActionsModal(circle)}
                    onPress={() => openCircleDetail(circle)}
                    testId={`circles:item_${circle.id}`}
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
  listContainer: {
    marginTop: theme.spacing[16],
  },

  // ── Skeleton ──────────────────────────────────────────────────────────────
  // Оновлені стилі для Skeleton, що повторюють CircleItem
  skeletonCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius.xl,
    padding: theme.spacing[16],
    marginBottom: theme.spacing[12],
  },
  skeletonHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing[16], // Збільшено для відповідності структурі
  },
  skeletonTitle: {
    height: 18,
    width: "40%",
    borderRadius: 9,
    backgroundColor: theme.colors.border.opaque,
  },
  skeletonMenu: {
    width: 24,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.border.opaque,
  },
  skeletonMembersRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  skeletonAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.border.opaque,
    borderWidth: 2,
    borderColor: theme.colors.background.secondary, // Створює ефект розрізу між фейковими аватарами
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyContainer: {
    alignItems: "center",
    paddingTop: theme.spacing[32],
    paddingHorizontal: theme.spacing[24],
    gap: theme.spacing[12],
  },
  emptyImage: {
    width: 180,
    height: 180,
    marginBottom: theme.spacing[8],
  },
  emptyTitle: {
    textAlign: "center",
  },
  emptySubtitle: {
    textAlign: "center",
    lineHeight: 22,
  },
  emptyButton: {
    marginTop: theme.spacing[8],
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
