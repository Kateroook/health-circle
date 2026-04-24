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
  testId?: string;
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
  testId,
}) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (isVisible) setValue(initialValue);
  }, [isVisible, initialValue]);

  if (!isVisible) return null;

  return (
    <ModalContainer isVisible={isVisible} onClose={onCancel} testId={testId}>
      <ModalHeader title={title} testId={testId ? `${testId}:header` : undefined} />
      <ModalContent noMarginBottom testId={testId ? `${testId}:content` : undefined}>
        <TextField
          label=""
          placeholder={placeholder}
          value={value}
          onChangeText={setValue}
          autoFocus
          required
          caption={caption}
          testId={testId ? `${testId}:input` : undefined}
        />
      </ModalContent>
      <ModalActions testId={testId ? `${testId}:actions` : undefined}>
        <Button
          label="Скасувати"
          hierarchy="secondary"
          shape="rectangle"
          size="medium"
          onPress={onCancel}
          testId={testId ? `${testId}:cancel:button` : undefined}
        />
        <Button
          label="Зберегти"
          hierarchy="primary"
          shape="rectangle"
          size="medium"
          disabled={value.trim() === "" || value.trim() === initialValue}
          onPress={() => onSave(value.trim())}
          testId={testId ? `${testId}:submit:button` : undefined}
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
          testId={testId ? `${testId}:extraAction:button` : undefined}
        />
      )}
    </ModalContainer>
  );
};
