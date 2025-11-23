import { useAuthStore } from "@/src/store/authStore";
import { COLORS } from "@/src/theme/colors";
import { AntDesign } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Modal from "react-native-modal";

interface Member {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  active: boolean;
}

interface Props {
  currentName: string;
  visible: boolean;
  members: Member[];
  onClose: () => void;
  onRename: (newName: string) => void;
  onSaveMembers: (updated: { id: string }[]) => void;
  onDelete: () => void;
}

export default function CircleActionsModal({
  visible,
  currentName,
  members,
  onClose,
  onRename,
  onSaveMembers,
  onDelete,
}: Props) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [isEditingMembers, setIsEditingMembers] = useState(false);

  const [newName, setNewName] = useState("");
  const [localMembers, setLocalMembers] = useState<Member[]>([]);
  const user = useAuthStore().user;

  React.useEffect(() => {
    if (visible) {
      setLocalMembers(
        members
          .filter((m) => m.id !== user?.id)
          .map((m) => ({
            id: m.id,
            firstName: m.firstName,
            middleName: m.middleName,
            lastName: m.lastName,
            active: true,
          }))
      );
    }
  }, [members, visible]);

  const handleRenamePress = () => {
    setNewName(currentName);
    setIsRenaming(true);
  };

  const handleDoneRename = () => {
    if (newName.trim() !== "") {
      onRename(newName.trim());
      setIsRenaming(false);
      setNewName("");
    }
  };

  const toggleMember = (id: string) => {
    setLocalMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, active: !m.active } : m))
    );
  };

  const handleSaveMembers = () => {
    onSaveMembers(
      localMembers.filter((m) => m.active === true).map((m) => ({ id: m.id }))
    );
    setIsEditingMembers(false);
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection="down"
      style={styles.sheetWrapper}
      backdropOpacity={0.2}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      propagateSwipe
    >
      <View style={styles.sheet}>
        <View style={styles.handle} />

        {/* ===== RENAME MODE ===== */}
        {isRenaming && !isEditingMembers && (
          <View style={{ padding: 20 }}>
            <TouchableOpacity
              onPress={() => setIsRenaming(false)}
              style={styles.backButton}
            >
              <AntDesign
                name="arrow-left"
                size={16}
                color={COLORS.PRIMARY_BLUE}
              />
              <Text style={[styles.backButtonText, { marginLeft: 8 }]}>
                Назад
              </Text>
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Нова назва"
              placeholderTextColor={COLORS.TEXT_GRAY}
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />

            <TouchableOpacity
              style={styles.doneButton}
              onPress={handleDoneRename}
              disabled={newName.trim() === ""}
            >
              <Text style={styles.doneButtonText}>Готово</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ===== EDIT MEMBERS MODE ===== */}
        {!isRenaming && isEditingMembers && (
          <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
            <TouchableOpacity
              onPress={() => setIsEditingMembers(false)}
              style={styles.backButton}
            >
              <AntDesign
                name="arrow-left"
                size={16}
                color={COLORS.PRIMARY_BLUE}
              />
              <Text style={[styles.backButtonText, { marginLeft: 8 }]}>
                Назад
              </Text>
            </TouchableOpacity>

            <ScrollView style={{ maxHeight: 350 }}>
              {localMembers.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={styles.memberItem}
                  onPress={() => toggleMember(m.id)}
                >
                  <Text
                    style={styles.memberName}
                  >{`${m.lastName} ${m.firstName} ${m.middleName}`}</Text>

                  {m.active ? (
                    <AntDesign
                      name="check-circle"
                      size={22}
                      color={COLORS.PRIMARY_BLUE}
                    />
                  ) : (
                    <AntDesign
                      name="close-circle"
                      size={22}
                      color={COLORS.TEXT_GRAY}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.doneButton}
              onPress={handleSaveMembers}
            >
              <Text style={styles.doneButtonText}>Готово</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ===== DEFAULT MENU ===== */}
        {!isRenaming && !isEditingMembers && (
          <>
            <TouchableOpacity style={styles.item} onPress={handleRenamePress}>
              <Text style={styles.text}>Перейменувати</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.item}
              onPress={() => setIsEditingMembers(true)}
            >
              <Text style={styles.text}>Редагувати склад</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.item, styles.delete]}
              onPress={onDelete}
            >
              <Text style={[styles.text, styles.deleteText]}>Видалити</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetWrapper: { justifyContent: "flex-end", margin: 0 },
  sheet: {
    backgroundColor: COLORS.BACKGROUND_LIGHT,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    backgroundColor: "#D1D1D6",
    borderRadius: 2,
    marginVertical: 10,
  },
  item: { paddingVertical: 18, paddingHorizontal: 20 },
  text: { fontSize: 16, color: COLORS.TEXT_DARK, fontWeight: "600" },

  memberItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BACKGROUND_CARD,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  memberName: {
    fontSize: 16,
    color: COLORS.TEXT_DARK,
    fontWeight: "600",
  },

  delete: { marginTop: 10 },
  deleteText: { color: COLORS.STATE_DANGER },

  input: {
    backgroundColor: COLORS.INPUT_BG,
    borderWidth: 1,
    borderColor: COLORS.BACKGROUND_CARD,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.TEXT_DARK,
    textAlign: "center",
    marginBottom: 30,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.PRIMARY_BLUE,
    fontWeight: "500",
  },
  doneButton: {
    backgroundColor: COLORS.BLACK_BTN,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },
  doneButtonText: {
    color: COLORS.BACKGROUND_LIGHT,
    fontSize: 18,
    fontWeight: "700",
  },
});
