import React from "react";
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MemberAvatar from "@/src/components/MemberAvatar";

// Тимчасово дублюємо потрібні типи (потім винесемо в окремий файл)
type UserStatus = "SAFE" | "DANGER" | "UNKNOWN";

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  avatarUpdatedAt?: string;
  status: UserStatus;
  active: boolean;
}

interface MemberProfileModalProps {
  member: Member | null;
  visible: boolean;
  onClose: () => void;
}

export default function MemberProfileModal({ member, visible, onClose }: MemberProfileModalProps) {
  if (!visible || !member) return null;

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
          {/* Кнопка закриття */}
          <TouchableOpacity style={modalStyles.closeButton} onPress={onClose}>
            <Text style={modalStyles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          {/* Аватар */}
          <View style={modalStyles.avatarWrapper}>
            <MemberAvatar member={member} />
          </View>

          {/* Ім'я */}
          <Text style={modalStyles.name}>
            {member.firstName} {member.lastName}
          </Text>

          {/* Рядок статусу */}
          <View style={modalStyles.statusRow}>
            <View style={[modalStyles.statusCircle, { backgroundColor: circleColor }]}>
              <Text style={modalStyles.statusCircleSymbol}>{symbol}</Text>
            </View>
            <Text style={[modalStyles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>

          {/* Кнопки */}
          <View style={modalStyles.buttonsColumn}>
            <TouchableOpacity
              style={modalStyles.actionButton}
              activeOpacity={0.8}
              onPress={() => {
                // TODO: Написати повідомлення
                console.log("Написати", member.id);
              }}
            >
              <Text style={modalStyles.actionButtonText}>Написати</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={modalStyles.actionButton}
              activeOpacity={0.8}
              onPress={() => {
                // TODO: Перекличка / дзвінок
                console.log("Перекличка", member.id);
              }}
            >
              <Text style={modalStyles.actionButtonText}>Перекличка</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

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
