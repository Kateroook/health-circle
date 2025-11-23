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
  const [activeCircle, setActiveCircle] = useState<null | {
    id: string;
    name: string;
    members: any[];
    extraCount?: number;
  }>(null);
  const [circles, setCircles] = useState<(typeof activeCircle)[]>([]);

  // Fetch all circles
  const fetchCircles = async () => {
    try {
      const data = await apiFetch("/groups", { method: "GET" });
      setCircles(data);
    } catch (error) {
      console.error("Error loading circles:", error);
    }
  };

  useEffect(() => {
    fetchCircles();
  }, []);

  // Handle Android back button
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

  function openActionsModal(circle: typeof activeCircle) {
    setActiveCircle(circle);
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
          circles.map((circle) => (
            <CircleItem
              key={circle.id}
              title={circle.name}
              members={circle.members}
              extraCount={circle.extraCount}
              onMenuPress={() => openActionsModal(circle)}
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
            <AddCircleModal
              onClose={() => setIsAddModalVisible(false)}
              onUpdated={fetchCircles} // refresh after adding
            />
          </SafeAreaView>
        </View>
      </Modal>

      {/* Circle Actions Modal */}
      <CircleActionsModal
        visible={isActionsVisible}
        onClose={() => setIsActionsVisible(false)}
        onRename={async () => {
          if (!activeCircle) return;
          const newName = "User input name"; // replace with prompt or modal input
          await apiFetch("/groups", {
            method: "PUT",
            body: JSON.stringify({ id: activeCircle.id, name: newName }),
          });
          setIsActionsVisible(false);
          fetchCircles();
        }}
        onEditMembers={async () => {
          if (!activeCircle) return;
          // TODO: open edit members modal or call API with new members
          setIsActionsVisible(false);
        }}
        onDelete={async () => {
          if (!activeCircle) return;
          await apiFetch(`/groups/${activeCircle.id}`, { method: "DELETE" });
          setIsActionsVisible(false);
          fetchCircles();
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

  bottomModal: { justifyContent: "flex-end", margin: 0 },

  modalWrapper: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "92%",
    paddingBottom: 10,
  },
});
