import React from "react";
import { StyleSheet } from "react-native";

import { theme } from "@/src/theme/theme";
import { Button } from "./Button";
import { ModalActions, ModalContainer, ModalHeader } from "./modal";

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
  testId?: string;
  useContainer?: boolean;
  direction?: "row" | "column";
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
  testId,
  useContainer = true,
  direction = "row",
}) => {
  if (!isVisible) return null;

  const cancelButton = (
    <Button
      label={cancelText}
      hierarchy="secondary"
      size="medium"
      shape="rectangle"
      onPress={onCancel}
      disabled={isLoading}
      testId={testId ? `${testId}:cancel:button` : `confirmationModal:cancel:button`}
      style={styles.fullWidth} // Ensure it fills the wrapper
    />
  );

  const confirmButton = (
    <Button
      label={isLoading ? "..." : confirmText}
      hierarchy="primary"
      size="medium"
      shape="rectangle"
      onPress={onConfirm}
      disabled={isLoading}
      style={[styles.fullWidth, confirmStyle === "destructive" && styles.destructiveBtn]}
      testId={testId ? `${testId}:confirm:button` : `confirmationModal:confirm:button`}
    />
  );

  const content = (
    <>
      <ModalHeader
        title={title}
        description={message}
        testId={testId ? `${testId}:header` : `confirmationModal:header`}
      />
      <ModalActions
        testId={testId ? `${testId}:actions` : `confirmationModal:actions`}
        direction={direction}
      >
        {/* In Column: Confirm is top. In Row: Cancel is left (order depends on your UX) */}
        {direction === "column" ? confirmButton : cancelButton}
        {direction === "column" ? cancelButton : confirmButton}
      </ModalActions>
    </>
  );

  return useContainer ? (
    <ModalContainer isVisible={isVisible} onClose={onCancel} testId={testId}>
      {content}
    </ModalContainer>
  ) : (
    content
  );
};

const styles = StyleSheet.create({
  destructiveBtn: {
    backgroundColor: theme.colors.negative,
  },
  fullWidth: {
    width: "100%",
  },
});
export default ConfirmationModal;
