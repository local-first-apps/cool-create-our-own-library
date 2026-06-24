import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pencil, Trash2, type LucideIcon } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BookForm } from "../components/BookForm";
import { InfoRow } from "../components/InfoRow";
import { useI18n } from "../i18n";
import { deleteBook, getBookById, updateBook } from "../services/db";
import { Book, BookInput } from "../types/Book";
import { RootStackParamList } from "../types/Navigation";
import { formatDateTime } from "../utils/date";

type Props = NativeStackScreenProps<RootStackParamList, "BookDetail">;

export function BookDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const loadBook = useCallback(async () => {
    try {
      setLoading(true);
      const found = await getBookById(route.params.id);
      if (!found) {
        Alert.alert(t("bookNotFound"), t("bookNotAvailable"), [
          { text: t("ok"), onPress: () => navigation.goBack() }
        ]);
        return;
      }

      setBook(found);
    } catch (err) {
      Alert.alert(t("error"), err instanceof Error ? err.message : t("localDatabaseError"));
    } finally {
      setLoading(false);
    }
  }, [navigation, route.params.id, t]);

  useFocusEffect(
    useCallback(() => {
      void loadBook();
    }, [loadBook])
  );

  async function handleUpdate(input: BookInput) {
    if (!book) {
      return;
    }

    const updated = await updateBook(book.id, input);
    setBook(updated);
    setEditing(false);
  }

  function handleDelete() {
    if (!book) {
      return;
    }

    Alert.alert(t("deleteBookTitle"), t("deleteBookBody"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteBook(book.id);
            navigation.popToTop();
          } catch (err) {
            Alert.alert(t("error"), err instanceof Error ? err.message : t("localDatabaseError"));
          }
        }
      }
    ]);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!book) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>{t("bookNotAvailable")}</Text>
      </View>
    );
  }

  if (editing) {
    return (
      <BookForm
        initialValue={book}
        submitLabel={t("save")}
        onCancel={() => setEditing(false)}
        onSubmit={handleUpdate}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 32, 72) }]}>
      {book.thumbnail ? <Image source={{ uri: book.thumbnail }} style={styles.cover} resizeMode="contain" /> : null}

      <View style={styles.panel}>
        <Text style={styles.title}>{book.title}</Text>
        {book.subtitle ? <Text style={styles.bookSubtitle}>{book.subtitle}</Text> : null}
        <InfoRow label="ISBN" value={book.isbn} />
        <InfoRow label={t("authors")} value={book.authors} />
        <InfoRow label={t("publisher")} value={book.publisher} />
        <InfoRow label={t("publishedYear")} value={book.publishedYear} />
        <InfoRow label={t("pageCount")} value={book.pageCount} />
        <InfoRow label={t("category")} value={book.category} />
        <InfoRow label={t("language")} value={book.language} />
        <InfoRow label={t("shelf")} value={book.shelf} />
        <InfoRow label={t("notes")} value={book.notes} />
        <InfoRow label={t("synopsis")} value={book.synopsis} />
        <InfoRow label={t("exportField_createdAt")} value={formatDateTime(book.createdAt)} />
        <InfoRow label={t("exportField_updatedAt")} value={formatDateTime(book.updatedAt)} />
      </View>

      <View style={styles.actions}>
        <DetailActionButton icon={Pencil} label={t("edit")} onPress={() => setEditing(true)} />
        <DetailActionButton danger icon={Trash2} label={t("delete")} onPress={handleDelete} />
      </View>
    </ScrollView>
  );
}

type DetailActionButtonProps = {
  danger?: boolean;
  icon: LucideIcon;
  label: string;
  onPress: () => void;
};

function DetailActionButton({ danger = false, icon: Icon, label, onPress }: DetailActionButtonProps) {
  const color = danger ? "#ffffff" : "#111827";
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.actionButton, danger && styles.actionButtonDanger]}>
      <Text numberOfLines={2} adjustsFontSizeToFit style={[styles.actionText, danger && styles.actionTextDanger]}>
        {label}
      </Text>
      <Icon color={color} size={27} strokeWidth={1.8} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: 8
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
    paddingHorizontal: 10,
    paddingVertical: 9
  },
  actionButtonDanger: {
    backgroundColor: "#dc2626",
    borderColor: "#dc2626"
  },
  actionText: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 17,
    minHeight: 34,
    textAlign: "center"
  },
  actionTextDanger: {
    color: "#ffffff"
  },
  centered: {
    alignItems: "center",
    backgroundColor: "#f7f8fa",
    flex: 1,
    justifyContent: "center",
    padding: 24
  },
  content: {
    backgroundColor: "#f7f8fa",
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
  bookSubtitle: {
    color: "#475569",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: -2
  },
  muted: {
    color: "#64748b",
    fontSize: 16
  },
  panel: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 14
  },
  title: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8
  }
});
