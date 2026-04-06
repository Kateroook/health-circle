import { AntDesign, Feather, FontAwesome6 } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React, { useState } from "react";
import { Linking, Platform, StyleSheet, ToastAndroid, TouchableOpacity, View } from "react-native";
import { theme } from "../theme/theme";
import { Member } from "../types";
import { Avatar } from "./Avatar";
import { Button } from "./Button";
import { ConfirmRollCallModal } from "./circle/actions/ConfirmRollCallModal";
import { RenameModal } from "./circle/actions/RenameModal";
import ConfirmationModal from "./ConfirmationModal";
import { StatusBadge } from "./StatusBadge";
import { Typography } from "./typography";

interface MemberProfileViewProps {
  member: Member;
  onRollCall?: () => void;
  onMessage?: () => void;
  onBlock?: () => void;
  onRemove?: () => void;
  onRename?: (newName: string) => void;
  isOwner?: boolean;
}

export const MemberProfileView = ({
  member,
  onRollCall,
  onMessage,
  onBlock,
  onRemove,
  onRename,
  isOwner,
}: MemberProfileViewProps) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [isRollCallModalVisible, setIsRollCallModalVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRemoveModalVisible, setIsRemoveModalVisible] = useState(false);

  const handleContact = () => {
    if (member.phone) {
      Linking.openURL(`tel:${member.phone}`);
    } else {
      Linking.openURL("tel:");
    }
  };

  const handleCopyLocation = async (copyStr?: string) => {
    const coords = copyStr || `${member.latitude || ""}, ${member.longitude || ""}`;
    if (coords !== ", " && coords !== "") {
      await Clipboard.setStringAsync(coords);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (Platform.OS === "android") {
        ToastAndroid.show("Координати скопійовано!", ToastAndroid.SHORT);
      }
    }
  };

  const renderLocation = () => {
    if (member.status !== "DANGER") return null;

    const hasCoords = !!(member.latitude && member.longitude);
    const hasAddress = !!(member.region || member.district);

    if (!hasCoords && !hasAddress) return null;

    let locationText = "";
    if (hasAddress) {
      locationText = `${member.region || ""}${member.region && member.district ? ", " : ""}${member.district || ""}`;
    } else if (hasCoords) {
      locationText = `${member.latitude?.toFixed(4)}, ${member.longitude?.toFixed(4)}`;
    }

    const copyCoords = `${member.latitude || ""}, ${member.longitude || ""}`;

    return (
      <TouchableOpacity
        onPress={() => handleCopyLocation(copyCoords)}
        style={styles.locationContainer}
        hitSlop={10}
        testID="profile:copyLocation:button"
        accessibilityLabel="profile:copyLocation:button"
      >
        <FontAwesome6 name="location-dot" size={16} color={theme.colors.content.primary} />
        <Typography variant="body1" style={styles.locationText} weight="semibold">
          {locationText}
        </Typography>
        {copied ? (
          <Feather
            name="check"
            size={16}
            color={theme.colors.state.safe}
            style={{ marginLeft: 8 }}
          />
        ) : (
          <AntDesign
            name="copy"
            size={16}
            color={theme.colors.content.primary}
            style={{ marginLeft: 8 }}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Rename Modal */}
      <RenameModal
        isVisible={isRenaming}
        title="Редагування імʼя"
        placeholder="Введіть нове імʼя"
        caption="Це імʼя буде відображатися у вашому колі"
        initialValue={member.fullName || member.firstName}
        onCancel={() => setIsRenaming(false)}
        onSave={(newName) => {
          onRename?.(newName);
          setIsRenaming(false);
        }}
        extraAction={
          member.isAlias
            ? {
                label: "Відновити оригінальне імʼя",
                onPress: () => {
                  onRename?.("");
                  setIsRenaming(false);
                },
              }
            : undefined
        }
        testId="profile:rename:modal"
      />

      {/* Roll Call Modal */}
      <ConfirmRollCallModal
        isVisible={isRollCallModalVisible}
        onCancel={() => setIsRollCallModalVisible(false)}
        onConfirm={async () => {
          setIsRollCallModalVisible(false);
          onRollCall?.();
        }}
        testId="profile:confirmRollCall:modal"
      />

      {/* Remove Modal */}
      <ConfirmationModal
        isVisible={isRemoveModalVisible}
        onCancel={() => setIsRemoveModalVisible(false)}
        onConfirm={() => {
          setIsRemoveModalVisible(false);
          onRemove?.();
        }}
        title="Видалити учасника?"
        message={`${member.fullName || member.firstName} буде видалено з кола`}
        confirmText="Видалити"
        cancelText="Назад"
        confirmStyle="destructive"
        testId="profile:remove:modal"
      />

      <View style={styles.profileSection}>
        <Avatar userId={member.id} avatarUpdatedAt={member.avatarUpdatedAt} size="xl" />
        <Typography variant="h2" tone="primary" style={styles.name}>
          {member.fullName || `${member.firstName} ${member.lastName}`}
        </Typography>
        <View style={[styles.statusContainer, { flexDirection: "column", gap: theme.spacing[8] }]}>
          <View style={styles.statusContainer}>
            <StatusBadge variant="pill" status={member.status} />
            {onRollCall && (
              <Button
                shape="round"
                hierarchy="secondary"
                size="medium"
                onPress={() => setIsRollCallModalVisible(true)}
                leadingIcon={<Feather name="rss" size={18} color={theme.colors.content.primary} />}
                style={styles.rollCallIconButton}
                testId="profile:rollCall:button"
              />
            )}
          </View>
          <Typography variant="caption" tone="secondary">
            {member.lastStatusUpdate
              ? (() => {
                  const date = new Date(member.lastStatusUpdate);
                  const now = new Date();
                  const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
                  const diffHours = Math.floor(diffMins / 60);

                  const timeAgo =
                    diffMins < 1
                      ? "щойно"
                      : diffMins < 60
                        ? `${diffMins} хв тому`
                        : diffHours < 24
                          ? `${diffHours} год тому`
                          : date.toLocaleDateString("uk-UA", {
                              day: "2-digit",
                              month: "2-digit",
                            });

                  const statusLabels: Record<string, string> = {
                    SAFE: ``,
                    WAS_SAFE: `нещодавно в безпеці`,
                    DANGER: `потребує допомоги`,
                    UNKNOWN: `востаннє відповів(ла)`,
                  };

                  const label = statusLabels[member.status] ?? "оновив(ла) статус";
                  return `${label} · ${timeAgo}`;
                })()
              : "ще не відповідав(ла)"}
          </Typography>
        </View>
        {renderLocation()}
      </View>
      <View style={styles.actionsColumn}>
        {onMessage && (
          <Button
            label="Зв'язатися"
            hierarchy="secondary"
            shape="rectangle"
            size="medium"
            onPress={handleContact}
            testId="profile:contact:button"
          />
        )}
        {onRename && (
          <Button
            label="Перейменувати"
            hierarchy="secondary"
            shape="rectangle"
            size="medium"
            onPress={() => setIsRenaming(true)}
            testId="profile:rename:button"
          />
        )}
        {isOwner && onBlock && (
          <Button
            label="Заблокувати"
            hierarchy="secondary"
            shape="rectangle"
            size="medium"
            onPress={onBlock}
            testId="profile:block:button"
          />
        )}
        {isOwner && onRemove && (
          <Button
            label="Видалити з кола"
            hierarchy="tertiary"
            shape="rectangle"
            size="medium"
            onPress={() => setIsRemoveModalVisible(true)}
            textStyle={{ color: theme.colors.negative }}
            testId="profile:remove:button"
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    width: "100%",
  },
  profileSection: {
    alignItems: "center",
    marginBottom: theme.spacing[32],
  },
  name: {
    marginTop: theme.spacing[8],
    marginBottom: theme.spacing[16],
    textAlign: "center",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  rollCallIconButton: {
    marginLeft: theme.spacing[8],
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing[20],
    paddingTop: theme.spacing[8],
    paddingHorizontal: theme.spacing[16],
  },
  locationText: {
    marginLeft: theme.spacing[8],
    color: theme.colors.content.primary,
    marginBottom: 0,
  },
  actionsColumn: {
    width: "100%",
    gap: theme.spacing[8],
  },
  rcMessageTextContainer: {
    flex: 1,
    marginLeft: theme.spacing[12],
  },
  rcTimeText: {
    color: theme.colors.content.secondary,
    marginLeft: theme.spacing[8],
    alignSelf: "flex-end",
  },
});
