import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { I18nProvider, useI18n } from "./src/i18n";
import { BookConfirmScreen } from "./src/screens/BookConfirmScreen";
import { BookDetailScreen } from "./src/screens/BookDetailScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { InstructionsScreen } from "./src/screens/InstructionsScreen";
import { LibraryScreen } from "./src/screens/LibraryScreen";
import { ManualBookScreen } from "./src/screens/ManualBookScreen";
import { ScannerScreen } from "./src/screens/ScannerScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { initDatabase } from "./src/services/db";
import { RootStackParamList } from "./src/types/Navigation";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [ready, setReady] = useState(false);
  const [splashImageLoaded, setSplashImageLoaded] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!splashImageLoaded) {
      return undefined;
    }

    const timer = setTimeout(() => setSplashDone(true), 1300);
    return () => clearTimeout(timer);
  }, [splashImageLoaded]);

  useEffect(() => {
    initDatabase()
      .then(() => setReady(true))
      .catch((err) => {
        console.error(err);
        setError("Errore durante l'inizializzazione del database locale.");
      });
  }, []);

  if (error) {
    return (
      <SafeAreaProvider>
        <I18nProvider>
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </I18nProvider>
      </SafeAreaProvider>
    );
  }

  if (!ready || !splashDone) {
    return (
      <SafeAreaProvider>
        <I18nProvider>
          <View style={styles.splashContainer}>
            <Image
              onError={() => setSplashImageLoaded(true)}
              onLoad={() => setSplashImageLoaded(true)}
              resizeMode="cover"
              source={require("./assets/splash-app.png")}
              style={styles.splashImage}
            />
          </View>
        </I18nProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <I18nProvider>
        <AppNavigator />
      </I18nProvider>
    </SafeAreaProvider>
  );
}

function AppNavigator() {
  const { t } = useI18n();

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        screenOptions={{
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#f7f8fa" },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: "#f7f8fa" }
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Library" component={LibraryScreen} options={{ title: t("library") }} />
        <Stack.Screen name="Scanner" component={ScannerScreen} options={{ title: t("scanBook") }} />
        <Stack.Screen name="BookConfirm" component={BookConfirmScreen} options={{ title: t("confirmBook") }} />
        <Stack.Screen name="ManualBook" component={ManualBookScreen} options={{ title: t("manualAdd") }} />
        <Stack.Screen name="BookDetail" component={BookDetailScreen} options={{ title: t("bookDetail") }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: t("settings") }} />
        <Stack.Screen name="Instructions" component={InstructionsScreen} options={{ title: t("instructions") }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    backgroundColor: "#f7f8fa",
    flex: 1,
    justifyContent: "center",
    padding: 24
  },
  errorText: {
    color: "#9b1c1c",
    fontSize: 16,
    textAlign: "center"
  },
  splashContainer: {
    backgroundColor: "#2563EB",
    flex: 1
  },
  splashImage: {
    height: "100%",
    width: "100%"
  }
});
