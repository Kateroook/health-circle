import { getAvatarUrl } from "@/src/api/api";
import { theme } from "@/src/theme/theme";
import { useAuthStore } from "@/src/store/authStore";
import React, { useEffect, useMemo, useState } from "react";
import { Image, ImageSourcePropType, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_MAP: Record<AvatarSize, { outer: number; inner: number }> = {
  xs: { outer: 32, inner: 24 },
  sm: { outer: 48, inner: 32 },
  md: { outer: 56, inner: 48 },
  lg: { outer: 64, inner: 52 },
  xl: { outer: 100, inner: 84 },
};

const BORDER_CONFIG: Record<AvatarSize, { colorBorder: number; whiteBorder: number }> = {
  xs: { colorBorder: 2, whiteBorder: 1 },
  sm: { colorBorder: 3, whiteBorder: 1.5 },
  md: { colorBorder: 6, whiteBorder: 2 },
  lg: { colorBorder: 7, whiteBorder: 2 },
  xl: { colorBorder: 9, whiteBorder: 3 },
};

const DEFAULT_AVATAR = require("@/src/assets/images/default-avatar.png");

interface AvatarProps {
  userId?: string;
  avatarUpdatedAt?: string;
  source?: ImageSourcePropType;

  size?: AvatarSize;

  showStatusRing?: boolean;
  showOuterRing?: boolean;
  statusColor?: string;

  style?: StyleProp<ViewStyle>;
}
export const Avatar: React.FC<AvatarProps> = ({
  userId,
  avatarUpdatedAt,
  source,
  size = "md",
  showStatusRing = false,
  showOuterRing = false,
  statusColor = "white",
  style,
}) => {
  const [imageError, setImageError] = useState(false);
  const accessToken = useAuthStore((state) => state.accessToken);

  const { outer, inner } = SIZE_MAP[size];
  const { colorBorder, whiteBorder } = BORDER_CONFIG[size];

  const hasStatus = showStatusRing;
  const hasOuter = showOuterRing && hasStatus;

  let containerSize = outer;
  if (hasOuter) containerSize += whiteBorder * 2;

  const imageContainerSize = hasStatus ? inner : outer;
  useEffect(() => {
    setImageError(false);
  }, [source, userId, avatarUpdatedAt]);

  const resolvedSource = useMemo(() => {
    if (source) return source;

    if (userId) {
      const url = getAvatarUrl(userId, avatarUpdatedAt);
      if (url && !imageError) {
        return {
          uri: url,
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
          cache: "reload",
        };
      }
    }

    return DEFAULT_AVATAR;
  }, [source, userId, avatarUpdatedAt, imageError, accessToken]);

  const image = (
    <Image
      source={resolvedSource}
      style={styles.image}
      resizeMode="cover"
      onError={() => setImageError(true)}
    />
  );

  if (!hasStatus) {
    return <View style={[styles.circle, { width: outer, height: outer }, style]}>{image}</View>;
  }

  return (
    <View
      style={[
        styles.circle,
        hasOuter && {
          width: outer + whiteBorder * 2,
          height: outer + whiteBorder * 2,
          borderWidth: whiteBorder,
          borderColor: "white",
          backgroundColor: "white",
        },
        !hasOuter && {
          width: outer,
          height: outer,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.circle,
          {
            width: outer,
            height: outer,
            borderWidth: colorBorder,
            borderColor: statusColor,
            backgroundColor: "white",
          },
        ]}
      >
        <View
          style={[
            styles.circle,
            {
              width: inner,
              height: inner,
            },
          ]}
        >
          {image}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    borderRadius: theme.radius.circle,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: theme.radius.circle,
    backgroundColor: theme.colors.background.tertiary,
  },
});
