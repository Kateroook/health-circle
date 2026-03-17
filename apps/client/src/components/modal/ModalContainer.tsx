import React, { type ReactNode } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import Modal from "react-native-modal";

import { theme } from "@/src/theme/theme";

type ModalContainerProps = {
  isVisible: boolean;
  onClose?: () => void;
  children: ReactNode;
  fullScreen?: boolean;
};

export const ModalContainer: React.FC<ModalContainerProps> = ({
  isVisible,
  onClose,
  children,
  fullScreen = false,
}) => {
  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      useNativeDriver
      useNativeDriverForBackdrop
      animationIn={fullScreen ? "slideInUp" : "zoomIn"}
      animationOut={fullScreen ? "slideOutDown" : "zoomOut"}
      animationInTiming={220}
      animationOutTiming={180}
      backdropTransitionInTiming={220}
      backdropTransitionOutTiming={180}
      backdropColor={theme.colors.background.overlay}
      backdropOpacity={fullScreen ? 0 : 1}
      style={[styles.modal, fullScreen && styles.fullScreenModal]}
      hideModalContentWhileAnimating
      accessibilityViewIsModal
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={[styles.keyboardWrapper, fullScreen && { flex: 1 }]}
      >
        <View style={[styles.container, fullScreen && styles.fullScreenContainer]}>{children}</View>
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
  fullScreenModal: {
    margin: 0,
    width: "100%",
    height: "100%",
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
  fullScreenContainer: {
    width: "100%",
    maxWidth: "100%",
    height: "100%",
    borderRadius: 0,
    padding: 0,
    gap: 0,
  },
});
