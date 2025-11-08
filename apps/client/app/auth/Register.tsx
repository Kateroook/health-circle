import { router } from "expo-router";
import { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
import { apiFetch } from "../../lib/api";
import SafeScreen from "../components/SafeScreen";

export default function Register() {
  const [form, setForm] = useState({
    phone: "",
    email: "",
    firstName: "",
    middleName: "",
    lastName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (key: string, value: string) =>
    setForm({ ...form, [key]: value });

  async function handleRegister() {
    setError("");
    setLoading(true);
    try {
      await apiFetch("/users", { method: "POST", body: JSON.stringify(form) });
      router.push({
        pathname: "/auth/PasswordSetup",
        params: { email: form.email },
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeScreen scrollable>
      <Text>Реєстрація</Text>
      <View style={{ gap: 12, top: 20 }}>
        {["phone", "email", "firstName", "middleName", "lastName"].map((k) => (
          <TextInput
            key={k}
            placeholder={k}
            value={(form as any)[k]}
            onChangeText={(v) => handleChange(k, v)}
            style={{ borderBottomWidth: 1 }}
          />
        ))}
        {error && <Text style={{ color: "red" }}>{error}</Text>}
        <Button
          title={loading ? "Loading..." : "Register"}
          onPress={handleRegister}
        />
        <Button title="Skip for now" onPress={() => router.replace("/home")} />
      </View>
    </SafeScreen>
  );
}
