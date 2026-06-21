import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BarcodeScanningResult, CameraView, useCameraPermissions } from "expo-camera";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Linking, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { fetchBookByIsbn } from "../services/googleBooks";
import { getActiveLibrary } from "../services/settings";
import { RootStackParamList } from "../types/Navigation";
import { isLikelyIsbn13, normalizeIsbn } from "../utils/isbn";

type Props = NativeStackScreenProps<RootStackParamList, "Scanner">;

export function ScannerScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const isFocused = useIsFocused();
  const [locked, setLocked] = useState(false);
  const [message, setMessage] = useState("Inquadra il codice a barre EAN-13 del libro.");

  useFocusEffect(
    useCallback(() => {
      setLocked(false);
      setMessage("Inquadra il codice a barre EAN-13 del libro.");
    }, [])
  );

  async function handleBarcodeScanned(result: BarcodeScanningResult) {
    if (locked) {
      return;
    }

    const isbn = normalizeIsbn(result.data);
    setLocked(true);

    if (!isLikelyIsbn13(isbn)) {
      setMessage("Codice non riconosciuto come ISBN");
      Alert.alert("ISBN non valido", "Codice non riconosciuto come ISBN", [
        { text: "Riprova", onPress: () => setLocked(false) }
      ]);
      return;
    }

    try {
      setMessage("Ricerca libro su Google Books...");
      const book = await fetchBookByIsbn(isbn);
      const activeLibrary = await getActiveLibrary();
      if (!book) {
        Alert.alert("Libro non trovato", "Nessun risultato trovato su Google Books per questo ISBN.", [
          { text: "Riprova", onPress: () => setLocked(false) },
          { text: "Aggiungi manualmente", onPress: () => navigation.navigate("ManualBook", { initialBook: { isbn, library: activeLibrary } }) }
        ]);
        return;
      }

      navigation.navigate("BookConfirm", { book: { ...book, library: activeLibrary } });
    } catch (err) {
      Alert.alert(
        "Errore",
        err instanceof Error ? err.message : "Impossibile recuperare i dati del libro. Verifica la connessione internet.",
        [
          { text: "Riprova", onPress: () => setLocked(false) },
          {
            text: "Aggiungi manualmente",
            onPress: async () => navigation.navigate("ManualBook", { initialBook: { isbn, library: await getActiveLibrary() } })
          }
        ]
      );
      setMessage("Inquadra il codice a barre EAN-13 del libro.");
    }
  }

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!permission.granted) {
    const canAskAgain = permission.canAskAgain;

    return (
      <View style={styles.permission}>
        <Text style={styles.permissionTitle}>Permesso fotocamera necessario</Text>
        <Text style={styles.permissionText}>La fotocamera serve solo per leggere il codice ISBN/EAN-13 del libro.</Text>
        <AppButton
          label={canAskAgain ? "Concedi permesso" : "Apri impostazioni"}
          onPress={canAskAgain ? requestPermission : Linking.openSettings}
        />
        <AppButton label="Indietro" onPress={() => navigation.goBack()} variant="secondary" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        active={isFocused}
        barcodeScannerSettings={{ barcodeTypes: ["ean13"] }}
        facing="back"
        onBarcodeScanned={locked ? undefined : handleBarcodeScanned}
        onMountError={(event) => Alert.alert("Errore fotocamera", event.message)}
        style={styles.camera}
      />
      <View style={styles.overlay}>
        <Text style={styles.overlayText}>{message}</Text>
        {locked ? <ActivityIndicator color="#ffffff" style={styles.indicator} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  camera: {
    flex: 1
  },
  centered: {
    alignItems: "center",
    backgroundColor: "#f7f8fa",
    flex: 1,
    justifyContent: "center"
  },
  container: {
    backgroundColor: "#000000",
    flex: 1
  },
  indicator: {
    marginTop: 8
  },
  overlay: {
    backgroundColor: "rgba(15, 23, 42, 0.82)",
    bottom: 0,
    left: 0,
    padding: 18,
    position: "absolute",
    right: 0
  },
  overlayText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center"
  },
  permission: {
    backgroundColor: "#f7f8fa",
    flex: 1,
    gap: 12,
    justifyContent: "center",
    padding: 24
  },
  permissionText: {
    color: "#475569",
    fontSize: 16,
    lineHeight: 23,
    textAlign: "center"
  },
  permissionTitle: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center"
  }
});
