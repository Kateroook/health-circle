import { Button } from "@/src/components/Button";
import { ListItem } from "@/src/components/ListItem";
import { ModalActions, ModalContent, ModalHeader } from "@/src/components/modal";
import { ModalContainer } from "@/src/components/modal/ModalContainer";
import { useAuthStore } from "@/src/store/authStore";
import { theme } from "@/src/theme/theme";
import { AntDesign } from "@expo/vector-icons";
import Feather from "@expo/vector-icons/Feather";
import * as Clipboard from "expo-clipboard";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import ConfirmationModal from "../../ConfirmationModal";
import { TextField } from "../../fields/TextField";
import { BottomSheetContainer } from "../../modal/BottomSheetContainer";
import { RenameModal } from "./RenameModal";
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
  circleId: string;
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
  circleId,
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

  interface RenameCircleModalProps {
    isVisible: boolean;
    newName: string;
    onChangeName: (name: string) => void;
    onCancel: () => void;
    onSave: () => void;
  }

  const RenameCircleModal: React.FC<RenameCircleModalProps> = ({
    isVisible,
    newName,
    onChangeName,
    onCancel,
    onSave,
  }) => {
    if (!isVisible) return null;

    return (
      <ModalContainer isVisible={isVisible} onClose={onCancel}>
        <ModalHeader title="Редагуй назву Кола" />
        <ModalContent noMarginBottom>
          <TextField
            label=""
            placeholder="Введи нову назву"
            value={newName}
            onChangeText={onChangeName}
            autoFocus
            required
            caption="Назва зміниться для всіх членів Кола"
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
            disabled={newName.trim() === ""}
            onPress={onSave}
          />
        </ModalActions>
      </ModalContainer>
    );
  };
  return (
    <BottomSheetContainer isVisible={visible} onClose={onClose}>
      <ConfirmationModal
        isVisible={isDeleteVisible}
        onCancel={() => setIsDeleteVisible(false)}
        onConfirm={() => {
          setIsDeleteVisible(false);
          setTimeout(() => onDelete(), 300);
        }}
        title="Видалити це Коло?"
        message="Після видалення ви не зможете стежити за станом його учасників"
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
      {/* ===== RENAME MODE ===== */}
      <RenameModal
        isVisible={isRenaming && isOwner}
        title="Редагуй назву Кола"
        placeholder="Введи нову назву"
        caption="Назва зміниться для всіх членів Кола"
        initialValue={currentName}
        onCancel={() => {
          setIsRenaming(false);
          setNewName("");
        }}
        onSave={(newName) => {
          onRename(newName);
          setIsRenaming(false);
          setNewName("");
        }}
      />

      {/* ===== EDIT MEMBERS MODE ===== */}
      {isEditingMembers && isOwner && (
        <View style={styles.section}>
          <Button
            shape="round"
            hierarchy="tertiary"
            size="xsmall"
            leadingIcon={
              <AntDesign name="arrow-left" size={16} color={theme.colors.content.primary} />
            }
            onPress={() => setIsEditingMembers(false)}
            style={{ alignSelf: "flex-start" }}
          />
          <Text style={styles.sectionTitle}>Редагуй склад кола</Text>
          <Text style={styles.sectionSubtitle}>
            Видали учасників, яких більше не потрібно відстежувати
          </Text>

          <ScrollView style={styles.memberScroll} showsVerticalScrollIndicator={false}>
            {localMembers.map((m, index) => (
              <ListItem
                key={m.id}
                layout="check"
                artworkSize="none"
                label={`${m.lastName} ${m.firstName}`}
                checked={m.active}
                onPress={() => toggleMember(m.id)}
                showDivider={index < localMembers.length - 1}
              />
            ))}
          </ScrollView>

          <Button
            label="Зберегти"
            hierarchy="primary"
            shape="pill"
            size="large"
            onPress={handleSaveMembers}
            style={{ width: "100%" }}
          />
        </View>
      )}

      {/* ===== MAIN MENU ===== */}
      {!isEditingMembers && (
        <View style={styles.section}>
          <Text style={styles.modalTitle} numberOfLines={1} ellipsizeMode="tail">
            {currentName}
          </Text>

          {isOwner && (
            <View style={styles.inviteContainer}>
              <Text style={styles.inviteText}>Код: {inviteCode}</Text>
              <Button
                shape="round"
                hierarchy="primary"
                size="xsmall"
                leadingIcon={
                  <Feather name="refresh-cw" size={16} color={theme.colors.content.onColor} />
                }
                onPress={onRegenerateInvite}
              />
              <Button
                shape="round"
                hierarchy="primary"
                size="xsmall"
                leadingIcon={<Feather name="copy" size={16} color={theme.colors.content.onColor} />}
                onPress={handleCopy}
              />
            </View>
          )}

          <View style={styles.actionButtons}>
            {isOwner ? (
              <>
                <Button
                  label="Перейменувати"
                  hierarchy="secondary"
                  shape="rectangle"
                  size="medium"
                  onPress={handleRenamePress}
                  style={{ width: "100%" }}
                />
                <Button
                  label="Редагувати склад"
                  hierarchy="secondary"
                  shape="rectangle"
                  size="medium"
                  onPress={() => setIsEditingMembers(true)}
                  style={{ width: "100%" }}
                />
                <Button
                  label="Видалити"
                  hierarchy="tertiary"
                  shape="rectangle"
                  size="medium"
                  onPress={() => setIsDeleteVisible(true)}
                  style={{ width: "100%" }}
                  textStyle={{ color: theme.colors.negative }}
                />
              </>
            ) : (
              <Button
                label="Покинути коло"
                hierarchy="tertiary"
                shape="rectangle"
                size="medium"
                onPress={() => setIsLeaveVisible(true)}
                style={{ width: "100%" }}
                textStyle={{ color: theme.colors.negative }}
              />
            )}
          </View>
        </View>
      )}
    </BottomSheetContainer>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: theme.spacing[12],
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.h3,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.content.primary,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.h3,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.content.primary,
    textAlign: "center",
  },
  sectionSubtitle: {
    fontSize: theme.typography.fontSize.caption,
    color: theme.colors.content.secondary,
    textAlign: "center",
    paddingHorizontal: theme.spacing[20],
  },
  inviteContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: theme.colors.background.tertiary,
    paddingHorizontal: theme.spacing[16],
    paddingVertical: theme.spacing[8],
    borderRadius: theme.radius.pill,
    gap: theme.spacing[8],
  },
  inviteText: {
    fontSize: theme.typography.fontSize.subtitle1,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.content.primary,
  },
  actionButtons: {
    paddingTop: theme.spacing[16],
    gap: theme.spacing[8],
    width: "100%",
  },
  memberScroll: {
    maxHeight: theme.spacing[96] * 4,
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
