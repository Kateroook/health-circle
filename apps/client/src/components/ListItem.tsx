/**
 * ListItem component — design system primitive.
 *
 * Supports 5 layout variants × 3 artwork sizes to match the Figma "List item" component set.
 *
 * Layout variants:
 *   "compact"    – Icon + label + arrow (navigational row)
 *   "simple"     – Avatar + label + subLabel + supportCaption (info row)
 *   "stateBadge" – Avatar + label + state text + supportCaption + warning badge
 *   "check"      – Avatar + label + text + checkmark indicator
 *   "switch"     – Label + text + toggle switch
 *
 * Artwork sizes (left-side visual):
 *   "small" – 24 px icon  (compact) / 48 px avatar (others)
 *   "large" – 36 px icon  (compact) / 48 px avatar (others)
 *   "none"  – no left artwork, 16 px left padding
 */
import { theme } from "@/src/theme/theme";
import { AntDesign, FontAwesome6, Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBadge, UserStatus } from "./StatusBadge";
import { Typography } from "./typography/Typography";

export type ListItemLayout = "compact" | "simple" | "stateBadge" | "check" | "switch";
export type ListItemArtworkSize = "small" | "large" | "none";

export interface ListItemProps {
  /** Layout variant — determines the tail element and text lines shown. */
  layout?: ListItemLayout;
  /** Size of the left-side artwork slot. */
  artworkSize?: ListItemArtworkSize;
  /** Primary label (always visible). */
  label: string;
  /** Secondary label shown below the primary label (simple / stateBadge / check / switch). */
  subLabel?: string;
  /** Third line of supporting text (simple / stateBadge). */
  supportCaption?: React.ReactNode;
  /**
   * Icon rendered in the compact artwork frame.
   * Pass any ReactNode (e.g. an <Ionicons> or a custom SVG wrapper).
   * Ignored when artworkSize is "none".
   */
  leadingIcon?: React.ReactNode;
  /** Avatar image source for simple / stateBadge / check layouts. */
  avatarSource?: ImageSourcePropType;
  renderAvatar?: () => React.ReactNode;
  /** Show the 1 px opaque divider at the bottom. Defaults to true. */
  showDivider?: boolean;
  /** Called when the row is pressed. */
  onPress?: () => void;
  /** Current value of the switch (switch layout). */
  switchValue?: boolean;
  /** Called when the switch is toggled (switch layout). */
  onSwitchChange?: (value: boolean) => void;
  /** Whether the checkmark is shown as selected (check layout). */
  checked?: boolean;
  status?: UserStatus;
  /** Hide the right-side chevron icon (compact layout). Defaults to false. */
  hideChevron?: boolean;
  /** Custom icon to show on the right side (compact layout). */
  trailingIcon?: React.ReactNode;
  testId?: string;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/** 48 × 48 px circular avatar image. */
const AvatarImage = ({ source }: { source?: ImageSourcePropType }) => (
  <View style={styles.avatarContainer}>
    <Image
      source={source ?? require("@/src/assets/images/default-avatar.png")}
      style={styles.avatar}
    />
  </View>
);

/** Arrow icon for compact / navigational rows. */
const ArrowRight = () => (
  <Ionicons name="chevron-forward" size={20} color={theme.colors.content.primary} />
);

/** Blue filled checkmark for the check layout tail. */
const CheckmarkBadge = ({ selected }: { selected?: boolean }) => (
  <View style={[styles.checkBadge, selected && styles.checkBadgeSelected]}>
    {selected && <Ionicons name="checkmark" size={16} color={theme.colors.content.onColor} />}
  </View>
);

// ─── Divider ─────────────────────────────────────────────────────────────────

const Divider = ({ offset }: { offset: number }) => (
  <View style={[styles.dividerWrapper, { paddingLeft: offset }]}>
    <View style={styles.dividerLine} />
  </View>
);

// ─── Main component ───────────────────────────────────────────────────────────

export const ListItem: React.FC<ListItemProps> = ({
  layout = "compact",
  artworkSize = "small",
  label,
  subLabel,
  supportCaption,
  leadingIcon,
  renderAvatar,
  avatarSource,
  showDivider = false,
  onPress,
  switchValue = false,
  onSwitchChange,
  checked = false,
  status,
  hideChevron = false,
  trailingIcon,
  testId,
}) => {
  const isCompact = layout === "compact";

  // Divider left offset mirrors artwork frame width (matches Figma padding-left values)
  const dividerOffset =
    artworkSize === "none"
      ? theme.spacing[16]
      : isCompact && artworkSize === "small"
        ? theme.spacing[56]
        : theme.spacing[64];

  // ── Artwork frame (left) ────────────────────────────────────────────────────
  const renderLeadingArtwork = () => {
    if (artworkSize === "none") return null;

    if (isCompact) {
      const iconSize = artworkSize === "large" ? 36 : 24;
      return (
        <View
          style={[
            styles.compactArtworkFrame,
            artworkSize === "large" && styles.compactArtworkFrameLarge,
          ]}
        >
          {leadingIcon ?? (
            <AntDesign name="heart" size={iconSize} color={theme.colors.content.primary} />
          )}
        </View>
      );
    }

    return (
      <View style={styles.avatarFrame}>
        {renderAvatar ? renderAvatar() : <AvatarImage source={avatarSource} />}
      </View>
    );
  };

  // ── Tail artwork (right) ────────────────────────────────────────────────────
  const renderTailArtwork = () => {
    switch (layout) {
      case "compact":
        if (trailingIcon) {
          return <View style={styles.tailArrowFrame}>{trailingIcon}</View>;
        }
        if (hideChevron) return null;
        return (
          <View style={styles.tailArrowFrame}>
            <ArrowRight />
          </View>
        );
      case "stateBadge":
        return (
          <View style={styles.tailBadgeFrame}>
            {status ? (
              <StatusBadge
                status={status}
                variant="round"
                testId={testId ? `${testId}:badge:${status}` : `statusBadge:${status}`}
              />
            ) : null}
          </View>
        );
      case "check":
        return (
          <View style={styles.tailBadgeFrame}>
            <CheckmarkBadge selected={checked} />
          </View>
        );
      case "switch":
        return (
          <View style={styles.tailSwitchFrame}>
            <CustomToggle
              value={switchValue}
              onValueChange={onSwitchChange ?? (() => {})}
              testId={testId ? `${testId}:switch` : undefined}
            />
          </View>
        );
      case "simple":
      default:
        return null;
    }
  };

  // ── Text content ────────────────────────────────────────────────────────────
  const contentPadding = isCompact ? styles.textContentCompact : styles.textContentExpanded;

  const renderTextContent = () => (
    <View style={[styles.textContent, contentPadding]}>
      <Typography
        variant="subtitle1"
        tone="primary"
        style={styles.label}
        testId={testId ? `${testId}:label` : undefined}
      >
        {label}
      </Typography>
      {subLabel !== undefined && (
        <Typography
          variant="subtitle1"
          tone="secondary"
          style={styles.subLabel}
          testId={testId ? `${testId}:subLabel` : undefined}
          accessible={true}
          importantForAccessibility="yes"
        >
          {subLabel}
        </Typography>
      )}
      {supportCaption !== undefined &&
        (typeof supportCaption === "string" || typeof supportCaption === "number" ? (
          <Typography
            variant="body2"
            tone="secondary"
            style={styles.supportCaption}
            testId={testId ? `${testId}:supportCaption` : undefined}
          >
            {supportCaption}
          </Typography>
        ) : (
          <View
            style={styles.supportCaption}
            testID={testId ? `${testId}:supportCaption` : undefined}
            accessibilityLabel={testId ? `${testId}:supportCaption` : undefined}
          >
            {supportCaption}
          </View>
        ))}
    </View>
  );

  // ── Root container ──────────────────────────────────────────────────────────
  const rowPaddingLeft = artworkSize === "none" ? theme.spacing[16] : 0;

  return (
    <Pressable
      testID={testId}
      accessibilityLabel={testId}
      onPress={onPress}
      style={({ pressed }) => [styles.root, pressed && onPress && styles.rootPressed]}
    >
      {/* Content row */}
      <View style={[styles.contentRow, { paddingLeft: rowPaddingLeft }]}>
        {renderLeadingArtwork()}
        {renderTextContent()}
        {renderTailArtwork()}
      </View>

      {/* Divider */}
      {showDivider && <Divider offset={dividerOffset} />}
    </Pressable>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    backgroundColor: theme.colors.background.secondary,
    flex: 1,
  },
  rootPressed: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.radius.lg,
  },

