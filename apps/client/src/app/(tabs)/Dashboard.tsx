import { apiFetch, updateMyStatus } from "@/src/api/api";
import MemberAvatar from "@/src/components/MemberAvatar";
import { useSyncSignal } from "@/src/hooks/useSyncSignal";
import { useAuthStore } from "@/src/store/authStore";
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

const PRIMARY_COLOR = "#007AFF";
const TEXT_COLOR = "#1C1C1E";
const LIGHT_GRAY = "#F2F2F7";
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
        return "#34C759";
      case "DANGER":
        return "#FF3B30";
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
        <Text style={styles.mainStatusText}>
          {currentStatus === "SAFE"
            ? "В безпеці"
            : currentStatus === "DANGER"
              ? "Потрібна допомога!"
              : "Невідомо"}
        </Text>
      </Pressable>
      <Text style={styles.mainStatusHelperText}>
        Натисніть — якщо в безпеці{"\n"}
        Затисніть — якщо потрібна допомога
      </Text>
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
      bgColor = "#E8F5E9";
      circleColor = "#4CAF50";
      symbol = "✓";
      break;
    case "UNKNOWN":
      bgColor = "#FFF3E0";
      circleColor = "#FF9800";
      symbol = "?";
      break;
    case "DANGER":
      bgColor = "#FFEBEE";
      circleColor = "#F44336";
      symbol = "!";
      break;
    default:
      bgColor = "#F5F5F5";
      circleColor = "#9E9E9E";
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
        <Text
          style={{
            color: "#FFFFFF",
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
      statusColor = "#4CAF50";
      circleColor = "#4CAF50";
      symbol = "✓";
      break;
    case "DANGER":
      statusText = "Потрібна допомога!";
      statusColor = "#F44336";
      circleColor = "#F44336";
      symbol = "!";
      break;
    default:
      statusText = "Невідомо";
      statusColor = "#FF9800";
      circleColor = "#FF9800";
      symbol = "?";
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={modalStyles.overlay} onPress={onClose}>
        <Pressable style={modalStyles.card} onPress={(e) => e.stopPropagation()}>
          {/* Close button */}
          <TouchableOpacity style={modalStyles.closeButton} onPress={onClose}>
            <Text style={modalStyles.closeButtonText}>✕</Text>
          </TouchableOpacity>

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
        <Text style={styles.greeting} numberOfLines={1}>
          Привіт, {user?.firstName || "Користувач"}!
        </Text>

        <MainStatusIndicator
          currentStatus={user?.status || "UNKNOWN"}
          onUpdateStatus={handleStatusUpdate}
        />

        <View style={styles.statusCircleSection}>
          <Text style={styles.sectionHeader}>СТАТУС КОЛА</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.statusFilters}
            contentContainerStyle={{ paddingRight: 20 }}
          >
            <TouchableOpacity
              style={selectedGroupId === "ALL" ? styles.statusFilterActive : styles.statusFilter}
              onPress={() => setSelectedGroupId("ALL")}
            >
              <Text
                style={
                  selectedGroupId === "ALL"
                    ? styles.statusFilterTextActive
                    : styles.statusFilterText
                }
              >
                Усі
              </Text>
            </TouchableOpacity>

            {groups.map((group) => (
              <TouchableOpacity
                key={group.id}
                style={
                  selectedGroupId === group.id ? styles.statusFilterActive : styles.statusFilter
                }
                onPress={() => setSelectedGroupId(group.id)}
              >
                <Text
                  numberOfLines={1}
                  style={
                    selectedGroupId === group.id
                      ? styles.statusFilterTextActive
                      : styles.statusFilterText
                  }
                >
                  {group.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.contactList}>
            {displayedMembers.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  {groups.length === 0 ? "У вас ще немає кіл" : "Немає контактів у цьому колі"}
                </Text>
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
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingTop: 36,
    paddingBottom: 28,
    paddingHorizontal: 24,
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
    borderRadius: 15,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 13,
    color: "#8E8E93",
    fontWeight: "600",
  },
  avatarWrapper: {
    marginBottom: 14,
    transform: [{ scale: 1.6 }],
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 10,
    textAlign: "center",
  },
  // Status: circle icon + text side by side
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 8,
  },
  statusCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  statusCircleSymbol: {
    color: "#FFFFFF",
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
    gap: 10,
  },
  actionButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 50,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    color: "#1C1C1E",
    fontSize: 15,
    fontWeight: "600",
  },
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 120,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    color: TEXT_COLOR,
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
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  mainStatusHelperText: {
    marginTop: 20,
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 20,
  },
  statusCircleSection: {
    marginBottom: 30,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8E8E93",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  statusFilters: {
    flexDirection: "row",
    marginBottom: 16,
  },
  statusFilter: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 20,
    marginRight: 10,
    maxWidth: 150,
  },
  statusFilterActive: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: TEXT_COLOR,
    borderRadius: 20,
    marginRight: 10,
    maxWidth: 150,
  },
  statusFilterText: {
    fontSize: 14,
    color: TEXT_COLOR,
    fontWeight: "600",
  },
  statusFilterTextActive: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  contactList: {
    backgroundColor: "#FFFFFF",
    minHeight: 50,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5EA",
  },
  avatarContainer: {
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
    justifyContent: "center",
  },
  contactName: {
    fontSize: 16,
    fontWeight: "600",
    color: TEXT_COLOR,
    marginBottom: 2,
  },
  contactStatusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  contactStatusIcon: {
    marginLeft: 12,
    width: 44,
    alignItems: "flex-end",
  },
  emptyState: {
    padding: 20,
    alignItems: "center",
  },
  emptyStateText: {
    color: "#8E8E93",
    fontStyle: "italic",
  },
});
