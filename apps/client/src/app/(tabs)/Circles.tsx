import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function CirclesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Ваші Кола</Text>

      <View style={styles.circleCard}>
        <Text style={styles.circleTitle}>Близькі</Text>
        <View style={styles.row}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.avatar} />
          ))}
        </View>
      </View>

      <View style={styles.circleCard}>
        <Text style={styles.circleTitle}>Друзі</Text>
        <View style={styles.row}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.avatar} />
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.button}>
        <Text style={{ color: "#fff", fontSize: 16 }}>Створити нове коло</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  header: { fontSize: 28, fontWeight: "600", marginBottom: 30 },
  circleCard: {
    padding: 20,
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    marginBottom: 25,
  },
  circleTitle: { fontSize: 20, marginBottom: 10 },
  row: { flexDirection: "row", gap: 12 },
  avatar: {
    width: 45,
    height: 45,
    backgroundColor: "#ddd",
    borderRadius: 22,
  },
  button: {
    marginTop: 40,
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
});
