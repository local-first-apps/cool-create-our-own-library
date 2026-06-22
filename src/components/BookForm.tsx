import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useI18n } from "../i18n";
import { DEFAULT_LIBRARY_NAME, getLocations } from "../services/db";
import { BookInput } from "../types/Book";
import { BOOK_LANGUAGE_OPTIONS, normalizeBookLanguage } from "../utils/bookLanguage";
import { AppButton } from "./AppButton";

type BookFormProps = {
  initialValue?: Partial<BookInput>;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (book: BookInput) => Promise<void>;
};

type FieldName = keyof Pick<
  BookInput,
  "isbn" | "title" | "authors" | "publisher" | "publishedYear" | "category" | "language" | "shelf" | "notes" | "synopsis"
>;

const FIELDS: Array<{
  key: FieldName;
  label: string;
  labelKey?: "authors" | "category" | "language" | "notes" | "publishedYear" | "publisher" | "shelf" | "synopsis" | "title";
  required?: boolean;
  multiline?: boolean;
  keyboardType?: "default" | "number-pad";
}> = [
  { key: "isbn", label: "ISBN" },
  { key: "title", label: "Titolo", labelKey: "title", required: true },
  { key: "authors", label: "Autore/i", labelKey: "authors" },
  { key: "publisher", label: "Editore", labelKey: "publisher" },
  { key: "publishedYear", label: "Anno", labelKey: "publishedYear", keyboardType: "number-pad" },
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
    authors: initialValue?.authors ?? "",
    publisher: initialValue?.publisher ?? "",
    publishedYear: initialValue?.publishedYear ?? "",
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

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 32, 72) }]}
        keyboardShouldPersistTaps="handled"
      >
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
          <AppButton label={submitLabel} onPress={handleSubmit} disabled={saving} />
          <AppButton label={t("cancel")} onPress={onCancel} variant="secondary" disabled={saving} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 10,
    marginTop: 8
  },
  container: {
    flex: 1
  },
  content: {
    gap: 14,
    padding: 16
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
