import { COLORS } from "@/src/theme/colors";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MemberAvatar from "../MemberAvatar";

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  active: boolean;
}

interface CircleItemProps {
  title: string;
  members: Member[];
  extraCount?: number;
  onMenuPress?: () => void;
}

const CircleItem: React.FC<CircleItemProps> = ({
  title,
  members,
  extraCount,
  onMenuPress,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity
          onPress={onMenuPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.menu}>...</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.members}>
        {members.slice(0, 5).map((member) => (
          <MemberAvatar key={member.id} member={member} />
        ))}

        {(members.length > 5 || extraCount) && (
          <View style={[styles.avatarWrapper, styles.extra]}>
            <Text style={styles.extraText}>
              +{extraCount || members.length - 5}
            </Text>
          </View>
        )}
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
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.TEXT_DARK,
  },
  menu: {
    fontSize: 26,
    color: COLORS.TEXT_GRAY,
    marginTop: -8,
  },
  members: {
    flexDirection: "row",
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
  extra: {
    backgroundColor: "#E5E5EA",
    borderColor: "white",
    zIndex: 0,
  },
  extraText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.TEXT_DARK,
  },
});

export default CircleItem;
