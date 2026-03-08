import { useAuthStore } from "@/src/store/authStore";
import { AntDesign } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { setContactAlias } from "@/src/api/contacts";
import { blockUser, initiatePersonalRollCall, initiateRollCall } from "@/src/api/groups";
import { Button } from "@/src/components/Button";
import { BottomSheetContainer, ModalActions } from "@/src/components/modal";
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

  const handleRollCall = async () => {
    try {
      await initiateRollCall(circleId);
      onRollCall();
    } catch (error) {
      console.error("Failed to initiate roll call:", error);
    }
  };

  const handlePersonalRollCall = async () => {
    if (selectedMember && circleId) {
      try {
        await initiatePersonalRollCall(circleId, selectedMember.id);
        onRollCall();
      } catch (error) {
        console.error("Failed to initiate personal roll call:", error);
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
          <Button
            shape="round"
            hierarchy="tertiary"
            size="xsmall"
            leadingIcon={<AntDesign name="arrow-left" size={16} color={theme.colors.accent} />}
            onPress={() => setView("details")}
            style={{ alignSelf: "flex-start" }}
          />

          <MemberDetailsView
            member={selectedMember}
            onInternalRename={handleInternalMemberRename}
            onClose={() => setView("details")}
            onRemoveMember={handleRemoveMember}
            onBlock={isOwner ? () => setIsBlockConfirmVisible(true) : undefined}
            onRollCall={handlePersonalRollCall}
            isOwner={isOwner}
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
            onRollCallPress={handleRollCall}
          />

          {/* Footer Actions (Delete/Leave) */}
          <ModalActions direction="column" style={styles.footer}>
            {isOwner ? (
              <Button
                label="Видалити коло"
                hierarchy="tertiary"
                shape="rectangle"
                size="medium"
                onPress={() => setIsDeleteVisible(true)}
                style={{ width: "100%" }}
                textStyle={{ color: theme.colors.negative }}
              />
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
});
