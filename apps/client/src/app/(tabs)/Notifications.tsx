import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotificationsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Text style={styles.header}>Сповіщення</Text>

        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.notification}>
            <View style={styles.avatar} />
            <View>
              <Text style={{ fontSize: 16 }}>Хтось зробив дію #{i}</Text>
              <Text style={{ color: "#888", fontSize: 13 }}>1 годину тому</Text>
            </View>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  header: { fontSize: 28, fontWeight: "600", marginBottom: 25 },
  notification: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginBottom: 25,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22,
    backgroundColor: "#eee",
  },
});
