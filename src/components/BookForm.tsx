import { useEffect, useState } from "react";
import { Camera, Save, X, type LucideIcon } from "lucide-react-native";
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useI18n } from "../i18n";
import { takeCoverPhoto } from "../services/coverPhoto";
import { DEFAULT_LIBRARY_NAME, getLocations } from "../services/db";
import { BookInput } from "../types/Book";
import { BOOK_LANGUAGE_OPTIONS, normalizeBookLanguage } from "../utils/bookLanguage";

type BookFormProps = {
  initialValue?: Partial<BookInput>;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (book: BookInput) => Promise<void>;
};

type FieldName = keyof Pick<
  BookInput,
  | "isbn"
  | "title"
  | "subtitle"
  | "authors"
  | "publisher"
  | "publishedYear"
  | "pageCount"
  | "category"
  | "language"
  | "shelf"
  | "notes"
  | "synopsis"
>;

const FIELDS: Array<{
  key: FieldName;
  label: string;
  labelKey?:
    | "authors"
    | "category"
    | "language"
    | "notes"
    | "pageCount"
    | "publishedYear"
    | "publisher"
    | "shelf"
    | "subtitle"
    | "synopsis"
    | "title";
  required?: boolean;
  multiline?: boolean;
  keyboardType?: "default" | "number-pad";
}> = [
  { key: "isbn", label: "ISBN" },
  { key: "title", label: "Titolo", labelKey: "title", required: true },
  { key: "subtitle", label: "Sottotitolo", labelKey: "subtitle" },
  { key: "authors", label: "Autore/i", labelKey: "authors" },
  { key: "publisher", label: "Editore", labelKey: "publisher" },
  { key: "publishedYear", label: "Anno", labelKey: "publishedYear", keyboardType: "number-pad" },
  { key: "pageCount", label: "Numero pagine", labelKey: "pageCount", keyboardType: "number-pad" },
  { key: "category", label: "Categoria", labelKey: "category" },
  { key: "language", label: "Lingua", labelKey: "language" },
  { key: "shelf", label: "Scaffale/Stanza", labelKey: "shelf" },
  { key: "notes", label: "Note", labelKey: "notes", multiline: true },
  { key: "synopsis", label: "Sinossi", labelKey: "synopsis", multiline: true }
];

