import { COLORS } from "@/src/theme/colors";
import { AntDesign, Feather, MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MemberAvatar from "../../MemberAvatar";

import { Member } from "../CircleItem";

type DetailsMember = Member & { mood?: string };

interface CircleDetailsViewProps {
  name: string;
  inviteCode: string;
  members: DetailsMember[];
  isOwner: boolean;
  onClose: () => void;
  onRenamePress: () => void;
  onUnsubscribePress: () => void;
  onMemberPress: (member: DetailsMember) => void;
}

export default function CircleDetailsView({
  name,
  inviteCode,
  members,
  isOwner,
  onClose,
  onRenamePress,
  onUnsubscribePress,
  onMemberPress,
}: CircleDetailsViewProps) {
  const handleCopy = async () => {
    await Clipboard.setStringAsync(inviteCode);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{name}</Text>
        {isOwner && (
          <TouchableOpacity onPress={onRenamePress} style={styles.editButton}>
            <AntDesign name="edit" size={20} color={COLORS.PRIMARY_BLUE} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.codeContainer}>
        <Text style={styles.codeText}>Код: {inviteCode}</Text>
        <TouchableOpacity onPress={handleCopy} style={styles.copyButton}>
          <Feather name="copy" size={16} color={COLORS.TEXT_DARK} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.membersList}>
        {members.map((member) => (
          <View key={member.id} style={styles.memberCard}>
            <View style={styles.memberHeader}>
              <View style={styles.memberInfo}>
                 <MemberAvatar member={{...member, status: member.status || 'UNKNOWN'}} />
                 <View style={styles.memberNameContainer}>
                    <Text style={styles.memberName}>
                        {member.fullName || `${member.firstName} ${member.lastName}`.trim()}
                    </Text>
                    <View style={styles.statusContainer}>
                        <Text style={styles.statusText}>
                            {member.status === 'SAFE' ? 'В безпеці' : 
                             member.status === 'DANGER' ? 'У небезпеці' : 'Невідомо'}
                        </Text>
                         <MaterialIcons name="notifications" size={16} color={COLORS.PRIMARY_BLUE} />
                    </View>
                    <View style={styles.moodContainer}>
                        <Text style={styles.moodLabel}>НАСТРІЙ</Text>
                        <View style={styles.moodValueContainer}>
                            <Text style={styles.moodText}>{member.mood || 'Не відмітився'}</Text>
                             <MaterialIcons name="notifications" size={16} color={COLORS.PRIMARY_BLUE} />
                        </View>
                    </View>
                 </View>
              </View>
              <TouchableOpacity onPress={() => onMemberPress(member)}>
                <MaterialIcons name="more-horiz" size={24} color={COLORS.TEXT_GRAY} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.TEXT_DARK,
  },
  editButton: {
    padding: 8,
    backgroundColor: COLORS.PRIMARY_BLUE + "20", // Light blue background
    borderRadius: 20,
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2F6",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 20,
  },
  codeText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.TEXT_DARK,
    marginRight: 8,
  },
  copyButton: {
    padding: 4,
  },
  membersList: {
    flex: 1,
  },
  memberCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fff', // Use explicit white if card bg is different
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  memberHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  memberInfo: {
    flexDirection: "row",
    flex: 1,
  },
  memberNameContainer: {
    marginLeft: 12,
    flex: 1,
  },
  memberName: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.TEXT_DARK,
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
  },
  moodContainer: {
    marginTop: 4
  },
  moodLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.TEXT_GRAY,
    textTransform: 'uppercase',
    marginBottom: 2
  },
  moodValueContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6
  },
  moodText: {
      fontSize: 14,
      fontWeight: '600',
      color: COLORS.TEXT_DARK
  }
});
