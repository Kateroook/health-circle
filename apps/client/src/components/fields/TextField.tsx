import { Feather } from "@expo/vector-icons";
import React, { ReactNode, useCallback, useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

import { Typography } from "@/src/components/typography";
import { theme } from "@/src/theme/theme";

export type TextFieldInteractionState = "enabled" | "pressed" | "active" | "activeTyping";

export type TextFieldValidationState = "none" | "error" | "success" | "incomplete" | "complete";

export interface BaseTextFieldProps extends Omit<
  TextInputProps,
  "style" | "onChange" | "onChangeText" | "value"
> {
  label?: string;
  /**
   * Controlled value. If omitted, the field will manage its own value using `defaultValue`.
   */
  value?: string;
  /**
   * Initial value for uncontrolled usage.
   */
  defaultValue?: string;
  onChangeText?: (text: string) => void;
  /**
   * Optional caption shown below the field when there is no error or success message.
   */
  caption?: string;
  /**
   * Validation message for the error state. Overrides `caption` text.
   */
  errorMessage?: string;
  /**
   * Validation message for the success state. Overrides `caption` text (unless `errorMessage` is set).
   */
  successMessage?: string;
  /**
   * Mark the field as required. Used to derive `incomplete` / `complete` states on blur.
   */
  required?: boolean;
  /**
   * Custom hint icon rendered in the caption row (left side).
   */
  hintIcon?: ReactNode;
  /**
   * Leading artwork rendered inside the input container, to the left of the text.
   */
  leadingArtwork?: ReactNode;
  /**
   * Trailing artwork rendered inside the input container, to the right of the text and clear button.
   */
  trailingArtwork?: ReactNode;
  /**
   * Show a clear button while typing (`ActiveTyping` state). Defaults to `true`.
   */
  showClearButton?: boolean;
  /**
   * Disable the field. When disabled, interaction / validation states and clear button are suppressed.
   */
  disabled?: boolean;
  /**
   * Force a specific validation state from the outside. If omitted, a best-effort state is derived
   */
  validationState?: Exclude<TextFieldValidationState, "incomplete" | "complete" | "none">;
  testId?: string;
}

export interface TextFieldProps extends BaseTextFieldProps {}

export interface PasswordFieldProps extends Omit<BaseTextFieldProps, "secureTextEntry"> {
  /**
   * Whether the password should be visible by default. Defaults to `false`.
   */
  defaultVisible?: boolean;
}

export interface PhoneFieldProps extends BaseTextFieldProps {
  /**
   * Optional ISO country code for future formatting / masking logic.
   * Currently informational only – formatting can be added on top of this base architecture.
   */
  countryCode?: string;
}

export { PinCodeField } from "./PinCodeField";

const ICON_SIZE = 20;

/**
 * Layout primitives
 * Each subcomponent is small and focused so other field types (PasswordField, PhoneField, SearchField, etc.)
 * can reuse or swap them while keeping a consistent architecture.
 */

export const TextFieldLabelRow: React.FC<{
  label?: string;
  required?: boolean;
  characterCount?: string;
  labelTrailing?: ReactNode;
}> = ({ label, required, characterCount, labelTrailing }) => {
  if (!label && !characterCount && !labelTrailing) return null;

  return (
    <View style={styles.labelRow}>
      <View style={styles.labelLeft}>
        {label ? (
          <Typography variant="subtitle1" tone="primary">
            {label}
            {required ? " *" : ""}
          </Typography>
        ) : null}
      </View>
      {characterCount ? (
        <Typography variant="subtitle1" tone="tertiary">
          {characterCount}
        </Typography>
      ) : (
        (labelTrailing ?? null)
      )}
    </View>
  );
};

export const TextFieldRoot: React.FC<{
  disabled?: boolean;
  interactionState: TextFieldInteractionState;
  validationState: TextFieldValidationState;
  children: ReactNode;
}> = ({ disabled, interactionState, validationState, children }) => {
  const { backgroundColor, borderColor, borderWidth, overlayStyle } = getContainerVisuals(
    interactionState,
    validationState,
    disabled,
  );

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor,
          borderColor,
          borderWidth,
        },
        overlayStyle,
      ]}
    >
      {children}
    </View>
  );
};

export const TextFieldLeading: React.FC<{ children: ReactNode }> = ({ children }) => {
  if (!children) return null;
  return <View style={styles.leading}>{children}</View>;
};

