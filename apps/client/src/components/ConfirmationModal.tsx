import { COLORS } from "@/src/theme/colors";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Modal from "react-native-modal";

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
  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onCancel}
      onBackButtonPress={onCancel}
      useNativeDriver
      useNativeDriverForBackdrop
      style={styles.modal}
      backdropOpacity={0.4}
    >
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        {message && <Text style={styles.message}>{message}</Text>}

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.btn, styles.cancelBtn]}
            onPress={onCancel}
            disabled={isLoading}
          >
            <Text style={styles.cancelText}>{cancelText}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.btn,
              confirmStyle === "destructive"
                ? styles.destructiveBtn
                : styles.confirmBtn,
              isLoading && styles.disabled,
            ]}
            onPress={onConfirm}
            disabled={isLoading}
          >
            <Text
              style={[
                styles.confirmText,
                confirmStyle === "destructive" ? { color: "white" } : {},
              ]}
            >
              {isLoading ? "..." : confirmText}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: "center",
    alignItems: "center",
    margin: 20,
  },
  container: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    color: COLORS.TEXT_GRAY,
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 20,
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  destructiveBtn: {
    backgroundColor: "black",
  },
  confirmBtn: {
    backgroundColor: COLORS.PRIMARY_BLUE,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  confirmText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  disabled: {
    opacity: 0.6,
  },
});

export default ConfirmationModal;
