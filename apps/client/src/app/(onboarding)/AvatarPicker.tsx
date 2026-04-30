import { apiUploadFile } from "@/src/api/api";
import { Button } from "@/src/components/Button";
import { Typography } from "@/src/components/typography";
import { useAuthStore } from "@/src/store/authStore";
import { theme } from "@/src/theme/theme";
import { ScreenIds } from "@/src/utils/testIDs";
import { AntDesign } from "@expo/vector-icons";
import { Asset } from "expo-asset";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import { FlatList, Image, ImageSourcePropType, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DEFAULT_AVATARS: { id: string; source: ImageSourcePropType }[] = [
  { id: "cool", source: require("@/src/assets/images/avatars/avatar-cool.png") },
  { id: "duckling", source: require("@/src/assets/images/avatars/avatar-duckling.png") },
  { id: "chillguy", source: require("@/src/assets/images/avatars/avatar-chillguy.png") },
  { id: "headphones", source: require("@/src/assets/images/avatars/avatar-headphones.png") },
  { id: "sleepy", source: require("@/src/assets/images/avatars/avatar-sleepy.png") },
  { id: "scarf", source: require("@/src/assets/images/avatars/avatar-scarf.png") },
  { id: "hungry", source: require("@/src/assets/images/avatars/avatar-hungry.png") },
  { id: "summer", source: require("@/src/assets/images/avatars/avatar-summer.png") },
];

const AVATAR_SIZE = 200;
const GRID_ITEM_SIZE = 72;
const NUM_COLUMNS = 4;

type AvatarItem = { id: string; source: ImageSourcePropType };

export default function AvatarPickerScreen() {
  const user = useAuthStore((s: ReturnType<typeof useAuthStore.getState>) => s.user);
  const updateUser = useAuthStore((s: ReturnType<typeof useAuthStore.getState>) => s.updateUser);

  const [selectedAvatar, setSelectedAvatar] = useState<AvatarItem | null>(null);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const finish = () => router.replace("/(tabs)/Dashboard");

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      setCustomImage(result.assets[0].uri);
      setSelectedAvatar(null);
    }
  };

  const handleSelectDefault = (avatar: AvatarItem) => {
    setSelectedAvatar(avatar);
    setCustomImage(null);
  };

  const handleNext = async () => {
    if (!customImage && !selectedAvatar) {
      finish();
      return;
    }

    if (!user?.id) {
      finish();
      return;
    }

    setLoading(true);
    try {
      if (customImage) {
        const filename = customImage.split("/").pop()!;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";
        const response = await apiUploadFile(`/users/${user.id}/avatar`, {
          uri: customImage,
          name: filename,
          type,
        });
        if (response?.avatarUpdatedAt) {
          updateUser({ avatarUpdatedAt: response.avatarUpdatedAt });
        }
      } else if (selectedAvatar) {
        const asset = await Asset.fromModule(selectedAvatar.source as number).downloadAsync();
        const uri = asset.localUri ?? asset.uri;
        const filename = `avatar-${selectedAvatar.id}.png`;
        const response = await apiUploadFile(`/users/${user.id}/avatar`, {
          uri,
          name: filename,
          type: "image/png",
        });
        if (response?.avatarUpdatedAt) {
          updateUser({ avatarUpdatedAt: response.avatarUpdatedAt });
        }
      }
    } catch (e) {
      console.error("Avatar upload error:", e);
    } finally {
      setLoading(false);
    }

    finish();
  };

  const previewSource: ImageSourcePropType | null = customImage
    ? { uri: customImage }
    : selectedAvatar
      ? selectedAvatar.source
      : null;

  return (
    <SafeAreaView
      style={styles.screen}
      testID={ScreenIds.avatarPicker}
      accessibilityLabel={ScreenIds.avatarPicker}
    >
      {/* Skip */}
      <Button
        label="Пропустити"
        hierarchy="tertiary"
        size="small"
        onPress={finish}
        style={styles.skipButton}
        testId="auth:skipAvatar:button"
      />

      {/* Title */}
      <View style={styles.titleBlock}>
        <Typography variant="h2" tone="primary" style={styles.title}>
          Обрати картинку профілю
        </Typography>
        <Typography variant="body2" tone="secondary" style={styles.subtitle}>
          Обери фото, яке найкраще представляє тебе!
        </Typography>
      </View>

      {/* Avatar preview */}
      <Pressable
        style={styles.avatarPickerWrapper}
        onPress={handlePickImage}
        testID="auth:avatar:upload_wrapper"
      >
        {previewSource ? (
          <View style={styles.avatarPreviewContainer}>
            <Image source={previewSource} style={styles.avatarPreview} />
          </View>
        ) : (
          <View style={styles.avatarPlaceholder} />
        )}
        <View style={styles.addButton}>
          <AntDesign name="plus" size={24} color={theme.colors.content.onColor} />
        </View>
      </Pressable>

      {/* Default avatars */}
      <Typography variant="body2" tone="secondary" style={styles.orLabel}>
        Або обери з переліку аватарів Кола:
      </Typography>

      <FlatList
        data={DEFAULT_AVATARS}
        keyExtractor={(item: AvatarItem) => item.id}
        numColumns={NUM_COLUMNS}
        scrollEnabled={false}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.gridRow}
        renderItem={({ item }: { item: AvatarItem }) => {
          const isSelected = selectedAvatar?.id === item.id;
          return (
            <Pressable
              onPress={() => handleSelectDefault(item)}
              style={[styles.gridItem, isSelected && styles.gridItemSelected]}
              testID={`auth:avatar:${item.id}:button`}
              accessibilityLabel={`auth:avatar:${item.id}:button`}
              accessibilityRole="button"
            >
              <Image source={item.source} style={styles.gridAvatar} />
            </Pressable>
          );
        }}
      />

      {/* Next button */}
      <View style={styles.footer}>
        <Button
          label={loading ? "Завантаження..." : "Далі"}
          hierarchy={selectedAvatar || customImage ? "primary" : "secondary"}
          shape="rectangle"
          size="medium"
          loading={loading}
          disabled={loading}
          onPress={handleNext}
          style={{ width: "100%" }}
          testId="auth:next:button"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    paddingHorizontal: theme.spacing[16],
  },
  skipButton: {
    alignSelf: "flex-end",
    marginTop: theme.spacing[16],
  },
  titleBlock: {
    marginTop: theme.spacing[10],
    gap: theme.spacing[16],
  },
  title: { textAlign: "center" },
  subtitle: { textAlign: "center" },
  avatarPickerWrapper: {
    alignSelf: "center",
    marginTop: theme.spacing[32],
    marginBottom: theme.spacing[32],
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: theme.radius.circle,
    borderWidth: theme.borderWidth.lg,
    borderColor: theme.colors.accent,
    borderStyle: "dashed",
  },
  avatarPreviewContainer: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: theme.radius.circle,
    overflow: "hidden",
    backgroundColor: theme.colors.background.tertiary,
  },
  avatarPreview: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: theme.radius.circle,
  },
  addButton: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  orLabel: {
    textAlign: "center",
    marginBottom: theme.spacing[16],
  },
  grid: {
    justifyContent: "center",
    alignItems: "center",
    gap: theme.spacing[8],
    marginTop: theme.spacing[16],
  },
  gridRow: { gap: theme.spacing[8] },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    borderRadius: theme.radius.circle,
    backgroundColor: theme.colors.background.tertiary,
    overflow: "hidden",
    borderWidth: theme.borderWidth.lg,
    borderColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  gridItemSelected: { borderColor: theme.colors.accent },
  gridAvatar: { width: GRID_ITEM_SIZE, height: GRID_ITEM_SIZE },
  footer: {
    position: "absolute",
    bottom: theme.spacing[40],
    left: theme.spacing[24],
    right: theme.spacing[24],
  },
});
