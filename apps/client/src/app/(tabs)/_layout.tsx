import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useAuthStore } from "../../store/authStore";

export default function TabLayout() {
  const user = useAuthStore((state) => state.user);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#FF6B6B",
        tabBarInactiveTintColor: "#666",
        tabBarStyle: {
          height: 90,
          paddingHorizontal: 10,
          paddingTop: 10,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 0,
        },
        tabBarShowLabel: false,
      }}
    >
      {/* Dashboard */}
      <Tabs.Screen
        name="Dashboard"
        options={{
          title: "Головна",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="heart" color={color} size={28} />
          ),
        }}
      />

      {/* Circles */}
      <Tabs.Screen
        name="Circles"
        options={{
          title: "Кола",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="account-group"
              color={color}
              size={28}
            />
          ),
        }}
      />

      {/* Notifications */}
      <Tabs.Screen
        name="Notifications"
        options={{
          title: "Сповіщення",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="bell-outline"
              color={color}
              size={28}
            />
          ),
        }}
      />

      {/* Settings */}
      <Tabs.Screen
        name="Settings"
        options={{
          title: "Налаштування",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="cog" color={color} size={28} />
          ),
        }}
      />
    </Tabs>
  );
}
