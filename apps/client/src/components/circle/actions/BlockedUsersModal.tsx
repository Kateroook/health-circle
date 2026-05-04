import { Button } from "@/src/components/Button";
import { ListItem } from "@/src/components/ListItem";
import { Typography } from "@/src/components/typography";
import { useToast } from "@/src/hooks/useToast";
import { theme } from "@/src/theme/theme";
import { AntDesign } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { getBlockedUsers, unblockUser } from "@/src/api/groups";
import { BottomSheetContainer } from "../../modal/BottomSheetContainer";

interface Props {
  visible: boolean;
  circleId: string;
  onClose: () => void;
  onUnblocked?: () => void;
}

interface BlockedUser {
  id: string;
  firstName: string;
  lastName: string;
  blocked: boolean;
}

function parseBlockedUsers(data: any[]): BlockedUser[] {
  return data.map((item) => {
    const user = item?.user ?? item;
    return {
      id: user.id ?? item.userId,
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      blocked: true,
    };
  });
}

export function BlockedUsersModal({ visible, circleId, onClose, onUnblocked }: Props) {
  const { showToast } = useToast();
  const [users, setUsers] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchBlockedUsers();
    } else {
      setUsers([]);
    }
  }, [visible]);

  const fetchBlockedUsers = async () => {
    setIsLoading(true);
    try {
      const data = await getBlockedUsers(circleId);
      setUsers(parseBlockedUsers(data as any[]));
    } catch {
      showToast({ type: "error", title: "Не вдалося завантажити список" });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUser = (id: string) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, blocked: !u.blocked } : u)));
  };

  const handleSave = async () => {
    const toUnblock = users.filter((u) => !u.blocked);
    if (toUnblock.length === 0) {
      onClose();
      return;
    }
    setIsSaving(true);
    try {
      await Promise.all(toUnblock.map((u) => unblockUser(circleId, u.id)));
      showToast({ type: "success", title: "Збережено", compact: true });
      onClose();
      onUnblocked?.(); // сигналізуємо батьку — треба перезавантажити групу
    } catch {
      showToast({ type: "error", title: "Помилка збереження" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BottomSheetContainer isVisible={visible} onClose={onClose}>
      <View style={styles.section}>
        <Button
          shape="round"
          hierarchy="tertiary"
          size="xsmall"
          leadingIcon={
            <AntDesign name="arrow-left" size={16} color={theme.colors.content.primary} />
          }
          onPress={onClose}
          style={{ alignSelf: "flex-start" }}
        />

        <Typography variant="h3" weight="bold" style={styles.title}>
          Заблоковані користувачі
        </Typography>
        <Typography variant="body2" tone="secondary" style={styles.subtitle}>
          Зніми галочку, щоб розблокувати учасника
        </Typography>

        {isLoading ? (
          <ActivityIndicator size="small" color={theme.colors.accent} style={styles.loader} />
        ) : users.length === 0 ? (
          <Typography variant="body2" tone="secondary" style={styles.empty}>
            Немає заблокованих користувачів
          </Typography>
        ) : (
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {users.map((u, index) => (
              <ListItem
                key={u.id}
                layout="check"
                artworkSize="none"
                label={`${u.lastName} ${u.firstName}`}
                checked={u.blocked}
                onPress={() => toggleUser(u.id)}
                showDivider={index < users.length - 1}
              />
            ))}
          </ScrollView>
        )}

        <Button
          label="Зберегти"
          hierarchy="primary"
          shape="pill"
          size="large"
          onPress={handleSave}
          loading={isSaving}
          disabled={isLoading || users.length === 0}
          style={{ width: "100%" }}
        />
      </View>
    </BottomSheetContainer>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: theme.spacing[12],
  },
  title: {
    fontSize: theme.typography.fontSize.h3,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.content.primary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: theme.typography.fontSize.caption,
    color: theme.colors.content.secondary,
    textAlign: "center",
    paddingHorizontal: theme.spacing[20],
  },
  scroll: {
    maxHeight: theme.spacing[96] * 4,
  },
  loader: {
    marginVertical: theme.spacing[20],
  },
  empty: {
    textAlign: "center",
    marginVertical: theme.spacing[20],
  },
});
