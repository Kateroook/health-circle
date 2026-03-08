import { COLORS } from "@/src/theme/colors";
import { AntDesign, Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MemberAvatar } from "../../MemberAvatar";

import { Member } from "../CircleItem";

type DetailsMember = Member & { mood?: string };

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
  onUnsubscribePress,
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backArrow}>
          <AntDesign name="left" size={24} color={COLORS.TEXT_DARK} />
        </TouchableOpacity>
        <View style={styles.titleInfo}>
          <Text style={styles.title}>{name}</Text>
          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>Код: {inviteCode}</Text>
            <TouchableOpacity onPress={handleCopy} style={styles.copyButton}>
              <Feather name="copy" size={14} color={COLORS.TEXT_DARK} />
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

      <ScrollView style={styles.membersList} contentContainerStyle={styles.membersListContent}>
        <View style={styles.membersCard}>
          {members.map((member, index) => (
            <TouchableOpacity
              key={member.id}
              style={[styles.memberCard, index === members.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => onMemberPress(member)}
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
                      : (member.status as any) === "WAS_SAFE"
                        ? "У безпеці о 18:56"
                        : "19:05"}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.statusIconContainer,
                  {
                    backgroundColor: "transparent",
                  },
                ]}
              >
                <AntDesign
                  name={
                    member.status === "SAFE"
                      ? "check-circle"
                      : (member.status as any) === "WAS_SAFE"
                        ? "sync"
                        : "question-circle"
                  }
                  size={
                    member.status === "SAFE" ||
                    (member.status as any) === "UNKNOWN" ||
                    !member.status
                      ? 26
                      : 18
                  }
                  color={
                    member.status === "SAFE"
                      ? COLORS.STATE_SAFE
                      : (member.status as any) === "WAS_SAFE"
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
  container: {
    paddingHorizontal: 20,
    backgroundColor: "#F7F8FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 20,
  },
  titleInfo: {
    flex: 1,
    marginLeft: 15,
  },
  backArrow: {
    marginTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.TEXT_DARK,
    marginBottom: 4,
  },
  editButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.PRIMARY_BLUE,
    borderRadius: 18,
    marginTop: 4,
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EBEDF0",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  codeText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.TEXT_DARK,
    marginRight: 6,
  },
  copyButton: {
    padding: 2,
  },
  statsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
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
    // Let content define height so it displays correctly inside bottom sheet
    // rather than trying to flex into potentially zero height.
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
    fontWeight: "600",
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
