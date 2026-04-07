import { Button } from "@/src/components/Button";
import { MemberProfileView } from "@/src/components/MemberProfileView";
import { ModalContainer } from "@/src/components/modal/ModalContainer";
import { theme } from "@/src/theme/theme";
import { AntDesign } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";

import { Member } from "@/src/types";

interface MemberDetailModalProps {
  member: Member | null;
  visible: boolean;
  onClose: () => void;
  onRollCall?: (memberId: string) => void;
  canRollCall?: boolean;
}

export default function MemberDetailModal({
  member,
  visible,
  onClose,
  onRollCall,
  canRollCall,
}: MemberDetailModalProps) {
  return (
    <ModalContainer isVisible={visible && !!member} onClose={onClose}>
      {member && (
        <>
          <Button
            shape="round"
            hierarchy="tertiary"
            size="small"
            leadingIcon={<AntDesign name="close" size={16} color={theme.colors.content.primary} />}
            onPress={onClose}
            style={styles.closeButton}
          />

          <View style={{ width: "100%", marginTop: theme.spacing[8] }}>
            <MemberProfileView
              member={member}
              onRollCall={canRollCall ? onRollCall : undefined}
              onMessage={() => {}}
            />
          </View>
        </>
      )}
    </ModalContainer>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    alignSelf: "flex-start",
  },
  avatarWrapper: {
    alignSelf: "center",
    marginTop: theme.spacing[8],
    marginBottom: theme.spacing[20],
    transform: [{ scale: 1.6 }],
  },
  name: {
    textAlign: "center",
  },
  buttonsColumn: {
    width: "100%",
    gap: theme.spacing[8],
  },
});
