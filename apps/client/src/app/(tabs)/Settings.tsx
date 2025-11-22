import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch } from "../../api/api";
import { useAuthStore } from "../../store/authStore";
import { cleanObj } from "../../utils/clean.util";

export default function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [middleName, setMiddleName] = useState(user?.middleName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [phone, setPhone] = useState(user?.phone || "");

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

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Text style={styles.header}>Налаштування</Text>

        {/* First Name */}
        <View style={styles.block}>
          <Text style={styles.label}>Імʼя</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Введіть імʼя"
            placeholderTextColor="#999"
          />
        </View>

        {/* Middle Name */}
        <View style={styles.block}>
          <Text style={styles.label}>По-батькові</Text>
          <TextInput
            style={styles.input}
            value={middleName}
            onChangeText={setMiddleName}
            placeholder="Введіть по-батькові"
            placeholderTextColor="#999"
          />
        </View>

        {/* Last Name */}
        <View style={styles.block}>
          <Text style={styles.label}>Прізвище</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Введіть прізвище"
            placeholderTextColor="#999"
          />
        </View>

        {/* Phone */}
        <View style={styles.block}>
          <Text style={styles.label}>Номер телефону</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+380..."
            keyboardType="phone-pad"
            placeholderTextColor="#999"
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.save} onPress={handleSave}>
          <Text style={styles.saveText}>Зберегти</Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={styles.logout} onPress={logout}>
          <Text style={styles.logoutText}>Вийти</Text>
        </TouchableOpacity>

        {/* Delete Account */}
        <TouchableOpacity style={styles.delete} onPress={handleDeleteAccount}>
          <Text style={styles.deleteText}>Видалити акаунт</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  header: { fontSize: 28, fontWeight: "600", marginBottom: 25 },

  block: { marginBottom: 20 },

  label: { fontSize: 18, marginBottom: 12 },

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
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  logout: {
    marginTop: 20,
    backgroundColor: "#FF6B6B",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  logoutText: { color: "#fff", fontSize: 16 },

  delete: {
    marginTop: 15,
    backgroundColor: "#D9534F",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  deleteText: { color: "#fff", fontSize: 16 },
});
