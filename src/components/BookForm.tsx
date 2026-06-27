import { useEffect, useState } from "react";
import { ArrowRight, Camera, Save, Search, X, type LucideIcon } from "lucide-react-native";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useI18n } from "../i18n";
import { takeCoverPhoto } from "../services/coverPhoto";
import { DEFAULT_LIBRARY_NAME, getLocations } from "../services/db";
import { fetchBookByIsbn, searchBooksByTitle } from "../services/googleBooks";
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
  { key: "isbn", label: "ISBN", keyboardType: "number-pad" },
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
  const [lookupLoading, setLookupLoading] = useState<"isbn" | "title" | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<"isbn" | "title", string>>>({});
  const [titleResults, setTitleResults] = useState<BookInput[]>([]);
  const [titleModalVisible, setTitleModalVisible] = useState(false);

  useEffect(() => {
    getLocations()
      .then(setLocations)
      .catch(() => setLocations([]));
  }, []);

  async function handleSubmit() {
    if (!value.title.trim()) {
      setError(t("titleRequired"));
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

  function applyLookupResult(book: BookInput) {
    setValue((current) => ({
      ...current,
      ...book,
      library: current.library,
      notes: current.notes,
      shelf: current.shelf
    }));
    setTitleModalVisible(false);
    setError(null);
    setFieldErrors({});
  }

  async function handleIsbnLookup() {
    const isbn = (value.isbn ?? "").trim();
    if (!isbn) {
      setFieldErrors((current) => ({ ...current, isbn: t("invalidIsbnBody") }));
      return;
    }

    setLookupLoading("isbn");
    setError(null);
    setFieldErrors((current) => ({ ...current, isbn: undefined }));
    try {
      const found = await fetchBookByIsbn(isbn);
      if (!found) {
        setFieldErrors((current) => ({ ...current, isbn: t("isbnNotFound") }));
        return;
      }

      applyLookupResult(found);
    } catch (err) {
      const message = err instanceof Error ? err.message : t("error");
      setFieldErrors((current) => ({
        ...current,
        isbn: message.includes("ISBN") && message.includes("riconosciuto") ? t("invalidIsbnBody") : message
      }));
    } finally {
      setLookupLoading(null);
    }
  }

  async function handleTitleLookup() {
    const title = value.title.trim();
    if (!title) {
      setFieldErrors((current) => ({ ...current, title: t("titleRequired") }));
      return;
    }

    setLookupLoading("title");
    setError(null);
    setFieldErrors((current) => ({ ...current, title: undefined }));
    try {
      const results = await searchBooksByTitle(title, 5);
      if (results.length === 0) {
        setFieldErrors((current) => ({ ...current, title: t("titleNotFound") }));
        return;
      }

      setTitleResults(results);
      setTitleModalVisible(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      setLookupLoading(null);
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
              <View style={field.key === "isbn" || field.key === "title" ? styles.lookupRow : undefined}>
                <TextInput
                  autoCapitalize="sentences"
                  keyboardType={field.keyboardType ?? "default"}
                  multiline={field.multiline}
                  onChangeText={(text) => {
                    setValue((current) => ({ ...current, [field.key]: text }));
                    if (field.key === "isbn" || field.key === "title") {
                      setFieldErrors((current) => ({ ...current, [field.key]: undefined }));
                    }
                  }}
                  placeholder={field.labelKey ? t(field.labelKey) : field.label}
                  placeholderTextColor="#8a94a6"
                  style={[
                    styles.input,
                    field.multiline && styles.multiline,
                    (field.key === "isbn" || field.key === "title") && styles.lookupInput
                  ]}
                  value={(value[field.key] ?? "") as string}
                />
                {field.key === "isbn" || field.key === "title" ? (
                  <Pressable
                    accessibilityLabel={field.key === "isbn" ? t("searchByIsbn") : t("searchByTitle")}
                    accessibilityRole="button"
                    disabled={Boolean(lookupLoading)}
                    onPress={field.key === "isbn" ? () => void handleIsbnLookup() : () => void handleTitleLookup()}
                    style={[styles.lookupButton, lookupLoading && styles.lookupButtonDisabled]}
                  >
                    {lookupLoading === field.key ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : field.key === "isbn" ? (
                      <ArrowRight color="#ffffff" size={27} strokeWidth={2.4} />
                    ) : (
                      <Search color="#ffffff" size={25} strokeWidth={2.4} />
                    )}
                  </Pressable>
                ) : null}
              </View>
            )}
            {(field.key === "isbn" || field.key === "title") && fieldErrors[field.key] ? (
              <Text style={styles.fieldError}>{fieldErrors[field.key]}</Text>
            ) : null}
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

      <Modal animationType="fade" transparent visible={titleModalVisible} onRequestClose={() => setTitleModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalPanel, { paddingBottom: Math.max(insets.bottom + 18, 24) }]}>
            <Text style={styles.modalTitle}>{t("chooseBook")}</Text>
            <ScrollView style={styles.resultList} contentContainerStyle={styles.resultListContent}>
              {titleResults.map((book, index) => (
                <Pressable
                  accessibilityRole="button"
                  key={`${book.isbn || book.title}-${index}`}
                  onPress={() => applyLookupResult(book)}
                  style={styles.resultRow}
                >
                  {book.thumbnail ? <Image source={{ uri: book.thumbnail }} style={styles.resultCover} resizeMode="cover" /> : null}
                  <View style={styles.resultTextBox}>
                    <Text numberOfLines={2} style={styles.resultTitle}>
                      {book.title}
                    </Text>
                    {book.subtitle ? (
                      <Text numberOfLines={1} style={styles.resultMeta}>
                        {book.subtitle}
                      </Text>
                    ) : null}
                    <Text numberOfLines={2} style={styles.resultMeta}>
                      {[book.authors, book.publishedYear, book.publisher].filter(Boolean).join(" • ")}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable accessibilityRole="button" onPress={() => setTitleModalVisible(false)} style={styles.modalCancelButton}>
              <Text style={styles.modalCancelText}>{t("cancel")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  fieldError: {
    color: "#b91c1c",
    fontSize: 13,
    lineHeight: 18
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
  lookupButton: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: "#2563EB",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 46,
    width: 54
  },
  lookupButtonDisabled: {
    opacity: 0.65
  },
  lookupInput: {
    flex: 1
  },
  lookupRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
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
  modalBackdrop: {
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    flex: 1,
    justifyContent: "flex-end"
  },
  modalCancelButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#d7dde6",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: "center"
  },
  modalCancelText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "800"
  },
  modalPanel: {
    backgroundColor: "#f7f8fa",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    gap: 12,
    maxHeight: "82%",
    padding: 16
  },
  modalTitle: {
    color: "#111827",
    fontSize: 24,
    fontWeight: "900"
  },
  resultCover: {
    backgroundColor: "#e2e8f0",
    borderRadius: 6,
    height: 78,
    width: 52
  },
  resultList: {
    maxHeight: 420
  },
  resultListContent: {
    gap: 8
  },
  resultMeta: {
    color: "#64748b",
    fontSize: 13,
    lineHeight: 18
  },
  resultRow: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#d7dde6",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 92,
    padding: 10
  },
  resultTextBox: {
    flex: 1,
    gap: 3
  },
  resultTitle: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 21
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
