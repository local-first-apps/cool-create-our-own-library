import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppButton } from "../components/AppButton";
import {
  defaultDeviceNameFor,
  defaultLibraryNameFor,
  isLocalizedDefaultDeviceName,
  isLocalizedDefaultLibraryName,
  useI18n
} from "../i18n";
import { DEFAULT_LIBRARY_NAME, renameLibrary } from "../services/db";
import {
  DEFAULT_DEVICE_NAME,
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  getActiveLibrary,
  getSettings,
  saveActiveLibrary,
  saveDeviceName,
  saveLanguage
} from "../services/settings";
import { RootStackParamList } from "../types/Navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;
const APP_VERSION_LABEL = "COOL | Create Our Own Library (1.0.0 - build 1)";
const PRIVACY_URL = "https://local-first-apps.github.io/cool-create-our-own-library/privacy.html";
const TERMS_URL = "https://local-first-apps.github.io/cool-create-our-own-library/terms.html";
const FEEDBACK_EMAIL_URL = "mailto:cool.library.app@gmail.com?subject=COOL%20feedback";

export function SettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { setAppLanguage, t } = useI18n();
  const [deviceName, setDeviceName] = useState("");
  const [libraryName, setLibraryName] = useState("");
  const [currentLibraryName, setCurrentLibraryName] = useState("");
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [savedLanguage, setSavedLanguage] = useState(DEFAULT_LANGUAGE);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      Promise.all([getSettings(), getActiveLibrary()])
        .then(([settings, activeLibrary]) => {
          setDeviceName(settings.deviceName);
          setLanguage(settings.language);
          setSavedLanguage(settings.language);
          setLibraryName(activeLibrary === DEFAULT_LIBRARY_NAME ? defaultLibraryNameFor(settings.language) : activeLibrary);
          setCurrentLibraryName(activeLibrary);
          setDeviceName(settings.deviceName === DEFAULT_DEVICE_NAME ? defaultDeviceNameFor(settings.language) : settings.deviceName);
        })
        .catch(() => {
          setDeviceName(defaultDeviceNameFor(DEFAULT_LANGUAGE));
          setLanguage(DEFAULT_LANGUAGE);
          setSavedLanguage(DEFAULT_LANGUAGE);
          setLibraryName(defaultLibraryNameFor(DEFAULT_LANGUAGE));
          setCurrentLibraryName(DEFAULT_LIBRARY_NAME);
        });
    }, [])
  );

  async function handleSave() {
    try {
      setSaving(true);
      const renamedLibrary = await renameLibrary(currentLibraryName, libraryName);
      await saveActiveLibrary(renamedLibrary);
      await saveDeviceName(deviceName);
      await saveLanguage(language);
      setAppLanguage(language);
      setSavedLanguage(language);
      Alert.alert(t("settingsSaved"), t("settingsSavedBody"), [
        { text: t("ok"), onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      Alert.alert(t("error"), err instanceof Error ? err.message : t("localDatabaseError"));
    } finally {
      setSaving(false);
    }
  }

  async function openExternalUrl(url: string) {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(t("error"), url);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 32, 72) }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.field}>
          <Text style={styles.label}>{t("libraryName")}</Text>
          <Text style={styles.description}>{t("libraryNameDescription")}</Text>
          <TextInput
            autoCapitalize="sentences"
            onChangeText={setLibraryName}
            placeholder={t("librarySetupPlaceholder")}
            placeholderTextColor="#8a94a6"
            style={styles.input}
            value={libraryName}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t("deviceNameField")}</Text>
          <Text style={styles.description}>{t("deviceNameDescription")}</Text>
          <TextInput
            autoCapitalize="sentences"
            onChangeText={setDeviceName}
            placeholder={t("deviceNamePlaceholder")}
            placeholderTextColor="#8a94a6"
            style={styles.input}
            value={deviceName}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t("language")}</Text>
          <View style={styles.languageRow}>
            {SUPPORTED_LANGUAGES.map((item) => (
              <Pressable
                key={item}
                accessibilityRole="button"
                onPress={() => {
                  if (isLocalizedDefaultLibraryName(libraryName)) {
                    setLibraryName(defaultLibraryNameFor(item));
                  }
                  if (isLocalizedDefaultDeviceName(deviceName)) {
                    setDeviceName(defaultDeviceNameFor(item));
                  }
                  setLanguage(item);
                  setAppLanguage(item);
                }}
                style={[styles.languageButton, item === language && styles.languageButtonActive]}
              >
                <Text style={[styles.languageText, item === language && styles.languageTextActive]}>{item}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          <View style={styles.actionButton}>
            <AppButton label={t("save")} onPress={handleSave} disabled={saving} />
          </View>
          <View style={styles.actionButton}>
            <AppButton
              label={t("cancel")}
              onPress={() => {
                setAppLanguage(savedLanguage);
                navigation.goBack();
              }}
              variant="secondary"
              disabled={saving}
            />
          </View>
        </View>

        <View style={styles.feedbackAction}>
          <AppButton
            label={t("feedback")}
            onPress={() => openExternalUrl(FEEDBACK_EMAIL_URL)}
            variant="secondary"
          />
        </View>

        <View style={styles.legalActions}>
          <LegalLinkButton label={t("terms")} onPress={() => openExternalUrl(TERMS_URL)} />
          <LegalLinkButton label={t("privacy")} onPress={() => openExternalUrl(PRIVACY_URL)} />
        </View>

        <Text style={styles.appVersion}>{APP_VERSION_LABEL}</Text>
      </ScrollView>

    </View>
  );
}

type LegalLinkButtonProps = {
  label: string;
  onPress: () => void;
};

function LegalLinkButton({ label, onPress }: LegalLinkButtonProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.legalButton}>
      <Text style={styles.legalButtonText}>{label}</Text>
    </Pressable>
  );
}

