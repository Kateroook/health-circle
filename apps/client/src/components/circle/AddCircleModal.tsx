import { apiFetch } from "@/src/api/api";
import { PinCodeField } from "@/src/components/fields/TextField";
import { BottomSheetContainer, ModalContent, ModalHeader } from "@/src/components/modal";
import { theme } from "@/src/theme/theme";
import { AntDesign, Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React, { useState } from "react";
import { Image, Share, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAnalytics } from "../../hooks/useAnalytics";
import { useToast } from "../../hooks/useToast";
import { formatErrorMessage } from "../../utils/error.util";
import { Button } from "../Button";
import { Typography } from "../typography";

interface AddCircleModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

const AddCircleModal: React.FC<AddCircleModalProps> = ({ visible, onClose, onUpdated }) => {
  const { showToast } = useToast();
  const { logEvent } = useAnalytics();
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
    showToast({ type: "success", title: "Скопійовано", compact: true });
  };

  // --- CREATE CIRCLE ---
  const handleCreateCircle = async () => {
    setIsCreating(true);
    try {
      const response = await apiFetch("/groups", {
        method: "POST",
        body: JSON.stringify({ name: circleName.trim() }),
      });
      logEvent("create_circle");
      const code = response.inviteCode || "";
      setGeneratedCode(code);
      setCreateStep(2);
      if (onUpdated) onUpdated();
      showToast({ type: "success", title: "Коло створено", compact: true });
    } catch (error: any) {
      const msg = formatErrorMessage(error, "Не вдалося створити коло. Спробуйте ще раз.");
      showToast({ type: "error", title: "Помилка", subtitle: msg });
      console.error("Create circle error:", error);
    } finally {
      setIsCreating(false);
    }
  };

  // --- JOIN CIRCLE ---
  const handleJoinCircle = async () => {
    if (joinCode.length !== 6) {
      showToast({
        type: "error",
        title: "Помилка",
        subtitle: "Будь ласка, введіть повний код",
      });
      return;
    }
    const code = joinCode;
    setIsJoining(true);
    try {
      await apiFetch("/groups/join", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      logEvent("join_circle");
      showToast({ type: "success", title: "Ви приєдналися до кола" });
      if (onUpdated) onUpdated();
      onClose();
    } catch (error: any) {
      const msg = formatErrorMessage(error, "Не вдалося приєднатися до кола. Перевірте код.");
      showToast({ type: "error", title: "Помилка", subtitle: msg });
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
                  {/* STEP 1 — введення назви */}
                  {createStep === 1 && !isCreating && (
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

                  {/* CREATING — іде запит */}
                  {isCreating && (
                    <View style={styles.statusContainer}>
                      <Typography variant="subtitle1" tone="secondary" style={styles.statusText}>
                        Твоє коло створюється...
                      </Typography>
                      <Image
                        source={require("../../assets/images/interactiveScreens/circle_creating.png")}
                        style={styles.statusImage}
                        resizeMode="contain"
                      />
                    </View>
                  )}

                  {/* STEP 2 — коло створено */}
                  {createStep === 2 && !isCreating && (
                    <>
                      {/* Стан "Коло створено" */}
                      <View style={styles.statusContainer}>
                        <Typography variant="subtitle1" tone="primary" style={styles.statusText}>
                          Коло створено
                        </Typography>
                        <Image
                          source={require("../../assets/images/interactiveScreens/circle_created.png")}
                          style={styles.statusImage}
                          resizeMode="contain"
                        />
                      </View>

                      {/* Код і запрошення */}
                      <View style={styles.codeContainer}>
                        <PinCodeField
                          label="Код кола"
                          value={generatedCode}
                          variant="code"
                          labelTrailing={
                            <Button
                              shape="round"
                              hierarchy="tertiary"
                              size="xsmall"
                              leadingIcon={
                                <AntDesign
                                  name="copy"
                                  size={theme.typography.lineHeight.subtitle1}
                                  color={theme.colors.content.secondary}
                                />
                              }
                              onPress={handleCopy}
                            />
                          }
                        />
                      </View>
                      <Button
                        label="Надіслати запрошення"
                        hierarchy="accent"
                        shape="rectangle"
                        size="medium"
                        trailingIcon={
                          <Feather name="send" size={20} color={theme.colors.content.onColor} />
                        }
                        onPress={async () => {
                          try {
                            await Share.share({
                              message: `Приєднуйся до мого Кола в Health Circle! Код: ${generatedCode}`,
                            });
                          } catch (error) {
                            console.error(error);
                          }
                        }}
                        style={{ width: "100%" }}
                      />
                    </>
                  )}
                </View>
              )}

              {/* JOIN button */}
              {activeTab === "join" && (
                <Button
                  label={isJoining ? "Підключення..." : "Приєднатися"}
                  hierarchy="primary"
                  shape="rectangle"
                  size="medium"
                  loading={isJoining}
                  disabled={joinCode.length !== 6 || isJoining}
                  onPress={handleJoinCircle}
                  style={{ width: "100%" }}
                />
              )}

              {/* CREATE step 1 button */}
              {activeTab === "create" && createStep === 1 && !isCreating && (
                <Button
                  label="Створити"
                  hierarchy="primary"
                  shape="rectangle"
                  size="medium"
                  disabled={circleName.trim().length < 3}
                  onPress={handleCreateCircle}
                  style={{ width: "100%" }}
                />
              )}

              {/* CREATE step 2 button */}
              {activeTab === "create" && createStep === 2 && !isCreating && (
                <Button
                  label="Готово"
                  hierarchy="primary"
                  shape="rectangle"
                  size="medium"
                  onPress={onClose}
                  style={{ width: "100%" }}
                />
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
  segmentActive: { backgroundColor: theme.colors.background.secondary },
  segmentTextActive: {
    color: theme.colors.content.primary,
  },
  tabContent: { paddingVertical: theme.spacing[8] },
  nameInput: {
    fontSize: theme.typography.fontSize.h1,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.content.primary,
    marginBottom: theme.spacing[32],
  },
  codeContainer: {
    marginBottom: theme.spacing[8],
  },
  centeredText: {
    textAlign: "center",
    paddingBottom: theme.spacing[88],
    color: theme.colors.content.primary,
  },
  // Стани створення/успіху
  statusContainer: {
    alignItems: "center",
    paddingVertical: theme.spacing[16],
    gap: theme.spacing[16],
  },
  statusText: {
    textAlign: "center",
  },
  statusImage: {
    width: 236,
    height: 188,
  },
});

export default AddCircleModal;
