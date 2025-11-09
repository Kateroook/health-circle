import { Button, Text, View } from "react-native";
import { useAuth } from "../contexts/AuthContext";

export default function Home() {
  const { user, logout } = useAuth();
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      {user ? (
        <>
          <Text>Welcome, {user.firstName}</Text>
          <Button title="Logout" onPress={logout} />
        </>
      ) : (
        <Text>You’re in guest mode — login required for full features.</Text>
      )}
    </View>
  );
}