const TERMS_TEXT = [
  "COOL | Create Our Own Library è un'app per catalogare libri su un dispositivo personale.",
  "L'utente è responsabile dei dati inseriti, delle modifiche, delle cancellazioni e dei file esportati.",
  "Le informazioni recuperate da Google Books possono essere incomplete, inesatte o non disponibili. L'utente può correggere manualmente i dati prima o dopo il salvataggio.",
  "L'app non offre sincronizzazione cloud, account utente, backup remoto o recupero automatico dei dati. È consigliabile esportare periodicamente la biblioteca.",
  "I file CSV, Excel e Word sono generati sul telefono e possono essere condivisi tramite le funzioni del sistema operativo.",
  "Il servizio è fornito senza garanzia di disponibilità continua o assenza di errori. Per una distribuzione commerciale, questi termini andranno verificati e adattati al paese di pubblicazione."
];

const PRIVACY_TEXT = [
  "COOL | Create Our Own Library salva la biblioteca nel database SQLite locale del telefono.",
  "L'app non usa backend, database remoto, Render, Firebase, Supabase o sincronizzazione cloud.",
  "Il nome dispositivo, il nome biblioteca e i libri salvati restano sul telefono, salvo esportazione o condivisione avviata dall'utente.",
  "Quando si scansiona o inserisce un ISBN, l'app può interrogare Google Books API per recuperare titolo, autori, editore, anno, categoria, lingua, sinossi e copertina. In quel caso la richiesta viene inviata a Google.",
  "L'app richiede il permesso fotocamera per leggere i codici a barre. I file esportati vengono condivisi solo tramite le funzioni di condivisione scelte dall'utente.",
  "Per una pubblicazione su App Store o Google Play, questa informativa dovrà essere completata con dati del titolare, contatti, paese applicabile e collegamenti pubblici richiesti dagli store."
];

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8
  },
  actionButton: {
    flex: 1
  },
  container: {
    backgroundColor: "#f7f8fa",
    flex: 1
  },
  content: {
    padding: 16
  },
  description: {
    color: "#475569",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 10
  },
  field: {
    marginBottom: 18
  },
  feedbackAction: {
    marginTop: 22
  },
  input: {
    backgroundColor: "#ffffff",
    borderColor: "#cbd5e1",
    borderRadius: 8,
    borderWidth: 1,
    color: "#111827",
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 12
  },
  label: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 4
  },
  languageButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#cbd5e1",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 42,
    justifyContent: "center"
  },
  languageButtonActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB"
  },
  languageRow: {
    flexDirection: "row",
    gap: 8
  },
  languageText: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "800"
  },
  languageTextActive: {
    color: "#ffffff"
  },
  legalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 30
  },
  legalButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#d7dde6",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  legalButtonText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
    flexShrink: 1,
    textAlign: "center"
  },
  legalText: {
    color: "#334155",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 12
  },
  legalTextBox: {
    maxHeight: 380
  },
  appVersion: {
    color: "#64748b",
    fontSize: 11,
    marginTop: 18,
    textAlign: "center"
  },
  modalActions: {
    marginTop: 12
  },
  modalBackdrop: {
    backgroundColor: "rgba(15, 23, 42, 0.38)",
    flex: 1,
    justifyContent: "flex-end"
  },
  modalPanel: {
    backgroundColor: "#f7f8fa",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    maxHeight: "88%",
    padding: 16
  },
  modalTitle: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 10
  }
});
