import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppButton } from "../components/AppButton";
import {
  DEFAULT_EXPORT_FIELD_KEYS,
  EXPORT_FIELDS,
  ExportFieldKey,
  exportBooks,
  ExportFormat
} from "../services/excelExport";
import { DEFAULT_LIBRARY_NAME, getBooks, renameLibrary } from "../services/db";
import { getSettings, getStoredActiveLibrary, saveActiveLibrary } from "../services/settings";
import { Book } from "../types/Book";
import { RootStackParamList } from "../types/Navigation";
import { compareAuthorsByLabel, formatAuthorLabel } from "../utils/authors";
import { filterBooks } from "../utils/bookFilters";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;
type YearPickerTarget = "from" | "to";
type MultiFilterKey = "authors" | "categories" | "languages" | "locations";
type ExportScope = "filtered" | "all";

function resultLabel(count: number, total: number): string {
  return `${count} ${count === 1 ? "risultato" : "risultati"} su ${total}`;
}

export function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [books, setBooks] = useState<Book[]>([]);
  const [activeLibrary, setActiveLibrary] = useState(DEFAULT_LIBRARY_NAME);
  const [setupLibraryInput, setSetupLibraryInput] = useState(DEFAULT_LIBRARY_NAME);
  const [setupVisible, setSetupVisible] = useState(false);
  const [multiFilter, setMultiFilter] = useState<MultiFilterKey | null>(null);
  const [yearPickerTarget, setYearPickerTarget] = useState<YearPickerTarget | null>(null);
  const [yearSelectionVisible, setYearSelectionVisible] = useState(false);
  const [exportVisible, setExportVisible] = useState(false);
  const [exportScope, setExportScope] = useState<ExportScope>("all");
  const [selectedExportFields, setSelectedExportFields] = useState<ExportFieldKey[]>(DEFAULT_EXPORT_FIELD_KEYS);
  const [exportFieldOrder, setExportFieldOrder] = useState<ExportFieldKey[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [yearFrom, setYearFrom] = useState<string | null>(null);
  const [yearTo, setYearTo] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deviceName, setDeviceName] = useState("Dispositivo non specificato");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [storedLibrary, settings] = await Promise.all([
        getStoredActiveLibrary(),
        getSettings()
      ]);
      const library = storedLibrary ?? DEFAULT_LIBRARY_NAME;
      setBooks(await getBooks(library));
      setActiveLibrary(library);
      setSetupLibraryInput(library);
      setSetupVisible(!storedLibrary);
      setDeviceName(settings.deviceName);
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

  const categories = useMemo(() => {
    const values = books.map((book) => book.category).filter((value): value is string => Boolean(value));
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
  }, [books]);

  const authors = useMemo(() => {
    const values = books.map((book) => book.authors).filter((value): value is string => Boolean(value));
    return Array.from(new Set(values)).sort(compareAuthorsByLabel);
  }, [books]);

  const years = useMemo(() => {
    const values = books.map((book) => book.publishedYear).filter((value): value is string => Boolean(value));
    return Array.from(new Set(values)).sort((a, b) => b.localeCompare(a));
  }, [books]);

  const languages = useMemo(() => {
    const values = books.map((book) => book.language).filter((value): value is string => Boolean(value));
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
  }, [books]);

  const positions = useMemo(() => {
    const values = books.map((book) => book.shelf).filter((value): value is string => Boolean(value));
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
  }, [books]);

  useEffect(() => {
    setSelectedAuthors((current) => current.filter((value) => authors.includes(value)));
    setSelectedCategories((current) => current.filter((value) => categories.includes(value)));
    setSelectedLanguages((current) => current.filter((value) => languages.includes(value)));
    setSelectedLocations((current) => current.filter((value) => positions.includes(value)));
    setSelectedYears((current) => current.filter((value) => years.includes(value)));
  }, [authors, categories, languages, positions, years]);

  useEffect(() => {
    setExportFieldOrder((current) => current.filter((value) => selectedExportFields.includes(value)));
  }, [selectedExportFields]);

  const filters = useMemo(
    () => ({
      search,
      selectedAuthors,
      selectedCategories,
      selectedLanguages,
      selectedLocations,
      selectedYears,
      yearFrom,
      yearTo
    }),
    [search, selectedAuthors, selectedCategories, selectedLanguages, selectedLocations, selectedYears, yearFrom, yearTo]
  );
  const visibleBooks = useMemo(() => filterBooks(books, filters), [books, filters]);
  const filtersActive = Boolean(
    search.trim() ||
      selectedAuthors.length ||
      selectedCategories.length ||
      selectedLanguages.length ||
      selectedLocations.length ||
      selectedYears.length ||
      yearFrom ||
      yearTo
  );

  async function saveInitialLibrary() {
    try {
      const library = await renameLibrary(DEFAULT_LIBRARY_NAME, setupLibraryInput);
      await saveActiveLibrary(library);
      setActiveLibrary(library);
      setSetupVisible(false);
      setBooks(await getBooks(library));
    } catch (err) {
      Alert.alert("Errore", err instanceof Error ? err.message : "Impossibile salvare il nome biblioteca.");
    }
  }

  function clearFilters() {
    setSearch("");
    setSelectedAuthors([]);
    setSelectedCategories([]);
    setSelectedLanguages([]);
    setSelectedLocations([]);
    setSelectedYears([]);
    setYearFrom(null);
    setYearTo(null);
  }

  function toggleInList<T extends string>(value: T, list: T[], setter: (next: T[]) => void) {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  function toggleYear(year: string) {
    toggleInList(year, selectedYears, setSelectedYears);
  }

  function selectYearForRange(year: string | null) {
    if (yearPickerTarget === "from") {
      setYearFrom(year);
    }
    if (yearPickerTarget === "to") {
      setYearTo(year);
    }
    setYearPickerTarget(null);
  }

  function openFilteredLibrary() {
    navigation.navigate("Library", filters);
  }

  function handleExport() {
    setExportScope(filtersActive ? "filtered" : "all");
    setExportVisible(true);
  }

  function toggleExportField(key: ExportFieldKey) {
    setSelectedExportFields((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  }

  function toggleExportFieldOrder(key: ExportFieldKey) {
    if (!selectedExportFields.includes(key)) {
      return;
    }

    setExportFieldOrder((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  }

  function selectedExportFieldsInOrder(): ExportFieldKey[] {
    const manual = exportFieldOrder.filter((key) => selectedExportFields.includes(key));
    const automatic = selectedExportFields.filter((key) => !manual.includes(key));
    return [...manual, ...automatic];
  }

  async function exportSelected(format: ExportFormat) {
    if (selectedExportFields.length === 0) {
      Alert.alert("Campi export", "Seleziona almeno un campo da esportare.");
      return;
    }

    try {
      setExporting(true);
      const booksToExport = exportScope === "filtered" ? visibleBooks : books;
      await exportBooks(booksToExport, deviceName, format, activeLibrary, selectedExportFieldsInOrder());
      setExportVisible(false);
    } catch (err) {
      Alert.alert("Errore esportazione", err instanceof Error ? err.message : "Impossibile esportare il file.");
    } finally {
      setExporting(false);
    }
  }

  const multiConfig = getMultiConfig();
  const allExportFieldsSelected = selectedExportFields.length === EXPORT_FIELDS.length;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(insets.bottom + 32, 64),
            paddingTop: Math.max(insets.top + 12, 38)
          }
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Image resizeMode="contain" source={require("../../assets/cool-home-logo.png")} style={styles.homeLogo} />
          <View style={styles.libraryRow}>
            <Text numberOfLines={1} style={styles.subtitle}>
              {activeLibrary}
            </Text>
            <Text style={styles.bookCount}>{books.length} libri</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <AppButton label="Scansiona libro" onPress={() => navigation.navigate("Scanner")} />
          <AppButton
            label="Aggiungi manualmente"
            onPress={() => navigation.navigate("ManualBook", { initialBook: { library: activeLibrary } })}
            variant="secondary"
          />
          <AppButton label="Visualizza biblioteca" onPress={() => navigation.navigate("Library")} variant="secondary" />
          <AppButton label="Esporta" onPress={handleExport} variant="secondary" disabled={exporting} />
          <AppButton label="Impostazioni" onPress={() => navigation.navigate("Settings")} variant="secondary" />
          <AppButton label="Istruzioni" onPress={() => navigation.navigate("Instructions")} variant="secondary" />
        </View>

        <View style={styles.filters}>
          <Text style={styles.sectionTitle}>Filtri</Text>
          <Text style={styles.counter}>{loading ? "Caricamento..." : resultLabel(visibleBooks.length, books.length)}</Text>
          <View style={styles.searchRow}>
            <TextInput
              autoCapitalize="none"
              onChangeText={setSearch}
              placeholder="Cerca..."
              placeholderTextColor="#8a94a6"
              style={styles.input}
              value={search}
            />
            <Pressable accessibilityRole="button" onPress={openFilteredLibrary} style={styles.iconButton}>
              <Text style={styles.iconButtonText}>{">"}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={clearFilters} style={[styles.iconButton, styles.clearButton]}>
              <Text style={styles.iconButtonText}>X</Text>
            </Pressable>
          </View>

          <View style={styles.filterGrid}>
            <FilterPickerButton count={selectedCategories.length} label="Categorie" onPress={() => setMultiFilter("categories")} />
            <FilterPickerButton count={selectedAuthors.length} label="Autori" onPress={() => setMultiFilter("authors")} />
            <FilterPickerButton count={selectedLanguages.length} label="Lingue" onPress={() => setMultiFilter("languages")} />
            <FilterPickerButton count={selectedLocations.length} label="Posizioni" onPress={() => setMultiFilter("locations")} />
          </View>

          <Text style={styles.filterLabel}>Anni</Text>
          <View style={styles.yearRangeRow}>
            <Pressable
              disabled={years.length === 0}
              onPress={() => setYearPickerTarget("from")}
              style={[styles.rangeButton, years.length === 0 && styles.rangeButtonDisabled]}
            >
              <Text style={[styles.rangeButtonText, years.length === 0 && styles.rangeButtonTextDisabled]}>
                Dal: {yearFrom ?? "-"}
              </Text>
            </Pressable>
            <Pressable
              disabled={years.length === 0}
              onPress={() => setYearPickerTarget("to")}
              style={[styles.rangeButton, years.length === 0 && styles.rangeButtonDisabled]}
            >
              <Text style={[styles.rangeButtonText, years.length === 0 && styles.rangeButtonTextDisabled]}>
                Al: {yearTo ?? "-"}
              </Text>
            </Pressable>
            <Pressable
              disabled={years.length === 0}
              onPress={() => setYearSelectionVisible(true)}
              style={[styles.rangeButtonWide, years.length === 0 && styles.rangeButtonDisabled]}
            >
              <Text style={[styles.rangeButtonText, years.length === 0 && styles.rangeButtonTextDisabled]}>
                {selectedYears.length > 0 ? `Anni (${selectedYears.length})` : "Seleziona"}
              </Text>
            </Pressable>
          </View>
        </View>

        {loading ? <ActivityIndicator style={styles.loader} /> : null}
      </ScrollView>

      <Modal animationType="slide" onRequestClose={() => setMultiFilter(null)} transparent visible={Boolean(multiFilter)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalPanel, { paddingBottom: Math.max(insets.bottom + 18, 34) }]}>
            <Text style={styles.modalTitle}>{multiConfig.title}</Text>
            <Text style={styles.counter}>{multiConfig.selected.length} selezionati</Text>
            <ScrollView style={styles.pickList}>
              {multiConfig.values.map((value) => (
                <Pressable
                  key={value}
                  onPress={() => multiConfig.toggle(value)}
                  style={[styles.pickRow, multiConfig.selected.includes(value) && styles.pickRowActive]}
                >
                  <Text style={[styles.pickRowText, multiConfig.selected.includes(value) && styles.pickRowTextActive]}>
                    {multiConfig.label(value)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <ModalActionButton label="Applica" onPress={() => setMultiFilter(null)} />
              <ModalActionButton label="Cancella" onPress={multiConfig.clear} variant="secondary" />
              <ModalActionButton label="Annulla" onPress={() => setMultiFilter(null)} variant="secondary" />
            </View>
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" onRequestClose={() => setYearPickerTarget(null)} transparent visible={Boolean(yearPickerTarget)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalPanel, { paddingBottom: Math.max(insets.bottom + 18, 34) }]}>
            <Text style={styles.modalTitle}>{yearPickerTarget === "from" ? "Anno iniziale" : "Anno finale"}</Text>
            <ScrollView style={styles.pickList}>
              <Pressable onPress={() => selectYearForRange(null)} style={styles.pickRow}>
                <Text style={styles.pickRowText}>Nessun limite</Text>
              </Pressable>
              {years.map((year) => (
                <Pressable key={year} onPress={() => selectYearForRange(year)} style={styles.pickRow}>
                  <Text style={styles.pickRowText}>{year}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <ModalActionButton label="Cancella" onPress={() => selectYearForRange(null)} variant="secondary" />
              <ModalActionButton label="Annulla" onPress={() => setYearPickerTarget(null)} variant="secondary" />
            </View>
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" onRequestClose={() => setYearSelectionVisible(false)} transparent visible={yearSelectionVisible}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalPanel, { paddingBottom: Math.max(insets.bottom + 18, 34) }]}>
            <Text style={styles.modalTitle}>Anni</Text>
            <Text style={styles.counter}>{selectedYears.length} selezionati</Text>
            <ScrollView style={styles.pickList}>
              {years.map((year) => (
                <Pressable
                  key={year}
                  onPress={() => toggleYear(year)}
                  style={[styles.pickRow, selectedYears.includes(year) && styles.pickRowActive]}
                >
                  <Text style={[styles.pickRowText, selectedYears.includes(year) && styles.pickRowTextActive]}>{year}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <ModalActionButton label="Applica" onPress={() => setYearSelectionVisible(false)} />
              <ModalActionButton label="Cancella" onPress={() => setSelectedYears([])} variant="secondary" />
              <ModalActionButton label="Annulla" onPress={() => setYearSelectionVisible(false)} variant="secondary" />
            </View>
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" onRequestClose={() => setExportVisible(false)} transparent visible={exportVisible}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalPanel, { paddingBottom: Math.max(insets.bottom + 18, 34) }]}>
            <Text style={styles.modalTitle}>Esporta</Text>
            <Text style={styles.counter}>Scegli i campi, l'ordine di restituzione e poi il formato.</Text>
            <Text style={styles.exportSummary}>
              {exportScope === "filtered" && filtersActive
                ? `Export: ${visibleBooks.length} ${visibleBooks.length === 1 ? "libro filtrato" : "libri filtrati"} su ${books.length}`
                : `Export: biblioteca completa, ${books.length} ${books.length === 1 ? "libro" : "libri"}`}
            </Text>
            <View style={styles.exportScopeRow}>
              <ExportScopeButton
                active={exportScope === "filtered"}
                disabled={!filtersActive}
                label="Risultati filtrati"
                onPress={() => setExportScope("filtered")}
              />
              <ExportScopeButton
                active={exportScope === "all"}
                label="Tutta la biblioteca"
                onPress={() => setExportScope("all")}
              />
            </View>
            <View style={styles.modalActions}>
              <ModalActionButton
                label={allExportFieldsSelected ? "Deseleziona tutti" : "Seleziona tutti"}
                onPress={() => {
                  setSelectedExportFields(allExportFieldsSelected ? [] : DEFAULT_EXPORT_FIELD_KEYS);
                  setExportFieldOrder([]);
                }}
                variant="secondary"
              />
              <ModalActionButton label="Annulla" onPress={() => setExportVisible(false)} variant="secondary" />
            </View>
            <ScrollView style={styles.exportFieldList}>
              {EXPORT_FIELDS.map((field) => {
                const active = selectedExportFields.includes(field.key);
                const orderIndex = exportFieldOrder.indexOf(field.key);
                return (
                  <View key={field.key} style={[styles.exportPickRow, active && styles.pickRowActive]}>
                    <Pressable onPress={() => toggleExportField(field.key)} style={styles.exportPickLabel}>
                      <Text style={[styles.pickRowText, active && styles.pickRowTextActive]}>{field.label}</Text>
                    </Pressable>
                    {active ? (
                      <Pressable onPress={() => toggleExportFieldOrder(field.key)} style={styles.orderButton}>
                        <Text style={styles.orderButtonText}>{orderIndex >= 0 ? String(orderIndex + 1) : "+"}</Text>
                      </Pressable>
                    ) : null}
                  </View>
                );
              })}
            </ScrollView>
            <Text style={styles.filterLabel}>Formato</Text>
            <View style={styles.exportFormatGrid}>
              <ModalActionButton label="CSV" onPress={() => void exportSelected("csv")} disabled={exporting} />
              <ModalActionButton label="Excel" onPress={() => void exportSelected("excel")} disabled={exporting} />
              <ModalActionButton label="Word" onPress={() => void exportSelected("word")} disabled={exporting} />
              <ModalActionButton label="PDF" onPress={() => void exportSelected("pdf")} disabled={exporting} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" onRequestClose={() => undefined} transparent visible={setupVisible}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalPanel, { paddingBottom: Math.max(insets.bottom + 18, 34) }]}>
            <Text style={styles.modalTitle}>Nome biblioteca</Text>
            <Text style={styles.setupText}>Scegli il nome della tua biblioteca. Potrai modificarlo in seguito dalle impostazioni.</Text>
            <TextInput
              autoCapitalize="sentences"
              onChangeText={setSetupLibraryInput}
              placeholder="Es. Biblioteca di casa"
              placeholderTextColor="#8a94a6"
              style={styles.inputFull}
              value={setupLibraryInput}
            />
            <View style={styles.modalActions}>
              <AppButton label="Salva" onPress={saveInitialLibrary} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  function getMultiConfig() {
    if (multiFilter === "authors") {
      return {
        clear: () => setSelectedAuthors([]),
        label: formatAuthorLabel,
        selected: selectedAuthors,
        title: "Autori",
        toggle: (value: string) => toggleInList(value, selectedAuthors, setSelectedAuthors),
        values: authors
      };
    }
    if (multiFilter === "languages") {
      return {
        clear: () => setSelectedLanguages([]),
        label: (value: string) => value,
        selected: selectedLanguages,
        title: "Lingue",
        toggle: (value: string) => toggleInList(value, selectedLanguages, setSelectedLanguages),
        values: languages
      };
    }
    if (multiFilter === "locations") {
      return {
        clear: () => setSelectedLocations([]),
        label: (value: string) => value,
        selected: selectedLocations,
        title: "Posizioni",
        toggle: (value: string) => toggleInList(value, selectedLocations, setSelectedLocations),
        values: positions
      };
    }
    return {
      clear: () => setSelectedCategories([]),
      label: (value: string) => value,
      selected: selectedCategories,
      title: "Categorie",
      toggle: (value: string) => toggleInList(value, selectedCategories, setSelectedCategories),
      values: categories
    };
  }
}

type FilterPickerButtonProps = {
  count: number;
  label: string;
  onPress: () => void;
};

function FilterPickerButton({ count, label, onPress }: FilterPickerButtonProps) {
  return (
    <Pressable onPress={onPress} style={[styles.filterButton, count > 0 && styles.filterButtonActive]}>
      <Text style={[styles.filterButtonText, count > 0 && styles.filterButtonTextActive]}>
        {label}
        {count > 0 ? ` (${count})` : ""}
      </Text>
    </Pressable>
  );
}

type ModalActionButtonProps = {
  disabled?: boolean;
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
};

function ModalActionButton({ disabled = false, label, onPress, variant = "primary" }: ModalActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.modalActionButton,
        variant === "secondary" && styles.modalActionButtonSecondary,
        disabled && styles.modalActionButtonDisabled
      ]}
    >
      <Text style={[styles.modalActionButtonText, variant === "secondary" && styles.modalActionButtonTextSecondary]}>
        {label}
      </Text>
    </Pressable>
  );
}

type ExportScopeButtonProps = {
  active: boolean;
  disabled?: boolean;
  label: string;
  onPress: () => void;
};

function ExportScopeButton({ active, disabled = false, label, onPress }: ExportScopeButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.exportScopeButton, active && styles.exportScopeButtonActive, disabled && styles.exportScopeButtonDisabled]}
    >
      <Text style={[styles.exportScopeButtonText, active && styles.exportScopeButtonTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 6,
    marginBottom: 8
  },
  bookCount: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 10
  },
  clearButton: {
    backgroundColor: "#334155"
  },
  container: {
    backgroundColor: "#f7f8fa",
    flex: 1
  },
  content: {
    padding: 14,
    paddingTop: 38
  },
  counter: {
    color: "#64748b",
    fontSize: 13,
    marginBottom: 6
  },
  filterButton: {
    backgroundColor: "#ffffff",
    borderColor: "#cbd5e1",
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: "48%",
    flexGrow: 1,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 9
  },
  filterButtonActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB"
  },
  filterButtonText: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center"
  },
  filterButtonTextActive: {
    color: "#ffffff"
  },
  filterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8
  },
  filterLabel: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 8
  },
  filters: {
    flex: 1
  },
  exportFieldList: {
    marginTop: 10,
    maxHeight: 260
  },
  exportFormatGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8
  },
  exportPickLabel: {
    flex: 1,
    justifyContent: "center",
    minHeight: 42
  },
  exportPickRow: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
    paddingLeft: 12,
    paddingRight: 8
  },
  exportScopeButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#cbd5e1",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 8
  },
  exportScopeButtonActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB"
  },
  exportScopeButtonDisabled: {
    opacity: 0.45
  },
  exportScopeButtonText: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center"
  },
  exportScopeButtonTextActive: {
    color: "#ffffff"
  },
  exportScopeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8
  },
  exportSummary: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4
  },
  header: {
    alignItems: "center",
    marginBottom: 10
  },
  homeLogo: {
    height: 72,
    marginBottom: 0,
    marginTop: 0,
    width: "100%"
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 40,
    width: 46
  },
  iconButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900"
  },
  input: {
    backgroundColor: "#ffffff",
    borderColor: "#cbd5e1",
    borderRadius: 8,
    borderWidth: 1,
    color: "#111827",
    flex: 1,
    fontSize: 15,
    minHeight: 40,
    paddingHorizontal: 12
  },
  inputFull: {
    backgroundColor: "#ffffff",
    borderColor: "#cbd5e1",
    borderRadius: 8,
    borderWidth: 1,
    color: "#111827",
    fontSize: 15,
    minHeight: 46,
    paddingHorizontal: 12
  },
  libraryRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 9,
    width: "100%"
  },
  loader: {
    marginTop: 8
  },
  modalActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14
  },
  modalActionButton: {
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 8,
    paddingVertical: 9
  },
  modalActionButtonDisabled: {
    opacity: 0.55
  },
  modalActionButtonSecondary: {
    backgroundColor: "#ffffff",
    borderColor: "#cbd5e1",
    borderWidth: 1
  },
  modalActionButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center"
  },
  modalActionButtonTextSecondary: {
    color: "#1f2937"
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
    marginBottom: 4
  },
  orderButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#cbd5e1",
    borderRadius: 8,
    borderWidth: 1,
    height: 30,
    justifyContent: "center",
    width: 36
  },
  orderButtonText: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "900"
  },
  pickList: {
    maxHeight: 360
  },
  pickRow: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 11
  },
  pickRowActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB"
  },
  pickRowText: {
    color: "#334155",
    fontSize: 15,
    fontWeight: "700"
  },
  pickRowTextActive: {
    color: "#ffffff"
  },
  rangeButton: {
    backgroundColor: "#ffffff",
    borderColor: "#cbd5e1",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: 10
  },
  rangeButtonWide: {
    backgroundColor: "#ffffff",
    borderColor: "#cbd5e1",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1.25,
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: 10
  },
  rangeButtonText: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "800"
  },
  rangeButtonDisabled: {
    opacity: 0.55
  },
  rangeButtonTextDisabled: {
    color: "#64748b"
  },
  searchRow: {
    flexDirection: "row",
    gap: 8
  },
  sectionTitle: {
    color: "#334155",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 2,
    textTransform: "uppercase"
  },
  setupText: {
    color: "#475569",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 14
  },
  subtitle: {
    color: "#2563EB",
    flex: 1,
    fontSize: 14,
    fontWeight: "800"
  },
  yearRangeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 5
  }
});
