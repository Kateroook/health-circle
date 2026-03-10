import { apiFetch } from "@/src/api/api";
import { AntDesign, Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React, { useState } from "react";
import { Alert, Share, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomSheetContainer, ModalContent, ModalHeader } from "@/src/components/modal";
import { theme } from "@/src/theme/theme";
import { formatErrorMessage } from "../../utils/error.util";
import { PinCodeField } from "../fields/TextField";
import { Typography } from "../typography";

interface AddCircleModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

const AddCircleModal: React.FC<AddCircleModalProps> = ({ visible, onClose, onUpdated }) => {
  const [activeTab, setActiveTab] = useState<"join" | "create">("join");

  // Join tab
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  // Create tab
  const [createStep, setCreateStep] = useState<1 | 2 | 3>(1);
  const [circleName, setCircleName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");

  const handleCopy = async () => {
    await Clipboard.setStringAsync(generatedCode);
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
      setGeneratedCode(code);
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
    if (joinCode.length !== 6) {
      Alert.alert("Помилка", "Будь ласка, введіть повний код");
      return;
    }
    const code = joinCode;
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
    <BottomSheetContainer isVisible={visible} onClose={onClose}>
      <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
        <KeyboardAwareScrollView
          enableOnAndroid={true}
          extraScrollHeight={theme.spacing[40]}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.scrollContent, { minHeight: "90%" }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.modalInner}>
            <ModalHeader
              title="Додайте нове коло"
              description="Створіть своє коло або приєднайся до існуючного"
            />
            <ModalContent noMarginBottom style={styles.modalContentInner}>
              {/* Tabs */}
              <View style={styles.segment}>
                <TouchableOpacity
                  style={[styles.segmentBtn, activeTab === "join" && styles.segmentActive]}
                  onPress={() => setActiveTab("join")}
                >
                  <Typography
                    variant="subtitle1"
                    style={[activeTab === "join" && styles.segmentTextActive]}
                  >
                    Приєднатися
                  </Typography>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.segmentBtn, activeTab === "create" && styles.segmentActive]}
                  onPress={() => {
                    setActiveTab("create");
                    setCreateStep(1);
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    style={[activeTab === "create" && styles.segmentTextActive]}
                  >
                    Створити
                  </Typography>
                </TouchableOpacity>
              </View>

              {/* JOIN Content */}
              {activeTab === "join" && (
                <View style={styles.tabContent}>
                  <Typography variant="subtitle1" style={{ marginBottom: theme.spacing[8] }}>
                    Введи код, щоб приєднатися до Кола.
                  </Typography>
                  <PinCodeField
                    label=""
                    value={joinCode}
                    onChangeText={setJoinCode}
                    required
                    variant="code"
                  />
                </View>
              )}

              {/* CREATE Content */}
              {activeTab === "create" && (
                <View style={styles.tabContent}>
                  {/* STEP 1 */}
                  {createStep === 1 && (
                    <>
                      <Typography variant="subtitle1" style={styles.centeredText}>
                        Назви своє Коло
                      </Typography>
                      <TextInput
                        style={styles.nameInput}
                        placeholder="Супер коло"
                        placeholderTextColor={theme.colors.content.tertiary}
                        value={circleName}
                        onChangeText={setCircleName}
                        maxLength={100}
                        textAlign="center"
                      />
                    </>
                  )}

                  {/* STEP 2 */}
                  {createStep === 2 && (
                    <>
                      <View style={styles.codeContainer}>
                        <PinCodeField
                          label="Код кола"
                          value={generatedCode}
                          variant="code"
                          labelTrailing={
                            <TouchableOpacity onPress={handleCopy} hitSlop={8}>
                              <AntDesign
                                name="copy"
                                size={theme.typography.lineHeight.subtitle1}
                                color={theme.colors.content.secondary}
                              />
                            </TouchableOpacity>
                          }
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.shareBtn}
                        onPress={async () => {
                          try {
                            await Share.share({
                              message: `Приєднуйся до мого Кола в Health Circle! Код: ${generatedCode}`,
                            });
                          } catch (error) {
                            console.error(error);
                          }
                        }}
                      >
                        <Typography variant="subtitle1" tone="onColor">
                          Надіслати запрошення
                        </Typography>
                        <Feather name="send" size={20} color={theme.colors.content.onColor} />
                      </TouchableOpacity>

                      {/* Велике світло-сіре коло з назвою */}
                      <View style={styles.circleContainer}>
                        <View style={styles.circle}>
                          <Typography
                            variant="h3"
                            tone="secondary"
                            numberOfLines={2}
                            ellipsizeMode="tail"
                          >
                            {circleName}
                          </Typography>
                        </View>
                      </View>
                    </>
                  )}
                </View>
              )}
              {activeTab === "join" && (
                <TouchableOpacity
                  style={[
                    styles.btn,
                    joinCode.length === 6 && !isJoining ? styles.blueBtn : styles.grayDisabledBtn,
                  ]}
                  disabled={joinCode.length !== 6 || isJoining}
                  onPress={handleJoinCircle}
                >
                  <Typography
                    variant="subtitle1"
                    tone="onColor"
                    style={[
                      joinCode.length === 6 && !isJoining ? styles.btnText : styles.btnTextDisabled,
                    ]}
                  >
                    {isJoining ? "Підключення..." : "Приєднатися"}
                  </Typography>
                </TouchableOpacity>
              )}

              {activeTab === "create" && createStep === 1 && (
                <TouchableOpacity
                  style={[
                    styles.btn,
                    styles.blueBtn,
                    (circleName.trim().length < 3 || isCreating) && styles.grayDisabledBtn,
                  ]}
                  disabled={circleName.trim().length < 3 || isCreating}
                  onPress={handleCreateCircle}
                >
                  <Typography
                    variant="subtitle1"
                    tone="onColor"
                    style={[
                      circleName.trim().length >= 3 && !isCreating
                        ? styles.btnText
                        : styles.btnTextDisabled,
                    ]}
                  >
                    {isCreating ? "Створюємо..." : "Створити"}
                  </Typography>
                </TouchableOpacity>
              )}

              {activeTab === "create" && createStep === 2 && (
                <>
                  <TouchableOpacity style={[styles.btn, styles.blackBtn]} onPress={onClose}>
                    <Typography variant="subtitle1" tone="onColor">
                      Готово
                    </Typography>
                  </TouchableOpacity>
                </>
              )}
            </ModalContent>
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </BottomSheetContainer>
  );
};

