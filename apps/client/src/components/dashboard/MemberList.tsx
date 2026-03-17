import React from "react";
import { StyleSheet, View } from "react-native";
import { Avatar } from "@/src/components/Avatar";
import { ListItem } from "@/src/components/ListItem";
import { STATUS_CONFIG } from "@/src/components/StatusBadge";
import { Typography } from "@/src/components/typography";
import { theme } from "@/src/theme/theme";
import { Member } from "@/src/types";

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
        members.map((member) => (
          <ListItem
            key={member.id}
            layout="stateBadge"
            artworkSize="small"
            label={`${member.firstName} ${member.lastName}`}
            subLabel={STATUS_CONFIG[member.status]?.label ?? "Невідомо"}
            status={member.status}
            onPress={() => onMemberPress(member)}
            renderAvatar={() => (
              <Avatar userId={member.id} avatarUpdatedAt={member.avatarUpdatedAt} size="sm" />
            )}
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
    marginTop: theme.spacing[8],
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
