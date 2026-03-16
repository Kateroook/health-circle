import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TabIcon = ({
  name,
  focused,
}: {
  name: keyof typeof MaterialCommunityIcons.glyphMap;
  focused: boolean;
}) => {
  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
      <MaterialCommunityIcons name={name} color={focused ? "#000000" : "#FFFFFF"} size={28} />
    </View>
  );
};

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { bottom: 20 + insets.bottom }]}>
      {state.routes.map((route, index) => {
        if (route.name === "Notifications") return null;

        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        let iconName: keyof typeof MaterialCommunityIcons.glyphMap = "circle";
        if (route.name === "Dashboard") iconName = "heart";
        else if (route.name === "Circles") iconName = "account-group";
        else if (route.name === "Notifications") iconName = "bell-outline";
        else if (route.name === "Settings") iconName = "cog";

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabBarItem}
          >
            <TabIcon name={iconName} focused={isFocused} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      {/* Dashboard */}
      <Tabs.Screen
        name="Dashboard"
        options={{
          title: "Головна",
        }}
      />

      {/* Circles */}
      <Tabs.Screen
        name="Circles"
        options={{
          title: "Кола",
        }}
      />

      {/* Notifications */}
      <Tabs.Screen
        name="Notifications"
        options={{
          title: "Сповіщення",
        }}
      />

      {/* Settings */}
      <Tabs.Screen
        name="Settings"
        options={{
          title: "Налаштування",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    left: 32,
    right: 32,
    height: 72,
    backgroundColor: "#000000",
    borderRadius: 30,
    borderTopWidth: 0,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 }, // Standard shadow
    shadowOpacity: 0.3,
    shadowRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16, // Add some padding for the items
  },
  tabBarItem: {
    flex: 1,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    width: 76,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 28,
    backgroundColor: "transparent",
    overflow: "hidden", // Force clipping
  },
  iconContainerFocused: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28, // Reinforce radius
  },
});