  // Content row
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  // Leading artwork — compact icon
  compactArtworkFrame: {
    width: theme.spacing[56],
    paddingVertical: theme.spacing[12],
    paddingHorizontal: theme.spacing[16],
    alignItems: "center",
    justifyContent: "center",
  },
  compactArtworkFrameLarge: {
    width: theme.spacing[64],
    paddingHorizontal: 0,
  },

  // Leading artwork — avatar
  avatarFrame: {
    width: theme.spacing[64],
    height: theme.spacing[64],
    padding: theme.spacing[8],
    alignItems: "center",
    justifyContent: "center",
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.circle,
    overflow: "hidden",
    backgroundColor: theme.colors.background.tertiary,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.circle,
  },

  // Text content
  textContent: {
    flex: 1,
    flexDirection: "column",
    gap: theme.spacing[4],
    alignItems: "center",
  },
  textContentCompact: {
    paddingVertical: theme.spacing[12],
  },
  textContentExpanded: {
    paddingVertical: theme.spacing[16],
  },
  label: {
    alignSelf: "stretch",
  },
  subLabel: {
    alignSelf: "stretch",
  },
  supportCaption: {
    alignSelf: "stretch",
  },

  // Tail — arrow
  tailArrowFrame: {
    width: theme.spacing[64],
    paddingVertical: theme.spacing[12],
    paddingHorizontal: theme.spacing[16],
    alignItems: "center",
    justifyContent: "center",
  },

