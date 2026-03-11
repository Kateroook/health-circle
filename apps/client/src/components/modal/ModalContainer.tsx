import React, { type ReactNode } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import Modal from "react-native-modal";

import { theme } from "@/src/theme/theme";

type ModalContainerProps = {
  isVisible: boolean;
  onClose?: () => void;
  children: ReactNode;
};

export const ModalContainer: React.FC<ModalContainerProps> = ({ isVisible, onClose, children }) => {
  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      useNativeDriver
      useNativeDriverForBackdrop
      animationIn="zoomIn"
      animationOut="zoomOut"
      animationInTiming={220}
      animationOutTiming={180}
      backdropTransitionInTiming={220}
      backdropTransitionOutTiming={180}
      backdropColor={theme.colors.background.overlay}
      backdropOpacity={1}
      style={styles.modal}
      hideModalContentWhileAnimating
      accessibilityViewIsModal
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardWrapper}
      >
        <View style={styles.container}>{children}</View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: "center",
    alignItems: "center",
    margin: 0,
  },
  keyboardWrapper: {
    width: "100%",
    alignItems: "center",
  },
  container: {
    width: "85%",
    maxWidth: theme.spacing[104] * 4, // ≈ 416
    padding: theme.spacing[16],
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.background.secondary,
    gap: theme.spacing[16],
  },
});
