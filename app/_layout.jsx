import * as Font from "expo-font";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Provider, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { NotificationProvider } from "../contexts/NotificationContext";
import { useSessionRestoration } from "../hooks/useSessionRestoration";
import { useGetProfileByRoleQuery } from "../redux/api/profileApi";
import { persistor, store } from "../redux/store";

function AppContent() {
  const { sessionRestored } = useSessionRestoration();
  const user = useSelector((state) => state.auth.user);

  // Fetch profile on app open - RTK Query will cache it for use across the app
  useGetProfileByRoleQuery(
    { userId: user?.id, role: user?.role },
    { skip: !sessionRestored || !user?.id || !user?.role }
  );

  if (!sessionRestored) {
    return <View style={styles.container} />; // Loading state
  }

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    Font.loadAsync({
      "Poppins-Light": require("../assets/fonts/Poppins-Light.ttf"),
      "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
      "Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
      "Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
      "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
    }).then(() => setFontsLoaded(true));
  }, []);

  if (!fontsLoaded) return null;

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </PersistGate>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
});
