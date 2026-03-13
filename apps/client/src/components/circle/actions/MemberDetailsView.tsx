import { Button } from "@/src/components/Button";
import { COLORS } from "@/src/theme/colors";
import { theme } from "@/src/theme/theme";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { MemberAvatar } from "../../MemberAvatar";
import { StatusBadge } from "../../StatusBadge";
import { TextField } from "../../fields/TextField";
import { Typography } from "../../typography";
import { Member } from "../CircleItem";
interface MemberDetailsViewProps {
  member: Member;
  onInternalRename?: (newName: string) => void;
  onClose: () => void;
  onRemoveMember: () => void;
  onBlock?: () => void;
  onRollCall?: () => void;
  isOwner?: boolean;
}

export default function MemberDetailsView({
  member,
  onInternalRename,
  onClose,
  onRemoveMember,
  onBlock,
  onRollCall,
  isOwner,
}: MemberDetailsViewProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(member.fullName || member.firstName);

  const handleSaveRename = () => {
    if (onInternalRename) {
      onInternalRename(newName);
    }
    setIsRenaming(false);
  };

  const handleResetAlias = () => {
    if (onInternalRename) {
      onInternalRename(""); // Clearing alias
    }
    setIsRenaming(false);
  };

  return (
    <View style={styles.container}>
      {!isRenaming ? (
        <>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <MemberAvatar member={{ ...member, status: member.status || "UNKNOWN" }} size="xl" />
            </View>
            <Typography variant="h2" style={styles.header}>
              {member.fullName || `${member.firstName} ${member.lastName}`}
            </Typography>
            <StatusBadge variant="pill" status={member.status} />
          </View>

          <View style={styles.actionsCard}>
            <Button
              label="Редагувати імʼя"
              hierarchy="secondary"
              shape="rectangle"
              size="medium"
              onPress={() => {
                setNewName(member.fullName || member.firstName);
                setIsRenaming(true);
              }}
              style={{ width: "100%" }}
            />
            {isOwner && onRollCall && (
              <Button
                label="Перекличка"
                hierarchy="secondary"
                shape="rectangle"
                size="medium"
                onPress={onRollCall}
                style={{ width: "100%" }}
              />
            )}
            {isOwner && onBlock && (
              <Button
                label="Заблокувати"
                hierarchy="secondary"
                shape="rectangle"
                size="medium"
                onPress={onBlock}
                style={{ width: "100%" }}
              />
            )}
            <Button
              label="Видалити з кола"
              hierarchy="tertiary"
              shape="rectangle"
              size="medium"
              onPress={onRemoveMember}
              style={{ width: "100%" }}
              textStyle={{ color: theme.colors.negative }}
            />
          </View>
        </>
      ) : (
        <View style={styles.renameContainer}>
          <Text style={styles.renameTitle}>Редагування імʼя</Text>
          <TextField
            label=""
            placeholder="Введіть нове імʼя"
            value={newName}
            onChangeText={setNewName}
            required
            caption="Це імʼя буде відображатися у вашому колі"
          />
          <View style={{ width: "100%", gap: 10, marginTop: 16 }}>
            <Button
              label="Зберегти"
              hierarchy="primary"
              shape="pill"
              size="medium"
              onPress={handleSaveRename}
              disabled={newName.trim() === ""}
              style={{ width: "100%" }}
            />

            {/* Show restore only if it is an alias */}
            {member.isAlias && (
              <Button
                label="Відновити оригінальне імʼя"
                hierarchy="secondary"
                shape="pill"
                size="medium"
                onPress={handleResetAlias}
                style={{ width: "100%" }}
                textStyle={{ color: theme.colors.negative }}
              />
            )}

            <Button
              label="Скасувати"
              hierarchy="secondary"
              shape="pill"
              size="medium"
              onPress={() => setIsRenaming(false)}
              style={{ width: "100%" }}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  profileSection: {
    alignItems: "center",
    marginBottom: theme.spacing[32],
  },
  avatarContainer: {
    marginBottom: theme.spacing[8],
  },
  header: {
    marginBottom: theme.spacing[16],
  },
  memberName: {
    marginTop: theme.spacing[16],
  },
  actionsCard: {
    gap: theme.spacing[8],
  },
  dangerText: {
    color: theme.colors.negative,
  },
  // Rename Styles
  renameContainer: {
    width: "100%",
    alignItems: "center",
    paddingTop: 10,
  },
  renameTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: COLORS.TEXT_DARK,
  },
  input: {
    marginBottom: 16,
  },
  hintText: {
    fontSize: 12,
    color: COLORS.TEXT_GRAY,
    alignSelf: "flex-start",
    marginBottom: 24,
  },
  saveButton: {
    width: "100%",
    backgroundColor: "black",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
});
