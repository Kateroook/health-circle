import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
import { apiFetch } from "../../lib/api";
import SafeScreen from "../components/SafeScreen";

export default function PasswordSetup() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit() {
    setError("");
    try {
      await apiFetch(`/auth/password-setup?email=${email}&code=${code}`, {
        method: "POST",
        body: JSON.stringify({ newPassword, confirmNewPassword: confirm }),
      });
      router.replace("/auth/Login");
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <SafeScreen scrollable>
      <View style={{ gap: 12 }}>
        <Text>Check your email for a 6-digit code</Text>
        <TextInput
          placeholder="Code"
          value={code}
          onChangeText={setCode}
          style={{ borderBottomWidth: 1 }}
        />
        <TextInput
          placeholder="New Password"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
          style={{ borderBottomWidth: 1 }}
        />
        <TextInput
          placeholder="Confirm Password"
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
          style={{ borderBottomWidth: 1 }}
        />
        {error && <Text style={{ color: "red" }}>{error}</Text>}
        <Button title="Set Password" onPress={handleSubmit} />
      </View>
    </SafeScreen>
  );
}
