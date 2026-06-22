import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppButton } from "../components/AppButton";
import { EmptyState } from "../components/EmptyState";
import { DEFAULT_LIBRARY_NAME, getBooks } from "../services/db";
import { getActiveLibrary } from "../services/settings";
import { Book } from "../types/Book";
import { RootStackParamList } from "../types/Navigation";
import { BookFilterParams, filterBooks } from "../utils/bookFilters";

type Props = NativeStackScreenProps<RootStackParamList, "Library">;

export function LibraryScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const [books, setBooks] = useState<Book[]>([]);
  const [filters, setFilters] = useState<BookFilterParams>(route.params ?? {});
  const [activeLibrary, setActiveLibrary] = useState(DEFAULT_LIBRARY_NAME);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const library = await getActiveLibrary();
      setActiveLibrary(library);
      setBooks(await getBooks(library));
    } catch (err) {
      Alert.alert("Errore database", err instanceof Error ? err.message : "Impossibile leggere la biblioteca locale.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  const visibleBooks = useMemo(() => filterBooks(books, filters), [books, filters]);
  const filtersActive = Boolean(
    filters.search?.trim() ||
      filters.selectedAuthors?.length ||
      filters.selectedCategories?.length ||
      filters.selectedLanguages?.length ||
      filters.selectedLocations?.length ||
      filters.selectedYears?.length ||
      filters.yearFrom ||
      filters.yearTo
  );

  function clearFilters() {
    setFilters({});
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{activeLibrary}</Text>
      <Text style={styles.subtitle}>
        {visibleBooks.length} di {books.length} libri
      </Text>

      {filtersActive ? (
        <View style={styles.filterBox}>
          <Text style={styles.filterText}>Vista filtrata</Text>
          <AppButton label="Cancella filtri" onPress={clearFilters} variant="secondary" />
        </View>
      ) : null}
      <View style={styles.homeAction}>
        <AppButton label="Torna alla Home" onPress={() => navigation.goBack()} variant="secondary" />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} />
      ) : (
        <FlatList
          data={visibleBooks}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={<EmptyState message="Nessun libro trovato." />}
          contentContainerStyle={[
            visibleBooks.length === 0 ? styles.emptyList : styles.list,
            { paddingBottom: Math.max(insets.bottom + 32, 72) }
          ]}
          renderItem={({ item }) => (
            <Pressable onPress={() => navigation.navigate("BookDetail", { id: item.id })} style={styles.bookItem}>
              <Text style={styles.bookTitle}>{item.title}</Text>
              <Text style={styles.bookMeta}>{item.authors || "Autore non indicato"}</Text>
              <View style={styles.bookFooter}>
                <Text style={styles.bookSmall}>{item.publishedYear || "Anno n/d"}</Text>
                {item.shelf ? <Text style={styles.bookSmall}>{item.shelf}</Text> : null}
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bookFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8
  },
  bookItem: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 8,
    borderWidth: 1,
    padding: 14
  },
  bookMeta: {
    color: "#475569",
    fontSize: 14,
    marginTop: 4
  },
  bookSmall: {
    color: "#64748b",
    fontSize: 13
  },
  bookTitle: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "700"
  },
  container: {
    backgroundColor: "#f7f8fa",
    flex: 1,
    padding: 16
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center"
  },
  filterBox: {
    gap: 8,
    marginBottom: 12
  },
  filterText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "700"
  },
  homeAction: {
    marginBottom: 12
  },
  list: {
    gap: 10
  },
  loader: {
    marginTop: 32
  },
  subtitle: {
    color: "#64748b",
    fontSize: 15,
    marginBottom: 14,
    marginTop: 4
  },
  title: {
    color: "#111827",
    fontSize: 24,
    fontWeight: "900"
  }
});
