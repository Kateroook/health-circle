import { theme } from "@/src/theme/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch } from "../../api/api";
import { Button } from "../Button";
import { TextField } from "../fields/TextField";
import { ListItem } from "../ListItem";
import { Typography } from "../typography";

interface AlertRegion {
  uid: number;
  name: string;
  type: string;
}

interface HromadaPickerProps {
  label: string;
  value: string; // display name of currently selected region
  onSelect: (uid: number, name: string) => void;
  placeholder?: string;
  testId?: string;
}

export const HromadaPicker: React.FC<HromadaPickerProps> = ({
  label,
  value,
  onSelect,
  placeholder,
  testId,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState("");
  const [regions, setRegions] = useState<AlertRegion[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRegions = useCallback(async () => {
    if (regions.length > 0) return; // already loaded
    setLoading(true);
    try {
      const data: AlertRegion[] = await apiFetch("/alerts/regions");
      setRegions(data ?? []);
    } catch (e) {
      console.error("Failed to fetch alert regions", e);
    } finally {
      setLoading(false);
    }
  }, [regions.length]);

  useEffect(() => {
    if (modalVisible) fetchRegions();
  }, [modalVisible, fetchRegions]);

  const filtered = useMemo(() => {
    if (!search.trim()) return regions;
    const s = search.toLowerCase();
    return regions.filter((r) => r.name.toLowerCase().includes(s));
  }, [search, regions]);

  const handleSelect = (region: AlertRegion) => {
    onSelect(region.uid, region.name);
    setModalVisible(false);
    setSearch("");
  };

  return (
    <View testID={testId} accessibilityLabel={testId} style={styles.container}>
      <TouchableOpacity onPress={() => setModalVisible(true)} activeOpacity={0.7}>
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
              onPress={() => {
                setModalVisible(false);
                setSearch("");
              }}
            />
            <Typography variant="h3" tone="primary" style={styles.headerTitle}>
              Виберіть громаду
            </Typography>
          </View>

          <View style={styles.searchContainer}>
            <TextField
              placeholder="Пошук громади, міста, району..."
              value={search}
              onChangeText={setSearch}
              autoFocus
              leadingArtwork={
                <MaterialCommunityIcons
                  name="magnify"
                  size={20}
                  color={theme.colors.content.tertiary}
                />
              }
            />
          </View>

          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={theme.colors.content.primary} />
            </View>
          ) : (
            <FlatList
              data={filtered}
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
              ListEmptyComponent={
                <Typography variant="body2" tone="secondary" style={styles.emptyText}>
                  Нічого не знайдено
                </Typography>
              }
            />
          )}
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
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingHorizontal: theme.spacing[16],
    paddingBottom: theme.spacing[32],
  },
  emptyText: {
    textAlign: "center",
    marginTop: theme.spacing[32],
  },
});