export const TextFieldTrailing: React.FC<{ children: ReactNode }> = ({ children }) => {
  if (!children) return null;
  return <View style={styles.trailing}>{children}</View>;
};

export const TextFieldInput = React.forwardRef<
  TextInput,
  {
    value: string;
    onChangeText: (text: string) => void;
    disabled?: boolean;
    onFocus?: () => void;
    onBlur?: () => void;
    testId?: string;
  } & Omit<
    TextInputProps,
    "style" | "onChangeText" | "editable" | "value" | "placeholderTextColor" | "onFocus" | "onBlur"
  >
>(({ value, onChangeText, disabled, multiline, onFocus, onBlur, testId, ...rest }, ref) => {
  return (
    <TextInput
      testID={testId}
      accessibilityLabel={testId}
      {...rest}
      ref={ref}
      style={[styles.input, multiline && styles.multilineInput]}
      value={value}
      onChangeText={onChangeText}
      placeholderTextColor={theme.colors.content.tertiary}
      editable={!disabled}
      multiline={multiline}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  );
});

TextFieldInput.displayName = "TextFieldInput";

export const TextFieldClearButton: React.FC<{ onClear: () => void }> = ({ onClear }) => {
  return (
    <TouchableOpacity onPress={onClear} style={styles.clearButton} hitSlop={8}>
      <Feather name="x-circle" size={ICON_SIZE} color={theme.colors.content.primary} />
    </TouchableOpacity>
  );
};

export const TextFieldHint: React.FC<{
  text?: string;
  tone: "secondary" | "negative" | "positive";
  icon?: ReactNode;
}> = ({ text, tone, icon }) => {
  if (!text) return null;

  return (
    <View style={styles.captionRow}>
      <View style={styles.captionLeft}>
        {icon}
        <Typography variant="caption" tone={tone} style={styles.captionText}>
          {text}
        </Typography>
      </View>
    </View>
  );
};

export const resolveInteractionState = ({
  isFocused,
  isPressed,
  hasValue,
  disabled,
}: {
  isFocused: boolean;
  isPressed: boolean;
  hasValue: boolean;
  disabled?: boolean;
}): TextFieldInteractionState => {
  if (disabled) return "enabled";
  if (isFocused && hasValue) return "activeTyping";
  if (isFocused) return "active";
  if (isPressed) return "pressed";
  return "enabled";
};

export const resolveValidationState = ({
  explicitValidation,
  required,
  hasValue,
  hasBlurred,
  hasError,
  hasSuccess,
}: {
  explicitValidation?: Exclude<TextFieldValidationState, "incomplete" | "complete" | "none">;
  required?: boolean;
  hasValue: boolean;
  hasBlurred: boolean;
  hasError: boolean;
  hasSuccess: boolean;
}): TextFieldValidationState => {
  if (explicitValidation) {
    return explicitValidation;
  }

  if (hasError) return "error";
  if (hasSuccess) return "success";

  if (required && hasBlurred && !hasValue) return "incomplete";
  if (required && hasBlurred && hasValue) return "complete";

  return "none";
};

export const getContainerVisuals = (
  interactionState: TextFieldInteractionState,
  validationState: TextFieldValidationState,
  disabled?: boolean,
): {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  overlayStyle: ViewStyle | undefined;
} => {
  if (disabled) {
    return {
      backgroundColor: theme.colors.background.tertiary,
      borderColor: theme.colors.border.transparent,
      borderWidth: theme.borderWidth.xs,
      overlayStyle: { opacity: 0.5 },
    };
  }

  // Validation overrides interaction visuals when applicable
  if (validationState === "error") {
    return {
      backgroundColor: theme.colors.background.secondary,
      borderColor: theme.colors.border.negative,
      borderWidth: theme.borderWidth.md,
      overlayStyle: undefined,
    };
  }

  if (validationState === "success") {
    return {
      backgroundColor: theme.colors.background.secondary,
      borderColor: theme.colors.border.positive,
      borderWidth: theme.borderWidth.md,
      overlayStyle: undefined,
    };
  }

  if (interactionState === "active" || interactionState === "activeTyping") {
    return {
      backgroundColor: theme.colors.background.secondary,
      borderColor: theme.colors.border.selected,
      borderWidth: theme.borderWidth.md,
      overlayStyle: undefined,
    };
  }

  // Incomplete & complete keep the default tertiary background by design
  return {
    backgroundColor: theme.colors.background.tertiary,
    borderColor: theme.colors.border.transparent,
    borderWidth: theme.borderWidth.xs,
    overlayStyle: interactionState === "pressed" ? { opacity: 0.9 } : undefined,
  };
};

