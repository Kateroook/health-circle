import { theme } from "@/src/theme/theme";
import React from "react";
import { StyleSheet, View } from "react-native";
import { SkeletonBox } from "./SkeletonBox";
import { SkeletonCircle } from "./SkeletonCircle";

export interface MemberRowSkeletonProps {
  showDivider?: boolean;
}

export function MemberRowSkeleton({ showDivider = false }: MemberRowSkeletonProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.avatarFrame}>
          <SkeletonCircle size={44} />
        </View>
        <View style={styles.textCol}>
          <SkeletonBox width={140} height={14} borderRadius={7} />
          <SkeletonBox width={90} height={11} borderRadius={6} style={styles.statusLine} />
        </View>
        <View style={styles.tailFrame}>
          <SkeletonCircle size={32} />
        </View>
      </View>
      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "stretch",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  avatarFrame: {
    width: theme.spacing[64],
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: {
    flex: 1,
    justifyContent: "center",
  },
  statusLine: {
    marginTop: 6,
  },
  tailFrame: {
    paddingVertical: theme.spacing[8],
    paddingHorizontal: theme.spacing[8],
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border.opaque,
    marginLeft: theme.spacing[64],
  },
});
