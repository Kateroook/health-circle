import { COLORS } from "@/src/theme/colors";
import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import MemberAvatar from "../../MemberAvatar";

import { Member } from "../CircleItem";

interface MemberDetailsViewProps {
  member: Member;
  onInternalRename?: (newName: string) => void; 
  onClose: () => void;
  onRemoveMember: () => void;
}

export default function MemberDetailsView({
  member,
  onInternalRename,
  onClose,
  onRemoveMember,
}: MemberDetailsViewProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(member.firstName);

  const handleSaveRename = () => {
    if (onInternalRename) {
      onInternalRename(newName);
    }
    setIsRenaming(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
         <View style={styles.dragHandle} />
      </View>
      
      {!isRenaming ? (
        <>
            <View style={styles.profileSection}>
                <View style={styles.avatarContainer}>
                     <MemberAvatar member={{...member, status: member.status || 'UNKNOWN'}} />
                </View>
                <Text style={styles.memberName}>{member.firstName} {member.lastName}</Text>
            </View>

            <View style={styles.actionsList}>
                <TouchableOpacity 
                    style={styles.actionButton} 
                    onPress={() => setIsRenaming(true)}
                >
                    <Text style={styles.actionButtonText}>Редагувати імʼя</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={onRemoveMember}
                >
                    <Text style={[styles.actionButtonText, styles.dangerText]}>Видалити з кола</Text>
                </TouchableOpacity>
            </View>
        </>
      ) : (
          <View style={styles.renameContainer}>
             <Text style={styles.renameTitle}>Редагування імʼя</Text>
             <TextInput
                style={styles.input}
                value={newName}
                onChangeText={setNewName}
                placeholder="Введіть нове імʼя"
             />
             <Text style={styles.hintText}>Це імʼя буде відображатися у вашому колі</Text>
             
             <TouchableOpacity style={styles.saveButton} onPress={handleSaveRename}>
                 <Text style={styles.saveButtonText}>Зберегти</Text>
             </TouchableOpacity>
          </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
    width: '100%',
  },
  header: {
      width: '100%',
      alignItems: 'center',
      marginBottom: 20
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  profileSection: {
      alignItems: 'center',
      marginBottom: 30
  },
  avatarContainer: {
      transform: [{ scale: 2 }], // Make avatar bigger
      marginBottom: 20
  },
  memberName: {
      fontSize: 24,
      fontWeight: 'bold',
      marginTop: 10,
      color: COLORS.TEXT_DARK
  },
  actionsList: {
      width: '100%',
      gap: 12
  },
  actionButton: {
      backgroundColor: '#Eef2F6',
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      width: '100%'
  },
  actionButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: COLORS.TEXT_DARK
  },
  dangerText: {
      color: COLORS.STATE_DANGER
  },
  // Rename Styles
  renameContainer: {
      width: '100%',
      alignItems: 'center',
      paddingTop: 10
  },
  renameTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 20,
      color: COLORS.TEXT_DARK
  },
  input: {
      width: '100%',
      backgroundColor: '#Eef2F6',
      padding: 16,
      borderRadius: 12,
      fontSize: 16,
      marginBottom: 8
  },
  hintText: {
      fontSize: 12,
      color: COLORS.TEXT_GRAY,
      alignSelf: 'flex-start',
      marginBottom: 24
  },
  saveButton: {
      width: '100%',
      backgroundColor: 'black',
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center'
  },
  saveButtonText: {
      color: 'white',
      fontWeight: '700',
      fontSize: 16
  }
});