const getCaptionContent = (
  validationState: TextFieldValidationState,
  errorMessage?: string,
  successMessage?: string,
  caption?: string,
): { text: string | undefined; tone: "secondary" | "negative" | "positive"; icon: ReactNode } => {
  if (validationState === "error" && errorMessage) {
    return {
      text: errorMessage,
      tone: "negative",
      icon: (
        <Feather
          name="alert-circle"
          size={ICON_SIZE}
          color={theme.colors.negative}
          style={styles.captionIcon}
        />
      ),
    };
  }

  if (validationState === "success" && successMessage) {
    return {
      text: successMessage,
      tone: "positive",
      icon: (
        <Feather
          name="check-circle"
          size={ICON_SIZE}
          color={theme.colors.positive}
          style={styles.captionIcon}
        />
      ),
    };
  }

  if (caption) {
    return {
      text: caption,
      tone: "secondary",
      icon: (
        <Feather
          name="info"
          size={ICON_SIZE}
          color={theme.colors.content.tertiary}
          style={styles.captionIcon}
        />
      ),
    };
  }

  return {
    text: undefined,
    tone: "secondary",
    icon: null,
  };
};

const getValidationTrailingIcon = (
  validationState: TextFieldValidationState,
  interactionState: TextFieldInteractionState,
): ReactNode | null => {
  // Do not show validation icons while the user is interacting (pressed/active/typing)
  if (interactionState !== "enabled") {
    return null;
  }

  if (validationState === "incomplete") {
    return (
      <Feather
        name="alert-circle"
        size={ICON_SIZE}
        color={theme.colors.negative}
        style={styles.trailingIcon}
      />
    );
  }

  if (validationState === "complete") {
    return (
      <Feather
        name="check-circle"
        size={ICON_SIZE}
        color={theme.colors.positive}
        style={styles.trailingIcon}
      />
    );
  }

  return null;
};

const BaseTextField: React.FC<BaseTextFieldProps> = (props) => {
  const {
    label,
    value,
    defaultValue,
    onChangeText,
    placeholder,
    caption,
    errorMessage,
    successMessage,
    required,
    hintIcon,
    leadingArtwork,
    trailingArtwork,
    showClearButton = true,
    disabled,
    validationState: validationStateProp,
    maxLength,
    secureTextEntry,
    keyboardType,
    multiline,
    numberOfLines,
    autoCapitalize,
    testId,
    ...restInputProps
  } = props;

  const inputRef = useRef<TextInput>(null);
  const [innerValue, setInnerValue] = useState<string>(defaultValue ?? "");
  const [isFocused, setIsFocused] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [hasBlurred, setHasBlurred] = useState(false);

  const isControlled = value !== undefined;
  const textValue = isControlled ? value! : innerValue;

  const handleChangeText = useCallback(
    (text: string) => {
      if (!isControlled) {
        setInnerValue(text);
      }
      if (!hasBlurred && text.length === 0) {
        // Keep incomplete/complete decisions until user has blurred
      }
      onChangeText?.(text);
    },
    [isControlled, onChangeText, hasBlurred],
  );

  const handleClear = useCallback(() => {
    if (!isControlled) {
      setInnerValue("");
    }
    onChangeText?.("");
  }, [isControlled, onChangeText]);

  const handleFocus = useCallback(() => {
    if (disabled) return;
    setIsFocused(true);
  }, [disabled]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    setHasBlurred(true);
  }, []);

  const hasValue = textValue != null && textValue.length > 0;
  const hasError = Boolean(errorMessage);
  const hasSuccess = Boolean(successMessage) && !hasError;

  const interactionState = useMemo(
    () => resolveInteractionState({ isFocused, isPressed, hasValue, disabled }),
    [isFocused, isPressed, hasValue, disabled],
  );

  const validationState = useMemo(
    () =>
      resolveValidationState({
        explicitValidation: validationStateProp,
        required,
        hasValue,
        hasBlurred,
        hasError,
        hasSuccess,
      }),
    [validationStateProp, required, hasValue, hasBlurred, hasError, hasSuccess],
  );

  const characterCount = maxLength ? `${textValue?.length ?? 0} / ${maxLength}` : undefined;
  const showClear =
    !disabled &&
    showClearButton &&
    interactionState === "activeTyping" &&
    (textValue?.length ?? 0) > 0;

  const captionData = getCaptionContent(validationState, errorMessage, successMessage, caption);
  const validationIcon = getValidationTrailingIcon(validationState, interactionState);

  return (
    <View style={styles.container}>
      <TextFieldLabelRow label={label} required={required} characterCount={characterCount} />

      <TextFieldRoot
        disabled={disabled}
        interactionState={interactionState}
        validationState={validationState}
      >
        <TextFieldLeading>{leadingArtwork}</TextFieldLeading>

        <TextFieldInput
          ref={inputRef}
          testId={testId}
          {...restInputProps}
          value={textValue}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          disabled={disabled}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />

        {showClear && <TextFieldClearButton onClear={handleClear} />}

        {validationIcon}

        <TextFieldTrailing>{trailingArtwork}</TextFieldTrailing>
      </TextFieldRoot>

      <TextFieldHint
        text={captionData.text}
        tone={captionData.tone}
        icon={hintIcon ?? captionData.icon}
      />
    </View>
  );
};

