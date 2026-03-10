import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

import { theme } from "@/src/theme/theme";
import { ModalActions, ModalContainer, ModalHeader } from "./modal";
import { Typography } from "./typography";

interface ConfirmationModalProps {
  isVisible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  cancelText?: string;
  confirmText?: string;
  confirmStyle?: "destructive" | "default";
  isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isVisible,
  onCancel,
  onConfirm,
  title,
  message,
  cancelText = "Назад",
  confirmText = "Видалити",
  confirmStyle = "destructive",
  isLoading = false,
}) => {
  if (!isVisible) {
    return null;
  }

  return (
    <ModalContainer isVisible={isVisible} onClose={onCancel}>
      <ModalHeader title={title} description={message} />
      <ModalActions>
        <TouchableOpacity
          style={[styles.btn, styles.cancelBtn]}
          onPress={onCancel}
          disabled={isLoading}
        >
          <Typography variant="subtitle1" weight="semibold" tone="primary">
            {cancelText}
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.btn,
            confirmStyle === "destructive" ? styles.destructiveBtn : styles.confirmBtn,
            isLoading && styles.disabled,
          ]}
          onPress={onConfirm}
          disabled={isLoading}
        >
          <Typography
            variant="subtitle1"
            tone={confirmStyle === "destructive" ? "onColor" : "onColor"}
          >
            {isLoading ? "..." : confirmText}
          </Typography>
        </TouchableOpacity>
      </ModalActions>
    </ModalContainer>
  );
};

const styles = StyleSheet.create({
  btn: {
    height: theme.spacing[48],
    borderRadius: theme.radius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: theme.colors.background.tertiary,
  },
  destructiveBtn: {
    backgroundColor: theme.colors.negative,
  },
  confirmBtn: {
    backgroundColor: theme.colors.primaryB,
  },
  disabled: {
    opacity: 0.6,
  },
});

export default ConfirmationModal;
