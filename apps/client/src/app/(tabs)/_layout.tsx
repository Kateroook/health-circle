import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Dimensions } from "react-native";

const screenWidth = Dimensions.get("window").width;
const TAB_WIDTH = (screenWidth - 64 - 12) / 3;

const CustomTabBar = ({ state, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: state.index * TAB_WIDTH,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [state.index]);

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

        let iconName: keyof typeof MaterialCommunityIcons.glyphMap = "circle";

        if (route.name === "Dashboard") iconName = "heart-outline";
        if (route.name === "Circles") iconName = "account-group-outline";
        if (route.name === "Settings") iconName = "cog";

        return (
          <TouchableOpacity key={route.key} style={styles.tabItem} onPress={onPress}>
            <MaterialCommunityIcons name={iconName} size={32} color={isFocused ? "#000" : "#FFF"} />
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
    zIndex: 2,
  },

  activePill: {
    position: "absolute",
    width: TAB_WIDTH,
    height: 44,
    borderRadius: 25,
    backgroundColor: "#FFF",
    left: 6,
    zIndex: 1,
  },
});
