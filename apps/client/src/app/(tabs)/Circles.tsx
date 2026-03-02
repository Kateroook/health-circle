import { apiFetch } from "@/src/api/api";
import AddCircleModal from "@/src/components/circle/AddCircleModal";
import CircleItem from "@/src/components/circle/CircleItem";
import CircleActionsModal from "@/src/components/circle/actions/CircleActionsModal";
import { COLORS } from "@/src/theme/colors";
import { AntDesign } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    BackHandler,
    Keyboard,
    LayoutAnimation,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    UIManager,
    View,
} from "react-native";
import Modal from "react-native-modal";
import { SafeAreaView } from "react-native-safe-area-context";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Member {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  avatarUpdatedAt?: string;
  active: boolean;
}

export default function CirclesScreen() {
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isActionsVisible, setIsActionsVisible] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsKeyboardVisible(false);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
  const [activeCircle, setActiveCircle] = useState<null | {
    id: string;
    inviteCode: string;
    name: string;
    owner: { id: string };
    members: Member[];
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

  useFocusEffect(
    useCallback(() => {
      fetchCircles();
    }, [])
  );

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
              color: "#FFF",
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
        <View style={[styles.modalWrapper, isKeyboardVisible && styles.modalWrapperExpanded]}>
          <SafeAreaView edges={isKeyboardVisible ? ["top", "bottom"] : ["bottom"]} style={isKeyboardVisible ? { flex: 1 } : undefined}>
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
        ownerId={activeCircle?.owner.id || ""}
        currentName={activeCircle?.name || ""}
        inviteCode={activeCircle?.inviteCode || ""}
        members={activeCircle?.members || []}
        onSaveMembers={async (updatedMembers) => {
          if (!activeCircle) return;
          await apiFetch("/groups", {
            method: "PUT",
            body: JSON.stringify({
              id: activeCircle.id,
              members: updatedMembers,
            }),
          });
          setIsActionsVisible(false);
          fetchCircles();
        }}
        onRename={async (newName) => {
          if (!activeCircle) return;
          await apiFetch("/groups", {
            method: "PUT",
            body: JSON.stringify({ id: activeCircle.id, name: newName }),
          });
          setIsActionsVisible(false);
          fetchCircles();
        }}
        onDelete={async () => {
          if (!activeCircle) return;
          await apiFetch(`/groups/${activeCircle.id}`, { method: "DELETE" });
          setIsActionsVisible(false);
          fetchCircles();
        }}
        onLeave={async () => {
          if (!activeCircle) return;
          await apiFetch(`/groups/${activeCircle.id}/leave`, {
            method: "POST",
          });
          console.log(1);
          setIsActionsVisible(false);
          fetchCircles();
        }}
        onRegenerateInvite={async () => {
          if (!activeCircle) return;
          const { code } = await apiFetch(`/groups/${activeCircle.id}/invite`, {
            method: "POST",
          });
          setActiveCircle((prev) =>
            prev ? { ...prev, inviteCode: code } : prev
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#F7F7F7" },
  content: { padding: 20, paddingBottom: 120 },
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
  modalWrapperExpanded: {
    maxHeight: "80%",
    flex: 1,
  },
});
