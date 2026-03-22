import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Member } from "../types";
import { theme } from "../theme/theme";
import { MemberAvatar } from "./MemberAvatar";
import { Typography } from "./typography";
import { StatusBadge } from "./StatusBadge";
import { Button } from "./Button";
import { RenameModal } from "./circle/actions/RenameModal";

interface MemberProfileViewProps {
  member: Member;
  onRollCall?: () => void;
  onMessage?: () => void;
  onBlock?: () => void;
  onRemove?: () => void;
  onRename?: (newName: string) => void;
  isOwner?: boolean;
}

export const MemberProfileView = ({
  member,
  onRollCall,
  onMessage,
  onBlock,
  onRemove,
  onRename,
  isOwner,
}: MemberProfileViewProps) => {
  const [isRenaming, setIsRenaming] = useState(false);

  return (
    <View style={styles.container}>
      <RenameModal
        isVisible={isRenaming}
        title="Редагування імʼя"
        placeholder="Введіть нове імʼя"
        caption="Це імʼя буде відображатися у вашому колі"
        initialValue={member.fullName || member.firstName}
        onCancel={() => setIsRenaming(false)}
        onSave={(newName) => {
          onRename?.(newName);
          setIsRenaming(false);
        }}
        extraAction={
          member.isAlias
            ? {
                label: "Відновити оригінальне імʼя",
                onPress: () => {
                  onRename?.("");
                  setIsRenaming(false);
                },
              }
            : undefined
        }
      />

      <View style={styles.profileSection}>
        <MemberAvatar member={member} size="xl" />
        <Typography variant="h2" tone="primary" style={styles.name}>
          {member.fullName || `${member.firstName} ${member.lastName}`}
        </Typography>
        <StatusBadge variant="pill" status={member.status} />
      </View>

      <View style={styles.actionsColumn}>
        {onMessage && (
          <Button
            label="Написати"
            hierarchy="secondary"
            shape="rectangle"
            size="medium"
            onPress={onMessage}
          />
        )}
        {onRollCall && (
          <Button
            label="Перекличка"
            hierarchy="secondary"
            shape="rectangle"
            size="medium"
            onPress={onRollCall}
          />
        )}
        {onRename && (
          <Button
            label="Редагувати імʼя"
            hierarchy="secondary"
            shape="rectangle"
            size="medium"
            onPress={() => setIsRenaming(true)}
          />
        )}
        {isOwner && onBlock && (
          <Button
            label="Заблокувати"
            hierarchy="secondary"
            shape="rectangle"
            size="medium"
            onPress={onBlock}
          />
        )}
        {isOwner && onRemove && (
          <Button
            label="Видалити з кола"
            hierarchy="tertiary"
            shape="rectangle"
            size="medium"
            onPress={onRemove}
            textStyle={{ color: theme.colors.negative }}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    width: "100%",
  },
  profileSection: {
    alignItems: "center",
    marginBottom: theme.spacing[32],
  },
  name: {
    marginTop: theme.spacing[8],
    marginBottom: theme.spacing[16],
    textAlign: "center",
  },
  actionsColumn: {
    width: "100%",
    gap: theme.spacing[8],
  },
});
