import { apiFetch, updateMyStatus } from "@/src/api/api";
import { Button } from "@/src/components/Button";
import MemberAvatar from "@/src/components/MemberAvatar";
import { Typography } from "@/src/components/typography";
import { useAuthStore } from "@/src/store/authStore";
import { theme } from "@/src/theme/theme";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type UserStatus = "SAFE" | "DANGER" | "UNKNOWN";

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
  members: Member[];
}

const PRIMARY_COLOR = theme.colors.accent;
const TEXT_COLOR = theme.colors.content.primary;
const LIGHT_GRAY = theme.colors.background.secondary;
const BORDER_RADIUS = 12;

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

// --- StatusBadge ---
const StatusBadge = ({ status }: { status: UserStatus }) => {
  let bgColor: string;
  let circleColor: string;
  let symbol: string;

  switch (status) {
    case "SAFE":
      bgColor = theme.colors.stateBackground.safe;
      circleColor = theme.colors.state.safe;
      symbol = "✓";
      break;
    case "UNKNOWN":
      bgColor = theme.colors.stateBackground.unknown;
      circleColor = theme.colors.state.unknown;
      symbol = "?";
      break;
    case "DANGER":
      bgColor = theme.colors.stateBackground.emergency;
      circleColor = theme.colors.state.emergency;
      symbol = "!";
      break;
    default:
      bgColor = theme.colors.stateBackground.calm;
      circleColor = theme.colors.state.calm;
      symbol = "?";
  }

  return (
    <View
      style={{
        width: 30,
        height: 30,
        borderRadius: 5,
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
        <Typography variant="subtitle1" tone="onColor" weight="bold">
          {symbol}
        </Typography>
      </View>
    </View>
  );
};

// --- MemberProfileModal ---
const MemberProfileModal = ({
  member,
  visible,
  onClose,
}: {
  member: Member | null;
  visible: boolean;
  onClose: () => void;
}) => {
  if (!member) return null;

  let statusText: string;
  let statusColor: string;
  let circleColor: string;
  let symbol: string;

  switch (member.status) {
    case "SAFE":
      statusText = "В безпеці";
      statusColor = theme.colors.state.safe;
      circleColor = theme.colors.state.safe;
      symbol = "✓";
      break;
    case "DANGER":
      statusText = "Потрібна допомога!";
      statusColor = theme.colors.state.emergency;
      circleColor = theme.colors.state.emergency;
      symbol = "!";
      break;
    default:
      statusText = "Невідомо";
      statusColor = theme.colors.state.unknown;
      circleColor = theme.colors.state.unknown;
      symbol = "?";
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={modalStyles.overlay} onPress={onClose}>
        <Pressable style={modalStyles.card} onPress={(e) => e.stopPropagation()}>
          {/* Close button */}
          <Button
            shape="round"
            hierarchy="tertiary"
            size="medium"
            leadingIcon="✕"
            onPress={onClose}
            style={{ alignSelf: "flex-start" }}
          />
          {/* Avatar */}
          <View style={modalStyles.avatarWrapper}>
            <MemberAvatar member={member} />
          </View>

          {/* Name */}
          <Text style={modalStyles.name}>
            {member.firstName} {member.lastName}
          </Text>

          {/* Status row: icon + text */}
          <View style={modalStyles.statusRow}>
            <View style={[modalStyles.statusCircle, { backgroundColor: circleColor }]}>
              <Text style={modalStyles.statusCircleSymbol}>{symbol}</Text>
            </View>
            <Text style={[modalStyles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>

          {/* Buttons — one under another */}
          <View style={modalStyles.buttonsColumn}>
            <TouchableOpacity
              style={modalStyles.actionButton}
              activeOpacity={0.8}
              onPress={() => {}}
            >
              <Text style={modalStyles.actionButtonText}>Написати</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={modalStyles.actionButton}
              activeOpacity={0.8}
              onPress={() => {}}
            >
              <Text style={modalStyles.actionButtonText}>Перекличка</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// --- ContactStatusRow ---
const ContactStatusRow = ({
  member,
  onPress,
}: {
  member: Member;
  onPress: (member: Member) => void;
}) => {
  let statusText: string;
  let statusColor: string;

  switch (member.status) {
    case "SAFE":
      statusText = "В безпеці";
      statusColor = "#4CAF50";
      break;
    case "DANGER":
      statusText = "Потрібна допомога!";
      statusColor = "#F44336";
      break;
    default:
      statusText = "Невідомо";
      statusColor = "#FF9800";
  }

  return (
    <TouchableOpacity style={styles.contactRow} activeOpacity={0.7} onPress={() => onPress(member)}>
      <View style={styles.avatarContainer}>
        <MemberAvatar member={member} />
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>
          {member.firstName} {member.lastName}
        </Text>
        <Text style={[styles.contactStatusText, { color: statusColor }]}>{statusText}</Text>
      </View>
      <View style={styles.contactStatusIcon}>
        <StatusBadge status={member.status} />
      </View>
    </TouchableOpacity>
  );
};

// --- DashboardScreen ---
export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("ALL");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchGroups = async () => {
    try {
      const data = await apiFetch("/groups", { method: "GET" });
      setGroups(data);
    } catch (error) {
      console.error("Error loading groups:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
      const interval = setInterval(fetchGroups, 5000);
      return () => clearInterval(interval);
    }, []),
  );

  const handleStatusUpdate = async (newStatus: UserStatus) => {
    try {
      await updateMyStatus(newStatus);
      useAuthStore.setState((state) => {
        if (!state.user) return state;
        return { user: { ...state.user, status: newStatus } };
      });
    } catch (e) {
      Alert.alert("Помилка", "Не вдалося оновити статус. Перевірте інтернет.");
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
            contentContainerStyle={{ paddingRight: 20 }}
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
                <ContactStatusRow key={member.id} member={member} onPress={handleMemberPress} />
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <MemberProfileModal
        member={selectedMember}
        visible={modalVisible}
        onClose={handleCloseModal}
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
    paddingTop: theme.spacing[24],
    paddingBottom: theme.spacing[28],
    paddingHorizontal: theme.spacing[24],
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  closeButton: {
    position: "absolute",
    top: 14,
    right: 16,
    width: 30,
    height: 30,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.tertiary,
    justifyContent: "center",
    alignItems: "center",
  },

  avatarWrapper: {
    marginBottom: theme.spacing[14],
    transform: [{ scale: 1.6 }],
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.content.primary,
    marginBottom: theme.spacing[10],
    textAlign: "center",
  },
  // Status: circle icon + text side by side
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing[24],
    gap: theme.spacing[8],
  },
  statusCircle: {
    width: 22,
    height: 22,
    borderRadius: theme.radius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  statusCircleSymbol: {
    color: theme.colors.content.onColor,
    fontSize: 13,
    fontWeight: "bold",
    includeFontPadding: false,
    lineHeight: 22,
  },
  statusText: {
    fontSize: 15,
    fontWeight: "600",
  },
  // Buttons stacked vertically
  buttonsColumn: {
    width: "100%",
    gap: theme.spacing[12],
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 120,
  },
  greeting: {
    marginTop: 16,
    marginBottom: 40,
  },
  mainStatusContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  mainStatusGlowBackground: {
    width: 200,
    height: 200,
    borderRadius: 100,
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
    fontSize: 14,
    color: theme.colors.content.secondary,
    textAlign: "center",
    lineHeight: 20,
  },

  statusCircleSection: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius.xl,
    padding: theme.spacing[16],
  },
  statusFilters: {
    flexDirection: "row",
    gap: theme.spacing[8], // won't work on ScrollView directly
  },
  sectionHeader: {
    marginBottom: theme.spacing[8],
    letterSpacing: 0.5,
  },

  statusFilter: {
    paddingVertical: theme.spacing[8],
    paddingHorizontal: theme.spacing[16],
    backgroundColor: LIGHT_GRAY,
    borderRadius: theme.radius.lg,
    marginRight: theme.spacing[10],
    maxWidth: 150,
  },
  statusFilterActive: {
    paddingVertical: theme.spacing[8],
    paddingHorizontal: theme.spacing[16],
    backgroundColor: TEXT_COLOR,
    borderRadius: theme.radius.lg,
    marginRight: theme.spacing[10],
    maxWidth: 150,
  },
  statusFilterText: {
    fontSize: 14,
    color: TEXT_COLOR,
    fontWeight: "600",
  },
  statusFilterTextActive: {
    fontSize: 14,
    color: theme.colors.primaryA,
    fontWeight: "600",
  },
  contactList: {
    backgroundColor: theme.colors.background.secondary,
    minHeight: 50,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border.opaque,
  },
  avatarContainer: {
    marginRight: theme.spacing[12],
  },
  contactInfo: {
    flex: 1,
    justifyContent: "center",
  },
  contactName: {
    fontSize: 16,
    fontWeight: "600",
    color: TEXT_COLOR,
    marginBottom: theme.spacing[2],
  },
  contactStatusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  contactStatusIcon: {
    marginLeft: theme.spacing[12],
    width: 44,
    alignItems: "flex-end",
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
