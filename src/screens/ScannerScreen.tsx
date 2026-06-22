import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BarcodeScanningResult, CameraView, useCameraPermissions } from "expo-camera";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Linking, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { useI18n } from "../i18n";
import { fetchBookByIsbn } from "../services/googleBooks";
import { getActiveLibrary } from "../services/settings";
import { RootStackParamList } from "../types/Navigation";
import { isLikelyIsbn13, normalizeIsbn } from "../utils/isbn";

type Props = NativeStackScreenProps<RootStackParamList, "Scanner">;

export function ScannerScreen({ navigation }: Props) {
  const { t } = useI18n();
  const [permission, requestPermission] = useCameraPermissions();
  const isFocused = useIsFocused();
  const [locked, setLocked] = useState(false);
  const [message, setMessage] = useState(t("scanHint"));

  useFocusEffect(
    useCallback(() => {
      setLocked(false);
      setMessage(t("scanHint"));
    }, [t])
  );

  async function handleBarcodeScanned(result: BarcodeScanningResult) {
    if (locked) {
      return;
    }

    const isbn = normalizeIsbn(result.data);
    setLocked(true);

    if (!isLikelyIsbn13(isbn)) {
      setMessage(t("invalidIsbnBody"));
      Alert.alert(t("invalidIsbn"), t("invalidIsbnBody"), [
        { text: t("retry"), onPress: () => setLocked(false) }
      ]);
      return;
    }

    try {
      setMessage(t("googleSearch"));
      const book = await fetchBookByIsbn(isbn);
      const activeLibrary = await getActiveLibrary();
      if (!book) {
        Alert.alert(t("bookNotFound"), t("bookNotFoundBody"), [
          { text: t("retry"), onPress: () => setLocked(false) },
          { text: t("addManually"), onPress: () => navigation.navigate("ManualBook", { initialBook: { isbn, library: activeLibrary } }) }
        ]);
        return;
      }

      navigation.navigate("BookConfirm", { book: { ...book, library: activeLibrary } });
    } catch (err) {
      Alert.alert(
        t("error"),
        err instanceof Error ? err.message : t("localDatabaseError"),
        [
          { text: t("retry"), onPress: () => setLocked(false) },
          {
            text: t("addManually"),
            onPress: async () => navigation.navigate("ManualBook", { initialBook: { isbn, library: await getActiveLibrary() } })
          }
        ]
      );
      setMessage(t("scanHint"));
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
        <Text style={styles.permissionTitle}>{t("cameraPermissionTitle")}</Text>
        <Text style={styles.permissionText}>{t("cameraPermissionBody")}</Text>
        <AppButton
          label={canAskAgain ? t("grantPermission") : t("openSettings")}
          onPress={canAskAgain ? requestPermission : Linking.openSettings}
        />
        <AppButton label={t("back")} onPress={() => navigation.goBack()} variant="secondary" />
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
        onMountError={(event) => Alert.alert(t("cameraError"), event.message)}
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
