import { Button } from "@/src/components/Button";
import { Typography } from "@/src/components/typography";
import { theme } from "@/src/theme/theme";
import { AntDesign } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DEFAULT_AVATARS = [
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

interface AvatarPickerScreenProps {
  onSkip: () => void;
  onNext: (avatarSource: any) => void;
}

export default function AvatarPickerScreen({ onSkip, onNext }: AvatarPickerScreenProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<any>(null);
  const [customImage, setCustomImage] = useState<string | null>(null);

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

  const handleSelectDefault = (avatar: (typeof DEFAULT_AVATARS)[0]) => {
    setSelectedAvatar(avatar);
    setCustomImage(null);
  };

  const handleNext = () => {
    if (customImage) {
      onNext({ uri: customImage });
    } else if (selectedAvatar) {
      onNext(selectedAvatar.source);
    } else {
      onSkip();
    }
  };

  const previewSource = customImage
    ? { uri: customImage }
    : selectedAvatar
      ? selectedAvatar.source
      : null;

  return (
    <SafeAreaView style={styles.screen}>
      {/* Skip */}
      <Button
        label="Пропустити"
        hierarchy="tertiary"
        size="small"
        onPress={onSkip}
        style={styles.skipButton}
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
      <Pressable style={styles.avatarPickerWrapper} onPress={handlePickImage}>
        {previewSource ? (
          <View style={styles.avatarPreviewContainer}>
            <Image source={previewSource} style={styles.avatarPreview} />
          </View>
        ) : (
          <View style={styles.avatarPlaceholder}>
            {/* Dashed circle border via border trick */}
          </View>
        )}
        {/* + button */}
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
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        scrollEnabled={false}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.gridRow}
        renderItem={({ item }) => {
          const isSelected = selectedAvatar?.id === item.id;
          return (
            <Pressable
              onPress={() => handleSelectDefault(item)}
              style={[styles.gridItem, isSelected && styles.gridItemSelected]}
            >
              <Image source={item.source} style={styles.gridAvatar} />
            </Pressable>
          );
        }}
      />

      {/* Next button */}
      <View style={styles.footer}>
        <Button
          label="Далі"
          hierarchy={selectedAvatar || customImage ? "primary" : "secondary"}
          shape="rectangle"
          size="medium"
          onPress={handleNext}
          style={{ width: "100%" }}
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
  title: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
  },
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
  gridRow: {
    gap: theme.spacing[8],
  },
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
  gridItemSelected: {
    borderColor: theme.colors.accent,
  },
  gridAvatar: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
  },
  footer: {
    position: "absolute",
    bottom: theme.spacing[40],
    left: theme.spacing[24],
    right: theme.spacing[24],
  },
});
