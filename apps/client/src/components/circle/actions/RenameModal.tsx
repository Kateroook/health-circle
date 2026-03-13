import { Button } from "@/src/components/Button";
import { TextField } from "@/src/components/fields/TextField";
import { ModalActions, ModalContent, ModalHeader } from "@/src/components/modal";
import { ModalContainer } from "@/src/components/modal/ModalContainer";
import { theme } from "@/src/theme/theme";
import React, { useEffect, useState } from "react";

interface RenameModalProps {
  isVisible: boolean;
  title: string;
  placeholder: string;
  caption?: string;
  initialValue?: string;
  onCancel: () => void;
  onSave: (newName: string) => void;
  extraAction?: {
    label: string;
    onPress: () => void;
  };
}

export const RenameModal: React.FC<RenameModalProps> = ({
  isVisible,
  title,
  placeholder,
  caption,
  initialValue = "",
  onCancel,
  onSave,
  extraAction,
}) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (isVisible) setValue(initialValue);
  }, [isVisible, initialValue]);

  if (!isVisible) return null;

  return (
    <ModalContainer isVisible={isVisible} onClose={onCancel}>
      <ModalHeader title={title} />
      <ModalContent noMarginBottom>
        <TextField
          label=""
          placeholder={placeholder}
          value={value}
          onChangeText={setValue}
          autoFocus
          required
          caption={caption}
        />
      </ModalContent>
      <ModalActions>
        <Button
          label="Скасувати"
          hierarchy="secondary"
          shape="rectangle"
          size="medium"
          onPress={onCancel}
        />
        <Button
          label="Зберегти"
          hierarchy="primary"
          shape="rectangle"
          size="medium"
          disabled={value.trim() === "" || value.trim() === initialValue}
          onPress={() => onSave(value.trim())}
        />
      </ModalActions>
      {extraAction && (
        <Button
          label={extraAction.label}
          hierarchy="tertiary"
          shape="rectangle"
          size="medium"
          onPress={extraAction.onPress}
          style={{ width: "100%" }}
          textStyle={{ color: theme.colors.negative }}
        />
      )}
    </ModalContainer>
  );
};
