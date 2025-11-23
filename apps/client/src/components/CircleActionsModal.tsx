import { AntDesign } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Modal from "react-native-modal";
import { COLORS } from "../theme/colors";

interface Props {
  currentName: string;
  visible: boolean;
  onClose: () => void;
  onRename: (newName: string) => void;
  onEditMembers: () => void;
  onDelete: () => void;
}

export default function CircleActionsModal({
  visible,
  currentName,
  onClose,
  onRename,
  onEditMembers,
  onDelete,
}: Props) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState("");

  const handleRenamePress = () => {
    setNewName(currentName);
    setIsRenaming(true);
  };

  const handleDonePress = () => {
    if (newName.trim() !== "") {
      onRename(newName.trim());
      setNewName("");
      setIsRenaming(false);
    }
  };

  const handleCancelRename = () => {
    setNewName("");
    setIsRenaming(false);
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

        {isRenaming ? (
          <View style={{ padding: 20 }}>
            {/* Back button */}

            <TouchableOpacity
              onPress={handleCancelRename}
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
              onPress={handleDonePress}
              disabled={newName.trim() === ""}
            >
              <Text style={styles.doneButtonText}>Готово</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TouchableOpacity style={styles.item} onPress={handleRenamePress}>
              <Text style={styles.text}>Перейменувати</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.item} onPress={onEditMembers}>
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
  },
  doneButtonText: {
    color: COLORS.BACKGROUND_LIGHT,
    fontSize: 18,
    fontWeight: "700",
  },
});
