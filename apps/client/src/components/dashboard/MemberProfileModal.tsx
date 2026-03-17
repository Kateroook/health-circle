import React from "react";
import { Modal, Pressable, StyleSheet } from "react-native";
import { Button } from "@/src/components/Button";
import { theme } from "@/src/theme/theme";
import AntDesign from "@expo/vector-icons/build/AntDesign";
import { Member } from "@/src/types";
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Button
            shape="round"
            hierarchy="tertiary"
            size="medium"
            leadingIcon={<AntDesign name="close" size={16} color={theme.colors.content.primary} />}
            onPress={onClose}
            style={styles.closeButton}
          />

          <MemberProfileView
            member={member}
            onRollCall={canRollCall ? onRollCall : undefined}
            onMessage={() => {}}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.background.overlay,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing[16],
  },
  card: {
    width: "100%",
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius.xl,
    paddingTop: theme.spacing[16],
    paddingBottom: theme.spacing[32],
    paddingHorizontal: theme.spacing[16],
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  closeButton: {
    alignSelf: "flex-start",
    marginBottom: theme.spacing[16],
  },
});
