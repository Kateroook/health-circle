import { ReactNode } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  children: ReactNode;
  scrollable?: boolean;
};

export default function SafeScreen({ children, scrollable = false }: Props) {
  if (scrollable) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["bottom", "top"]}>
        <ScrollView keyboardShouldPersistTaps="handled">{children}</ScrollView>
      </SafeAreaView>
    );
  }

  return <SafeAreaView style={styles.safeArea}>{children}</SafeAreaView>;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});
