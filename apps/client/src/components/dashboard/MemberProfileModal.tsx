import { BottomSheetContainer } from "@/src/components/modal/BottomSheetContainer";
import { Member } from "@/src/types";
import React, { useState } from "react";
import { MemberProfileView } from "../MemberProfileView";
import { ConfirmRollCallModal } from "../circle/actions/ConfirmRollCallModal";
import { RenameModal } from "../circle/actions/RenameModal";
import ConfirmationModal from "../ConfirmationModal";
import { Alert } from "react-native";

interface MemberProfileModalProps {
  member: Member | null;
  visible: boolean;
  onClose: () => void;
  onRollCall: (memberId: string) => void;
  canRollCall: boolean;
  isOwner?: boolean;
  onRemove?: () => void;
  onBlock?: () => void;
  onRename?: (newName: string) => void;
}

export const MemberProfileModal = ({
  member,
  visible,
  onClose,
  onRollCall,
  canRollCall,
  isOwner,
  onRemove,
  onBlock,
  onRename,
}: MemberProfileModalProps) => {
  const [isRollCallConfirmVisible, setIsRollCallConfirmVisible] = useState(false);
  const [isRenameVisible, setIsRenameVisible] = useState(false);
  const [isRemoveVisible, setIsRemoveVisible] = useState(false);

  if (!member) return null;

  return (
    <>
      {
        console.log("MemberProfileModal props:", {
          isOwner,
          hasOnRemove: !!onRemove,
          memberId: member?.id,
        }) as any
      }
      <BottomSheetContainer isVisible={visible} onClose={onClose}>
        <MemberProfileView
          member={member}
          onRollCall={canRollCall ? onRollCall : undefined}
          onRequestRollCall={canRollCall ? () => setIsRollCallConfirmVisible(true) : undefined}
          onMessage={() => {}}
          isOwner={isOwner}
          onRemove={onRemove}
          onRequestRemove={
            onRemove
              ? () => {
                  Alert.alert(
                    "Видалити учасника??",
                    `${member.fullName || member.firstName} буде видалено з кола`,
                    [
                      { text: "Назад", style: "cancel" },
                      { text: "Видалити", style: "destructive", onPress: () => onRemove?.() },
                    ],
                  );
                }
              : undefined
          }
          onBlock={onBlock}
          onRename={onRename}
          onRequestRename={onRename ? () => setIsRenameVisible(true) : undefined}
        />
      </BottomSheetContainer>

      <ConfirmRollCallModal
        isVisible={isRollCallConfirmVisible}
        onCancel={() => setIsRollCallConfirmVisible(false)}
        onConfirm={async () => {
          setIsRollCallConfirmVisible(false);
          onRollCall(member.id);
        }}
        testId="profile:confirmRollCall:modal"
      />

      <RenameModal
        isVisible={isRenameVisible}
        title="Редагування імʼя"
        placeholder="Введіть нове імʼя"
        caption="Це імʼя буде відображатися у вашому колі"
        initialValue={member.fullName || member.firstName}
        onCancel={() => setIsRenameVisible(false)}
        onSave={(newName) => {
          onRename?.(newName);
          setIsRenameVisible(false);
        }}
        extraAction={
          member.isAlias
            ? {
                label: "Відновити оригінальне імʼя",
                onPress: () => {
                  onRename?.("");
                  setIsRenameVisible(false);
                },
              }
            : undefined
        }
        testId="profile:rename:modal"
      />

      <ConfirmationModal
        isVisible={isRemoveVisible}
        onCancel={() => {
          console.log("cancel pressed");
          setIsRemoveVisible(false);
        }}
        onConfirm={() => {
          console.log("confirm pressed, onRemove:", !!onRemove);
          setIsRemoveVisible(false);
          onRemove?.();
        }}
        title="Видалити учасника?"
        message={`${member.fullName || member.firstName} буде видалено з кола`}
        confirmText="Видалити"
        cancelText="Назад"
        confirmStyle="destructive"
        testId="profile:remove:modal"
      />
    </>
  );
};
