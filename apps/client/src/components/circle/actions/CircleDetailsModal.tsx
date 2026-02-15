import { useAuthStore } from "@/src/store/authStore";
import { COLORS } from "@/src/theme/colors";
import { AntDesign } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    Keyboard,
    LayoutAnimation,
    Platform,
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
import CircleDetailsView from "./CircleDetailsView";
import MemberDetailsView from "./MemberDetailsView";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

import { Member } from "../CircleItem";

interface Props {
  visible: boolean;
  currentName: string;
  inviteCode: string;
  members: Member[];
  ownerId: string;
  onClose: () => void;
  onRename: (newName: string) => void; // Used for "Rename Circle" from details
  onSaveMembers: (updated: { id: string }[]) => void;
  onDelete: () => void; // Used for "Delete Circle" from details
  onLeave: () => void; // Used for "Leave Circle" from details
  onRegenerateInvite: () => Promise<void>;
}

export default function CircleDetailsModal({
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
  const [view, setView] = useState<"details" | "member" | "rename_circle">("details");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [newName, setNewName] = useState("");
  
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isDeleteVisible, setIsDeleteVisible] = useState(false);
  const [isLeaveVisible, setIsLeaveVisible] = useState(false);

  const user = useAuthStore().user;
  const isOwner = user?.id === ownerId;

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setView("details");
      setSelectedMember(null);
      setNewName("");
    }
  }, [visible]);

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

  const handleMemberPress = (member: Member) => {
    setSelectedMember(member);
    setView("member");
  };

  const handleRenameCirclePress = () => {
    setNewName(currentName);
    setView("rename_circle");
  };

  const handleDoneRenameCircle = () => {
    if (newName.trim() !== "") {
        onRename(newName.trim());
        setView("details");
    }
  };

  const handleRemoveMember = () => {
    if (selectedMember && isOwner) {
       const updatedMembers = members
            .filter(m => m.id !== selectedMember?.id)
            .map(m => ({ id: m.id }));
       onSaveMembers(updatedMembers);
       setView("details");
    }
  };
  
  const handleInternalMemberRename = (newName: string) => {
      console.log(`Requested rename for ${selectedMember?.id} to ${newName}`);
      setView("details");
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onBackButtonPress={() => {
          if (view !== 'details') {
              setView('details');
          } else {
              onClose();
          }
      }}
      onSwipeComplete={onClose}
      swipeDirection={view === "details" ? "down" : undefined}
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

        {/* ===== RENAME CIRCLE MODE ===== */}
        {view === "rename_circle" && isOwner && (
          <View style={{ padding: 20 }}>
            <TouchableOpacity
              onPress={() => setView("details")}
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
              onPress={handleDoneRenameCircle}
              disabled={newName.trim() === ""}
            >
              <Text style={styles.doneButtonText}>Готово</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ===== MEMBER DETAILS MODE ===== */}
        {view === "member" && selectedMember && (
            <View style={{ flex: 1 }}>
                 <TouchableOpacity
                  onPress={() => setView("details")}
                  style={[styles.backButton, { paddingHorizontal: 20 }]}
                >
                  <AntDesign
                    name="arrow-left"
                    size={16}
                    color={COLORS.PRIMARY_BLUE}
                  />
                  <Text style={styles.backButtonText}>Назад</Text>
                </TouchableOpacity>
                
                <MemberDetailsView 
                    member={selectedMember}
                    onInternalRename={handleInternalMemberRename}
                    onClose={() => setView("details")}
                    onRemoveMember={handleRemoveMember}
                />
            </View>
        )}

        {/* ===== DETAILS VIEW (Main) ===== */}
        {view === "details" && (
            <>
              <CircleDetailsView
                name={currentName}
                inviteCode={inviteCode}
                members={members}
                isOwner={isOwner || false}
                onClose={onClose}
                onRenamePress={handleRenameCirclePress}
                onUnsubscribePress={() => setIsLeaveVisible(true)}
                onMemberPress={handleMemberPress}
              />
              
              {/* Footer Actions (Delete/Leave) */}
              <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
                {isOwner ? (
                     <TouchableOpacity
                      style={styles.delete}
                      onPress={() => setIsDeleteVisible(true)}
                    >
                      <Text style={styles.deleteText}>Видалити коло</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                      style={styles.delete}
                      onPress={() => setIsLeaveVisible(true)}
                    >
                      <Text style={styles.deleteText}>Покинути коло</Text>
                    </TouchableOpacity>
                )}
              </View>
          </>
        )}
      </SafeAreaView>

      <ConfirmationModal
        isVisible={isDeleteVisible}
        onCancel={() => setIsDeleteVisible(false)}
        onConfirm={() => {
          setIsDeleteVisible(false);
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
    maxHeight: "92%",
    flex: 1 
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
  delete: { backgroundColor: "transparent", marginTop: 10, marginBottom: 20 },
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
});
