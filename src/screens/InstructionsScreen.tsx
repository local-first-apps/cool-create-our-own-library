import { ScrollView, StyleSheet, Text, View } from "react-native";

type InstructionSection = {
  body: string[];
  title: string;
};

const SECTIONS: InstructionSection[] = [
  {
    title: "A cosa serve",
    body: [
      "COOL cataloga i libri salvandoli nel database locale del telefono.",
      "Ogni telefono ha la propria biblioteca e puo' esportare i propri file."
    ]
  },
  {
    title: "Aggiungere libri",
    body: [
      "Usa Scansiona libro per leggere un ISBN con la fotocamera.",
      "Se Google Books trova dati utili, puoi controllarli, modificarli e salvarli.",
      "Usa Aggiungi manualmente quando il codice non esiste o i dati non sono disponibili."
    ]
  },
  {
    title: "Modificare e organizzare",
    body: [
      "Apri un libro dalla biblioteca per vedere i dettagli, modificarlo o eliminarlo.",
      "Scaffale/Stanza serve per indicare dove si trova il libro.",
      "Le posizioni gia' usate vengono proposte quando inserisci nuovi libri."
    ]
  },
  {
    title: "Cercare e filtrare",
    body: [
      "In Home puoi cercare per testo e filtrare per categoria, autore, lingua, posizione e anno.",
      "Visualizza biblioteca mostra sempre l'elenco completo.",
      "Il pulsante accanto alla ricerca apre la lista filtrata."
    ]
  },
  {
    title: "Esportare",
    body: [
      "Esporta genera file CSV, Excel, Word o PDF dai libri visibili.",
      "Puoi scegliere quali campi esportare e impostare un ordine parziale delle colonne.",
      "I record sono ordinati in base alla prima colonna esportata."
    ]
  },
  {
    title: "Dati e privacy",
    body: [
      "L'app non usa backend, cloud o database remoto.",
      "I dati restano sul telefono salvo export o condivisione avviata da te.",
      "Google Books viene contattato solo per recuperare informazioni da un ISBN."
    ]
  }
];

export function InstructionsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.intro}>Guida rapida al funzionamento dell'app.</Text>
      {SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.body.map((item) => (
            <Text key={item} style={styles.text}>
              {item}
            </Text>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 32
  },
  intro: {
    color: "#475569",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16
  },
  section: {
    marginBottom: 18
  },
  sectionTitle: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 6
  },
  text: {
    color: "#334155",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 5
  }
});
