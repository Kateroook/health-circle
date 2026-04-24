import { theme } from "@/src/theme/theme";
import React, { type ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

export interface ModalActionsProps {
  children: ReactNode;
  /**
   * Layout direction for action buttons. "row" = side by side (default), "column" = stacked (e.g. bottom sheets).
   */
  direction?: "row" | "column";
  /**
   * When false (default for center modals), actions flow in layout.
   * When true, stick to bottom (e.g. bottom sheets).
   */
  sticky?: boolean;
  overlay?: ReactNode;
  bottomInset?: number;
  style?: StyleProp<ViewStyle>;
  /** Gap between buttons. Default from theme. */
  gap?: number;
  testId?: string;
}

export const ModalActions: React.FC<ModalActionsProps> = ({
  children,
  direction = "row",
  sticky = false,
  overlay,
  bottomInset = 0,
  style,
  gap = theme.spacing[8],
  testId,
}) => {
  const content = (
    <View
      style={[
        styles.actionsContainer,
        direction === "column" ? styles.actionsColumn : styles.actionsRow,
        { gap },
      ]}
    >
      {React.Children.map(children, (child, index) => {
        if (!child) return null;
        return (
          <View
            key={index}
            style={direction === "column" ? styles.buttonWrapperColumn : styles.buttonWrapperRow}
          >
            {child}
          </View>
        );
      })}
    </View>
  );

  return (
    <View
      testID={testId}
      style={[
        sticky ? styles.stickyContainer : styles.flexContainer,
        sticky && { bottom: bottomInset },
        style,
      ]}
    >
      {sticky && overlay && <View style={StyleSheet.absoluteFill}>{overlay}</View>}
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  flexContainer: {
    width: "100%",
  },
  stickyContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    width: "100%",
    backgroundColor: "transparent",
    justifyContent: "flex-end",
  },
  actionsContainer: {
    width: "100%",
    alignItems: "stretch",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  actionsColumn: {
    flexDirection: "column",
  },
  buttonWrapperRow: {
    flex: 1,
    justifyContent: "center",
  },
  buttonWrapperColumn: {
    width: "100%",
  },
});
