import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";

import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";

import DashboardScreen from "./screens/DashboardScreen";
import AnalyticsScreen from "./screens/AnalyticsScreen";
import ProfileScreen from "./screens/ProfileScreen";

// Import the SMS Sync hook
import { useSmsSync } from "./hooks/useSmsSync";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// The Bottom Tabs (Our main app interface)
function MainTabs({ navigation }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: "#09090B",
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTitle: "",
        headerRight: () => (
          <TouchableOpacity
            style={styles.avatarButton}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("Profile")}
          >
            <Ionicons name="person" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        ),
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#09090B",
          borderTopWidth: 1,
          borderTopColor: "#27272A",
          height: 70,
          elevation: 0,
          shadowOpacity: 0,
          // THE FIX: This pushes the icons down to perfectly center them in the 70px height
          paddingTop: Platform.OS === "android" ? 12 : 8,
          paddingBottom: Platform.OS === "ios" ? 20 : 12,
        },
        tabBarIcon: ({ focused }) => {
          let iconName;
          if (route.name === "Dashboard") {
            iconName = focused ? "wallet" : "wallet-outline";
          } else if (route.name === "Analytics") {
            iconName = focused ? "pie-chart" : "pie-chart-outline";
          }
          return (
            <Ionicons
              name={iconName}
              size={28}
              color={focused ? "#FFFFFF" : "#71717A"}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          headerLeft: () => (
            <View style={styles.headerLeftContainer}>
              <Text style={styles.userName}>My Wallet</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          headerLeft: () => (
            <View style={styles.headerLeftContainer}>
              <Text style={styles.userName}>Analytics</Text>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  let [fontsLoaded] = useFonts({
    "Jakarta-Regular": PlusJakartaSans_400Regular,
    "Jakarta-SemiBold": PlusJakartaSans_600SemiBold,
    "Jakarta-Bold": PlusJakartaSans_700Bold,
    "Jakarta-ExtraBold": PlusJakartaSans_800ExtraBold,
  });

  // Initialize the background SMS listener globally
  useSmsSync();

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SafeAreaView
          style={{ flex: 1, backgroundColor: "#09090B" }}
          edges={["top", "left", "right"]}
        >
          <StatusBar style="light" />
          <NavigationContainer>
            <Stack.Navigator>
              <Stack.Screen
                name="MainTabs"
                component={MainTabs}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                  headerShown: true,
                  title: "My Profile",
                  headerStyle: {
                    backgroundColor: "#09090B",
                    elevation: 0,
                    shadowOpacity: 0,
                  },
                  headerTitleStyle: {
                    fontFamily: "Jakarta-Bold",
                    color: "#FFFFFF",
                  },
                  headerTintColor: "#FFFFFF",
                }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  headerLeftContainer: {
    paddingLeft: 24,
    justifyContent: "center",
  },
  userName: {
    fontFamily: "Jakarta-ExtraBold",
    fontSize: 28,
    color: "#FFFFFF",
  },
  avatarButton: {
    marginRight: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#27272A",
    justifyContent: "center",
    alignItems: "center",
  },
  profileContainer: {
    flex: 1,
    backgroundColor: "#09090B",
    justifyContent: "center",
    alignItems: "center",
  },
  profileText: {
    fontFamily: "Jakarta-Bold",
    fontSize: 24,
    color: "#FFFFFF",
  },
  profileSubText: {
    fontFamily: "Jakarta-Regular",
    fontSize: 16,
    color: "#A1A1AA",
    marginTop: 8,
  },
});