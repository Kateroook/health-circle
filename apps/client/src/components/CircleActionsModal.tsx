import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Modal from "react-native-modal";
import { COLORS } from "../theme/colors";

interface Props {
  visible: boolean;
  onClose: () => void;

  onRename: () => void;
  onEditMembers: () => void;
  onDelete: () => void;
}

export default function CircleActionsModal({
  visible,
  onClose,
  onRename,
  onEditMembers,
  onDelete,
}: Props) {
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

        <TouchableOpacity style={styles.item} onPress={onRename}>
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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetWrapper: {
    justifyContent: "flex-end",
    margin: 0,
  },
  sheet: {
    backgroundColor: "white",
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
  item: {
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  text: {
    fontSize: 16,
    color: COLORS.TEXT_DARK,
    fontWeight: "600",
  },
  delete: {
    marginTop: 10,
  },
  deleteText: {
    color: COLORS.STATE_DANGER,
  },
});