export function BookForm({ initialValue, submitLabel, onCancel, onSubmit }: BookFormProps) {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const [value, setValue] = useState<BookInput>({
    isbn: initialValue?.isbn ?? "",
    title: initialValue?.title ?? "",
    subtitle: initialValue?.subtitle ?? "",
    authors: initialValue?.authors ?? "",
    publisher: initialValue?.publisher ?? "",
    publishedYear: initialValue?.publishedYear ?? "",
    pageCount: initialValue?.pageCount ?? "",
    category: initialValue?.category ?? "",
    language: normalizeBookLanguage(initialValue?.language) ?? "",
    library: initialValue?.library ?? DEFAULT_LIBRARY_NAME,
    shelf: initialValue?.shelf ?? "",
    notes: initialValue?.notes ?? "",
    synopsis: initialValue?.synopsis ?? "",
    thumbnail: initialValue?.thumbnail ?? null
  });
  const [locations, setLocations] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getLocations()
      .then(setLocations)
      .catch(() => setLocations([]));
  }, []);

  async function handleSubmit() {
    if (!value.title.trim()) {
      setError(`${t("title")} *`);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSubmit(value);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      setSaving(false);
    }
  }

  async function handleTakeCoverPhoto() {
    try {
      const uri = await takeCoverPhoto();
      if (uri) {
        setValue((current) => ({ ...current, thumbnail: uri }));
      }
    } catch (err) {
      setError(err instanceof Error && err.message === "CAMERA_PERMISSION_DENIED" ? t("cameraPermissionTitle") : t("cameraError"));
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 18}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 96, 136) }]}
        keyboardShouldPersistTaps="handled"
      >
        {value.thumbnail ? <Image source={{ uri: value.thumbnail }} style={styles.cover} resizeMode="contain" /> : null}

        {FIELDS.map((field) => (
          <View key={field.key} style={styles.field}>
            <Text style={styles.label}>
              {field.labelKey ? t(field.labelKey) : field.label}
              {field.required ? " *" : ""}
            </Text>
            {field.key === "language" ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestions}>
                <Pressable
                  onPress={() => setValue((current) => ({ ...current, language: "" }))}
                  style={[styles.suggestion, !value.language && styles.suggestionActive]}
                >
                  <Text style={[styles.suggestionText, !value.language && styles.suggestionTextActive]}>-</Text>
                </Pressable>
                {BOOK_LANGUAGE_OPTIONS.map((language) => (
                  <Pressable
                    key={language}
                    onPress={() => setValue((current) => ({ ...current, language }))}
                    style={[styles.suggestion, value.language === language && styles.suggestionActive]}
                  >
                    <Text style={[styles.suggestionText, value.language === language && styles.suggestionTextActive]}>
                      {language}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              <TextInput
                autoCapitalize="sentences"
                keyboardType={field.keyboardType ?? "default"}
                multiline={field.multiline}
                onChangeText={(text) => setValue((current) => ({ ...current, [field.key]: text }))}
                placeholder={field.labelKey ? t(field.labelKey) : field.label}
                placeholderTextColor="#8a94a6"
                style={[styles.input, field.multiline && styles.multiline]}
                value={(value[field.key] ?? "") as string}
              />
            )}
            {field.key === "shelf" && locations.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestions}>
                {locations.map((location) => (
                  <Pressable
                    key={location}
                    onPress={() => setValue((current) => ({ ...current, shelf: location }))}
                    style={styles.suggestion}
                  >
                    <Text style={styles.suggestionText}>{location}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}
          </View>
        ))}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.actions}>
          <FormActionButton icon={Camera} label={t("takeCoverPhoto")} onPress={() => void handleTakeCoverPhoto()} disabled={saving} />
          <FormActionButton icon={Save} label={submitLabel} onPress={handleSubmit} disabled={saving} primary />
          <FormActionButton icon={X} label={t("cancel")} onPress={onCancel} disabled={saving} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type FormActionButtonProps = {
  disabled?: boolean;
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  primary?: boolean;
};

function FormActionButton({ disabled = false, icon: Icon, label, onPress, primary = false }: FormActionButtonProps) {
  const color = primary ? "#ffffff" : "#111827";
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.actionButton, primary && styles.actionButtonPrimary, disabled && styles.actionButtonDisabled]}
    >
      <Text numberOfLines={2} adjustsFontSizeToFit style={[styles.actionText, primary && styles.actionTextPrimary]}>
        {label}
      </Text>
      <Icon color={color} size={25} strokeWidth={1.8} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8
  },
  actionButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#d7dde6",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: 6,
    justifyContent: "center",
    minHeight: 82,
    paddingHorizontal: 8,
    paddingVertical: 9
  },
  actionButtonDisabled: {
    opacity: 0.55
  },
  actionButtonPrimary: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB"
  },
  actionText: {
    color: "#111827",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
    minHeight: 32,
    textAlign: "center"
  },
  actionTextPrimary: {
    color: "#ffffff"
  },
  container: {
    flex: 1
  },
  content: {
    gap: 14,
    padding: 16
  },
  cover: {
    alignSelf: "center",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    height: 220,
    width: 150
  },
  error: {
    color: "#b91c1c",
    fontSize: 14
  },
  field: {
    gap: 6
  },
  input: {
    backgroundColor: "#ffffff",
    borderColor: "#cbd5e1",
    borderRadius: 8,
    borderWidth: 1,
    color: "#111827",
    fontSize: 16,
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  label: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "700"
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: "top"
  },
  suggestion: {
    backgroundColor: "#eef6f5",
    borderColor: "#b7d8d3",
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  suggestionActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB"
  },
  suggestions: {
    marginTop: 2
  },
  suggestionText: {
    color: "#0f5f59",
    fontSize: 13,
    fontWeight: "700"
  },
  suggestionTextActive: {
    color: "#ffffff"
  }
});
