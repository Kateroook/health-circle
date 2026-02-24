import { apiFetch, updateMyStatus } from "@/src/api/api";
import MemberAvatar from "@/src/components/MemberAvatar";
import { useAuthStore } from "@/src/store/authStore";
import { AntDesign } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
    Alert,
    Image,
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

// --- Constants ---
const PRIMARY_COLOR = "#007AFF"; // Blue
const DANGER_COLOR = "#FF3B30"; // Red
const TEXT_COLOR = "#1C1C1E";
const LIGHT_GRAY = "#F2F2F7";
const BORDER_RADIUS = 12;

// --- Helper Components ---

/**
 * Кнопка статусу з логікою:
 * - Короткий тап: "Я в безпеці"
 * - Довгий тап (0.8с): "Потрібна допомога"
 */
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
      {
        text: "Так, я в безпеці",
        onPress: () => onUpdateStatus("SAFE"),
      },
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
      ]
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

const StatusBadge = ({ status }: { status: UserStatus }) => {
    let bgColor: string;       // блідий фон прямокутника
    let circleColor: string;   // колір круга
    let symbol: string;        // символ всередині
    let symbolColor = "#FFFFFF"; // завжди білий

    switch (status) {
        case "SAFE":
            bgColor = "#E8F5E9";     // дуже блідо-зелений
            circleColor = "#4CAF50"; // зелений
            symbol = "✓";            // галочка (можна "✔" або "check")
            break;

        case "UNKNOWN":
            bgColor = "#FFF3E0";     // блідо-оранжевий / персиковий
            circleColor = "#FF9800"; // оранжевий
            symbol = "?";
            break;

        case "DANGER":
            bgColor = "#FFEBEE";     // блідо-червоний
            circleColor = "#F44336"; // червоний
            symbol = "!";
            break;

        default:
            bgColor = "#F5F5F5";
            circleColor = "#9E9E9E";
            symbol = "?";
    }

    return (
        <View style={{
            width: 30,
            height: 30,
            borderRadius: 5,
            backgroundColor: bgColor,
            justifyContent: 'center',
            alignItems: 'center',
        }}>
            <View style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: circleColor,
                justifyContent: 'center',
                alignItems: 'center',
            }}>
                <Text
                    style={{
                        color: symbolColor,
                        fontSize: 14,
                        fontWeight: 'bold',
                        includeFontPadding: false, // щоб символ сидів ідеально по центру
                        lineHeight: 20,
                    }}
                >
                    {symbol}
                </Text>
            </View>
        </View>
    );
};

const ContactStatusRow = ({ member }: { member: Member }) => {
    let statusText: string;
    let statusColor: string;

    switch (member.status) {
        case "SAFE":
            statusText = "В безпеці";
            statusColor = "#4CAF50";   // можна узгодити з circleColor
            break;
        case "DANGER":
            statusText = "Потрібна допомога!";
            statusColor = "#F44336";
            break;
        default:
            statusText = "Невідомо";
            statusColor = "#FF9800";   // оранжевий для UNKNOWN
    }

    return (
        <View style={styles.contactRow}>
            <View style={styles.avatarContainer}>
                <MemberAvatar member={member} />
            </View>
            <View style={styles.contactInfo}>
                <Text style={styles.contactName}>
                    {member.firstName} {member.lastName}
                </Text>
                <Text style={[styles.contactStatusText, { color: statusColor }]}>
                    {statusText}
                </Text>
            </View>
            <View style={styles.contactStatusIcon}>
                <StatusBadge status={member.status} />
            </View>
        </View>
    );
};

const MoodSection = () => (
  <View style={styles.moodCard}>
    <View>
      <Text style={styles.sectionHeader}>НАСТРІЙ</Text>
      <Text style={styles.moodTitle}>Нормальний</Text>
      <Text style={styles.moodDescription}>Все добре, працюю</Text>
    </View>
    <Image
      source={{ uri: "https://via.placeholder.com/60" }}
      style={styles.moodEmoji}
    />
  </View>
);

// --- Main Screen Component ---
export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("ALL");

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
    }, [])
  );

  const handleStatusUpdate = async (newStatus: UserStatus) => {
    try {
      await updateMyStatus(newStatus);
      useAuthStore.setState((state) => {
        if (!state.user) return state;
        return {
          user: {
            ...state.user,
            status: newStatus,
          },
        };
      });
    } catch (e) {
      Alert.alert("Помилка", "Не вдалося оновити статус. Перевірте інтернет.");
    }
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.greeting} numberOfLines={1}>
          Привіт, {user?.firstName || "Користувач"}!
        </Text>

        {/* Status Button */}
        <MainStatusIndicator
          currentStatus={user?.status || "UNKNOWN"}
          onUpdateStatus={handleStatusUpdate}
        />

        {/* Status Circle Section */}
        <View style={styles.statusCircleSection}>
          <Text style={styles.sectionHeader}>СТАТУС КОЛА</Text>

          {/* Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.statusFilters}
            contentContainerStyle={{ paddingRight: 20 }}
          >
            <TouchableOpacity
              style={
                selectedGroupId === "ALL"
                  ? styles.statusFilterActive
                  : styles.statusFilter
              }
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
                  selectedGroupId === group.id
                    ? styles.statusFilterActive
                    : styles.statusFilter
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

          {/* Contact List */}
          <View style={styles.contactList}>
            {displayedMembers.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  {groups.length === 0
                    ? "У вас ще немає кіл"
                    : "Немає контактів у цьому колі"}
                </Text>
              </View>
            ) : (
              displayedMembers.map((member) => (
                <ContactStatusRow key={member.id} member={member} />
              ))
            )}
          </View>
        </View>

        {/* Mood Section */}
        {/* <MoodSection /> */}
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Stylesheet ---
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

  // Main Status Indicator
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
    // Shadows for glow effect
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

  // Status Circle Section
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

  // Contact List & Row
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
        marginLeft: 12,          // трохи більше відступу, бо іконка стала ширшою
        width: 44,               // фіксована ширина під бейдж
        alignItems: 'flex-end',  // вирівняти праворуч
    },
  emptyState: {
    padding: 20,
    alignItems: "center",
  },
  emptyStateText: {
    color: "#8E8E93",
    fontStyle: "italic",
  },

  // Mood Section
  moodCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: LIGHT_GRAY,
    borderRadius: BORDER_RADIUS,
    padding: 16,
    marginTop: 10,
  },
  moodTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: TEXT_COLOR,
    marginBottom: 4,
  },
  moodDescription: {
    fontSize: 14,
    color: TEXT_COLOR,
    maxWidth: "80%",
  },
  moodEmoji: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FF9500",
  },
});
