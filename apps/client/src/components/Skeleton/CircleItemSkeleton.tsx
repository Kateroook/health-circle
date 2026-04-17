import { theme } from "@/src/theme/theme";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

function CircleItemSkeleton() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  return (
    <Animated.View style={[styles.skeletonCard, { opacity }]}>
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonMenu} />
      </View>

      {/* Імітація Members (Аватари що накладаються) */}
      <View style={styles.skeletonMembersRow}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[styles.skeletonAvatarCircle, { marginLeft: i === 0 ? 0 : -12, zIndex: 5 - i }]}
          />
        ))}
      </View>
    </Animated.View>
  );
}

export function CirclesSkeletonList() {
  return (
    <View style={styles.listContainer}>
      {[0, 1, 2].map((i) => (
        <CircleItemSkeleton key={i} />
      ))}
    </View>
  );
}

export default CircleItemSkeleton;

const styles = StyleSheet.create({
  listContainer: {
    marginTop: theme.spacing[16],
  },
  skeletonCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius.xl,
    padding: theme.spacing[16],
    marginBottom: theme.spacing[12],
  },
  skeletonHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing[16],
  },
  skeletonTitle: {
    height: 18,
    width: "40%",
    borderRadius: 9,
    backgroundColor: theme.colors.border.opaque,
  },
  skeletonMenu: {
    width: 24,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.border.opaque,
  },
  skeletonMembersRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  skeletonAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.border.opaque,
    borderWidth: 2,
    borderColor: theme.colors.background.secondary,
  },
});
