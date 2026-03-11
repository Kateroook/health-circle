import React, { ReactNode, useCallback, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from "react-native";

import { Typography } from "@/src/components/typography";
import { theme } from "@/src/theme/theme";
import {
  getContainerVisuals,
  resolveInteractionState,
  resolveValidationState,
  TextFieldHint,
  TextFieldInteractionState,
  TextFieldLabelRow,
  TextFieldValidationState,
} from "./TextField";

export interface PinCodeFieldProps extends Omit<
  TextInputProps,
  | "value"
  | "defaultValue"
  | "onChangeText"
  | "onFocus"
  | "onBlur"
  | "secureTextEntry"
  | "multiline"
  | "numberOfLines"
  | "keyboardType"
  | "style"
> {
  label?: string;
  value?: string;
  labelTrailing?: ReactNode;
  defaultValue?: string;
  onChangeText?: (value: string) => void;
  required?: boolean;
  caption?: string;
  errorMessage?: string;
  successMessage?: string;
  hintIcon?: ReactNode;
  disabled?: boolean;
  /**
   * - "pin": numeric only, shows dots
   * - "code": alphanumeric, shows characters (for invite / verification codes)
   */
  variant?: "pin" | "code";
}

const PIN_LENGTH = 6;
const SLOT_SIZE = 56;
const SLOT_GAP = 4;

const getCaptionContent = (
  validationState: TextFieldValidationState,
  errorMessage?: string,
  successMessage?: string,
  caption?: string,
): { text: string | undefined; tone: "secondary" | "negative" | "positive" } => {
  if (validationState === "error" && errorMessage) {
    return { text: errorMessage, tone: "negative" };
  }
  if (validationState === "success" && successMessage) {
    return { text: successMessage, tone: "positive" };
  }
  if (caption) {
    return { text: caption, tone: "secondary" };
  }
  return { text: undefined, tone: "secondary" };
};

const getSlotVisuals = ({
  interactionState,
  validationState,
  isActiveSlot,
  isFilled,
  disabled,
}: {
  interactionState: TextFieldInteractionState;
  validationState: TextFieldValidationState;
  isActiveSlot: boolean;
  isFilled: boolean;
  disabled?: boolean;
}): { borderColor: string; borderWidth: number; backgroundColor: string; opacity?: number } => {
  const { backgroundColor } = getContainerVisuals(interactionState, validationState, disabled);

  if (disabled) {
    return {
      backgroundColor: theme.colors.background.secondary,
      borderColor: theme.colors.border.transparent,
      borderWidth: theme.borderWidth.xs,
      opacity: 0.6,
    };
  }

  if (validationState === "error") {
    return {
      backgroundColor: theme.colors.background.secondary,
      borderColor: theme.colors.border.negative,
      borderWidth: theme.borderWidth.sm,
    };
  }

  if (validationState === "success") {
    return {
      backgroundColor: theme.colors.background.secondary,
      borderColor: theme.colors.border.positive,
      borderWidth: theme.borderWidth.sm,
    };
  }

  if (isActiveSlot && (interactionState === "active" || interactionState === "activeTyping")) {
    return {
      backgroundColor,
      borderColor: theme.colors.border.selected,
      borderWidth: theme.borderWidth.sm,
    };
  }

  return {
    backgroundColor,
    borderColor: isFilled ? theme.colors.border.opaque : theme.colors.border.transparent,
    borderWidth: theme.borderWidth.xs,
  };
};

export const PinCodeField: React.FC<PinCodeFieldProps> = ({
  label,
  value,
  defaultValue,
  onChangeText,
  required,
  caption,
  errorMessage,
  successMessage,
  hintIcon,
  disabled,
  variant = "pin",
  autoFocus,
  labelTrailing,
  ...rest
}) => {
  const inputRef = useRef<TextInput | null>(null);
  const [innerValue, setInnerValue] = useState(defaultValue ?? "");
  const [isFocused, setIsFocused] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [hasBlurred, setHasBlurred] = useState(false);

  const isControlled = value !== undefined;
  const rawValue = isControlled ? value! : innerValue;
  const normalizedValue =
    variant === "pin"
      ? (rawValue ?? "").replace(/\D/g, "").slice(0, PIN_LENGTH)
      : (rawValue ?? "")
          .replace(/[^a-zA-Z0-9]/g, "")
          .toUpperCase()
          .slice(0, PIN_LENGTH);

  const hasValue = normalizedValue.length > 0;
  const hasError = Boolean(errorMessage);
  const hasSuccess = Boolean(successMessage) && !hasError;

  const interactionState = useMemo(
    () => resolveInteractionState({ isFocused, isPressed, hasValue, disabled }),
    [isFocused, isPressed, hasValue, disabled],
  );

  const validationState = useMemo(
    () =>
      resolveValidationState({
        required,
        hasValue: normalizedValue.length === PIN_LENGTH,
        hasBlurred,
        hasError,
        hasSuccess,
        explicitValidation: undefined,
      }),
    [required, normalizedValue.length, hasBlurred, hasError, hasSuccess],
  );

  const captionData = getCaptionContent(validationState, errorMessage, successMessage, caption);

  const commitValue = useCallback(
    (nextRaw: string) => {
      const next =
        variant === "pin"
          ? (nextRaw ?? "").replace(/\D/g, "").slice(0, PIN_LENGTH)
          : (nextRaw ?? "")
              .replace(/[^a-zA-Z0-9]/g, "")
              .toUpperCase()
              .slice(0, PIN_LENGTH);
      if (!isControlled) setInnerValue(next);
      onChangeText?.(next);
    },
    [isControlled, onChangeText, variant],
  );

  const handlePressIn = useCallback(() => setIsPressed(true), []);
  const handlePressOut = useCallback(() => setIsPressed(false), []);

  const handleFocus = useCallback(() => {
    if (disabled) return;
    setIsFocused(true);
  }, [disabled]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    setHasBlurred(true);
  }, []);

  return (
    <View style={styles.container}>
      <TextFieldLabelRow label={label} required={required} labelTrailing={labelTrailing} />

      {/* hidden input */}
      <Pressable
        style={styles.container}
        onPress={() => {
          if (!disabled) {
            inputRef.current?.focus();
          }
        }}
      >
        {/* hidden input */}
        <TextInput
          ref={inputRef}
          value={normalizedValue}
          onChangeText={commitValue}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoFocus={autoFocus}
          editable={!disabled}
          keyboardType={variant === "pin" ? "number-pad" : "default"}
          textContentType="oneTimeCode"
          importantForAutofill="yes"
          maxLength={PIN_LENGTH}
          caretHidden
          style={styles.hiddenInput}
          {...rest}
        />

        {/* Slots */}
        <View style={styles.slotsRow}>
          {Array.from({ length: PIN_LENGTH }).map((_, idx) => {
            const char = normalizedValue[idx] ?? "";

            const isActiveSlot =
              isFocused && idx === Math.min(normalizedValue.length, PIN_LENGTH - 1);

            const slot = getSlotVisuals({
              interactionState,
              validationState,
              isActiveSlot,
              isFilled: Boolean(char),
              disabled,
            });

            return (
              <View
                key={idx}
                style={[
                  styles.slot,
                  {
                    backgroundColor: slot.backgroundColor,
                    borderColor: slot.borderColor,
                    borderWidth: slot.borderWidth,
                    opacity: slot.opacity,
                  },
                ]}
              >
                {variant === "pin" ? (
                  char ? (
                    <View style={styles.dot} />
                  ) : null
                ) : (
                  <Typography variant="subtitle1" tone="primary" weight="bold">
                    {char}
                  </Typography>
                )}
              </View>
            );
          })}
        </View>
      </Pressable>
      <TextFieldHint text={captionData.text} tone={captionData.tone} icon={hintIcon} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    width: 1,
    height: 1,
  },
  slotsRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: SLOT_GAP,
  },
  slot: {
    width: SLOT_SIZE,
    height: SLOT_SIZE,
    borderRadius: theme.radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  slotContent: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.content.primary,
  },
});
