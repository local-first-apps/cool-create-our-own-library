import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppLanguage, useI18n } from "../i18n";

type InstructionSection = {
  body: string[];
  title: string;
};

const SECTIONS: Record<AppLanguage, InstructionSection[]> = {
  IT: [
    {
      title: "A cosa serve",
      body: [
        "COOL cataloga i libri salvandoli nel database locale del telefono.",
        "Ogni telefono ha la propria biblioteca e può esportare i propri file."
      ]
    },
    {
      title: "Aggiungere libri",
      body: [
        "Usa \"Scansiona libro\" per leggere un ISBN con la fotocamera.",
        "La scansione funziona meglio con buona illuminazione. Tieni il codice a barre ben visibile e fermo.",
        "Se Google Books trova dati utili, puoi controllarli, modificarli e salvarli.",
        "Usa \"Aggiungi manualmente\" quando il codice non esiste o i dati non sono disponibili."
      ]
    },
    {
      title: "Modificare e organizzare",
      body: [
        "Apri un libro dalla biblioteca per vedere i dettagli, modificarlo o eliminarlo.",
        "Scaffale/Stanza serve per indicare dove si trova il libro.",
        "Le posizioni già usate vengono proposte quando inserisci nuovi libri."
      ]
    },
    {
      title: "Cercare e filtrare",
      body: [
        "In Home puoi cercare per testo e filtrare per categoria, autore, lingua, posizione e anno.",
        "\"Visualizza biblioteca\" mostra sempre l'elenco completo.",
        "Il pulsante accanto alla ricerca apre la lista filtrata."
      ]
    },
    {
      title: "Esportare",
      body: [
        "\"Esporta\" genera file CSV, Excel o Word.",
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
  ],
  EN: [
    {
      title: "Purpose",
      body: [
        "COOL catalogs books by saving them in the local database on the phone.",
        "Each phone has its own library and can export its own files."
      ]
    },
    {
      title: "Adding books",
      body: [
        "Use \"Scan book\" to read an ISBN with the camera.",
        "Scanning works best with good lighting. Keep the barcode clearly visible and steady.",
        "If Google Books returns useful data, you can review, edit and save it.",
        "Use \"Add manually\" when the code does not exist or data is not available."
      ]
    },
    {
      title: "Editing and organizing",
      body: [
        "Open a book from the library to view details, edit it or delete it.",
        "Shelf/Room indicates where the book is located.",
        "Previously used locations are suggested when you add new books."
      ]
    },
    {
      title: "Searching and filtering",
      body: [
        "On Home you can search by text and filter by category, author, language, location and year.",
        "\"View library\" always shows the full list.",
        "The button next to search opens the filtered list."
      ]
    },
    {
      title: "Exporting",
      body: [
        "\"Export\" creates CSV, Excel or Word files.",
        "You can choose which fields to export and set a partial column order.",
        "Records are sorted by the first exported column."
      ]
    },
    {
      title: "Data and privacy",
      body: [
        "The app does not use a backend, cloud or remote database.",
        "Data stays on the phone unless you export or share it.",
        "Google Books is contacted only to retrieve information from an ISBN."
      ]
    }
  ],
  FR: [
    { title: "Usage", body: ["COOL catalogue les livres dans la base locale du téléphone.", "Chaque téléphone a sa propre bibliothèque et peut exporter ses fichiers."] },
    { title: "Ajouter des livres", body: ["Utilisez \"Scanner un livre\" pour lire un ISBN avec la caméra.", "La lecture marche mieux avec une bonne lumière. Gardez le code-barres visible et immobile.", "Si Google Books trouve des données, vous pouvez les vérifier, les modifier et les enregistrer.", "Utilisez \"Ajouter manuellement\" si le code n'existe pas ou si les données sont indisponibles."] },
    { title: "Modifier et organiser", body: ["Ouvrez un livre pour voir les détails, le modifier ou le supprimer.", "\"Étagère/Pièce\" indique où se trouve le livre.", "Les emplacements déjà utilisés sont proposés lors de nouveaux ajouts."] },
    { title: "Rechercher et filtrer", body: ["Dans Home, recherchez par texte et filtrez par catégorie, auteur, langue, emplacement et année.", "\"Voir bibliothèque\" affiche toujours la liste complète.", "Le bouton près de la recherche ouvre la liste filtrée."] },
    { title: "Exporter", body: ["\"Exporter\" crée des fichiers CSV, Excel ou Word.", "Vous pouvez choisir les champs et définir un ordre partiel des colonnes.", "Les lignes sont triées selon la première colonne exportée."] },
    { title: "Données et confidentialité", body: ["L'app n'utilise pas de backend, cloud ou base distante.", "Les données restent sur le téléphone sauf export ou partage.", "Google Books est contacté seulement pour récupérer des informations depuis un ISBN."] }
  ],
  ES: [
    { title: "Para qué sirve", body: ["COOL cataloga libros guardándolos en la base local del teléfono.", "Cada teléfono tiene su propia biblioteca y puede exportar sus archivos."] },
    { title: "Añadir libros", body: ["Usa \"Escanear libro\" para leer un ISBN con la cámara.", "La lectura funciona mejor con buena iluminación. Mantén el código de barras visible y quieto.", "Si Google Books encuentra datos, puedes revisarlos, modificarlos y guardarlos.", "Usa \"Añadir manualmente\" cuando el código no exista o no haya datos."] },
    { title: "Modificar y organizar", body: ["Abre un libro para ver detalles, modificarlo o eliminarlo.", "\"Estante/Sala\" indica dónde está el libro.", "Las ubicaciones ya usadas se proponen al añadir nuevos libros."] },
    { title: "Buscar y filtrar", body: ["En Home puedes buscar por texto y filtrar por categoría, autor, idioma, ubicación y año.", "\"Ver biblioteca\" muestra siempre la lista completa.", "El botón junto a la búsqueda abre la lista filtrada."] },
    { title: "Exportar", body: ["\"Exportar\" genera archivos CSV, Excel o Word.", "Puedes elegir los campos y definir un orden parcial de columnas.", "Los registros se ordenan por la primera columna exportada."] },
    { title: "Datos y privacidad", body: ["La app no usa backend, nube ni base remota.", "Los datos quedan en el teléfono salvo exportación o uso compartido.", "Google Books se contacta solo para recuperar información desde un ISBN."] }
  ],
  DE: [
    { title: "Zweck", body: ["COOL katalogisiert Bücher in der lokalen Datenbank des Telefons.", "Jedes Telefon hat seine eigene Bibliothek und kann eigene Dateien exportieren."] },
    { title: "Bücher hinzufügen", body: ["Mit \"Buch scannen\" liest du eine ISBN mit der Kamera.", "Der Scan funktioniert am besten bei guter Beleuchtung. Halte den Barcode gut sichtbar und ruhig.", "Wenn Google Books Daten findet, kannst du sie prüfen, bearbeiten und speichern.", "Nutze \"Manuell hinzufügen\", wenn der Code nicht existiert oder keine Daten verfügbar sind."] },
    { title: "Bearbeiten und organisieren", body: ["Öffne ein Buch, um Details zu sehen, es zu bearbeiten oder zu löschen.", "\"Regal/Raum\" gibt an, wo sich das Buch befindet.", "Bereits verwendete Standorte werden bei neuen Büchern vorgeschlagen."] },
    { title: "Suchen und filtern", body: ["Auf Home kannst du nach Text suchen und nach Kategorie, Autor, Sprache, Standort und Jahr filtern.", "\"Bibliothek ansehen\" zeigt immer die vollständige Liste.", "Der Button neben der Suche öffnet die gefilterte Liste."] },
    { title: "Exportieren", body: ["\"Exportieren\" erzeugt CSV-, Excel- oder Word-Dateien.", "Du kannst Felder auswählen und eine teilweise Spaltenreihenfolge festlegen.", "Datensätze werden nach der ersten exportierten Spalte sortiert."] },
    { title: "Daten und Datenschutz", body: ["Die App nutzt kein Backend, keine Cloud und keine entfernte Datenbank.", "Daten bleiben auf dem Telefon, außer du exportierst oder teilst sie.", "Google Books wird nur kontaktiert, um Informationen aus einer ISBN abzurufen."] }
  ]
};

export function InstructionsScreen() {
  const { language, t } = useI18n();
  const sections = SECTIONS[language] ?? SECTIONS.IT;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.intro}>{t("instructionsIntro")}</Text>
      {sections.map((section) => (
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