export const TextField: React.FC<TextFieldProps> = (props) => {
  return <BaseTextField {...props} />;
};

export const PasswordField: React.FC<PasswordFieldProps> = ({
  defaultVisible = false,
  trailingArtwork,
  ...rest
}) => {
  const [visible, setVisible] = useState(defaultVisible);

  const toggle = useCallback(() => {
    setVisible((prev) => !prev);
  }, []);

  const passwordToggle = (
    <TouchableOpacity onPress={toggle} style={styles.passwordToggle} hitSlop={8}>
      <Feather
        name={visible ? "eye-off" : "eye"}
        size={ICON_SIZE}
        color={theme.colors.content.tertiary}
      />
    </TouchableOpacity>
  );

  // Compose any consumer-provided trailing artwork after the password toggle
  const composedTrailing =
    trailingArtwork != null ? (
      <View style={styles.trailingGroup}>
        {passwordToggle}
        {trailingArtwork}
      </View>
    ) : (
      passwordToggle
    );

  return (
    <BaseTextField
      {...rest}
      secureTextEntry={!visible}
      autoCapitalize={rest.autoCapitalize ?? "none"}
      trailingArtwork={composedTrailing}
    />
  );
};

export const PhoneField: React.FC<PhoneFieldProps> = ({ countryCode, leadingArtwork, ...rest }) => {
  const phoneIcon =
    leadingArtwork ??
    (countryCode ? (
      <Typography variant="body1" tone="secondary">
        +{countryCode}
      </Typography>
    ) : (
      <Feather
        name="phone"
        size={ICON_SIZE}
        color={theme.colors.content.secondary}
        style={styles.leadingIcon}
      />
    ));

  return (
    <BaseTextField
      {...rest}
      leadingArtwork={phoneIcon}
      keyboardType={rest.keyboardType ?? "phone-pad"}
      autoCapitalize={rest.autoCapitalize ?? "none"}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing[8],
  },
  labelLeft: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: theme.spacing[8],
  },
  root: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing[8],
    paddingVertical: theme.spacing[16],
  },
  leading: {
    marginRight: theme.spacing[8],
    justifyContent: "center",
    alignItems: "center",
  },
  trailing: {
    paddingHorizontal: theme.spacing[8],
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  trailingGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    fontSize: theme.typography.fontSize.body1,
    lineHeight: theme.typography.lineHeight.body1,
    color: theme.colors.content.primary,
    paddingVertical: 0,
    paddingHorizontal: theme.spacing[8],
  },
  multilineInput: {
    textAlignVertical: "top",
  },
  clearButton: {
    paddingHorizontal: theme.spacing[8],
    justifyContent: "center",
    alignItems: "center",
  },
  passwordToggle: {
    justifyContent: "center",
    alignItems: "center",
  },
  leadingIcon: {
    paddingHorizontal: theme.spacing[8],
  },
  trailingIcon: {
    paddingHorizontal: theme.spacing[8],
  },
  captionRow: {
    marginTop: theme.spacing[8],
  },
  captionLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  captionText: {
    marginBottom: 0,
  },
  captionIcon: {
    marginRight: theme.spacing[4],
  },
});
