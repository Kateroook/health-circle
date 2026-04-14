import { ToastContext, ToastStack } from "@/src/components/Toast/ToastProvider";
import React, { useContext, useEffect, useState, type ReactNode } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import Modal from "react-native-modal";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { theme } from "@/src/theme/theme";

type ModalContainerProps = {
  isVisible: boolean;
  onClose?: () => void;
  children: ReactNode;
  fullScreen?: boolean;
  testId?: string;
};

export const ModalContainer: React.FC<ModalContainerProps> = ({
  isVisible,
  onClose,
  children,
  fullScreen = false,
  testId,
}) => {
  const insets = useSafeAreaInsets();
  const toastCtx = useContext(ToastContext);
  const [showToasts, setShowToasts] = useState(false);

  useEffect(() => {
    if (isVisible) setShowToasts(true);
  }, [isVisible]);

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
      onModalWillHide={() => setShowToasts(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={[styles.keyboardWrapper, fullScreen && { flex: 1 }]}
      >
        <View
          testID={testId}
          accessibilityLabel={testId}
          style={[styles.container, fullScreen && styles.fullScreenContainer]}
        >
          {children}
        </View>
      </KeyboardAvoidingView>
      {toastCtx && showToasts && <ToastStack insets={{ top: insets.top }} />}
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