  // Tail — badge (warning / checkmark)
  tailBadgeFrame: {
    paddingVertical: theme.spacing[8],
    paddingHorizontal: theme.spacing[8],
    alignItems: "center",
    justifyContent: "center",
  },

  // Tail — switch
  tailSwitchFrame: {
    paddingVertical: theme.spacing[8],
    paddingHorizontal: theme.spacing[16],
    alignItems: "center",
    justifyContent: "center",
  },

  // Warning badge shell
  warningBadge: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.circle,
    backgroundColor: theme.colors.background.lightNegative,
    alignItems: "center",
    justifyContent: "center",
  },

  // Checkmark badge shell
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.circle,
    borderWidth: 2,
    borderColor: theme.colors.border.opaque,
    alignItems: "center",
    justifyContent: "center",
  },
  checkBadgeSelected: {
    borderWidth: 0,
    backgroundColor: theme.colors.accent,
  },

  // Divider
  dividerWrapper: {
    alignSelf: "stretch",
  },
  dividerLine: {
    height: 1,
    backgroundColor: theme.colors.border.opaque,
  },
});

export default ListItem;

const CustomToggle = ({
  value,
  onValueChange,
  testId,
}: {
  value: boolean;
  onValueChange: (newValue: boolean) => void;
  testId?: string;
}) => {
  return (
    <TouchableOpacity
      testID={testId}
      accessibilityLabel={testId}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      activeOpacity={0.8}
      onPress={() => onValueChange(!value)}
      style={{
        width: 54,
        height: 32,
        borderRadius: theme.radius.pill,
        backgroundColor: value ? theme.colors.accent : theme.colors.background.tertiary,
        justifyContent: "center",
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[4],
      }}
    >
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.colors.primaryA,
          alignSelf: value ? "flex-end" : "flex-start",
          justifyContent: "center",
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.22,
          shadowRadius: 2.22,
          elevation: 3,
        }}
      >
        {value ? (
          <FontAwesome6 name="check" color={theme.colors.accent} size={16} />
        ) : (
          <FontAwesome6 name="xmark" color={theme.colors.primitives.grey[300]} size={16} />
        )}
      </View>
    </TouchableOpacity>
  );
};
