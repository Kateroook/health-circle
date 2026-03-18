import { theme } from "@/src/theme/theme";
import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import { Avatar, AvatarSize } from "./Avatar";
import { Member } from "../types";

export const STATUS_COLORS: Record<Member["status"], string> = {
  SAFE: theme.colors.state.safe,
  DANGER: theme.colors.state.emergency,
  UNKNOWN: theme.colors.state.unknown,
  WAS_SAFE: theme.colors.state.beenSafe,
};

interface MemberAvatarProps {
  member: Member;
  size?: AvatarSize;
  style?: StyleProp<ViewStyle>;
}

export const MemberAvatar: React.FC<MemberAvatarProps> = ({ member, size = "md", style }) => {
  return (
    <Avatar
      userId={member.id}
      avatarUpdatedAt={member.avatarUpdatedAt}
      size={size}
      border
      borderColor={STATUS_COLORS[member.status] ?? theme.colors.state.unknown}
      style={style}
    />
  );
};
