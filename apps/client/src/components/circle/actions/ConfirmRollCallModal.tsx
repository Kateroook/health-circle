import { theme } from "@/src/theme/theme";
import { StyleSheet, View } from "react-native";
import { Avatar } from "../../Avatar";
import { Button } from "../../Button";
import { ModalActions, ModalContainer, ModalHeader } from "../../modal";
import { Typography } from "../../typography";

interface RollCallModalProps {
  isVisible: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
  title?: string;
  description?: string;
  cancelText?: string;
  confirmText?: string;
  isLoading?: boolean;
}

export const ConfirmRollCallModal: React.FC<RollCallModalProps> = ({
  isVisible,
  onCancel,
  onConfirm,
  title = `Запитати "Як ти?"`,
  description = "Ми надішлемо нагадування усім учасникам Кола, щоб вони відмітили свій стан під час тривоги",
  cancelText = "Скасувати",
  confirmText = "Запитати",
  isLoading = false,
}) => {
  return (
    <ModalContainer isVisible={isVisible} onClose={onCancel}>
      <ModalHeader title={title} description={description} />
      <View style={styles.rcMessageBubble}>
        <Avatar
          source={require("@/src/assets/images/Logo-nobackground.png")}
          size="xs"
        />
        <View style={styles.rcMessageTextContainer}>
          <Typography
            variant="body2"
            weight="bold"
            style={{ color: theme.colors.content.primary, marginBottom: 0 }}
          >
            Як ти?
          </Typography>
          <Typography
            variant="body2"
            style={{ color: theme.colors.content.primary, marginBottom: 0 }}
          >
            Відміть, будь ласка, свій стан
          </Typography>
        </View>
        <Typography variant="body2" style={styles.rcTimeText}>
          {new Date().toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}
        </Typography>
      </View>
      <ModalActions direction="row">
        <Button
          label={cancelText}
          hierarchy="secondary"
          shape="rectangle"
          size="medium"
          onPress={onCancel}
          disabled={isLoading}
        />
        <Button
          label={isLoading ? "..." : confirmText}
          hierarchy="primary"
          shape="rectangle"
          size="medium"
          onPress={onConfirm}
          disabled={isLoading}
        />
      </ModalActions>
    </ModalContainer>
  );
};

const styles = StyleSheet.create({
  rcMessageBubble: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: theme.spacing[12],
    borderRadius: theme.radius.xl,
    width: "100%",

    backgroundColor: "rgba(255,255,255,0.6)",
    borderWidth: 1,
    borderColor: theme.colors.primaryA,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  rcMessageTextContainer: {
    marginLeft: theme.spacing[8],
  },
  rcTimeText: {
    color: theme.colors.content.secondary,
    marginLeft: "auto",
  },
});
