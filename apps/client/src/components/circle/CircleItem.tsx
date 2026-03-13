import { COLORS } from "@/src/theme/colors";
import { theme } from "@/src/theme/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { MemberAvatar } from "../MemberAvatar";
import { Typography } from "../typography";

export interface Member {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName?: string;
  isAlias?: boolean;
  avatarUpdatedAt?: string;
  status: "SAFE" | "DANGER" | "UNKNOWN" | "WAS_SAFE";
  active?: boolean;
}

interface CircleItemProps {
  title: string;
  members: Member[];
  extraCount?: number;
  onMenuPress?: () => void;
  onPress?: () => void;
}
const MAX_VISIBLE = 5;
const CircleItem: React.FC<CircleItemProps> = ({
  title,
  members,
  extraCount,
  onMenuPress,
  onPress,
}) => {
  const visibleMembers = members.slice(0, MAX_VISIBLE);
  const overflow = extraCount ?? (members.length > MAX_VISIBLE ? members.length - MAX_VISIBLE : 0);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.header}>
        <Typography variant="h3" weight="bold" numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Typography>
        <TouchableOpacity
          onPress={onMenuPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="dots-horizontal" size={24} color={COLORS.TEXT_GRAY} />
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
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing[8],
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
