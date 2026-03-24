import { Avatar } from "@/src/components/Avatar";
import { ListItem } from "@/src/components/ListItem";
import { STATUS_CONFIG } from "@/src/components/StatusBadge";
import { Typography } from "@/src/components/typography";
import { theme } from "@/src/theme/theme";
import { Member } from "@/src/types";
import React from "react";
import { StyleSheet, View } from "react-native";

interface MemberListProps {
  members: Member[];
  hasGroups: boolean;
  onMemberPress: (member: Member) => void;
}

export const MemberList = ({ members, hasGroups, onMemberPress }: MemberListProps) => {
  return (
    <View style={styles.container}>
      {members.length === 0 ? (
        <View style={styles.emptyState}>
          <Typography variant="body2" tone="secondary" style={styles.emptyStateText}>
            {!hasGroups ? "У вас ще немає кіл" : "Немає контактів у цьому колі"}
          </Typography>
        </View>
      ) : (
        members.map((member, index) => (
          <ListItem
            key={member.id}
            layout="stateBadge"
            artworkSize="small"
            label={`${member.firstName} ${member.lastName}`}
            subLabel={STATUS_CONFIG[member.status]?.label ?? "Невідомо"}
            supportCaption={
              member.lastStatusUpdate
                ? (() => {
                    const date = new Date(member.lastStatusUpdate);
                    const now = new Date();
                    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
                    const diffHours = Math.floor(diffMins / 60);

                    const timeAgo =
                      diffMins < 1
                        ? "щойно"
                        : diffMins < 60
                          ? `${diffMins} хв тому`
                          : diffHours < 24
                            ? `${diffHours} год тому`
                            : date.toLocaleDateString("uk-UA", {
                                day: "2-digit",
                                month: "2-digit",
                              });

                    const statusLabels: Record<string, string> = {
                      SAFE: ``,
                      WAS_SAFE: `нещодавно в безпеці`,
                      DANGER: `потребує допомоги`,
                      UNKNOWN: `востаннє відповів(ла)`,
                    };

                    const label = statusLabels[member.status] ?? "оновив(ла) статус";
                    return `${label} · ${timeAgo}`;
                  })()
                : "ще не відповідав(ла)"
            }
            status={member.status}
            onPress={() => onMemberPress(member)}
            renderAvatar={() => (
              <Avatar userId={member.id} avatarUpdatedAt={member.avatarUpdatedAt} size="sm" />
            )}
            showDivider={index < members.length - 1}
          />
        ))
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
});
