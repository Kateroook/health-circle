import { useAuthStore } from "@/src/store/authStore";
import { AntDesign } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { setContactAlias } from "@/src/api/contacts";
import { blockUser } from "@/src/api/groups";
import { BottomSheetContainer, ModalActions } from "@/src/components/modal";
import { Typography } from "@/src/components/typography";
import { theme } from "@/src/theme/theme";
import ConfirmationModal from "../../ConfirmationModal";
import { Member } from "../CircleItem";
import CircleDetailsView from "./CircleDetailsView";
import MemberDetailsView from "./MemberDetailsView";

interface Props {
  visible: boolean;
  circleId: string;
  currentName: string;
  inviteCode: string;
  members: Member[];
  ownerId: string;
  onClose: () => void;
  onSaveMembers: (updated: { id: string }[]) => void;
  onDelete: () => void; // Used for "Delete Circle" from details
  onLeave: () => void; // Used for "Leave Circle" from details
  onRegenerateInvite: () => Promise<void>;
  onMemberUpdated: () => void;
  onEdit: () => void;
}

export default function CircleDetailsModal({
  visible,
  circleId,
  currentName,
  inviteCode,
  members,
  ownerId,
  onClose,
  onSaveMembers,
  onDelete,
  onLeave,
  onRegenerateInvite,
  onMemberUpdated,
  onEdit,
}: Props) {
  const [view, setView] = useState<"details" | "member">("details");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const [isDeleteVisible, setIsDeleteVisible] = useState(false);
  const [isLeaveVisible, setIsLeaveVisible] = useState(false);
  const [isBlockConfirmVisible, setIsBlockConfirmVisible] = useState(false);

  const user = useAuthStore().user;
  const isOwner = user?.id === ownerId;

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setView("details");
      setSelectedMember(null);
    }
  }, [visible]);

  const handleMemberPress = (member: Member) => {
    setSelectedMember(member);
    setView("member");
  };

  const handleRemoveMember = () => {
    if (selectedMember && isOwner) {
      const updatedMembers = members
        .filter((m) => m.id !== selectedMember?.id)
        .map((m) => ({ id: m.id }));
      onSaveMembers(updatedMembers);
      setView("details");
    }
  };

  const handleInternalMemberRename = async (newName: string) => {
    if (selectedMember) {
      try {
        await setContactAlias(selectedMember.id, newName);
        onMemberUpdated();
        setView("details");
      } catch (error) {
        console.error("Failed to rename member:", error);
        // Optionally show an alert
      }
    }
  };

  const handleBlockUser = async () => {
    if (selectedMember && circleId) {
      try {
        await blockUser(circleId, selectedMember.id);
        onMemberUpdated();
        setView("details");
        setIsBlockConfirmVisible(false);
      } catch (error) {
        console.error("Failed to block user:", error);
      }
    }
  };

  return (
    <BottomSheetContainer
      isVisible={visible}
      onClose={() => {
        if (view !== "details") {
          setView("details");
        } else {
          onClose();
        }
      }}
    >
      {/* ===== MEMBER DETAILS MODE ===== */}
      {view === "member" && selectedMember && (
        <View style={styles.section}>
          <TouchableOpacity onPress={() => setView("details")} style={styles.backButton}>
            <AntDesign name="arrow-left" size={16} color={theme.colors.accent} />
            <Typography variant="subtitle1"> Назад</Typography>
          </TouchableOpacity>

          <MemberDetailsView
            member={selectedMember}
            onInternalRename={handleInternalMemberRename}
            onClose={() => setView("details")}
            onRemoveMember={handleRemoveMember}
            onBlock={isOwner ? () => setIsBlockConfirmVisible(true) : undefined}
          />
        </View>
      )}

      {/* ===== DETAILS VIEW (Main) ===== */}
      {view === "details" && (
        <View style={styles.section}>
          <CircleDetailsView
            name={currentName}
            inviteCode={inviteCode}
            members={members}
            isOwner={isOwner || false}
            onClose={onClose}
            onRenamePress={onEdit}
            onUnsubscribePress={() => setIsLeaveVisible(true)}
            onMemberPress={handleMemberPress}
          />

          {/* Footer Actions (Delete/Leave) */}
          <ModalActions direction="column" style={styles.footer}>
            {isOwner ? (
              <TouchableOpacity style={styles.delete} onPress={() => setIsDeleteVisible(true)}>
                <Typography variant="subtitle1" weight="semibold" tone="negative">
                  Видалити коло
                </Typography>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.delete} onPress={() => setIsLeaveVisible(true)}>
                <Typography variant="subtitle1" weight="semibold" tone="negative">
                  Покинути коло
                </Typography>
              </TouchableOpacity>
            )}
          </ModalActions>
        </View>
      )}

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

      <ConfirmationModal
        isVisible={isBlockConfirmVisible}
        onCancel={() => setIsBlockConfirmVisible(false)}
        onConfirm={handleBlockUser}
        title={`Заблокувати ${selectedMember?.fullName || selectedMember?.firstName}?`}
        message="Цей користувач буде видалений з кола і не зможе приєднатися знову."
        confirmText="Заблокувати"
        cancelText="Скасувати"
      />
    </BottomSheetContainer>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: theme.spacing[16],
    paddingBottom: theme.spacing[8],
  },
  footer: {
    paddingHorizontal: theme.spacing[16],
    paddingBottom: theme.spacing[10],
  },
  delete: {
    backgroundColor: "transparent",
    paddingVertical: theme.spacing[12],
    alignItems: "center",
  },
  input: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing[16],
    paddingHorizontal: theme.spacing[20],
    fontSize: theme.typography.fontSize.h2,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.content.primary,
    textAlign: "center",
    marginTop: theme.spacing[8],
    marginBottom: theme.spacing[24],
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing[16],
  },
  backButtonText: {
    fontSize: theme.typography.fontSize.subtitle1,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.accent,
    marginLeft: theme.spacing[8],
  },
  doneButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.pill,
    paddingVertical: theme.spacing[14],
    alignItems: "center",
    marginTop: theme.spacing[20],
  },
  doneButtonText: {
    color: theme.colors.content.onColor,
    fontSize: theme.typography.fontSize.subtitle1,
    fontWeight: theme.typography.fontWeight.bold,
  },
});
