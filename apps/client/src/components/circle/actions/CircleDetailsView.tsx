import { AntDesign, Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { MemberAvatar } from "../../MemberAvatar";
import { ListItem } from "../../ListItem";
import { Typography } from "../../typography";
import { theme } from "@/src/theme/theme";
import { Member } from "@/src/types";

interface CircleDetailsViewProps {
  name: string;
  inviteCode: string;
  members: Member[];
  isOwner: boolean;
  onClose: () => void;
  onRenamePress: () => void;
  onUnsubscribePress: () => void;
  onMemberPress: (member: Member) => void;
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

  const unknownCount = members.filter((m) => m.status === "UNKNOWN" || !m.status).length;
  const safeCount = members.filter((m) => m.status === "SAFE").length;
  const wasSafeCount = members.filter((m) => m.status === "WAS_SAFE").length;

  return (
    <View style={styles.outerContainer}>
      <View style={styles.headerArea}>
        <View style={styles.headerTop}>
          <View style={styles.titleInfo}>
            <TouchableOpacity onPress={onClose} style={styles.backArrow}>
              <AntDesign name="left" size={24} color={theme.colors.content.primary} />
            </TouchableOpacity>
            <Typography variant="h2" weight="bold" style={styles.title} numberOfLines={1}>
              {name}
            </Typography>
          </View>
        </View>

        <View style={styles.codeWrapper}>
          <View style={styles.codeContainer}>
            <Typography variant="body2" weight="semibold" style={styles.codeText}>
              Код: {inviteCode}
            </Typography>
            <TouchableOpacity
              onPress={handleCopy}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.copyButton}
            >
              <AntDesign name="copy" size={16} color={theme.colors.content.primary} />
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
          <Typography variant="h3" weight="bold" style={styles.membersCountText}>
            {members.length} учасників
          </Typography>
          <TouchableOpacity onPress={onRollCallPress} style={styles.rollCallButton}>
            <Typography variant="body2" weight="bold" style={styles.rollCallButtonText}>
              Перекличка
            </Typography>
            <Feather name="rss" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
        <Typography variant="body2" weight="regular" style={styles.statsSummaryText}>
          {unknownCount} не відповіли,{"\n"}
          {wasSafeCount} нещодавно в безпеці, {safeCount} в безпеці
        </Typography>
      </View>

      <ScrollView
        style={styles.membersList}
        contentContainerStyle={styles.membersListContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.membersCard}>
          {members.map((member, index) => (
            <ListItem
              key={member.id}
              layout="stateBadge"
              label={member.fullName || `${member.firstName} ${member.lastName}`.trim()}
              subLabel={
                member.status === "SAFE"
                  ? "У безпеці"
                  : member.status === "WAS_SAFE"
                    ? "Був у безпеці"
                    : "Невідомо"
              }
              supportCaption={
                member.status === "SAFE"
                  ? "19:05"
                  : member.status === "WAS_SAFE"
                    ? "У безпеці о 18:56"
                    : "19:05"
              }
              status={member.status}
              renderAvatar={() => <MemberAvatar member={member} />}
              onPress={() => onMemberPress(member)}
              showDivider={index < members.length - 1}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: theme.colors.background.primary,
    flex: 1,
    paddingTop: theme.spacing[64],
  },
  headerArea: {
    paddingHorizontal: theme.spacing[20],
    marginBottom: theme.spacing[20],
    position: "relative",
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
    marginRight: theme.spacing[16],
  },
  backArrow: {
    marginRight: theme.spacing[16],
  },
  title: {
    color: theme.colors.content.primary,
  },
  editButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: 18,
    shadowColor: theme.colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    position: "absolute",
    right: theme.spacing[20],
    top: 0,
  },
  codeWrapper: {
    flexDirection: "row",
    paddingLeft: 40,
    marginTop: 8,
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background.tertiary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.md,
  },
  codeText: {
    color: theme.colors.content.primary,
    marginRight: 10,
  },
  copyButton: {
    padding: 2,
  },
  statsCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius.xl,
    marginHorizontal: theme.spacing[20],
    padding: theme.spacing[20],
    marginBottom: theme.spacing[20],
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
    color: theme.colors.content.primary,
  },
  rollCallButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    paddingHorizontal: theme.spacing[16],
    paddingVertical: theme.spacing[10],
    borderRadius: 14,
    gap: 6,
    shadowColor: theme.colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  rollCallButtonText: {
    color: "#FFFFFF",
  },
  statsSummaryText: {
    color: theme.colors.content.primary,
    lineHeight: 18,
    opacity: 0.8,
  },
  membersList: {
    paddingHorizontal: theme.spacing[20],
  },
  membersListContent: {
    paddingBottom: 40,
  },
  membersCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius.xl,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
});
