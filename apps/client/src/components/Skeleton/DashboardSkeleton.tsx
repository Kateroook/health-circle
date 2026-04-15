import { theme } from "@/src/theme/theme";
import React from "react";
import { StyleSheet, View } from "react-native";
import { MemberListSkeleton } from "./MemberListSkeleton";
import { SkeletonBox } from "./SkeletonBox";
import { SkeletonCircle } from "./SkeletonCircle";

export function DashboardSkeleton() {
  return (
    <View>
      <View style={styles.statusButtonWrap}>
        <SkeletonCircle size={236} />
      </View>
      <View style={styles.section}>
        <SkeletonBox width={120} height={12} borderRadius={6} style={styles.sectionLabel} />

        <View style={styles.filtersRow}>
          {[0, 1, 2].map((i) => (
            <SkeletonBox key={i} width={64} height={32} borderRadius={theme.radius.pill} />
          ))}
        </View>

        <MemberListSkeleton count={4} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius.xl,
    padding: theme.spacing[16],
    gap: theme.spacing[8],
    marginTop: theme.spacing[104],
  },
  statusButtonWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing[8],
  },
  sectionLabel: {
    alignSelf: "flex-start",
    marginBottom: theme.spacing[8],
  },
  filtersRow: {
    flexDirection: "row",
    gap: theme.spacing[8],
    marginBottom: theme.spacing[4],
  },
});
