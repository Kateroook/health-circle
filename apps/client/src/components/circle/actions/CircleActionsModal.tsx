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
    Text,
    TextInput,
    TouchableOpacity,
    UIManager,
    View
} from "react-native";
import Modal from "react-native-modal";
import { SafeAreaView } from "react-native-safe-area-context";
import ConfirmationModal from "../../ConfirmationModal";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Member {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  active: boolean;
}

interface Props {
  visible: boolean;
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
                    {`${m.lastName} ${m.firstName}`}
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

        {/* ===== MAIN MENU ===== */}
        {!isRenaming && !isEditingMembers && (
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


