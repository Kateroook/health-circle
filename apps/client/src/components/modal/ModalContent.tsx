import { theme } from "@/src/theme/theme";
import React, { type ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

export interface ModalContentProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Remove bottom margin when content is followed by ModalActions */
  noMarginBottom?: boolean;
  testId?: string;
}

export const ModalContent: React.FC<ModalContentProps> = ({
  children,
  style,
  noMarginBottom = false,
  testId,
}) => {
  return (
    <View
      testID={testId}
      accessibilityLabel={testId}
      style={[styles.content, noMarginBottom && styles.contentNoMargin, style]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    width: "100%",
    flexGrow: 1,
    flexShrink: 1,
    marginBottom: theme.spacing[16],
  },
  contentNoMargin: {
    marginBottom: 0,
  },
});
