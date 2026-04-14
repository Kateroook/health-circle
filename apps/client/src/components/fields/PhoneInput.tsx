import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { FlatList, Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Typography } from "@/src/components/typography";
import { theme } from "@/src/theme/theme";
import { TextField, TextFieldProps } from "./TextField";

const COUNTRY_CODES = [
  { code: "+380", name: "Україна", flag: "🇺🇦" },
  { code: "+1", name: "США/Канада", flag: "🇺🇸/🇨🇦" },
  { code: "+44", name: "Велика Британія", flag: "🇬🇧" },
  { code: "+48", name: "Польща", flag: "🇵🇱" },
  { code: "+49", name: "Німеччина", flag: "🇩🇪" },
  { code: "+33", name: "Франція", flag: "🇫🇷" },
  { code: "+39", name: "Італія", flag: "🇮🇹" },
  { code: "+34", name: "Іспанія", flag: "🇪🇸" },
  { code: "+420", name: "Чехія", flag: "🇨🇿" },
  { code: "+43", name: "Австрія", flag: "🇦🇹" },
];

export interface PhoneInputProps extends Omit<TextFieldProps, "value" | "onChangeText"> {
  value: string;
  onChangeText: (text: string) => void;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({ value, onChangeText, ...rest }) => {
  const [modalVisible, setModalVisible] = useState(false);

  // Derive current prefix and the rest of the phone
  const currentPrefixObj = useMemo(() => {
    return COUNTRY_CODES.find((c) => value.startsWith(c.code)) || COUNTRY_CODES[0];
  }, [value]);

  const currentPrefix = currentPrefixObj.code;

  const restOfPhone = value.startsWith(currentPrefix) ? value.slice(currentPrefix.length) : value;

  const handlePrefixSelect = (newPrefix: string) => {
    setModalVisible(false);
    onChangeText(newPrefix + restOfPhone);
  };

  const handleChangePhonePart = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, ""); // only digits
    onChangeText(currentPrefix + cleaned);
  };

  const leadingArtwork = (
    <TouchableOpacity
      testID="auth:phone:prefix"
      style={styles.prefixContainer}
      onPress={() => setModalVisible(true)}
      activeOpacity={0.7}
    >
      <Typography
        variant="body1"
        tone="primary"
        style={styles.prefixText}
        testID="auth:phone:currentPrefix"
      >
        {currentPrefixObj.flag} {currentPrefix}
      </Typography>
      <Feather name="chevron-down" size={16} color={theme.colors.content.secondary} />
    </TouchableOpacity>
  );

  return (
    <>
      <TextField
        {...rest}
        value={restOfPhone}
        onChangeText={handleChangePhonePart}
        keyboardType="phone-pad"
        leadingArtwork={leadingArtwork}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeBtn}
              testID="auth:phone:closeModal"
            >
              <Feather name="x" size={24} color={theme.colors.content.primary} />
            </TouchableOpacity>
            <Typography variant="h3" tone="primary">
              Виберіть код країни
            </Typography>
            <View style={{ width: 24 }} />
          </View>

          <FlatList
            data={COUNTRY_CODES}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.itemRow}
                onPress={() => handlePrefixSelect(item.code)}
                testID={`auth:phone:country_${item.code}`}
              >
                <Typography variant="body1" tone="primary" style={styles.itemFlag}>
                  {item.flag}
                </Typography>
                <Typography variant="body1" tone="primary" style={styles.itemName}>
                  {item.name}
                </Typography>
                <Typography variant="body1" tone="secondary">
                  {item.code}
                </Typography>
                {currentPrefix === item.code && (
                  <Feather
                    name="check"
                    size={20}
                    color={theme.colors.positive}
                    style={{ marginLeft: 16 }}
                  />
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  prefixContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: theme.spacing[8],
    borderRightWidth: 1,
    borderRightColor: theme.colors.border.opaque,
    marginRight: theme.spacing[8],
  },
  prefixText: {
    marginRight: theme.spacing[4],
  },
  modalSafe: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing[16],
    paddingVertical: theme.spacing[16],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.opaque,
  },
  closeBtn: {
    padding: theme.spacing[4],
  },
  listContent: {
    paddingBottom: theme.spacing[40],
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing[16],
    paddingHorizontal: theme.spacing[24],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.transparent,
  },
  itemFlag: {
    marginRight: theme.spacing[16],
  },
  itemName: {
    flex: 1,
  },
});
