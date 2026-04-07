import { BottomSheetContainer } from "@/src/components/modal/BottomSheetContainer";
import { Member } from "@/src/types";
import React from "react";
import { MemberProfileView } from "../MemberProfileView";

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
  if (!member) return null;

  return (
    <BottomSheetContainer isVisible={visible} onClose={onClose}>
      <MemberProfileView
        member={member}
        onRollCall={canRollCall ? onRollCall : undefined}
        onMessage={() => {}}
        isOwner={isOwner}
        onRemove={onRemove}
        onBlock={onBlock}
        onRename={onRename}
      />
    </BottomSheetContainer>
  );
};
