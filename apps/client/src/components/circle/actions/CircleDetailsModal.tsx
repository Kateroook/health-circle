import { useAnalytics } from "@/src/hooks/useAnalytics";
import { useAuthStore } from "@/src/store/authStore";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { initiatePersonalRollCall } from "@/src/api/api";
import { setContactAlias } from "@/src/api/contacts";
import { blockUser, initiateRollCall } from "@/src/api/groups";
import { BottomSheetContainer, ModalContainer } from "@/src/components/modal";
import { theme } from "@/src/theme/theme";
import { Member } from "@/src/types";
import ConfirmationModal from "../../ConfirmationModal";
import { MemberProfileView } from "../../MemberProfileView";
import { ConfirmRollCallModal } from "./ConfirmRollCallModal";
import CircleDetailsView from "./CircleDetailsView";
import { RenameModal } from "./RenameModal";

interface Props {
  visible: boolean;
  circleId: string;
  currentName: string;
  inviteCode: string;
  members: Member[];
  ownerId: string;
  onClose: () => void;
  onSaveMembers: (updated: { id: string }[]) => void;
  onDelete: () => void;
  onLeave: () => void;
  onRegenerateInvite: () => Promise<void>;
  onMemberUpdated: () => void;
  onEdit: () => void;
  onRollCall: () => void;
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
  onRollCall,
}: Props) {
  const { logEvent } = useAnalytics();
  const [view, setView] = useState<"details" | "member">("details");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const [isDeleteVisible, setIsDeleteVisible] = useState(false);
  const [isLeaveVisible, setIsLeaveVisible] = useState(false);
  const [isBlockConfirmVisible, setIsBlockConfirmVisible] = useState(false);
  const [isRemoveConfirmVisible, setIsRemoveConfirmVisible] = useState(false);
  const [isRollCallConfirmVisible, setIsRollCallConfirmVisible] = useState(false);
  const [isRenameVisible, setIsRenameVisible] = useState(false);

  const user = useAuthStore().user;
  const isOwner = user?.id === ownerId;

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setView("details");
      setSelectedMember(null);
      setIsRollCallConfirmVisible(false);
      setIsRenameVisible(false);
      setIsBlockConfirmVisible(false);
      setIsRemoveConfirmVisible(false);
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
      }
    }
  };

  const handleBlockUser = async () => {
    if (selectedMember && circleId) {
      try {
        await blockUser(circleId, selectedMember.id);
        logEvent("block_user");
        onMemberUpdated();
        setView("details");
        setIsBlockConfirmVisible(false);
      } catch (error) {
        console.error("Failed to block user:", error);
      }
    }
  };

  const handleRollCall = async () => {
    try {
      await initiateRollCall(circleId);
      logEvent("initiate_roll_call", { type: "group" });
      onRollCall();
    } catch (error) {
      console.error("Failed to initiate roll call:", error);
    }
  };

  const handlePersonalRollCall = async () => {
    if (selectedMember) {
      try {
        await initiatePersonalRollCall(selectedMember.id);
        logEvent("initiate_personal_roll_call", { type: "individual" });
        onMemberUpdated(); // Notify parent to refresh member data
        onRollCall();
      } catch (error) {
        console.error("Failed to initiate personal roll call:", error);
      }
    }
  };

  return (
    <>
      <ModalContainer isVisible={visible} onClose={onClose} fullScreen>
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
            onRollCallPress={handleRollCall}
          />
        </View>
      </ModalContainer>

      {/* ===== MEMBER DETAILS BOTTOM SHEET ===== */}
      <BottomSheetContainer
        isVisible={view === "member" && !!selectedMember}
        onClose={() => setView("details")}
      >
        <View style={styles.memberSection}>
          <MemberProfileView
            member={selectedMember!}
            onRollCall={handlePersonalRollCall}
            onRequestRollCall={() => setIsRollCallConfirmVisible(true)}
            onRename={handleInternalMemberRename}
            onRequestRename={() => setIsRenameVisible(true)}
            onBlock={isOwner ? () => setIsBlockConfirmVisible(true) : undefined}
            onRemove={isOwner ? () => setIsRemoveConfirmVisible(true) : undefined}
            onRequestRemove={isOwner ? () => setIsRemoveConfirmVisible(true) : undefined}
            isOwner={isOwner}
          />
        </View>
      </BottomSheetContainer>

      <ConfirmRollCallModal
        isVisible={isRollCallConfirmVisible}
        onCancel={() => setIsRollCallConfirmVisible(false)}
        onConfirm={async () => {
          setIsRollCallConfirmVisible(false);
          await handlePersonalRollCall();
        }}
        testId="profile:confirmRollCall:modal"
      />

      <RenameModal
        isVisible={isRenameVisible}
        title="Редагування імʼя"
        placeholder="Введіть нове імʼя"
        caption="Це імʼя буде відображатися у вашому колі"
        initialValue={selectedMember?.fullName || selectedMember?.firstName || ""}
        onCancel={() => setIsRenameVisible(false)}
        onSave={async (newName) => {
          await handleInternalMemberRename(newName);
          setIsRenameVisible(false);
        }}
        extraAction={
          selectedMember?.isAlias
            ? {
                label: "Відновити оригінальне імʼя",
                onPress: async () => {
                  await handleInternalMemberRename("");
                  setIsRenameVisible(false);
                },
              }
            : undefined
        }
        testId="profile:rename:modal"
      />

      <ConfirmationModal
        isVisible={isDeleteVisible}
        onCancel={() => setIsDeleteVisible(false)}
        onConfirm={() => {
          setIsDeleteVisible(false);
          logEvent("delete_circle");
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
          logEvent("leave_circle");
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
        title={
          selectedMember
            ? `Заблокувати ${selectedMember.fullName || selectedMember.firstName}?`
            : "Заблокувати?"
        }
        message="Цей користувач буде видалений з кола і не зможе приєднатися знову."
        confirmText="Заблокувати"
        cancelText="Скасувати"
      />

      <ConfirmationModal
        isVisible={isRemoveConfirmVisible}
        onCancel={() => setIsRemoveConfirmVisible(false)}
        onConfirm={() => {
          setIsRemoveConfirmVisible(false);
          handleRemoveMember();
        }}
        title={
          selectedMember
            ? `Видалити ${selectedMember.fullName || selectedMember.firstName}?`
            : "Видалити?"
        }
        message="Ви впевнені, що хочете видалити цього учасника з кола?"
        confirmText="Видалити"
        cancelText="Скасувати"
      />
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  memberSection: {
    paddingBottom: theme.spacing[32],
    alignItems: "center",
  },
});
