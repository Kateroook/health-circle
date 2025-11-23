import { AntDesign } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const COLORS = {
  BACKGROUND_LIGHT: "#FFFFFF",
  BACKGROUND_CARD: "#F2F2F7",
  TEXT_DARK: "#2C2C2E",
  TEXT_GRAY: "#8E8E93",
  PRIMARY_BLUE: "#007AFF",
  STATE_SAFE: "#34C759",
  STATE_DANGER: "#FF3B30",
  STATE_UNKNOWN: "#FFCC00",
  ICON_INACTIVE: "#E5E5EA",
};
const BORDER_RADIUS = 12;

interface CircleItemProps {
  title: string;
  members: { status: "safe" | "danger" | "unknown"; image: any }[];
  extraCount?: number;
}

const CircleItem: React.FC<CircleItemProps> = ({
  title,
  members,
  extraCount,
}) => {
  const renderBorder = (status: "safe" | "danger" | "unknown") => {
    switch (status) {
      case "safe":
        return { borderColor: COLORS.STATE_SAFE };
      case "danger":
        return { borderColor: COLORS.STATE_DANGER };
      case "unknown":
        return { borderColor: COLORS.STATE_UNKNOWN };
      default:
        return { borderColor: "transparent" };
    }
  };

  const placeholderImage = { uri: "https://via.placeholder.com/40" };

  return (
    <View style={styles.circleItemCard}>
      <View style={styles.circleItemHeader}>
        <Text style={styles.circleItemTitle}>{title}</Text>
        <TouchableOpacity style={styles.circleItemMenu}>
          <Text style={styles.circleItemMenuDots}>...</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.memberAvatarList}>
        {members.slice(0, 5).map((member, index) => (
          <View
            key={index}
            style={[styles.avatarBorder, renderBorder(member.status)]}
          >
            <Image source={placeholderImage} style={styles.memberAvatar} />
          </View>
        ))}
        {extraCount && extraCount > 0 ? (
          <View style={[styles.avatarBorder, styles.extraCountContainer]}>
            <Text style={styles.extraCountText}>+{extraCount}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

interface ContactSelectModalProps {
  isVisible: boolean;
  onClose: () => void;
  onNext: () => void;
}

const ContactSelectModal: React.FC<ContactSelectModalProps> = ({
  isVisible,
  onClose,
  onNext,
}) => {
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const mockContacts = [
    { id: 1, name: "Мама", phone: "380994567890" },
    { id: 2, name: "Мама", phone: "380994567890" },
    { id: 3, name: "Мама", phone: "380994567890" },
    { id: 4, name: "Брат", phone: "380671234567" },
  ];
  const placeholderImage = { uri: "https://via.placeholder.com/40" };

  const toggleContact = (id: number) => {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <View style={styles.modalContent}>
      <View style={styles.modalHandle} />
      <View style={styles.modalHeaderStep1}>
        <Text style={styles.modalTitle}>Створіть нове коло</Text>
        <Text style={styles.modalSubtitle}>
          Додайте своїх найближчих людей до Кола, щоб слідкувати за їх станом
        </Text>
      </View>

      <View style={styles.modalGroupPreview}>
        <View style={styles.modalGroupGlow}>
          <Image source={placeholderImage} style={styles.modalPreviewAvatar} />
          <Image source={placeholderImage} style={styles.modalPreviewAvatar} />
          <Image source={placeholderImage} style={styles.modalPreviewAvatar} />
          <Image source={placeholderImage} style={styles.modalPreviewAvatar} />
        </View>
      </View>

      <Text style={styles.modalSearchLabel}>Шукати</Text>
      <ScrollView style={styles.contactListModal}>
        {mockContacts.map((contact) => (
          <TouchableOpacity
            key={contact.id}
            style={styles.contactRowModal}
            onPress={() => toggleContact(contact.id)}
          >
            <Image source={placeholderImage} style={styles.memberAvatar} />
            <View style={styles.contactInfoModal}>
              <Text style={styles.contactNameModal}>{contact.name}</Text>
              <Text style={styles.contactPhoneModal}>{contact.phone}</Text>
            </View>
            <View
              style={[
                styles.modalCheckbox,
                selectedContacts.includes(contact.id)
                  ? styles.modalCheckboxChecked
                  : styles.modalCheckboxUnchecked,
              ]}
            >
              {selectedContacts.includes(contact.id) && (
                <AntDesign
                  name="check"
                  size={14}
                  color={COLORS.BACKGROUND_LIGHT}
                />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.modalButton,
          selectedContacts.length === 0 && styles.modalButtonDisabled,
        ]}
        onPress={onNext}
        disabled={selectedContacts.length === 0}
      >
        <Text style={styles.modalButtonText}>Готово</Text>
      </TouchableOpacity>
    </View>
  );
};

interface NameCircleModalProps {
  isVisible: boolean;
  onClose: () => void;
  onBack: () => void;
}

const NameCircleModal: React.FC<NameCircleModalProps> = ({
  isVisible,
  onClose,
  onBack,
}) => {
  const [circleName, setCircleName] = useState("Колеги");
  const placeholderImage = { uri: "https://via.placeholder.com/40" };

  return (
    <View style={styles.modalContent}>
      <View style={styles.modalHandle} />

      <View style={styles.modalHeaderStep2}>
        <TouchableOpacity style={styles.modalBackButton} onPress={onBack}>
          <AntDesign name="arrowleft" size={18} color={COLORS.TEXT_DARK} />
          <Text style={styles.modalBackText}>Назад</Text>
        </TouchableOpacity>
        <Text style={styles.modalTitleStep2}>Назвіть ваше Коло</Text>
      </View>

      <View style={styles.modalGroupPreview}>
        <View style={styles.modalGroupGlow}>
          <Image source={placeholderImage} style={styles.modalPreviewAvatar} />
          <Image source={placeholderImage} style={styles.modalPreviewAvatar} />
          <Image source={placeholderImage} style={styles.modalPreviewAvatar} />
          <Image source={placeholderImage} style={styles.modalPreviewAvatar} />
        </View>
      </View>

      <View style={styles.circleNameInputWrapper}>
        <TextInput
          style={styles.circleNameInput}
          value={circleName}
          onChangeText={setCircleName}
          autoFocus={true}
          textAlign={"center"}
          selectionColor={COLORS.PRIMARY_BLUE}
        />
      </View>

      <TouchableOpacity style={styles.modalButton} onPress={onClose}>
        <Text style={styles.modalButtonText}>Готово</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function CirclesScreen() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalStep, setModalStep] = useState(1);

  const mockCircleMembers = [
    { status: "danger" as const, image: null },
    { status: "safe" as const, image: null },
    { status: "unknown" as const, image: null },
    { status: "unknown" as const, image: null },
    { status: "unknown" as const, image: null },
  ];

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.mainTitle}>Кола</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setIsModalVisible(true);
              setModalStep(1);
            }}
          >
            <AntDesign name="plus" size={24} color={COLORS.BACKGROUND_LIGHT} />
          </TouchableOpacity>
        </View>

        <CircleItem title="Близькі" members={mockCircleMembers.slice(0, 4)} />
        <CircleItem title="Родина" members={mockCircleMembers} extraCount={2} />
        <CircleItem
          title="Друзі"
          members={mockCircleMembers.slice(0, 4).map((m, i) => ({
            ...m,
            status: i % 2 === 0 ? "safe" : "unknown",
          }))}
        />
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalWrapper}>
            <SafeAreaView
              edges={["bottom", "left", "right"]}
              style={styles.modalSafeArea}
            >
              {modalStep === 1 && (
                <ContactSelectModal
                  isVisible={isModalVisible}
                  onClose={() => setIsModalVisible(false)}
                  onNext={() => setModalStep(2)}
                />
              )}
              {modalStep === 2 && (
                <NameCircleModal
                  isVisible={isModalVisible}
                  onClose={() => setIsModalVisible(false)}
                  onBack={() => setModalStep(1)}
                />
              )}
            </SafeAreaView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_LIGHT,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: Platform.OS === "ios" ? 0 : 20,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Montserrat-Bold",
    color: COLORS.TEXT_DARK,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.PRIMARY_BLUE,
    justifyContent: "center",
    alignItems: "center",
  },

  circleItemCard: {
    backgroundColor: COLORS.BACKGROUND_CARD,
    borderRadius: BORDER_RADIUS,
    padding: 16,
    marginBottom: 12,
  },
  circleItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  circleItemTitle: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Montserrat-Bold",
    color: COLORS.TEXT_DARK,
  },
  circleItemMenu: {
    padding: 4,
  },
  circleItemMenuDots: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.TEXT_GRAY,
  },

  memberAvatarList: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
  },
  avatarBorder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
    marginRight: -10,
    backgroundColor: COLORS.BACKGROUND_LIGHT,
  },
  memberAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.ICON_INACTIVE,
  },
  extraCountContainer: {
    backgroundColor: COLORS.ICON_INACTIVE,
    borderWidth: 0,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
    marginRight: 0,
  },
  extraCountText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Montserrat-SemiBold",
    color: COLORS.TEXT_DARK,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalWrapper: {
    backgroundColor: COLORS.BACKGROUND_LIGHT,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalSafeArea: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.ICON_INACTIVE,
    alignSelf: "center",
    marginVertical: 10,
  },
  modalHeaderStep1: {
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Montserrat-Bold",
    color: COLORS.TEXT_DARK,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    fontFamily: "Montserrat-Regular",
    color: COLORS.TEXT_GRAY,
    textAlign: "center",
  },

  modalGroupPreview: {
    alignItems: "center",
    marginVertical: 20,
  },
  modalGroupGlow: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.PRIMARY_BLUE,
    opacity: 0.7,
    shadowColor: COLORS.PRIMARY_BLUE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 50,
    elevation: 10,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  modalPreviewAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    margin: 5,
    backgroundColor: COLORS.BACKGROUND_LIGHT,
    borderWidth: 2,
    borderColor: COLORS.BACKGROUND_CARD,
  },

  modalSearchLabel: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Montserrat-SemiBold",
    color: COLORS.TEXT_GRAY,
    marginBottom: 10,
  },
  contactListModal: {
    maxHeight: 250,
    marginBottom: 20,
  },
  contactRowModal: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.ICON_INACTIVE,
  },
  contactInfoModal: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  contactNameModal: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Montserrat-SemiBold",
    color: COLORS.TEXT_DARK,
  },
  contactPhoneModal: {
    fontSize: 14,
    fontFamily: "Montserrat-Regular",
    color: COLORS.TEXT_GRAY,
  },
  modalCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  modalCheckboxChecked: {
    backgroundColor: COLORS.PRIMARY_BLUE,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY_BLUE,
  },
  modalCheckboxUnchecked: {
    backgroundColor: COLORS.BACKGROUND_LIGHT,
    borderWidth: 1,
    borderColor: COLORS.TEXT_GRAY,
  },

  modalButton: {
    backgroundColor: "#000000",
    borderRadius: BORDER_RADIUS,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: Platform.OS === "ios" ? 20 : 10,
    marginTop: 10,
  },
  modalButtonDisabled: {
    backgroundColor: COLORS.TEXT_GRAY,
  },
  modalButtonText: {
    color: COLORS.BACKGROUND_LIGHT,
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Montserrat-Bold",
  },

  modalHeaderStep2: {
    alignItems: "center",
    marginBottom: 30,
  },
  modalTitleStep2: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Montserrat-Bold",
    color: COLORS.TEXT_DARK,
    marginTop: 10,
  },
  modalBackButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  modalBackText: {
    fontSize: 16,
    fontFamily: "Montserrat-Regular",
    color: COLORS.TEXT_DARK,
    marginLeft: 5,
  },
  circleNameInputWrapper: {
    alignItems: "center",
    marginVertical: 40,
  },
  circleNameInput: {
    fontSize: 34,
    fontWeight: "bold",
    fontFamily: "Montserrat-Bold",
    color: COLORS.TEXT_DARK,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.PRIMARY_BLUE,
    paddingHorizontal: 10,
    paddingVertical: 5,
    minWidth: "50%",
  },
});
