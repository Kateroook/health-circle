import { useAuthStore } from "@/src/store/authStore";
import { AntDesign } from "@expo/vector-icons";
import Feather from "@expo/vector-icons/Feather";
import * as Clipboard from "expo-clipboard";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text,  TextInput, TouchableOpacity, View } from "react-native";

import { theme } from "@/src/theme/theme";
import ConfirmationModal from "../../ConfirmationModal";
import { TextField } from "../../fields/TextField";
import { BottomSheetContainer } from "../../modal/BottomSheetContainer";

interface Member {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  active?: boolean;
}

interface Props {
  visible: boolean;
  currentName: string;
  inviteCode: string;
  members: Member[];
  ownerId: string;
  onClose: () => void;
  onRename: (newName: string) => void;
  onSaveMembers: (updated: { id: string }[]) => void;
  onDelete: () => void;
  onLeave: () => void;
  onRegenerateInvite: () => Promise<void>;
}

export default function CircleActionsModal({
  visible,
  currentName,
  inviteCode,
  members,
  ownerId,
  onClose,
  onRename,
  onSaveMembers,
  onDelete,
  onLeave,
  onRegenerateInvite,
}: Props) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [isEditingMembers, setIsEditingMembers] = useState(false);
  const [newName, setNewName] = useState("");
  const [localMembers, setLocalMembers] = useState<Member[]>([]);
  const [isDeleteVisible, setIsDeleteVisible] = useState(false);
  const [isLeaveVisible, setIsLeaveVisible] = useState(false);

  const user = useAuthStore().user;
  const isOwner = user?.id === ownerId;

  useEffect(() => {
    if (visible) {
      setLocalMembers(
        members.filter((m) => m.id !== user?.id).map((m) => ({ ...m, active: true })),
      );
    }
  }, [members, visible, user?.id]);

  const handleRenamePress = () => {
    setNewName(currentName);
    setIsRenaming(true);
  };

  const handleDoneRename = () => {
    if (newName.trim() !== "") {
      onRename(newName.trim());
      setIsRenaming(false);
      setNewName("");
    }
  };

  const toggleMember = (id: string) => {
    setLocalMembers((prev) => prev.map((m) => (m.id === id ? { ...m, active: !m.active } : m)));
  };

  const handleSaveMembers = () => {
    onSaveMembers(localMembers.filter((m) => m.active).map((m) => ({ id: m.id })));
    setIsEditingMembers(false);
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(inviteCode);
  };

  return (
    <BottomSheetContainer isVisible={visible} onClose={onClose}>
      {/* Confirmation modals - nested inside so they appear on top of the sheet */}
      <ConfirmationModal
        isVisible={isDeleteVisible}
        onCancel={() => setIsDeleteVisible(false)}
        onConfirm={() => {
          setIsDeleteVisible(false);
          setTimeout(() => onDelete(), 300);
        }}
        title="Видалити це Коло?"
        message="Після видалення ви не зможете стежити за станом його учасників"
        confirmText="Видалити"
        cancelText="Назад"
      />

      <ConfirmationModal
        isVisible={isLeaveVisible}
        onCancel={() => setIsLeaveVisible(false)}
        onConfirm={() => {
          setIsLeaveVisible(false);
          setTimeout(() => onLeave(), 300);
        }}
        title="Покинути Коло?"
        message="Ви впевнені, що хочете покинути це коло?"
        confirmText="Покинути"
        cancelText="Назад"
      />

      {/* ===== RENAME MODE (Owner Only) ===== */}
      {isRenaming && isOwner && (
          <View style={styles.section}>
            <TouchableOpacity onPress={() => setIsRenaming(false)} style={styles.backButton}>
              <AntDesign name="arrow-left" size={16} color={theme.colors.content.primary} />
              <Text style={styles.backButtonText}>Назад</Text>
            </TouchableOpacity>

            <Text style={styles.renameTitle}>Редагуй назву Кола</Text>

            <TextField
              label=""
              placeholder="Введи нову назву"
              value={newName}
              onChangeText={setNewName}
              autoFocus
              required
              caption="Назва зміниться для всіх членів Кола"
            />

            <TouchableOpacity
              style={[styles.doneButton, newName.trim() === "" && styles.doneButtonDisabled]}
              onPress={handleDoneRename}
              disabled={newName.trim() === ""}
            >
              <Text style={styles.doneButtonText}>Зберегти</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ===== EDIT MEMBERS MODE (Owner Only) ===== */}
        {!isRenaming && isEditingMembers && isOwner && (
          <View style={styles.section}>
            <TouchableOpacity onPress={() => setIsEditingMembers(false)} style={styles.backButton}>
              <AntDesign name="arrow-left" size={16} color={theme.colors.content.primary} />
              <Text style={styles.backButtonText}>Назад</Text>
            </TouchableOpacity>

            <Text style={styles.editMembersTitle}>Редагуй склад кола</Text>
            <Text style={styles.editMembersSubtitle}>
              Видали учасників, яких більше не потрібно відстежувати
            </Text>

            <ScrollView style={styles.memberScroll}>
              {localMembers.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={styles.memberItem}
                  onPress={() => toggleMember(m.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.memberName} numberOfLines={1} ellipsizeMode="tail">
                    {`${m.lastName} ${m.firstName}`}
                  </Text>

                  <View style={styles.statusCircleContainer}>
                    {m.active ? (
                      <View style={[styles.statusCircle, styles.statusCircleActive]}>
                        <AntDesign name="check" size={14} color={theme.colors.content.onColor} />
                      </View>
                    ) : (
                      <View style={[styles.statusCircle, styles.statusCircleInactive]} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.doneButton} onPress={handleSaveMembers}>
              <Text style={styles.doneButtonText}>Зберегти</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ===== MAIN MENU ===== */}
        {!isRenaming && !isEditingMembers && (
          <View style={styles.section}>
            <Text style={styles.modalTitle} numberOfLines={1} ellipsizeMode="tail">
              {currentName}
            </Text>

            {/* Show Invite Code only to Owner */}
            {isOwner && (
              <View style={styles.inviteContainer}>
                <Text style={styles.inviteText}>Код: {inviteCode}</Text>
                <TouchableOpacity onPress={onRegenerateInvite} style={styles.inviteButton}>
                  <Feather name="refresh-cw" size={16} color={theme.colors.content.onColor} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCopy} style={styles.inviteButton}>
                  <Feather name="copy" size={16} color={theme.colors.content.onColor} />
                </TouchableOpacity>
              </View>
            )}

            {/* Owner Actions */}
            {isOwner ? (
              <>
                <TouchableOpacity style={styles.item} onPress={handleRenamePress}>
                  <Text style={styles.text}>Перейменувати</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.item} onPress={() => setIsEditingMembers(true)}>
                  <Text style={styles.text}>Редагувати склад</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.delete} onPress={() => setIsDeleteVisible(true)}>
                  <Text style={styles.deleteText}>Видалити</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.delete} onPress={() => setIsLeaveVisible(true)}>
                <Text style={styles.deleteText}>Покинути коло</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
    </BottomSheetContainer>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: theme.spacing[16],
    paddingBottom: theme.spacing[8],
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.h3,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.content.primary,
    textAlign: "center",
    marginBottom: theme.spacing[20],
    paddingHorizontal: theme.spacing[8],
  },
  item: {
    paddingVertical: theme.spacing[12],
    paddingHorizontal: theme.spacing[20],
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing[12],
  },
  text: {
    fontSize: theme.typography.fontSize.subtitle1,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.content.primary,
    textAlign: "center",
  },
  inviteContainer: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background.tertiary,
    paddingHorizontal: theme.spacing[14],
    paddingVertical: theme.spacing[8],
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing[24],
  },
  inviteText: {
    fontSize: theme.typography.fontSize.subtitle1,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.content.primary,
    marginRight: theme.spacing[8],
  },
  inviteButton: {
    padding: theme.spacing[4],
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.content.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  delete: {
    backgroundColor: "transparent",
    marginTop: theme.spacing[20],
    marginBottom: theme.spacing[16],
  },
  deleteText: {
    color: theme.colors.negative,
    fontSize: theme.typography.fontSize.subtitle1,
    fontWeight: theme.typography.fontWeight.semibold,
    textAlign: "center",
  },

  // ── Редагування назви ──
  renameTitle: {
    fontSize: theme.typography.fontSize.h3,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.content.primary,
    textAlign: "center",
    marginBottom: theme.spacing[20],
  },
  renameHint: {
    fontSize: theme.typography.fontSize.caption,
    color: theme.colors.content.secondary,
    textAlign: "center",
    marginTop: theme.spacing[8],
    marginBottom: theme.spacing[16],
  },
  input: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing[16],
    paddingHorizontal: theme.spacing[20],
    fontSize: theme.typography.fontSize.subtitle1,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.content.primary,
    textAlign: "center",
    marginBottom: theme.spacing[8],
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing[16],
    borderRadius: theme.radius.lg,
  },
  backButtonText: {
    fontSize: theme.typography.fontSize.subtitle1,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.content.primary,
    marginLeft: theme.spacing[8],
  },
  doneButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.pill,
    paddingVertical: theme.spacing[14],
    alignItems: "center",
    marginTop: theme.spacing[16],
  },
  doneButtonDisabled: {
    opacity: 0.5,
  },
  doneButtonText: {
    color: theme.colors.content.onColor,
    fontSize: theme.typography.fontSize.subtitle1,
    fontWeight: theme.typography.fontWeight.bold,
  },

  editMembersTitle: {
    fontSize: theme.typography.fontSize.h3,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.content.primary,
    textAlign: "center",
    marginBottom: theme.spacing[8],
  },

  editMembersSubtitle: {
    fontSize: theme.typography.fontSize.caption,
    color: theme.colors.content.secondary,
    textAlign: "center",
    marginBottom: theme.spacing[16],
    paddingHorizontal: theme.spacing[20],
  },

  memberScroll: {
    maxHeight: theme.spacing[96] * 4,
    marginTop: theme.spacing[16],
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing[16],
    borderBottomWidth: theme.borderWidth.sm,
    borderBottomColor: theme.colors.border.opaque,
  },

  memberName: {
    fontSize: theme.typography.fontSize.subtitle1,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.content.primary,
    flex: 1,
    marginRight: theme.spacing[16],
  },

  statusCircleContainer: {
    width: theme.spacing[28],
    height: theme.spacing[28],
    justifyContent: "center",
    alignItems: "center",
  },

  statusCircle: {
    width: theme.spacing[24],
    height: theme.spacing[24],
    borderRadius: theme.radius.lg,
    justifyContent: "center",
    alignItems: "center",
  },

  statusCircleActive: {
    backgroundColor: theme.colors.accent,
    borderWidth: 0,
  },

  statusCircleInactive: {
    backgroundColor: "transparent",
    borderWidth: theme.borderWidth.md,
    borderColor: theme.colors.accent,
  },
});
