import { COLORS } from "@/src/theme/colors";
import { AntDesign, Feather, Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MemberAvatar } from "../../MemberAvatar";
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
  onRollCallPress: () => void;
}

export default function CircleDetailsView({
  name,
  inviteCode,
  members,
  isOwner,
  onClose,
  onRenamePress,
  onMemberPress,
  onRollCallPress,
}: CircleDetailsViewProps) {
  const handleCopy = async () => {
    await Clipboard.setStringAsync(inviteCode);
  };

  const unknownCount = members.filter((m) => (m.status as any) === "UNKNOWN" || !m.status).length;
  const safeCount = members.filter((m) => m.status === "SAFE").length;
  const wasSafeCount = members.filter((m) => (m.status as any) === "WAS_SAFE").length;

  return (
    <View style={styles.outerContainer}>
      <View style={styles.headerArea}>
        <View style={styles.headerTop}>
          <View style={styles.titleInfo}>
            <TouchableOpacity onPress={onClose} style={styles.backArrow}>
              <AntDesign name="left" size={24} color={COLORS.TEXT_DARK} />
            </TouchableOpacity>
            <Text style={styles.title} numberOfLines={1}>
              {name}
            </Text>
          </View>
        </View>

        <View style={styles.codeWrapper}>
          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>Код: {inviteCode}</Text>
            <TouchableOpacity
              onPress={handleCopy}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.copyButton}
            >
              <Ionicons name="copy" size={16} color={COLORS.TEXT_DARK} />
            </TouchableOpacity>
          </View>
        </View>
        {isOwner && (
          <TouchableOpacity onPress={onRenamePress} style={styles.editButton}>
            <AntDesign name="edit" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statsHeader}>
          <Text style={styles.membersCountText}>{members.length} учасників</Text>
          {isOwner && (
            <TouchableOpacity onPress={onRollCallPress} style={styles.rollCallButton}>
              <Text style={styles.rollCallButtonText}>Перекличка</Text>
              <Feather name="rss" size={16} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.statsSummaryText}>
          {unknownCount} не відповіли,{"\n"}
          {wasSafeCount} нещодавно в безпеці, {safeCount} в безпеці
        </Text>
      </View>

      <ScrollView
        style={styles.membersList}
        contentContainerStyle={styles.membersListContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.membersCard}>
          {members.map((member, index) => (
            <TouchableOpacity
              key={member.id}
              style={[styles.memberCard, index === members.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => onMemberPress(member)}
              activeOpacity={0.7}
            >
              <View style={styles.memberMainInfo}>
                <MemberAvatar member={{ ...member, status: (member.status as any) || "UNKNOWN" }} />
                <View style={styles.memberTextInfo}>
                  <Text style={styles.memberNameText}>
                    {member.fullName || `${member.firstName} ${member.lastName}`.trim()}
                  </Text>
                  <Text style={styles.memberStatusLabel}>
                    {member.status === "SAFE"
                      ? "У безпеці"
                      : (member.status as any) === "WAS_SAFE"
                        ? "Був у безпеці"
                        : "Невідомо"}
                  </Text>
                  <Text style={styles.memberStatusTime}>
                    {member.status === "SAFE"
                      ? "19:05"
                      : member.status === "WAS_SAFE"
                        ? "У безпеці о 18:56"
                        : "19:05"}
                  </Text>
                </View>
              </View>
              <View style={[styles.statusIconContainer, { backgroundColor: "transparent" }]}>
                <AntDesign
                  name={
                    member.status === "SAFE"
                      ? "check-circle"
                      : member.status === "WAS_SAFE"
                        ? "sync"
                        : "question-circle"
                  }
                  size={
                    member.status === "SAFE" || member.status === "UNKNOWN" || !member.status
                      ? 26
                      : 18
                  }
                  color={
                    member.status === "SAFE"
                      ? COLORS.STATE_SAFE
                      : member.status === "WAS_SAFE"
                        ? COLORS.PRIMARY_BLUE
                        : "#FF9500"
                  }
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: "#F4F6F9",
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
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  titleInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 16,
  },
  backArrow: {
    marginRight: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.TEXT_DARK,
  },
  editButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.PRIMARY_BLUE,
    borderRadius: 18,
    shadowColor: COLORS.PRIMARY_BLUE,
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
    backgroundColor: "#EBEDF0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  codeText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.TEXT_DARK,
    marginRight: 10,
  },
  copyButton: {
    padding: 2,
  },
  statsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    marginHorizontal: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  membersCountText: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.TEXT_DARK,
  },
  rollCallButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.PRIMARY_BLUE,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
    shadowColor: COLORS.PRIMARY_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  rollCallButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  statsSummaryText: {
    fontSize: 12,
    color: COLORS.TEXT_DARK,
    lineHeight: 18,
    fontWeight: "500",
    opacity: 0.8,
  },
  membersList: {
    paddingHorizontal: 20,
  },
  membersListContent: {
    paddingBottom: 40,
  },
  membersCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  memberMainInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  memberTextInfo: {
    marginLeft: 12,
  },
  memberNameText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.TEXT_DARK,
  },
  memberStatusLabel: {
    fontSize: 14,
    color: COLORS.TEXT_GRAY,
    marginTop: 2,
  },
  memberStatusTime: {
    fontSize: 12,
    color: COLORS.TEXT_GRAY,
    marginTop: 2,
    opacity: 0.7,
  },
  statusIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
});
