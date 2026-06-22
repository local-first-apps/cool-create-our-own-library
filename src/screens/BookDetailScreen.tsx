import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppButton } from "../components/AppButton";
import { BookForm } from "../components/BookForm";
import { InfoRow } from "../components/InfoRow";
import { deleteBook, getBookById, updateBook } from "../services/db";
import { Book, BookInput } from "../types/Book";
import { RootStackParamList } from "../types/Navigation";
import { formatDateTime } from "../utils/date";

type Props = NativeStackScreenProps<RootStackParamList, "BookDetail">;

export function BookDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const loadBook = useCallback(async () => {
    try {
      setLoading(true);
      const found = await getBookById(route.params.id);
      if (!found) {
        Alert.alert("Libro non trovato", "Il libro non è più presente nella biblioteca.", [
          { text: "OK", onPress: () => navigation.goBack() }
        ]);
        return;
      }

      setBook(found);
    } catch (err) {
      Alert.alert("Errore database", err instanceof Error ? err.message : "Impossibile leggere il libro.");
    } finally {
      setLoading(false);
    }
  }, [navigation, route.params.id]);

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

    Alert.alert("Eliminare il libro?", "L'operazione non può essere annullata.", [
      { text: "Annulla", style: "cancel" },
      {
        text: "Elimina",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteBook(book.id);
            navigation.popToTop();
          } catch (err) {
            Alert.alert("Errore database", err instanceof Error ? err.message : "Impossibile eliminare il libro.");
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
        <Text style={styles.muted}>Libro non disponibile.</Text>
      </View>
    );
  }

  if (editing) {
    return (
      <BookForm
        initialValue={book}
        submitLabel="Salva modifiche"
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
        <InfoRow label="ISBN" value={book.isbn} />
        <InfoRow label="Autore/i" value={book.authors} />
        <InfoRow label="Editore" value={book.publisher} />
        <InfoRow label="Anno" value={book.publishedYear} />
        <InfoRow label="Categoria" value={book.category} />
        <InfoRow label="Lingua" value={book.language} />
        <InfoRow label="Scaffale/Stanza" value={book.shelf} />
        <InfoRow label="Note" value={book.notes} />
        <InfoRow label="Sinossi" value={book.synopsis} />
        <InfoRow label="Data inserimento" value={formatDateTime(book.createdAt)} />
        <InfoRow label="Ultima modifica" value={formatDateTime(book.updatedAt)} />
      </View>

      <View style={styles.actions}>
        <AppButton label="Modifica" onPress={() => setEditing(true)} />
        <AppButton label="Elimina" onPress={handleDelete} variant="danger" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 10
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
