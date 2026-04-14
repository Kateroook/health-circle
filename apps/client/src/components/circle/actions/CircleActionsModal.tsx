import { Button } from "@/src/components/Button";
import { ListItem } from "@/src/components/ListItem";
import { Typography } from "@/src/components/typography";
import { useAnalytics } from "@/src/hooks/useAnalytics";
import { useToast } from "@/src/hooks/useToast";
import { useAuthStore } from "@/src/store/authStore";
import { theme } from "@/src/theme/theme";
import { Member } from "@/src/types";
import { AntDesign, Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import ConfirmationModal from "../../ConfirmationModal";
import { BottomSheetContainer } from "../../modal/BottomSheetContainer";
import { ConfirmRollCallModal } from "./ConfirmRollCallModal";
import { RenameModal } from "./RenameModal";
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
  onRollCall: () => void;
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
  onRollCall,
  onRegenerateInvite,
}: Props) {
  const { showToast } = useToast();
  const { logEvent } = useAnalytics();
  const [isRenaming, setIsRenaming] = useState(false);
  const [isEditingMembers, setIsEditingMembers] = useState(false);
  const [newName, setNewName] = useState("");
  const [localMembers, setLocalMembers] = useState<Member[]>([]);
  const [isDeleteVisible, setIsDeleteVisible] = useState(false);
  const [isLeaveVisible, setIsLeaveVisible] = useState(false);
  const [isRollCallVisible, setIsRollCallVisible] = useState(false);
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
      logEvent("rename_circle");
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
    logEvent("copy_invite_code");
    showToast({ type: "success", title: "Скопійовано", compact: true });
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
          logEvent("rename_circle");
          setIsRenaming(false);
          setNewName("");
        }}
      />

      <ConfirmRollCallModal
        isVisible={isRollCallVisible}
        onCancel={() => setIsRollCallVisible(false)}
        onConfirm={async () => {
          setIsRollCallVisible(false);
          onRollCall();
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
          <Typography variant="h3" weight="bold" style={styles.sectionTitle}>
            Редагуй склад кола
          </Typography>
          <Typography variant="body2" tone="secondary" style={styles.sectionSubtitle}>
            Видали учасників, яких більше не потрібно відстежувати
          </Typography>

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
          <Typography
            variant="h3"
            weight="bold"
            style={styles.modalTitle}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {currentName}
          </Typography>

          {isOwner && (
            <View style={styles.inviteContainer}>
              <Typography variant="subtitle1" weight="semibold" style={styles.inviteText}>
                Код: {inviteCode}
              </Typography>
              <Button
                shape="round"
                hierarchy="primary"
                size="xsmall"
                leadingIcon={
                  <Feather name="refresh-cw" size={16} color={theme.colors.content.onColor} />
                }
                onPress={() => {
                  onRegenerateInvite();
                  logEvent("regenerate_invite_code");
                }}
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
            <Button
              label="Перекличка"
              hierarchy="accent"
              shape="rectangle"
              size="medium"
              leadingIcon={<Feather name="rss" size={16} color="#FFF" />}
              onPress={() => setIsRollCallVisible(true)}
              style={{ width: "100%", marginBottom: theme.spacing[8] }}
            />

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
              <>
                <Button
                  label="Покинути коло"
                  hierarchy="tertiary"
                  shape="rectangle"
                  size="medium"
                  onPress={() => setIsLeaveVisible(true)}
                  style={{ width: "100%" }}
                  textStyle={{ color: theme.colors.negative }}
                />
              </>
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
