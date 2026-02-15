import { getBlockedUsers, unblockUser } from "@/src/api/groups";
import { COLORS } from "@/src/theme/colors";
import { AntDesign } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MemberAvatar from "../../MemberAvatar";

const { height } = Dimensions.get("window");

interface BlockedUser {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUpdatedAt?: string;
  };
}

interface Props {
  circleId: string;
  onClose: () => void;
}

export default function BlockedUsersView({ circleId, onClose }: Props) {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const fetchBlockedUsers = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await getBlockedUsers(circleId);
      setBlockedUsers(data);
    } catch (error) {
      console.error("Failed to fetch blocked users:", error);
    } finally {
      setLoading(false);
    }
  }, [circleId]);

  useEffect(() => {
    fetchBlockedUsers();
  }, [fetchBlockedUsers]);

  const handleUnblock = async (userId: string) => {
    try {
      setUnblockingId(userId);
      await unblockUser(circleId, userId);
      setBlockedUsers((prev) => prev.filter((u) => u.user.id !== userId));
    } catch (error) {
      console.error("Failed to unblock user:", error);
    } finally {
      setUnblockingId(null);
    }
  };

  const renderItem = ({ item }: { item: BlockedUser }) => (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        <MemberAvatar
          member={{
            id: item.user.id,
            firstName: item.user.firstName,
            lastName: item.user.lastName,
            avatarUpdatedAt: item.user.avatarUpdatedAt,
            status: "UNKNOWN",
          }}
        />
        <Text style={styles.userName}>
          {item.user.firstName} {item.user.lastName}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.unblockButton}
        onPress={() => handleUnblock(item.user.id)}
        disabled={unblockingId === item.user.id}
      >
        {unblockingId === item.user.id ? (
          <ActivityIndicator size="small" color={COLORS.PRIMARY_BLUE} />
        ) : (
          <Text style={styles.unblockText}>Розблокувати</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <AntDesign name="arrow-left" size={24} color={COLORS.PRIMARY_BLUE} />
        </TouchableOpacity>
        <Text style={styles.title}>Заблоковані користувачі</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.PRIMARY_BLUE} style={{ marginTop: 20 }} />
      ) : blockedUsers.length === 0 ? (
        <Text style={styles.emptyText}>У цьому колі немає заблокованих користувачів</Text>
      ) : (
        <FlatList
          data={blockedUsers}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 200,
    maxHeight: height * 0.7,
    backgroundColor: COLORS.BACKGROUND_LIGHT,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.TEXT_DARK,
  },
  listContent: {
    padding: 20,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.TEXT_DARK,
  },
  unblockButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#Eef2F6",
  },
  unblockText: {
    fontSize: 14,
    color: COLORS.PRIMARY_BLUE,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: COLORS.TEXT_GRAY,
    fontSize: 16,
  },
});
