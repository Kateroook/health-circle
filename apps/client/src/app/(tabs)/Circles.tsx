import { AntDesign } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
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
  INPUT_BG: "#F2F2F7",
  BLACK_BTN: "#000000",
};

/* ----------------------------------------------------------
 * CIRCLE ITEM (Без змін)
 * -------------------------------------------------------- */
const CircleItem = ({ title, members, extraCount }) => {
  const renderBorder = (status) => {
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

  const placeholder = { uri: "https://via.placeholder.com/40" };

  return (
    <View style={styles.circleItemCard}>
      <View style={styles.circleItemHeader}>
        <Text style={styles.circleItemTitle}>{title}</Text>
        <TouchableOpacity>
          <Text style={styles.circleItemMenuDots}>...</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.memberAvatarList}>
        {members.slice(0, 5).map((m, i) => (
          <View key={i} style={[styles.avatarBorder, renderBorder(m.status)]}>
            <Image source={placeholder} style={styles.memberAvatar} />
          </View>
        ))}

        {extraCount ? (
          <View style={[styles.avatarBorder, styles.extraCountContainer]}>
            <Text style={styles.extraCountText}>+{extraCount}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

/* ----------------------------------------------------------
 * NEW MODAL CONTENT (Tabs: Join / Create)
 * -------------------------------------------------------- */
const AddCircleModal = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState("join"); // 'join' | 'create'

  // Join State
  const [joinCode, setJoinCode] = useState(["", "", "", "", "", ""]);

  // Create State
  const [createStep, setCreateStep] = useState(1); // 1: Name, 2: Share Code, 3: Done
  const [circleName, setCircleName] = useState("");
  const generatedCode = ["A", "B", "C", "1", "2", "3"]; // Mock generated code

  const placeholder = { uri: "https://via.placeholder.com/60" };

  // -- RENDERERS --

  // Code Input Renderer (Reusable for Input or Display)
  const renderCodeBoxes = (values, isEditable = true, onChange) => {
    return (
      <View style={styles.codeRow}>
        {values.map((val, index) => (
          <View key={index} style={styles.codeBox}>
            {isEditable ? (
              <TextInput
                style={styles.codeBoxInput}
                maxLength={1}
                value={val}
                onChangeText={(text) => {
                  const newCode = [...values];
                  newCode[index] = text;
                  if (onChange) onChange(newCode);
                }}
                textAlign="center"
              />
            ) : (
              <Text style={styles.codeBoxText}>{val}</Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  // --- TAB 1: JOIN ---
  const renderJoinTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionLabel}>
        Уведіть код, щоб приєднатися до Кола.
      </Text>

      {renderCodeBoxes(joinCode, true, setJoinCode)}

      <View style={styles.spacer} />

      {/* Placeholder Avatar Circle */}
      <View style={styles.previewCircleLarge}>
        <View style={styles.previewCircleInner} />
      </View>

      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.blueButton]}
          onPress={onClose} // Mock action
        >
          <Text style={styles.actionButtonText}>Приєднатися</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // --- TAB 2: CREATE ---
  const renderCreateTab = () => {
    // Step 1: Name Input
    if (createStep === 1) {
      return (
        <View style={styles.tabContent}>
          <Text style={styles.sectionLabel}>Назвіть ваше Коло</Text>
          <TextInput
            style={styles.nameInput}
            placeholder="Супер коло"
            placeholderTextColor="#C7C7CC"
            value={circleName}
            onChangeText={setCircleName}
          />

          {/* Код тут ще не показуємо або показуємо пустий/заблокований як на дизайні */}
          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionLabel}>Код кола</Text>
            <View style={styles.codeRow}>
              {[1, 2, 3, 4, 5, 6].map((_, i) => (
                <View
                  key={i}
                  style={[styles.codeBox, { backgroundColor: "#E5E5EA" }]}
                />
              ))}
            </View>
          </View>

          <View style={styles.bottomButtonContainer}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.blueButton,
                !circleName && styles.disabledButton,
              ]}
              disabled={!circleName}
              onPress={() => setCreateStep(2)}
            >
              <Text style={styles.actionButtonText}>Створити</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Step 2: Share Code
    if (createStep === 2) {
      return (
        <View style={styles.tabContent}>
          <Text style={styles.sectionLabel}>Назвіть ваше Коло</Text>
          <Text style={styles.finalNameText}>{circleName || "Близькі"}</Text>

          <View style={styles.codeLabelRow}>
            <Text style={styles.sectionLabel}>Код кола</Text>
            <AntDesign name="copy1" size={16} color={COLORS.TEXT_GRAY} />
          </View>

          {renderCodeBoxes(generatedCode, false)}

          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => setCreateStep(3)}
          >
            <Text style={styles.shareButtonText}>Надіслати запрошення</Text>
            <AntDesign
              name="sharealt"
              size={16}
              color="white"
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>

          {/* Placeholder for avatar preview at bottom */}
          <View style={[styles.previewCircleLarge, { marginTop: 30 }]}>
            <View style={styles.previewCircleInner}>
              <Image source={placeholder} style={styles.miniAvatar} />
              <Image source={placeholder} style={styles.miniAvatar} />
            </View>
          </View>
        </View>
      );
    }

    // Step 3: Final (Black Button)
    if (createStep === 3) {
      return (
        <View style={styles.tabContent}>
          {/* Same top part or simplified */}
          <Text style={styles.sectionLabel}>Назвіть ваше Коло</Text>
          <Text style={styles.finalNameText}>{circleName}</Text>

          <View style={styles.codeLabelRow}>
            <Text style={styles.sectionLabel}>Код кола</Text>
            <AntDesign name="copy1" size={16} color={COLORS.TEXT_GRAY} />
          </View>
          {renderCodeBoxes(generatedCode, false)}

          <View style={styles.blueMessageBlock}>
            <Text style={styles.blueMessageText}>Надіслати запрошення</Text>
            <AntDesign name="sharealt" size={14} color="white" />
          </View>

          <View style={styles.finalAvatarPreview}>
            <View style={styles.glowCircle}>
              <Image
                source={placeholder}
                style={[styles.miniAvatar, { left: -10 }]}
              />
              <Image
                source={placeholder}
                style={[styles.miniAvatar, { left: 10 }]}
              />
            </View>
          </View>

          <View style={styles.bottomButtonContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.blackButton]}
              onPress={onClose}
            >
              <Text style={styles.actionButtonText}>Готово</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
  };

  return (
    <View style={styles.modalContent}>
      <View style={styles.modalHandle} />

      <Text style={styles.modalTitle}>Додайте нове коло</Text>
      <Text style={styles.modalSubtitle}>
        Створіть своє коло або приєднайтеся до існуючого
      </Text>

      {/* Toggle Switch */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            activeTab === "join" && styles.toggleBtnActive,
          ]}
          onPress={() => {
            setActiveTab("join");
          }}
        >
          <Text
            style={[
              styles.toggleText,
              activeTab === "join" && styles.toggleTextActive,
            ]}
          >
            Приєднатися
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleBtn,
            activeTab === "create" && styles.toggleBtnActive,
          ]}
          onPress={() => {
            setActiveTab("create");
            setCreateStep(1);
          }}
        >
          <Text
            style={[
              styles.toggleText,
              activeTab === "create" && styles.toggleTextActive,
            ]}
          >
            Створити
          </Text>
        </TouchableOpacity>
      </View>

      {/* Dynamic Content */}
      <ScrollView style={{ minHeight: 300 }}>
        {activeTab === "join" ? renderJoinTab() : renderCreateTab()}
      </ScrollView>
    </View>
  );
};

/* ----------------------------------------------------------
 * MAIN SCREEN
 * -------------------------------------------------------- */
export default function CirclesScreen() {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const mockMembers = [
    { status: "danger", image: null },
    { status: "safe", image: null },
    { status: "unknown", image: null },
    { status: "unknown", image: null },
    { status: "unknown", image: null },
  ];

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.mainTitle}>Кола</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setIsModalVisible(true)}
          >
            <AntDesign name="plus" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <CircleItem title="Близькі" members={mockMembers.slice(0, 4)} />
        <CircleItem title="Родина" members={mockMembers} extraCount={2} />
        <CircleItem
          title="Друзі"
          members={mockMembers.slice(0, 4).map((m, i) => ({
            ...m,
            status: i % 2 === 0 ? "safe" : "unknown",
          }))}
        />
      </ScrollView>

      {/* MODAL */}
      <Modal
        animationType="slide"
        transparent
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalWrapper}>
            <SafeAreaView edges={["bottom"]}>
              <AddCircleModal onClose={() => setIsModalVisible(false)} />
            </SafeAreaView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

/* ----------------------------------------------------------
 * STYLES
 * -------------------------------------------------------- */
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFF",
  },

  /* HEADER & MAIN LIST */
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  circleItemCard: {
    backgroundColor: "#F2F2F7",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  circleItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  circleItemTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  circleItemMenuDots: {
    fontSize: 26,
    marginTop: -4,
    color: "#8E8E93",
  },
  memberAvatarList: {
    flexDirection: "row",
    marginTop: 14,
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
    backgroundColor: "#FFF",
  },
  memberAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#E5E5EA",
  },
  extraCountContainer: {
    backgroundColor: "#E5E5EA",
    borderWidth: 0,
  },
  extraCountText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
  },

  /* MODAL CONTAINER */
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalWrapper: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: "92%",
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D1D6",
    alignSelf: "center",
    marginVertical: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
    textAlign: "center",
    marginBottom: 6,
  },
  modalSubtitle: {
    textAlign: "center",
    fontSize: 13,
    color: "#8E8E93",
    marginBottom: 20,
    paddingHorizontal: 20,
  },

  /* TOGGLE SWITCH */
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#7676801F", // Light grey like iOS segmented control
    borderRadius: 9,
    padding: 2,
    marginBottom: 24,
    height: 36,
  },
  toggleBtn: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 7,
  },
  toggleBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#000000",
  },
  toggleTextActive: {
    fontWeight: "600",
  },

  /* TAB CONTENT */
  tabContent: {
    paddingVertical: 10,
  },
  sectionLabel: {
    fontSize: 13,
    color: "#8E8E93",
    marginBottom: 8,
  },

  /* CODE INPUTS */
  codeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  codeBox: {
    width: 46,
    height: 56,
    backgroundColor: "#F2F2F7",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  codeBoxInput: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1C1C1E",
    width: "100%",
    height: "100%",
  },
  codeBoxText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1C1C1E",
  },

  /* CREATE FORM */
  nameInput: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.PRIMARY_BLUE,
    paddingVertical: 8,
    borderBottomWidth: 0, // Clean style as per design
    marginBottom: 4,
  },
  finalNameText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 20,
  },
  codeLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  /* BUTTONS */
  bottomButtonContainer: {
    marginTop: 20,
  },
  actionButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  blueButton: {
    backgroundColor: COLORS.PRIMARY_BLUE,
  },
  blueButtonLight: {
    backgroundColor: "#E0EEFF",
  },
  blackButton: {
    backgroundColor: COLORS.BLACK_BTN,
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },

  /* SHARE BUTTON */
  shareButton: {
    backgroundColor: COLORS.PRIMARY_BLUE,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    marginTop: 10,
  },
  shareButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  blueMessageBlock: {
    backgroundColor: COLORS.PRIMARY_BLUE,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  blueMessageText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
    marginRight: 6,
  },

  /* PREVIEWS & DECORATIONS */
  spacer: {
    height: 20,
  },
  previewCircleLarge: {
    alignSelf: "center",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  previewCircleInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#E5E5EA", // Darker grey circle inside
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  finalAvatarPreview: {
    alignItems: "center",
    marginTop: 30,
    marginBottom: 10,
  },
  glowCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  miniAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#FFF",
  },
});
