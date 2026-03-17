import { apiFetch } from "@/src/api/api";
import { initiateRollCall } from "@/src/api/groups";
import { Button } from "@/src/components/Button";
import AddCircleModal from "@/src/components/circle/AddCircleModal";
import { Member, Circle } from "@/src/types";
import CircleItem from "@/src/components/circle/CircleItem";
import CircleActionsModal from "@/src/components/circle/actions/CircleActionsModal";
import CircleDetailsModal from "@/src/components/circle/actions/CircleDetailsModal";
import { useSyncSignal } from "@/src/hooks/useSyncSignal";
import { AntDesign } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { BackHandler, Platform, ScrollView, StyleSheet, UIManager, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Typography } from "@/src/components/typography";
import { useAuthStore } from "@/src/store/authStore";
import { theme } from "@/src/theme/theme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function CirclesScreen() {
  const user = useAuthStore().user;
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isActionsVisible, setIsActionsVisible] = useState(false);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);

  const [activeCircle, setActiveCircle] = useState<Circle | null>(null);
  const [circles, setCircles] = useState<Circle[]>([]);

  // Sync activeCircle when circles update (e.g. after rename)
  useEffect(() => {
    if (activeCircle) {
      const updated = circles.find((c) => c.id === activeCircle.id);
      if (updated) {
        setActiveCircle(updated);
      }
    }
  }, [circles]);

  // Fetch all circles
  const fetchCircles = useCallback(async () => {
    try {
      const data = await apiFetch("/groups", { method: "GET" });
      const circlesWithStatus = data.map((circle: any) => ({
        ...circle,
        members: circle.members.map((m: any) => ({
          ...m,
          status: m.status || "UNKNOWN",
        })),
      }));
      setCircles(circlesWithStatus);
    } catch (error) {
      console.error("Error loading circles:", error);
    }
  }, []);

  useSyncSignal(fetchCircles);

  useFocusEffect(
    useCallback(() => {
      // Empty, handled by sync signal
    }, []),
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
      if (isDetailsVisible) {
        setIsDetailsVisible(false);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [isAddModalVisible, isActionsVisible, isDetailsVisible]);

  function openActionsModal(circle: Circle) {
    setActiveCircle(circle);
    setIsActionsVisible(true);
  }

  function openDetailsModal(circle: Circle) {
    setActiveCircle(circle);
    setIsDetailsVisible(true);
  }

  const handleSaveMembers = async (updatedMembers: { id: string }[]) => {
    if (!activeCircle) return;
    try {
      await apiFetch("/groups", {
        method: "PUT",
        body: JSON.stringify({ id: activeCircle.id, members: updatedMembers }),
      });
      fetchCircles();
    } catch (error) {
      console.error("Failed to save members:", error);
    }
  };

  const handleRename = async (newName: string) => {
    if (!activeCircle) return;
    try {
      await apiFetch("/groups", {
        method: "PUT",
        body: JSON.stringify({ id: activeCircle.id, name: newName }),
      });
      setIsActionsVisible(false);
      fetchCircles();
    } catch (error) {
      console.error("Failed to rename circle:", error);
    }
  };

  const handleDelete = async () => {
    if (!activeCircle) return;
    try {
      await apiFetch(`/groups/${activeCircle.id}`, { method: "DELETE" });
      setIsActionsVisible(false);
      setIsDetailsVisible(false);
      fetchCircles();
    } catch (error) {
      console.error("Failed to delete circle:", error);
    }
  };

  const handleLeave = async () => {
    if (!activeCircle) return;
    try {
      await apiFetch(`/groups/${activeCircle.id}/leave`, { method: "POST" });
      setIsActionsVisible(false);
      setIsDetailsVisible(false);
      fetchCircles();
    } catch (error) {
      console.error("Failed to leave circle:", error);
    }
  };

  const handleRegenerateInvite = async () => {
    if (!activeCircle) return;
    try {
      const { code } = await apiFetch(`/groups/${activeCircle.id}/invite`, { method: "POST" });
      setActiveCircle((prev) => (prev ? { ...prev, inviteCode: code } : prev));
      fetchCircles();
    } catch (error) {
      console.error("Failed to regenerate invite:", error);
    }
  };

  const handleRollCall = async () => {
    if (!activeCircle) return;
    try {
      await initiateRollCall(activeCircle.id);
      fetchCircles();
    } catch (error) {
      console.error("Failed to initiate roll call:", error);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Typography variant="h1" tone="primary">
            Кола
          </Typography>
          <Button
            shape="round"
            hierarchy="accent"
            size="medium"
            leadingIcon={<AntDesign name="plus" size={24} color={theme.colors.content.onColor} />}
            onPress={() => setIsAddModalVisible(true)}
          />
        </View>

        {circles.length === 0 ? (
          <Typography
            variant="body1"
            tone="onColor"
            style={{
              textAlign: "center",
              marginTop: 20,
            }}
          >
            Кола не знайдені
          </Typography>
        ) : (
          circles.map((circle) => (
            <CircleItem
              key={circle.id}
              title={circle.name}
              members={circle.members}
              onMenuPress={() => openActionsModal(circle)}
              onPress={() => openDetailsModal(circle)}
            />
          ))
        )}
      </ScrollView>

      {/* Add Circle Modal */}
      <AddCircleModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onUpdated={fetchCircles}
      />

      {/* Circle Actions Modal */}
      <CircleActionsModal
        visible={isActionsVisible}
        onClose={() => setIsActionsVisible(false)}
        ownerId={activeCircle?.owner.id || ""}
        currentName={activeCircle?.name || ""}
        inviteCode={activeCircle?.inviteCode || ""}
        members={activeCircle?.members || []}
        circleId={activeCircle ? activeCircle.id : ""}
        onSaveMembers={handleSaveMembers}
        onRename={handleRename}
        onDelete={handleDelete}
        onLeave={handleLeave}
        onRegenerateInvite={handleRegenerateInvite}
        onRollCall={handleRollCall}
      />

      {/* Circle Details Modal */}
      <CircleDetailsModal
        visible={isDetailsVisible}
        onClose={() => setIsDetailsVisible(false)}
        circleId={activeCircle ? activeCircle.id : ""}
        ownerId={activeCircle && activeCircle.owner ? activeCircle.owner.id : ""}
        currentName={
          activeCircle
            ? activeCircle.name ||
              (activeCircle.owner && activeCircle.owner.id === user?.id
                ? "Моє коло"
                : activeCircle.owner
                  ? `${activeCircle.owner.firstName} ${activeCircle.owner.lastName}`
                  : "")
            : ""
        }
        inviteCode={activeCircle?.inviteCode || ""}
        members={activeCircle?.members || []}
        onSaveMembers={handleSaveMembers}
        onEdit={() => {
          setIsDetailsVisible(false);
          setTimeout(() => {
            setIsActionsVisible(true);
          }, 300);
        }}
        onDelete={handleDelete}
        onLeave={handleLeave}
        onRegenerateInvite={handleRegenerateInvite}
        onMemberUpdated={fetchCircles}
        onRollCall={handleRollCall}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background.primary },
  content: { paddingHorizontal: theme.spacing[16], paddingBottom: 140 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: theme.spacing[20],
    marginBottom: theme.spacing[28],
  },
});
