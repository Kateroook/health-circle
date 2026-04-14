import { theme } from "@/src/theme/theme";
import React from "react";
import { StyleSheet, View } from "react-native";
import { MemberRowSkeleton } from "./MemberRowSkeleton";

export interface MemberListSkeletonProps {
  count?: number;
}

export function MemberListSkeleton({ count = 4 }: MemberListSkeletonProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }, (_, i) => (
        <MemberRowSkeleton key={i} showDivider={i < count - 1} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.secondary,
    minHeight: 50,
  },
});
