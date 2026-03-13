import { COLORS } from "@/src/theme/colors";
import { theme } from "@/src/theme/theme";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MemberAvatar } from "../../MemberAvatar";
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
          </View>

          <View style={styles.actionsCard}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setNewName(member.fullName || member.firstName);
                setIsRenaming(true);
              }}
            >
              <Text style={styles.actionButtonText}>Редагувати імʼя</Text>
            </TouchableOpacity>

            {isOwner && onRollCall && (
              <TouchableOpacity style={styles.actionButton} onPress={onRollCall}>
                <Text style={styles.actionButtonText}>Перекличка</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionButton, { borderBottomWidth: 0 }]}
              onPress={onRemoveMember}
            >
              <Text style={[styles.actionButtonText, styles.dangerText]}>Видалити з кола</Text>
            </TouchableOpacity>
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

          <View style={{ width: "100%", gap: 10 }}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveRename}>
              <Text style={styles.saveButtonText}>Зберегти</Text>
            </TouchableOpacity>

            {/* Show restore only if it is an alias */}
            {member.isAlias && (
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: "#FFEEF0" }]}
                onPress={handleResetAlias}
              >
                <Text style={[styles.saveButtonText, { color: COLORS.STATE_DANGER }]}>
                  Відновити оригінальне імʼя
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: "transparent" }]}
              onPress={() => setIsRenaming(false)}
            >
              <Text style={[styles.saveButtonText, { color: COLORS.TEXT_GRAY }]}>Скасувати</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    backgroundColor: "#F7F8FA",
  },
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
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  actionButton: {
    paddingVertical: 18,
    alignItems: "center",
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.TEXT_DARK,
  },
  dangerText: {
    color: COLORS.STATE_DANGER,
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
    width: "100%",
    backgroundColor: "#Eef2F6",
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 8,
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
