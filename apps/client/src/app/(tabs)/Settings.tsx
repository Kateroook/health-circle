import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Налаштування</Text>

      <View style={styles.block}>
        <Text style={styles.label}>Імʼя користувача</Text>
        <View style={styles.item} />
      </View>

      <View style={styles.block}>
        <Text style={styles.label}>Сповіщення</Text>
        <View style={styles.item} />
      </View>

      <TouchableOpacity style={styles.logout}>
        <Text style={{ color: "#fff", fontSize: 16 }}>Вийти</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  header: { fontSize: 28, fontWeight: "600", marginBottom: 25 },
  block: { marginBottom: 30 },
  label: { fontSize: 18, marginBottom: 12 },
  item: {
    height: 50,
    backgroundColor: "#eee",
    borderRadius: 12,
  },
  logout: {
    marginTop: 40,
    backgroundColor: "#FF6B6B",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
});
