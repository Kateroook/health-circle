import { Avatar } from "@/src/components/Avatar";
import { ListItem } from "@/src/components/ListItem";
import { STATUS_CONFIG } from "@/src/components/StatusBadge";
import { Typography } from "@/src/components/typography";
import { useCurrentTime } from "@/src/hooks/useCurrentTime";
import { theme } from "@/src/theme/theme";
import { Member } from "@/src/types";
import { getRollCallText, getStatusText } from "@/src/utils/dateUpdate";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";

interface MemberListProps {
  members: Member[];
  hasGroups: boolean;
  onMemberPress: (member: Member) => void;
}

export const MemberList = ({ members, hasGroups, onMemberPress }: MemberListProps) => {
  const currentTime = useCurrentTime();

  return (
    <View style={styles.container}>
      {members.length === 0 ? (
        <View style={styles.emptyState}>
          <Typography variant="body2" tone="secondary" style={styles.emptyStateText}>
            {!hasGroups ? "У вас ще немає кіл" : "Немає контактів у цьому колі"}
          </Typography>
        </View>
      ) : (
        members.map((member, index) => {
          const captionText =
            member.status === "UNKNOWN" && member.lastPersonalRollCallAt
              ? getRollCallText(member.lastPersonalRollCallAt, currentTime)
              : getStatusText(member, currentTime);

          return (
            <ListItem
              key={member.id}
              layout="stateBadge"
              artworkSize="small"
              label={`${member.fullName || `${member.firstName} ${member.lastName}`}`}
              subLabel={STATUS_CONFIG[member.status]?.label ?? "Невідомо"}
              supportCaption={
                <View style={styles.supportCaptionWithIcon}>
                  {member.alertStatus?.active && (
                    <MaterialCommunityIcons
                      name="bullhorn"
                      size={14}
                      color={theme.colors.content.secondary}
                      style={{ marginTop: 1 }}
                    />
                  )}
                  <Typography variant="caption" tone="secondary">
                    {captionText}
                  </Typography>
                </View>
              }
              status={member.status}
              onPress={() => onMemberPress(member)}
              renderAvatar={() => (
                <Avatar userId={member.id} avatarUpdatedAt={member.avatarUpdatedAt} size="sm" />
              )}
              showDivider={index < members.length - 1}
              testId={`dashboard:member_${member.id}:button`}
            />
          );
        })
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.secondary,
    minHeight: 50,
  },
  emptyState: {
    padding: theme.spacing[20],
    alignItems: "center",
  },
  emptyStateText: {
    color: theme.colors.content.secondary,
    fontStyle: "italic",
  },
  supportCaptionWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[4],
  },
});
