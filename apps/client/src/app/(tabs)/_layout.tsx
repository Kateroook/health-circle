import { MaterialCommunityIcons, Octicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const screenWidth = Dimensions.get("window").width;
const TAB_WIDTH = (screenWidth - 64 - 12) / 3;

const TabBarIcon = ({ routeName, isFocused }: { routeName: string; isFocused: boolean }) => {
  const color = isFocused ? "#000" : "#FFF";

  if (routeName === "Dashboard") {
    return (
      <MaterialCommunityIcons
        name={isFocused ? "heart" : "heart-outline"}
        size={24}
        color={color}
      />
    );
  }

  if (routeName === "Circles") {
    return (
      <MaterialCommunityIcons
        name={isFocused ? "account-supervisor" : "account-supervisor-outline"}
        size={25}
        color={color}
      />
    );
  }

  return isFocused ? (
    <MaterialCommunityIcons name="cog" size={24} color={color} />
  ) : (
    <Octicons name="gear" size={22} color={color} />
  );
};

const CustomTabBar = ({ state, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: state.index * TAB_WIDTH,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [state.index, translateX]);

  return (
    <View style={[styles.tabBar, { bottom: 20 + insets.bottom }]}>
      {/* Animated pill */}
      <Animated.View
        style={[
          styles.activePill,
          {
            transform: [{ translateX }],
          },
        ]}
      />

      {state.routes.map((route, index) => {
        const isFocused = state.index === index;

        const onPress = () => {
          if (!isFocused) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity key={route.key} style={styles.tabItem} onPress={onPress}>
            <TabBarIcon routeName={route.name} isFocused={isFocused} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <CustomTabBar {...props} />}>
      <Tabs.Screen name="Dashboard" />
      <Tabs.Screen name="Circles" />
      <Tabs.Screen name="Settings" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    left: 32,
    right: 32,
    height: 56,
    zIndex: 0,
    elevation: 0,
    backgroundColor: "#000",
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
  },

  tabItem: {
    width: TAB_WIDTH,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  activePill: {
    position: "absolute",
    width: TAB_WIDTH,
    height: 44,
    borderRadius: 25,
    backgroundColor: "#FFF",
    left: 6,
  },
});
