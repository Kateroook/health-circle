import AddCircleModal from "@/src/components/AddCircleModal";
import CircleItem from "@/src/components/CircleItem";
import { COLORS } from "@/src/theme/colors";
import { AntDesign } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CirclesScreen() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const pan = useRef(new Animated.Value(0)).current;

  const mockMembers = [
    { status: "danger" as const },
    { status: "safe" as const },
    { status: "unknown" as const },
    { status: "unknown" as const },
    { status: "unknown" as const },
  ];

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => {
        return gesture.dy > 5;
      },

      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          pan.setValue(gesture.dy);
        }
      },

      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 120) {
          setIsModalVisible(false);
          pan.setValue(0);
        } else {
          Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isModalVisible) {
        setIsModalVisible(false);
        return true;
      }
      return false;
    });

    return () => sub.remove();
  }, [isModalVisible]);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Кола</Text>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setIsModalVisible(true)}
          >
            <AntDesign name="plus" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <CircleItem title="Близькі" members={mockMembers.slice(0, 4)} />
        <CircleItem title="Родина" members={mockMembers} extraCount={2} />
        <CircleItem title="Друзі" members={mockMembers.slice(0, 4)} />
      </ScrollView>

      {/* MODAL */}
      <Modal
        animationType="slide"
        transparent
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalWrapper}>
            <SafeAreaView edges={["bottom"]}>
              <AddCircleModal onClose={() => setIsModalVisible(false)} />
            </SafeAreaView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "white" },
  content: { padding: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: { fontSize: 28, fontWeight: "700" },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.PRIMARY_BLUE,
    justifyContent: "center",
    alignItems: "center",
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalWrapper: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "92%",
    paddingBottom: 10,
  },
});
