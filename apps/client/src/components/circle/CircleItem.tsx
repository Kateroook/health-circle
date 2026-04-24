import { theme } from "@/src/theme/theme";
import { Member } from "@/src/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { MemberAvatar } from "../MemberAvatar";
import { Typography } from "../typography";

interface CircleItemProps {
  title: string;
  members: Member[];
  extraCount?: number;
  onMenuPress?: () => void;
  onPress?: () => void;
  testId?: string;
}
const MAX_VISIBLE = 5;
const CircleItem: React.FC<CircleItemProps> = ({
  title,
  members,
  extraCount,
  onMenuPress,
  onPress,
  testId,
}) => {
  const visibleMembers = members.slice(0, MAX_VISIBLE);
  const overflow = extraCount ?? (members.length > MAX_VISIBLE ? members.length - MAX_VISIBLE : 0);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
      testID={testId}
      accessibilityLabel={testId}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Typography variant="h3" weight="bold" numberOfLines={1} ellipsizeMode="tail">
            {title}
          </Typography>
        </View>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={onMenuPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          testID={testId ? `${testId}:menu:button` : undefined}
          accessibilityLabel={testId ? `${testId}:menu:button` : undefined}
        >
          <MaterialCommunityIcons
            name="dots-horizontal"
            size={24}
            color={theme.colors.content.tertiary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.members}>
        {visibleMembers.map((member, index) => (
          <MemberAvatar
            key={member.id}
            member={member}
            size="lg"
            style={[styles.avatarOverlap, { zIndex: MAX_VISIBLE - index }]}
          />
        ))}

        {overflow > 0 && (
          <View style={[styles.avatarWrapper, styles.extraBubble, { zIndex: 0 }]}>
            <Typography variant="subtitle1" tone="secondary">
              +{overflow}
            </Typography>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius.xl,
    padding: theme.spacing[16],
    marginBottom: theme.spacing[8],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing[8],
  },
  titleContainer: {
    flex: 1,
    minWidth: 0,
    marginRight: theme.spacing[8],
  },
  menuButton: {
    flexShrink: 0,
  },
  members: {
    flexDirection: "row",
  },
  avatarWrapper: {
    marginRight: -12,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  avatarOverlap: {
    marginRight: -12,
  },
  extraBubble: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.circle,
    backgroundColor: theme.colors.background.tertiary,
    borderWidth: theme.borderWidth.md,
    borderColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default CircleItem;
