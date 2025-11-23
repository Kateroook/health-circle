import { apiFetch } from "@/src/api/api";
import AddCircleModal from "@/src/components/AddCircleModal";
import CircleActionsModal from "@/src/components/CircleActionsModal";
import CircleItem from "@/src/components/CircleItem";
import { COLORS } from "@/src/theme/colors";
import { AntDesign } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  BackHandler,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Modal from "react-native-modal";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CirclesScreen() {
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isActionsVisible, setIsActionsVisible] = useState(false);
  const [activeCircle, setActiveCircle] = useState<string | null>(null);
  const [circles, setCircles] = useState<
    { name: string; members: any[]; extraCount?: number }[]
  >([]);

  useEffect(() => {
    async function fetchCircles() {
      try {
        const data = await apiFetch("/groups", { method: "GET" });
        setCircles(data);
      } catch (error) {
        console.error("Error loading circles:", error);
      }
    }
    fetchCircles();
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isAddModalVisible) {
        setIsAddModalVisible(false);
        return true;
      }
      if (isActionsVisible) {
        setIsActionsVisible(false);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [isAddModalVisible, isActionsVisible]);

  function openActionsModal(circleName: string) {
    setActiveCircle(circleName);
    setIsActionsVisible(true);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Кола</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setIsAddModalVisible(true)}
          >
            <AntDesign name="plus" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {circles.length === 0 ? (
          <Text
            style={{
              textAlign: "center",
              marginTop: 20,
              color: COLORS.TEXT_GRAY,
            }}
          >
            Кола не знайдені
          </Text>
        ) : (
          circles.map((circle, i) => (
            <CircleItem
              key={i}
              title={circle.name}
              members={circle.members}
              extraCount={circle.extraCount}
              onMenuPress={() => openActionsModal(circle.name)}
            />
          ))
        )}
      </ScrollView>

      {/* Add Circle Modal */}
      <Modal
        isVisible={isAddModalVisible}
        onSwipeComplete={() => setIsAddModalVisible(false)}
        onBackdropPress={() => setIsAddModalVisible(false)}
        onBackButtonPress={() => setIsAddModalVisible(false)}
        swipeDirection="down"
        style={styles.bottomModal}
        backdropOpacity={0.25}
        useNativeDriver
        useNativeDriverForBackdrop
        animationIn="slideInUp"
        animationOut="slideOutDown"
        propagateSwipe
      >
        <View style={styles.modalWrapper}>
          <SafeAreaView edges={["bottom"]}>
            <AddCircleModal onClose={() => setIsAddModalVisible(false)} />
          </SafeAreaView>
        </View>
      </Modal>

      {/* Circle Actions Modal */}
      <CircleActionsModal
        visible={isActionsVisible}
        onClose={() => setIsActionsVisible(false)}
        onRename={() => {
          setIsActionsVisible(false);
          // open rename modal logic here
        }}
        onEditMembers={() => {
          setIsActionsVisible(false);
          // open edit members modal logic here
        }}
        onDelete={() => {
          setIsActionsVisible(false);
          // open delete confirmation modal logic here
        }}
      />
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

  bottomModal: {
    justifyContent: "flex-end",
    margin: 0,
  },

  modalWrapper: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "92%",
    paddingBottom: 10,
  },
});
