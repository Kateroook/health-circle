import { router } from "expo-router";
import { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import SafeScreen from "../components/SafeScreen";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin() {
    setError("");
    try {
      await login(email, password);
      router.navigate("/Home");
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <SafeScreen>
      <View style={{ gap: 12 }}>
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={{ borderBottomWidth: 1 }}
        />
        <TextInput
          placeholder="Password"
          value={password}
          secureTextEntry
          onChangeText={setPassword}
          style={{ borderBottomWidth: 1 }}
        />
        {error && <Text style={{ color: "red" }}>{error}</Text>}
        <Button title="Login" onPress={handleLogin} />
      </View>
    </SafeScreen>
  );
}
