import { useAuthStore } from "@/src/store/authStore";
import { COLORS } from "@/src/theme/colors";
import { AntDesign } from "@expo/vector-icons";
import Feather from "@expo/vector-icons/Feather";
import * as Clipboard from "expo-clipboard";
import React, { useEffect, useState } from "react";
import {
    Keyboard,
    LayoutAnimation,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    UIManager,
    View
} from "react-native";
import Modal from "react-native-modal";
import { SafeAreaView } from "react-native-safe-area-context";
import ConfirmationModal from "../../ConfirmationModal";
import BlockedUsersView from "./BlockedUsersView";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Member {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName?: string;
  active?: boolean;
}

interface Props {
  visible: boolean;
  circleId: string;
  currentName: string;
  inviteCode: string;
  members: Member[];
  ownerId: string;
  onClose: () => void;
  onRename: (newName: string) => void;
  onSaveMembers: (updated: { id: string }[]) => void;
  onDelete: () => void;
  onLeave: () => void;
  onRegenerateInvite: () => Promise<void>;
}

export default function CircleActionsModal({
  visible,
  circleId,
  currentName,
  inviteCode,
  members,
  ownerId,
  onClose,
  onRename,
  onSaveMembers,
  onDelete,
  onLeave,
  onRegenerateInvite,
}: Props) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [isEditingMembers, setIsEditingMembers] = useState(false);
  const [isViewingBlocked, setIsViewingBlocked] = useState(false);
  const [newName, setNewName] = useState("");
  const [localMembers, setLocalMembers] = useState<Member[]>([]);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isDeleteVisible, setIsDeleteVisible] = useState(false);
  const [isLeaveVisible, setIsLeaveVisible] = useState(false);

  const user = useAuthStore().user;
  const isOwner = user?.id === ownerId;

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsKeyboardVisible(false);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  React.useEffect(() => {
    if (visible) {
      setLocalMembers(
        members
          .filter((m) => m.id !== user?.id)
          .map((m) => ({ ...m, active: true }))
      );
    }
  }, [members, visible, user?.id]);

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
      localMembers.filter((m) => m.active).map((m) => ({ id: m.id }))
    );
    setIsEditingMembers(false);
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(inviteCode);
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
      <SafeAreaView
        style={[styles.sheet, isKeyboardVisible && styles.sheetExpanded]}
        edges={isKeyboardVisible ? ["top", "bottom"] : ["bottom"]}
      >
        <View style={styles.handle} />

        {/* ===== RENAME MODE (Owner Only) ===== */}
        {isRenaming && isOwner && (
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
              <Text style={styles.backButtonText}>Назад</Text>
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

        {/* ===== EDIT MEMBERS MODE (Owner Only) ===== */}
        {!isRenaming && isEditingMembers && isOwner && (
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
              <Text style={styles.backButtonText}>Назад</Text>
            </TouchableOpacity>

            <ScrollView style={{ maxHeight: 350 }}>
              {localMembers.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={styles.memberItem}
                  onPress={() => toggleMember(m.id)}
                >
                  <Text style={styles.memberName} numberOfLines={1} ellipsizeMode="tail">
                    {m.fullName || `${m.lastName} ${m.firstName}`.trim()}
                  </Text>
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

        {/* ===== BLOCKED USERS MODE (Owner Only) ===== */}
        {!isRenaming && !isEditingMembers && isViewingBlocked && isOwner && (
          <BlockedUsersView
             circleId={circleId}
             onClose={() => setIsViewingBlocked(false)}
          />
        )}

        {/* ===== MAIN MENU ===== */}
        {!isRenaming && !isEditingMembers && !isViewingBlocked && (
          <>
            <Text
              style={styles.modalTitle}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {currentName}
            </Text>
            {/* Show Invite Code only to Owner */}
            {isOwner && (
              <View style={styles.inviteContainer}>
                <Text style={styles.inviteText}>Код: {inviteCode}</Text>
                <TouchableOpacity
                  onPress={onRegenerateInvite}
                  style={styles.inviteButton}
                >
                  <Feather name="refresh-cw" size={16} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCopy}
                  style={[styles.inviteButton, { marginLeft: 8 }]}
                >
                  <Feather name="copy" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {/* Owner Actions */}
            {isOwner ? (
              <>
                <TouchableOpacity
                  style={styles.item}
                  onPress={handleRenamePress}
                >
                  <Text style={styles.text}>Перейменувати</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.item}
                  onPress={() => setIsEditingMembers(true)}
                >
                  <Text style={styles.text}>Редагувати склад</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.item}
                  onPress={() => setIsViewingBlocked(true)}
                >
                  <Text style={styles.text}>Заблоковані користувачі</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.delete}
                  onPress={() => setIsDeleteVisible(true)}
                >
                  <Text style={styles.deleteText}>Видалити коло</Text>
                </TouchableOpacity>
              </>
            ) : (
              /* User Actions */
              <>
                <TouchableOpacity
                  style={styles.delete}
                  onPress={() => setIsLeaveVisible(true)}
                >
                  <Text style={styles.deleteText}>Покинути коло</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </SafeAreaView>

      <ConfirmationModal
        isVisible={isDeleteVisible}
        onCancel={() => setIsDeleteVisible(false)}
        onConfirm={() => {
          setIsDeleteVisible(false);
          // Wait a bit for modal to close before triggering delete/onClose
          // Or just trigger it. onDelete usually closes the Modal itself.
          setTimeout(() => onDelete(), 300);
        }}
        title="Видалити це Коло?"
        message="Після видалення ви не зможете стежити за станом його учасників"
        confirmText="Видалити"
        cancelText="Назад"
      />

      <ConfirmationModal
        isVisible={isLeaveVisible}
        onCancel={() => setIsLeaveVisible(false)}
        onConfirm={() => {
          setIsLeaveVisible(false);
          setTimeout(() => onLeave(), 300);
        }}
        title="Покинути Коло?"
        message="Ви впевнені, що хочете покинути це коло?"
        confirmText="Покинути"
        cancelText="Назад"
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetWrapper: { justifyContent: "flex-end", margin: 0 },
  sheet: {
    backgroundColor: COLORS.BACKGROUND_LIGHT,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    maxHeight: "92%",
  },
  sheetExpanded: {
    maxHeight: "80%",
    flex: 1,
  },
  handle: {
    alignSelf: "center",
    width: 48,
    height: 5,
    backgroundColor: "#D1D1D6",
    borderRadius: 3,
    marginVertical: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.TEXT_DARK,
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: COLORS.BACKGROUND_CARD,
    borderRadius: 16,
    marginBottom: 14,
  },
  text: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.TEXT_DARK,
    textAlign: "center",
  },
  inviteContainer: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2F6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 32,
  },
  inviteText: { fontSize: 16, fontWeight: "600", marginRight: 8 },
  inviteButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: "#5D6470",
    justifyContent: "center",
    alignItems: "center",
  },
  delete: { backgroundColor: "transparent", marginTop: 24, marginBottom: 20 },
  deleteText: {
    color: COLORS.STATE_DANGER,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  input: {
    backgroundColor: COLORS.BACKGROUND_CARD,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.TEXT_DARK,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 26,
  },
  backButton: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.PRIMARY_BLUE,
    marginLeft: 8,
  },
  doneButton: {
    backgroundColor: COLORS.BLACK_BTN,
    borderRadius: 28,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 24,
  },
  doneButtonText: {
    color: COLORS.BACKGROUND_LIGHT,
    fontSize: 17,
    fontWeight: "700",
  },
  memberItem: {
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BACKGROUND_CARD,
  },
  memberName: { fontSize: 16, fontWeight: "600", color: COLORS.TEXT_DARK, flex: 1, marginRight: 12 },
});


