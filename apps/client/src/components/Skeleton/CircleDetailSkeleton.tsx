import { theme } from "@/src/theme/theme";
import React from "react";
import { StyleSheet, View } from "react-native";
import { MemberListSkeleton } from "./MemberListSkeleton";
import { SkeletonBox } from "./SkeletonBox";
import { SkeletonCircle } from "./SkeletonCircle";

export function CircleDetailSkeleton() {
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <SkeletonCircle size={40} />
        <View style={styles.titleBlock}>
          <SkeletonBox width="70%" height={28} borderRadius={8} />
          <SkeletonBox
            width={140}
            height={32}
            borderRadius={theme.radius.pill}
            style={styles.invitePill}
          />
        </View>
        <SkeletonCircle size={48} />
      </View>

      <View style={styles.body}>
        <SkeletonBox
          width="100%"
          height={80}
          borderRadius={theme.radius.xl}
          style={styles.statsCard}
        />
        <View style={styles.membersWrap}>
          <MemberListSkeleton count={5} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: theme.spacing[8],
    paddingVertical: theme.spacing[8],
    gap: theme.spacing[8],
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.opaque,
  },
  titleBlock: {
    flex: 1,
    gap: theme.spacing[4],
  },
  invitePill: {
    alignSelf: "flex-start",
    marginTop: theme.spacing[2],
  },
  body: {
    paddingTop: theme.spacing[16],
    paddingHorizontal: theme.spacing[16],
    gap: theme.spacing[8],
    paddingBottom: theme.spacing[40],
  },
  statsCard: {
    alignSelf: "stretch",
  },
  membersWrap: {
    alignSelf: "stretch",
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius.xl,
    padding: theme.spacing[8],
  },
});
