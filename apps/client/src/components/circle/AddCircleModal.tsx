import { apiFetch } from "@/src/api/api";
import { COLORS } from "@/src/theme/colors";
import { AntDesign, Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React, { useState } from "react";
import { Alert, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
// 1. Import the library
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { formatErrorMessage } from "../../utils/error.util";
import OtpInput from "../OtpInput";

interface AddCircleModalProps {
  onClose: () => void;
  onUpdated?: () => void;
}

const AddCircleModal: React.FC<AddCircleModalProps> = ({ onClose, onUpdated }) => {
  const [activeTab, setActiveTab] = useState<"join" | "create">("join");

  // Join tab
  const [joinCode, setJoinCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [isJoining, setIsJoining] = useState(false);

  // Create tab
  const [createStep, setCreateStep] = useState<1 | 2 | 3>(1);
  const [circleName, setCircleName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string[]>(["", "", "", "", "", ""]);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(generatedCode.join(""));
  };

  // --- CREATE CIRCLE ---
  const handleCreateCircle = async () => {
    setIsCreating(true);
    try {
      const response = await apiFetch("/groups", {
        method: "POST",
        body: JSON.stringify({ name: circleName.trim() }),
      });
      const code = response.inviteCode || "";
      setGeneratedCode(code.split(""));
      setCreateStep(2);

      if (onUpdated) onUpdated();
    } catch (error: any) {
      const msg = formatErrorMessage(error, "Не вдалося створити коло. Спробуйте ще раз.");
      Alert.alert("Помилка", msg);
      console.error("Create circle error:", error);
    } finally {
      setIsCreating(false);
    }
  };

  // --- JOIN CIRCLE ---
  const handleJoinCircle = async () => {
    const code = joinCode.join("");
    if (code.length !== 6) {
      Alert.alert("Помилка", "Будь ласка, введіть повний код");
      return;
    }
    setIsJoining(true);
    try {
      const response = await apiFetch("/groups/join", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      Alert.alert("Успіх", "Ви приєдналися до кола");

      if (onUpdated) onUpdated();
      onClose();
    } catch (error: any) {
      const msg = formatErrorMessage(error, "Не вдалося приєднатися до кола. Перевірте код.");
      Alert.alert("Помилка", msg);
      console.error("Join circle error:", error);
    } finally {
      setIsJoining(false);
    }
  };

  // --- RENDER ---
  return (
    // 2. Use KeyboardAwareScrollView as the main wrapper
    // enableOnAndroid: crucial for Android support
    // extraScrollHeight: adds padding above the keyboard so the input isn't glued to it
    <KeyboardAwareScrollView
      enableOnAndroid={true}
      extraScrollHeight={40}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.scrollContent, { minHeight: "90%" }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.modalInner}>
        <View style={styles.handle} />
        <Text style={styles.title}>Додайте нове коло</Text>
        <Text style={styles.subtitle}>Створіть своє коло або приєднайся до існуючого</Text>

        {/* Tabs */}
        <View style={styles.segment}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === "join" && styles.segmentActive]}
            onPress={() => setActiveTab("join")}
          >
            <Text style={[styles.segmentText, activeTab === "join" && styles.segmentTextActive]}>
              Приєднатися
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === "create" && styles.segmentActive]}
            onPress={() => {
              setActiveTab("create");
              setCreateStep(1);
            }}
          >
            <Text style={[styles.segmentText, activeTab === "create" && styles.segmentTextActive]}>
              Створити
            </Text>
          </TouchableOpacity>
        </View>

        {/* JOIN Content */}
        {activeTab === "join" && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionLabel}>Введи код, щоб приєднатися до Кола.</Text>
            <OtpInput value={joinCode} onChange={setJoinCode} />
            <TouchableOpacity
              style={[
                styles.btn,
                joinCode.join("").length === 6 && !isJoining
                  ? styles.blueBtn
                  : styles.grayDisabledBtn,
              ]}
              disabled={joinCode.join("").length !== 6 || isJoining}
              onPress={handleJoinCircle}
            >
              <Text
                style={[
                  styles.btnText,
                  joinCode.join("").length === 6 && !isJoining
                    ? styles.btnText // білий для активної
                    : styles.btnTextDisabled, // чорний/темний для неактивної
                ]}
              >
                {isJoining ? "Підключення..." : "Приєднатися"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* CREATE Content */}
        {activeTab === "create" && (
          <View style={styles.tabContent}>
            {/* STEP 1 */}
            {createStep === 1 && (
              <>
                <Text style={[styles.nameInput, styles.centeredText]}>Назви своє Коло</Text>
                <TextInput
                  style={styles.nameInput}
                  placeholder="Супер коло"
                  placeholderTextColor="#C7C7CC"
                  value={circleName}
                  onChangeText={setCircleName}
                  maxLength={100}
                  textAlign="center"
                />

                <TouchableOpacity
                  style={[
                    styles.btn,
                    styles.blueBtn,
                    (circleName.trim().length < 3 || isCreating) && styles.grayDisabledBtn,
                  ]}
                  disabled={circleName.trim().length < 3 || isCreating}
                  onPress={handleCreateCircle}
                >
                  <Text
                    style={[
                      styles.btnText,
                      circleName.trim().length >= 3 && !isCreating
                        ? styles.btnText // білий
                        : styles.btnTextDisabled, // чорний / темний
                    ]}
                  >
                    {isCreating ? "Створюємо..." : "Створити"}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* STEP 2 */}
            {createStep === 2 && (
              <>
                <Text style={styles.sectionLabel}>Назвіть ваше Коло</Text>

                {/* Велике світло-сіре коло з назвою */}
                <View style={styles.circleContainer}>
                  <View style={styles.circle}>
                    <Text style={styles.circleText} numberOfLines={2} ellipsizeMode="tail">
                      {circleName}
                    </Text>
                  </View>
                </View>

                <View style={styles.codeHeader}>
                  <Text style={styles.sectionLabel}>Код кола</Text>
                  <TouchableOpacity onPress={handleCopy}>
                    <AntDesign name="copy" size={16} color={COLORS.TEXT_GRAY} />
                  </TouchableOpacity>
                </View>

                <View style={styles.codeContainer}>
                  <OtpInput value={generatedCode} editable={false} onChange={() => {}} />
                </View>

                {/* Кнопка "Надіслати запрошення" / "Запросити" */}
                <TouchableOpacity
                  style={styles.shareBtn}
                  onPress={async () => {
                    try {
                      const code = generatedCode.join("");
                      await Share.share({
                        message: `Приєднуйся до мого Кола в Health Circle! Код: ${code}`,
                      });
                    } catch (error) {
                      console.error(error);
                    }
                  }}
                >
                  <Text style={styles.shareBtnText}>Надіслати запрошення</Text>
                  <Feather name="send" size={20} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Кнопка "Готово" */}
                <TouchableOpacity style={[styles.btn, styles.blackBtn]} onPress={onClose}>
                  <Text style={styles.btnText}>Готово</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    </KeyboardAwareScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  modalInner: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: "#D1D1D6",
    borderRadius: 2,
    alignSelf: "center",
    marginVertical: 12,
  },
  title: { fontSize: 20, fontWeight: "700", textAlign: "center" },
  subtitle: {
    fontSize: 13,
    color: COLORS.TEXT_GRAY,
    textAlign: "center",
    marginBottom: 20,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: "#7676801F",
    padding: 2,
    borderRadius: 15,
    height: 36,
    marginBottom: 24,
  },
  segmentBtn: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
  },
  grayDisabledBtn: {
    backgroundColor: "#C7C7CC", // світло-сірий, як у iOS
    opacity: 0.6, // або 1, якщо хочеш чистий колір без затемнення
  },
  segmentActive: { backgroundColor: "white" },
  segmentText: { fontSize: 13, fontWeight: "500" },
  segmentTextActive: { fontWeight: "700" },
  tabContent: { paddingVertical: 10 },
  sectionLabel: { fontSize: 13, color: COLORS.TEXT_GRAY, marginBottom: 8 },
  nameInput: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 20,
  },

  codeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  finalName: { fontSize: 22, fontWeight: "700", marginBottom: 20 },
  btn: {
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 10,
  },
  blueBtn: { backgroundColor: COLORS.BLACK_BTN },
  blackBtn: { backgroundColor: COLORS.BLACK_BTN },
  btnText: { color: "white", fontSize: 16, fontWeight: "600" },
  disabled: { opacity: 0.4 },
  codeContainer: {
    marginBottom: 0,
  },
  shareBtn: {
    flexDirection: "row",
    backgroundColor: "#5A8DEE",
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 0,
    marginBottom: 20,
    gap: 8,
  },
  centeredText: {
    textAlign: "center",
    color: "#000000",
  },
  shareBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    fontVariant: ["small-caps"],
    marginRight: 8,
  },
  btnTextDisabled: {
    color: "#000000",
  },
  circleContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 24, // простір зверху і знизу
  },

  circle: {
    width: 180, // або 200–220, якщо хочеш ще більше
    height: 180,
    borderRadius: 90, // половина від ширини/висоти → ідеальне коло
    backgroundColor: "#E5E5EA", // світло-сірий (systemGray5 або подібний)
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16, // внутрішні відступи, щоб текст не торкався країв
  },

  circleText: {
    fontSize: 24, // великий текст
    fontWeight: "700",
    color: "#000000", // або '#1C1C1E' для м'якшого чорного
    textAlign: "center",
    // lineHeight: 32,            // опціонально — для кращого вертикального центрування
  },
});

export default AddCircleModal;
