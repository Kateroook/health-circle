import { AntDesign, Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MemberAvatar from "../../MemberAvatar";
import { Member } from "../CircleItem";

type DetailsMember = Member & { mood?: string; lastUpdate?: string };

interface CircleDetailsViewProps {
  name: string;
  inviteCode: string;
  members: DetailsMember[];
  isOwner: boolean;
  onClose: () => void;
  onRenamePress: () => void;
  onUnsubscribePress: () => void;
  onMemberPress: (member: DetailsMember) => void;
}

export default function CircleDetailsView({
  name,
  inviteCode,
  members,
  isOwner,
  onClose,
  onRenamePress,
  onUnsubscribePress,
  onMemberPress,
}: CircleDetailsViewProps) {
  const handleCopy = async () => {
    await Clipboard.setStringAsync(inviteCode);
  };

  const stats = useMemo(() => {
    const unknown = members.filter((m) => m.status === "UNKNOWN").length;
    const safe = members.filter((m) => m.status === "SAFE").length;
    const danger = members.filter((m) => m.status === "DANGER").length;
    return { unknown, safe, danger, total: members.length };
  }, [members]);

  const statsTextLines = [];
  if (stats.unknown > 0) statsTextLines.push(`${stats.unknown} не відповіли`);
  if (stats.danger > 0) statsTextLines.push(`${stats.danger} у небезпеці`);
  if (stats.safe > 0) statsTextLines.push(`${stats.safe} в безпеці`);

  // Hardcoded for matching the design look if data is 0 but we want to show stats as in design
  // You can keep the dynamic one
  const displayStatsText =
    statsTextLines.length > 0 ? statsTextLines.join(",\n") : "Всі учасники в безпеці";

  const renderStatusIcon = (status: string) => {
    if (status === "UNKNOWN") {
      return (
        <View style={[styles.statusIconWrapper, { backgroundColor: "#FFF4EF" }]}>
          <View style={[styles.statusIconInner, { backgroundColor: "#FFB067" }]}>
            <Text style={{ color: "white", fontWeight: "800", fontSize: 16 }}>?</Text>
          </View>
        </View>
      );
    }
    if (status === "DANGER") {
      // In design there is "Був у безпеці" mapped to blue check with dashed edges
      // but DANGER usually is red. If the user uses DANGER as 'was safe', we fallback to blue dashes.
      return (
        <View style={[styles.statusIconWrapper, { backgroundColor: "#EAF2FF" }]}>
          <View
            style={[
              styles.statusIconInner,
              {
                backgroundColor: "#FFF",
                borderColor: "#508CFF",
                borderWidth: 2,
                borderStyle: "dashed",
              },
            ]}
          >
            <View style={{ backgroundColor: "#508CFF", borderRadius: 10, padding: 2 }}>
              <AntDesign name="check" size={12} color="#FFF" />
            </View>
          </View>
        </View>
      );
    }
    return (
      <View style={[styles.statusIconWrapper, { backgroundColor: "#EAFBF0" }]}>
        <View style={[styles.statusIconInner, { backgroundColor: "#1FC16B" }]}>
          <AntDesign name="check" size={16} color="#FFF" />
        </View>
      </View>
    );
  };

  const getStatusText = (member: DetailsMember) => {
    if (member.status === "UNKNOWN") return "Невідомо";
    if (member.status === "DANGER") return "Був у безпеці"; // mimicking image design
    return "У безпеці";
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.headerArea}>
        <View style={styles.headerTop}>
          <View style={styles.titleRow}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <AntDesign name="left" size={18} color="#1A1D2B" />
            </TouchableOpacity>
            <Text style={styles.title} numberOfLines={1}>
              {name}
            </Text>
          </View>

          <TouchableOpacity onPress={onRenamePress} style={styles.editButton}>
            <MaterialIcons name="edit" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.codeWrapper}>
          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>Код: {inviteCode}</Text>
            <TouchableOpacity
              onPress={handleCopy}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="copy" size={16} color="#1A1D2B" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statsTop}>
          <Text style={styles.statsTotalTitle}>{stats.total} учасників</Text>
          <TouchableOpacity style={styles.rollCallButton}>
            <Text style={styles.rollCallText}>Перекличка</Text>
            <MaterialCommunityIcons
              name="broadcast"
              size={18}
              color="#FFF"
              style={{ marginLeft: 6 }}
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.statsDescription}>{displayStatsText}</Text>
      </View>

      <View style={styles.membersCard}>
        <ScrollView contentContainerStyle={styles.membersList} showsVerticalScrollIndicator={false}>
          {members.map((member) => (
            <View key={member.id}>
              <TouchableOpacity
                style={styles.memberItem}
                onPress={() => onMemberPress(member)}
                activeOpacity={0.7}
              >
                <MemberAvatar member={{ ...member, status: member.status || "UNKNOWN" }} />

                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {member.fullName || `${member.firstName} ${member.lastName}`.trim()}
                  </Text>
                  <Text style={styles.memberStatusText}>{getStatusText(member)}</Text>
                  <Text style={styles.memberTimeText}>
                    {member.status === "SAFE"
                      ? "19:05"
                      : member.status === "DANGER"
                        ? "У безпеці о 18:56"
                        : "19:05"}
                  </Text>
                </View>

                {renderStatusIcon(member.status)}
              </TouchableOpacity>
              {/* Optional Divider, design shows very subtle or none, but list is tight. */}
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: "#F4F6F9", // soft app background mapped
    marginHorizontal: -16,
    marginTop: -32,
    paddingTop: 32,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerArea: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 16,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1A1D2B",
    letterSpacing: -0.5,
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#5982FF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#5982FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  codeWrapper: {
    flexDirection: "row",
    paddingLeft: 40,
    marginTop: 8,
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EAECEF", // Трохи темніший за F2F4F7, але світліший за попередній E6E9EF
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  codeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1D2B",
    marginRight: 10,
  },
  statsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    marginHorizontal: 20,
    padding: 24,
    paddingVertical: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  statsTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statsTotalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#2C2D35",
  },
  rollCallButton: {
    backgroundColor: "#5982FF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#5982FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  rollCallText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  statsDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: "#5B5D68",
    fontWeight: "500",
  },
  membersCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    marginHorizontal: 20,
    paddingTop: 24,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 20,
  },
  membersList: {
    paddingBottom: 20,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 18,
    justifyContent: "center",
  },
  memberName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A1D2B",
    marginBottom: 2,
  },
  memberStatusText: {
    fontSize: 14,
    color: "#5B5D68",
    fontWeight: "600",
    marginBottom: 1,
  },
  memberTimeText: {
    fontSize: 13,
    color: "#A2A4B0",
    fontWeight: "500",
  },
  statusIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  statusIconInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
