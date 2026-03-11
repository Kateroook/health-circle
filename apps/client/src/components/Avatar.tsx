import { getAvatarUrl } from "@/src/api/api";
import { theme } from "@/src/theme/theme";
import React, { useState } from "react";
import { Image, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

const SIZE_MAP: Record<AvatarSize, { outer: number; inner: number }> = {
  sm: { outer: 48, inner: 32 },
  md: { outer: 56, inner: 48 },
  lg: { outer: 64, inner: 52 },
  xl: { outer: 100, inner: 84 },
};
const BORDER_CONFIG: Record<AvatarSize, { colorBorder: number; whiteBorder: number }> = {
  sm: { colorBorder: 3, whiteBorder: 1.5 },
  md: { colorBorder: 6, whiteBorder: 2 },
  lg: { colorBorder: 7, whiteBorder: 2 },
  xl: { colorBorder: 9, whiteBorder: 3 },
};
const DEFAULT_AVATAR = require("@/src/assets/images/default-avatar.png");

interface AvatarProps {
  userId: string;
  avatarUpdatedAt?: string;
  size?: AvatarSize;
  border?: boolean;
  borderColor?: string;
  style?: StyleProp<ViewStyle>;
}

export const Avatar: React.FC<AvatarProps> = ({
  userId,
  avatarUpdatedAt,
  size = "md",
  border = false,
  borderColor = "white",
  style,
}) => {
  const [imageError, setImageError] = useState(false);
  const avatarUrl = getAvatarUrl(userId, avatarUpdatedAt);
  const { outer, inner } = SIZE_MAP[size];

  const image = (
    <Image
      source={!imageError && avatarUrl ? { uri: avatarUrl } : DEFAULT_AVATAR}
      style={[
        styles.image,
        !border && {
          width: outer,
          height: outer,
          borderRadius: outer / 2,
        },
        border && {
          width: inner,
          height: inner,
          borderRadius: inner / 2,
        },
      ]}
      onError={() => setImageError(true)}
      resizeMode="cover"
    />
  );

  if (!border) return image;

  const { colorBorder, whiteBorder } = BORDER_CONFIG[size];
  const totalBorder = colorBorder + whiteBorder;

  return (
    // White outer ring
    <View
      style={[
        styles.wrapper,
        {
          width: outer + whiteBorder * 2,
          height: outer + whiteBorder * 2,
          borderRadius: (outer + whiteBorder * 2) / 2,
          borderWidth: whiteBorder,
          borderColor: "white",
          padding: 0,
        },
        style,
      ]}
    >
      {/* Colored ring */}
      <View
        style={{
          width: outer,
          height: outer,
          borderRadius: outer / 2,
          borderWidth: colorBorder,
          borderColor,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "white",
        }}
      >
        {image}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    backgroundColor: theme.colors.background.tertiary,
  },
});