const styles = StyleSheet.create({
  safeArea: {},
  scrollContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing[8],
  },
  modalInner: {},
  modalContentInner: {
    marginTop: 0,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: theme.colors.background.tertiary,
    padding: theme.spacing[4],
    borderRadius: theme.radius.pill,
    height: theme.spacing[56],
    marginBottom: theme.spacing[16],
    marginTop: theme.spacing[16],
  },
  segmentBtn: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: theme.radius.pill,
  },
  grayDisabledBtn: {
    backgroundColor: theme.colors.background.tertiary,
  },
  segmentActive: { backgroundColor: theme.colors.background.secondary },
  segmentText: {
    fontSize: theme.typography.fontSize.caption,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.content.secondary,
  },
  segmentTextActive: {
    color: theme.colors.content.primary,
  },
  tabContent: { paddingVertical: theme.spacing[8] },
  sectionLabel: {
    fontSize: theme.typography.fontSize.caption,
    color: theme.colors.content.secondary,
    marginBottom: theme.spacing[8],
    textAlign: "center",
  },
  nameInput: {
    fontSize: theme.typography.fontSize.h1,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.content.primary,
    marginBottom: theme.spacing[32],
  },

  codeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing[8],
  },
  finalName: {
    fontSize: theme.typography.fontSize.h3,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing[20],
  },
  btn: {
    paddingVertical: theme.spacing[14],
    borderRadius: theme.radius.pill,
    alignItems: "center",
  },
  blueBtn: { backgroundColor: theme.colors.accent },
  blackBtn: { backgroundColor: theme.colors.primaryB },
  btnText: {
    color: theme.colors.content.onColor,
    fontSize: theme.typography.fontSize.subtitle1,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  disabled: { opacity: 0.4 },
  codeContainer: {
    marginBottom: theme.spacing[8],
  },
  shareBtn: {
    flexDirection: "row",
    backgroundColor: theme.colors.accent,
    paddingVertical: theme.spacing[14],
    borderRadius: theme.radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 0,
    marginBottom: theme.spacing[20],
    columnGap: theme.spacing[8],
  },
  centeredText: {
    textAlign: "center",
    paddingBottom: theme.spacing[88],
    color: theme.colors.content.primary,
  },

  btnTextDisabled: {
    color: theme.colors.content.primary,
  },
  circleContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: theme.spacing[32],
  },

  circle: {
    width: 224,
    height: 224,
    borderRadius: theme.radius.circle,
    backgroundColor: theme.colors.background.tertiary,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing[16],
  },

  circleText: {
    fontSize: theme.typography.fontSize.h3,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.content.primary,
    textAlign: "center",
  },
});

export default AddCircleModal;
