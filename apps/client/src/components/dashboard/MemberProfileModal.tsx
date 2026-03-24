import { BottomSheetContainer } from "@/src/components/modal/BottomSheetContainer";
import { Member } from "@/src/types";
import React from "react";
import { MemberProfileView } from "../MemberProfileView";

interface MemberProfileModalProps {
  member: Member | null;
  visible: boolean;
  onClose: () => void;
  onRollCall: () => void;
  canRollCall: boolean;
}

export const MemberProfileModal = ({
  member,
  visible,
  onClose,
  onRollCall,
  canRollCall,
}: MemberProfileModalProps) => {
  if (!member) return null;

  return (
    <BottomSheetContainer isVisible={visible} onClose={onClose}>
      <MemberProfileView
        member={member}
        onRollCall={canRollCall ? onRollCall : undefined}
        onMessage={() => {}}
      />
    </BottomSheetContainer>
  );
};
