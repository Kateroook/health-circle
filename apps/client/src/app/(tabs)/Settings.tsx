import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { apiFetch, apiUploadFile, getAvatarUrl } from "../../api/api";
import { useAuthStore } from "../../store/authStore";
import { cleanObj } from "../../utils/clean.util";

export default function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [middleName, setMiddleName] = useState(user?.middleName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const defaultAvatar = require("../../assets/images/default-avatar.png");

  useEffect(() => {
    // TODO: figure out a better way to force refresh after avatar update (http caching causes issues)
    if (user?.id) setAvatarUrl(`${getAvatarUrl(user.id)}?t=${Date.now()}`);
  }, [user]);

  const handleSave = async () => {
    try {
      await apiFetch("/users", {
        method: "PUT",
        body: JSON.stringify(
          cleanObj({
            id: user?.id,
            firstName,
            middleName,
            lastName,
            phone,
            email: user?.email,
          })
        ),
      });
      Alert.alert("Успіх", "Дані оновлено");
    } catch (e: any) {
      Alert.alert("Помилка", e?.message || "Не вдалося оновити дані");
    }
  };

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled) {
      const localUri = result.assets[0].uri;
      const filename = localUri.split("/").pop()!;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image";

      try {
        await apiUploadFile(`/users/${user?.id}/avatar`, {
          uri: localUri,
          name: filename,
          type,
        });
        // refresh avatar with cache-busting
        setAvatarUrl(`${getAvatarUrl(user?.id)}?t=${Date.now()}`);
        Alert.alert("Успіх", "Аватар оновлено");
      } catch (e: any) {
        Alert.alert("Помилка", e?.message || "Не вдалося оновити аватар");
      }
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert("Видалити акаунт?", "Цю дію не можна скасувати.", [
      { text: "Скасувати", style: "cancel" },
      {
        text: "Видалити",
        style: "destructive",
        onPress: async () => {
          try {
            await apiFetch("/users", { method: "DELETE" });
            logout();
          } catch (e) {
            Alert.alert("Помилка", "Не вдалося видалити акаунт");
          }
        },
      },
    ]);
  };

  const handleRemoveAvatar = async () => {
    Alert.alert("Видалити аватар?", "", [
      { text: "Скасувати", style: "cancel" },
      {
        text: "Видалити",
        style: "destructive",
        onPress: async () => {
          try {
            await apiFetch(`/users/${user?.id}/avatar`, { method: "DELETE" });
            setAvatarUrl(null);
            Alert.alert("Успіх", "Аватар видалено");
          } catch (e) {
            Alert.alert("Помилка", "Не вдалося видалити аватар");
          }
        },
      },
    ]);
  };

  const fields = [
    {
      label: "Імʼя",
      value: firstName,
      setter: setFirstName,
      placeholder: "Введіть імʼя",
    },
    {
      label: "По-батькові",
      value: middleName,
      setter: setMiddleName,
      placeholder: "Введіть по-батькові",
    },
    {
      label: "Прізвище",
      value: lastName,
      setter: setLastName,
      placeholder: "Введіть прізвище",
    },
    {
      label: "Номер телефону",
      value: phone,
      setter: setPhone,
      placeholder: "+380...",
      keyboardType: "phone-pad",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Налаштування</Text>

          <Image
            source={
              !imageError && avatarUrl ? { uri: avatarUrl } : defaultAvatar
            }
            style={styles.avatar}
            onError={() => setImageError(true)}
          />

          <View style={styles.avatarButtons}>
            <TouchableOpacity
              style={styles.avatarButton}
              onPress={handlePickAvatar}
            >
              <Text style={styles.avatarButtonText}>Змінити аватар</Text>
            </TouchableOpacity>
            {avatarUrl && (
              <TouchableOpacity
                style={[styles.avatarButton, styles.removeButton]}
                onPress={handleRemoveAvatar}
              >
                <Text style={styles.avatarButtonText}>Видалити аватар</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {fields.map((field) => (
          <View key={field.label} style={styles.block}>
            <Text style={styles.label}>{field.label}</Text>
            <TextInput
              style={styles.input}
              value={field.value}
              onChangeText={field.setter}
              placeholder={field.placeholder}
              placeholderTextColor="#999"
              keyboardType={field.keyboardType as any}
            />
          </View>
        ))}

        <TouchableOpacity style={styles.save} onPress={handleSave}>
          <Text style={styles.saveText}>Зберегти</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logout} onPress={logout}>
          <Text style={styles.logoutText}>Вийти</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.delete} onPress={handleDeleteAccount}>
          <Text style={styles.deleteText}>Видалити акаунт</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  headerContainer: { alignItems: "center", marginBottom: 30, padding: 20 },
  header: { fontSize: 28, fontWeight: "600", marginBottom: 20 },

  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
  avatarButtons: { flexDirection: "row", gap: 10, marginBottom: 5 },
  avatarButton: {
    backgroundColor: "#2196F3",
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  removeButton: { backgroundColor: "#FF6B6B" },
  avatarButtonText: { color: "#fff", fontWeight: "600" },

  block: { marginBottom: 20, paddingHorizontal: 20 },
  label: { fontSize: 18, marginBottom: 8 },
  input: {
    height: 50,
    backgroundColor: "#eee",
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
  },

  save: {
    marginTop: 10,
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 20,
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  logout: {
    marginTop: 20,
    backgroundColor: "#FF6B6B",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 20,
  },
  logoutText: { color: "#fff", fontSize: 16 },

  delete: {
    marginTop: 15,
    backgroundColor: "#D9534F",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 20,
  },
  deleteText: { color: "#fff", fontSize: 16 },
});
