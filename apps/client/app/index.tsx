import { router } from "expo-router";
import { Button, Text, View } from "react-native";
import SafeScreen from "./components/SafeScreen";

export default function Index() {
  return (
    <SafeScreen>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          gap: 16,
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: "600" }}>
          Welcome to HealthCircle 👋
        </Text>
        <Button
          title="Register"
          onPress={() => router.push({ pathname: "/auth/Register" })}
        />
        <Button
          title="Login"
          onPress={() => router.push({ pathname: "/auth/Login" })}
        />
        <Button
          title="Skip for now"
          onPress={() => router.replace({ pathname: "/Home" })}
        />
      </View>
    </SafeScreen>
  );
}
