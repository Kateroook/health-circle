import { apiFetch } from "@/src/api/api";
import { COLORS } from "@/src/theme/colors";
import { AntDesign } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import OtpInput from "../OtpInput";

interface AddCircleModalProps {
  onClose: () => void;
  onUpdated?: () => void;
}

const AddCircleModal: React.FC<AddCircleModalProps> = ({
  onClose,
  onUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<"join" | "create">("join");

  // Join tab
  const [joinCode, setJoinCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [isJoining, setIsJoining] = useState(false);

  // Create tab
  const [createStep, setCreateStep] = useState<1 | 2 | 3>(1);
  const [circleName, setCircleName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(generatedCode.join(""));
  };

  // --- CREATE CIRCLE ---
  const handleCreateCircle = async () => {
    setIsCreating(true);
    try {
      const response = await apiFetch("/groups", {
        method: "POST",
        body: JSON.stringify({ name: circleName }),
      });
      const code = response.inviteCode || "";
      setGeneratedCode(code.split(""));
      setCreateStep(2);

      if (onUpdated) onUpdated();
    } catch (error) {
      Alert.alert("Помилка", "Не вдалося створити коло. Спробуйте ще раз.");
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
    } catch (error) {
      Alert.alert("Помилка", "Не вдалося приєднатися до кола. Перевірте код.");
      console.error("Join circle error:", error);
    } finally {
      setIsJoining(false);
    }
  };

  // --- RENDER TABS ---
  return (
    <View style={styles.modal}>
      <View style={styles.handle} />
      <Text style={styles.title}>Додайте нове коло</Text>
      <Text style={styles.subtitle}>
        Створіть своє коло або приєднайтеся до існуючого
      </Text>

      {/* Tabs */}
      <View style={styles.segment}>
        <TouchableOpacity
          style={[
            styles.segmentBtn,
            activeTab === "join" && styles.segmentActive,
          ]}
          onPress={() => setActiveTab("join")}
        >
          <Text
            style={[
              styles.segmentText,
              activeTab === "join" && styles.segmentTextActive,
            ]}
          >
            Приєднатися
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.segmentBtn,
            activeTab === "create" && styles.segmentActive,
          ]}
          onPress={() => {
            setActiveTab("create");
            setCreateStep(1);
          }}
        >
          <Text
            style={[
              styles.segmentText,
              activeTab === "create" && styles.segmentTextActive,
            ]}
          >
            Створити
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* JOIN */}
        {activeTab === "join" && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionLabel}>
              Уведіть код, щоб приєднатися до Кола.
            </Text>
            <OtpInput value={joinCode} onChange={setJoinCode} />
            <TouchableOpacity
              style={[styles.btn, styles.blueBtn, isJoining && styles.disabled]}
              disabled={isJoining}
              onPress={handleJoinCircle}
            >
              <Text style={styles.btnText}>
                {isJoining ? "Підключення..." : "Приєднатися"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* CREATE */}
        {activeTab === "create" && (
          <View style={styles.tabContent}>
            {/* STEP 1 */}
            {createStep === 1 && (
              <>
                <Text style={styles.sectionLabel}>Назвіть ваше Коло</Text>
                <TextInput
                  style={styles.nameInput}
                  placeholder="Супер коло"
                  placeholderTextColor="#C7C7CC"
                  value={circleName}
                  onChangeText={setCircleName}
                />
                <Text style={styles.sectionLabel}>Код кола</Text>
                <View style={styles.codeRow}>
                  {Array(6)
                    .fill(null)
                    .map((_, i) => (
                      <View key={i} style={styles.codeBoxDisabled} />
                    ))}
                </View>
                <TouchableOpacity
                  style={[
                    styles.btn,
                    styles.blueBtn,
                    (!circleName || isCreating) && styles.disabled,
                  ]}
                  disabled={!circleName || isCreating}
                  onPress={handleCreateCircle}
                >
                  <Text style={styles.btnText}>
                    {isCreating ? "Створюємо..." : "Створити"}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* STEP 2 */}
            {createStep === 2 && (
              <>
                <Text style={styles.sectionLabel}>Назвіть ваше Коло</Text>
                <Text style={styles.finalName}>{circleName}</Text>
                <View style={styles.codeHeader}>
                  <Text style={styles.sectionLabel}>Код кола</Text>
                  <TouchableOpacity onPress={handleCopy}>
                    <AntDesign name="copy" size={16} color={COLORS.TEXT_GRAY} />
                  </TouchableOpacity>
                </View>
                <OtpInput
                  value={generatedCode}
                  editable={false}
                  onChange={() => {}}
                />
                <TouchableOpacity
                  style={[styles.btn, styles.blackBtn]}
                  onPress={onClose}
                >
                  <Text style={styles.btnText}>Готово</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  modal: {
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
    borderRadius: 9,
    height: 36,
    marginBottom: 24,
  },
  segmentBtn: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 7,
  },
  segmentActive: { backgroundColor: "white" },
  segmentText: { fontSize: 13, fontWeight: "500" },
  segmentTextActive: { fontWeight: "700" },
  tabContent: { paddingVertical: 10 },
  sectionLabel: { fontSize: 13, color: COLORS.TEXT_GRAY, marginBottom: 8 },
  nameInput: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.PRIMARY_BLUE,
    marginBottom: 20,
  },
  codeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  codeBoxDisabled: {
    width: 46,
    height: 56,
    borderRadius: 8,
    backgroundColor: "#E5E5EA",
  },
  codeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  finalName: { fontSize: 22, fontWeight: "700", marginBottom: 20 },
  btn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  blueBtn: { backgroundColor: COLORS.PRIMARY_BLUE },
  blackBtn: { backgroundColor: COLORS.BLACK_BTN },
  btnText: { color: "white", fontSize: 16, fontWeight: "600" },
  disabled: { opacity: 0.4 },
});

export default AddCircleModal;
