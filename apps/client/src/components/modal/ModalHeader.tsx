import { theme } from "@/src/theme/theme";
import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Typography } from "../typography";

export interface ModalHeaderProps {
  title: string;
  description?: string;
  style?: StyleProp<ViewStyle>;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({ title, description, style }) => {
  return (
    <View style={[styles.container, style]}>
      <Typography variant="h2" style={{ textAlign: "center" }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" tone="secondary" style={{ textAlign: "center" }}>
          {description}
        </Typography>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: theme.spacing[8],
    width: "100%",
  },
});
