import { getAvatarUrl } from "@/src/api/api";
import { COLORS } from "@/src/theme/colors";
import React, { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Member } from "./circle/CircleItem";

const getBorderColor = (status: Member["status"]) => {
  const colorMap: Record<Member["status"], string> = {
    SAFE: COLORS.STATE_SAFE,
    DANGER: COLORS.STATE_DANGER,
    UNKNOWN: COLORS.STATE_UNKNOWN,
  };

  return colorMap[status] ?? COLORS.STATE_UNKNOWN;
};

const MemberAvatar = ({ member }: { member: Member }) => {
  const [imageError, setImageError] = useState(false);
  const avatarUrl = getAvatarUrl(member.id, member.avatarUpdatedAt);
  const borderColor = getBorderColor(member.status);
  const defaultAvatar = require("@/src/assets/images/default-avatar.png");

  return (
    <View style={[styles.avatarWrapper, { borderColor }]}>
      <Image
        source={!imageError && avatarUrl ? { uri: avatarUrl } : defaultAvatar}
        style={styles.avatar}
        onError={() => setImageError(true)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  avatarWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "white",
    borderWidth: 3,
    marginRight: -10,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EEE",
  },
  initialsContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#D1D5DB",
  },
  initialsText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4B5563",
  },
});

export default MemberAvatar;
