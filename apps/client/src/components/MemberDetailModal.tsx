import React from "react";
import { View, StyleSheet } from "react-native";
import { MemberAvatar } from "@/src/components/MemberAvatar";
import { StatusBadge, UserStatus } from "@/src/components/StatusBadge";
import { Button } from "@/src/components/Button";
import { Typography } from "@/src/components/typography/Typography";
import { ModalContainer } from "@/src/components/modal/ModalContainer";
import { theme } from "@/src/theme/theme";
import { AntDesign } from "@expo/vector-icons";

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  avatarUpdatedAt?: string;
  status: UserStatus;
  active?: boolean;
}

interface MemberDetailModalProps {
  member: Member | null;
  visible: boolean;
  onClose: () => void;
  onRollCall?: () => void;
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

          <View style={styles.avatarWrapper}>
            <MemberAvatar member={member} />
          </View>

          <Typography variant="h2" tone="primary" style={styles.name}>
            {member.firstName} {member.lastName}
          </Typography>

          <StatusBadge status={member.status} variant="pill" />

          <View style={styles.buttonsColumn}>
            {canRollCall && onRollCall && (
              <Button
                label="Перекличка"
                hierarchy="secondary"
                shape="rectangle"
                size="medium"
                onPress={onRollCall}
              />
            )}

            <Button
              label="Написати"
              hierarchy="secondary"
              shape="rectangle"
              size="medium"
              onPress={() => console.log("Написати", member.id)}
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
