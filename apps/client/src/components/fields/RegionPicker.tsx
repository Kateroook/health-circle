import { theme } from "@/src/theme/theme";
import { OBLASTS, RegionItem } from "@/src/utils/regions";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { FlatList, Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../Button";
import { TextField } from "../fields/TextField";
import { ListItem } from "../ListItem";
import { Typography } from "../typography";

interface RegionPickerProps {
  label: string;
  value: string;
  onSelect: (name: string) => void;
  placeholder?: string;
}

export const RegionPicker: React.FC<RegionPickerProps> = ({
  label,
  value,
  onSelect,
  placeholder,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState("");

  const filteredRegions = useMemo(() => {
    if (!search.trim()) return OBLASTS;
    const s = search.toLowerCase();
    return OBLASTS.filter((r) => r.name.toLowerCase().includes(s));
  }, [search]);

  const handleSelect = (region: RegionItem) => {
    onSelect(region.name);
    setModalVisible(false);
    setSearch("");
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => {
          setModalVisible(true);
        }}
        activeOpacity={0.7}
      >
        <View pointerEvents="none">
          <TextField
            label={label}
            value={value}
            placeholder={placeholder}
            trailingArtwork={
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={theme.colors.content.tertiary}
              />
            }
          />
        </View>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.header}>
            <Button
              shape="round"
              hierarchy="tertiary"
              size="small"
              leadingIcon={
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={theme.colors.content.primary}
                />
              }
              onPress={() => setModalVisible(false)}
            />
            <Typography variant="h3" tone="primary" style={styles.headerTitle}>
              Виберіть область
            </Typography>
          </View>

          <View style={styles.searchContainer}>
            <TextField
              placeholder="Пошук області..."
              value={search}
              onChangeText={setSearch}
              autoFocus
              leftIcon={
                <MaterialCommunityIcons
                  name="magnify"
                  size={20}
                  color={theme.colors.content.tertiary}
                />
              }
            />
          </View>

          <FlatList
            data={filteredRegions}
            keyExtractor={(item) => item.uid.toString()}
            renderItem={({ item }) => (
              <ListItem
                label={item.name}
                subLabel={item.type}
                onPress={() => handleSelect(item)}
                showDivider
              />
            )}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing[16],
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing[16],
    paddingVertical: theme.spacing[12],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.opaque,
  },
  headerTitle: {
    marginLeft: theme.spacing[12],
  },
  searchContainer: {
    padding: theme.spacing[16],
  },
  listContent: {
    paddingHorizontal: theme.spacing[16],
    paddingBottom: theme.spacing[32],
  },
});
