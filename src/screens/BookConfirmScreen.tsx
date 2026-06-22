import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppButton } from "../components/AppButton";
import { BookForm } from "../components/BookForm";
import { InfoRow } from "../components/InfoRow";
import { DEFAULT_LIBRARY_NAME, getLocations, saveBook } from "../services/db";
import { getActiveLibrary } from "../services/settings";
import { BookInput } from "../types/Book";
import { RootStackParamList } from "../types/Navigation";

type Props = NativeStackScreenProps<RootStackParamList, "BookConfirm">;

export function BookConfirmScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const [book, setBook] = useState<BookInput>(route.params.book);
  const [library, setLibrary] = useState(book.library ?? DEFAULT_LIBRARY_NAME);
  const [shelf, setShelf] = useState(book.shelf ?? "");
  const [notes, setNotes] = useState(book.notes ?? "");
  const [locations, setLocations] = useState<string[]>([]);
  const [editingData, setEditingData] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getActiveLibrary()
      .then((activeLibrary) => {
        if (!book.library) {
          setLibrary(activeLibrary);
          setBook((current) => ({ ...current, library: activeLibrary }));
        }
      })
      .catch(() => undefined);
    getLocations()
      .then(setLocations)
      .catch(() => setLocations([]));
  }, [book.library]);

  async function handleSave() {
    try {
      setSaving(true);
      const result = await saveBook({ ...book, library, shelf, notes });
      if (result.duplicate) {
        Alert.alert("Duplicato", "Questo libro e' gia' presente nella biblioteca.", [
          { text: "Torna all'elenco", onPress: () => navigation.popToTop() }
        ]);
        return;
      }

      Alert.alert("Libro salvato", "Il libro e' stato aggiunto alla biblioteca.", [
        { text: "OK", onPress: () => navigation.popToTop() }
      ]);
    } catch (err) {
      Alert.alert("Errore database", err instanceof Error ? err.message : "Impossibile salvare il libro.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateData(updatedBook: BookInput) {
    setBook({ ...updatedBook, library });
    setShelf(updatedBook.shelf ?? shelf);
    setNotes(updatedBook.notes ?? notes);
    setEditingData(false);
  }

  if (editingData) {
    return (
      <BookForm
        initialValue={{ ...book, library, shelf, notes }}
        submitLabel="Aggiorna dati"
        onCancel={() => setEditingData(false)}
        onSubmit={handleUpdateData}
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
        <InfoRow label="Sinossi" value={book.synopsis} />
      </View>

      <AppButton label="Modifica dati" onPress={() => setEditingData(true)} variant="secondary" />

      <View style={styles.field}>
        <Text style={styles.label}>Scaffale/Stanza</Text>
        <TextInput
          onChangeText={setShelf}
          placeholder="Es. Salotto, studio, scaffale A"
          placeholderTextColor="#8a94a6"
          style={styles.input}
          value={shelf}
        />
        {locations.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestions}>
            {locations.map((location) => (
              <Pressable key={location} onPress={() => setShelf(location)} style={styles.suggestion}>
                <Text style={styles.suggestionText}>{location}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Note</Text>
        <TextInput
          multiline
          onChangeText={setNotes}
          placeholder="Note personali"
          placeholderTextColor="#8a94a6"
          style={[styles.input, styles.notes]}
          value={notes}
        />
      </View>

      <View style={styles.actions}>
        <AppButton label="Salva libro" onPress={handleSave} disabled={saving} />
        <AppButton label="Annulla" onPress={() => navigation.popToTop()} variant="secondary" disabled={saving} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 10
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
  notes: {
    minHeight: 96,
    textAlignVertical: "top"
  },
  panel: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 14
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
  suggestions: {
    marginTop: 2
  },
  suggestionText: {
    color: "#0f5f59",
    fontSize: 13,
    fontWeight: "700"
  },
  title: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8
  }
});
