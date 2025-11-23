import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../theme/colors";

type MemberStatus = "safe" | "danger" | "unknown";

interface Member {
  status: MemberStatus;
}

interface CircleItemProps {
  title: string;
  members: Member[];
  extraCount?: number;
}

const CircleItem: React.FC<CircleItemProps> = ({
  title,
  members,
  extraCount,
}) => {
  const placeholder = { uri: "https://via.placeholder.com/40" };

  const renderBorder = (status: MemberStatus) => {
    switch (status) {
      case "safe":
        return { borderColor: COLORS.STATE_SAFE };
      case "danger":
        return { borderColor: COLORS.STATE_DANGER };
      case "unknown":
        return { borderColor: COLORS.STATE_UNKNOWN };
      default:
        return { borderColor: "transparent" };
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity>
          <Text style={styles.menu}>...</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.members}>
        {members.slice(0, 5).map((m, i) => (
          <View key={i} style={[styles.avatarWrapper, renderBorder(m.status)]}>
            <Image source={placeholder} style={styles.avatar} />
          </View>
        ))}

        {extraCount ? (
          <View style={[styles.avatarWrapper, styles.extra]}>
            <Text style={styles.extraText}>+{extraCount}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.BACKGROUND_CARD,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.TEXT_DARK,
  },
  menu: {
    fontSize: 26,
    color: COLORS.TEXT_GRAY,
    marginTop: -4,
  },
  members: {
    flexDirection: "row",
    marginTop: 14,
  },
  avatarWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "white",
    borderWidth: 3,
    marginRight: -10,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  extra: {
    backgroundColor: "#E5E5EA",
    borderWidth: 0,
  },
  extraText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.TEXT_DARK,
  },
});

export default CircleItem;
