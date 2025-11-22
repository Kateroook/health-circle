import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Text style={styles.title}>Привіт, Тарасе!</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ваше коло сьогодні</Text>
          <View style={styles.avatars}>
            {[1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={styles.avatarPlaceholder} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Статистика</Text>
          <View style={styles.statBlock} />
          <View style={styles.statBlock} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 28, fontWeight: "600", marginBottom: 25 },
  card: {
    padding: 20,
    backgroundColor: "#F8F8F8",
    borderRadius: 16,
    marginBottom: 30,
  },
  cardTitle: { fontSize: 18, marginBottom: 15 },
  avatars: { flexDirection: "row", gap: 10 },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    backgroundColor: "#ddd",
    borderRadius: 25,
  },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 20, marginBottom: 10 },
  statBlock: {
    height: 60,
    backgroundColor: "#eee",
    borderRadius: 12,
    marginBottom: 15,
  },
});
