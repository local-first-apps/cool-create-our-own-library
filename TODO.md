# COOL Roadmap

Nome app previsto: **COOL - Create Our Own Library**.

## Obiettivo

Mantenere l'app semplice, locale e senza backend:

- database SQLite locale su ogni telefono;
- export Excel locale;
- nessuna sincronizzazione cloud;
- nessun Render, Firebase, Supabase o database remoto;
- Google Books API solo per recuperare metadati da ISBN.

## Priorita prima della build stand-alone

Queste modifiche conviene farle prima di produrre una build installabile, perche' toccano struttura dati, navigazione o identita' dell'app.

1. **Rinominare l'app in COOL** - FATTO
   - Nome visibile: `COOL`.
   - Nome esteso: `Create Our Own Library`.
   - Aggiornare `app.json`, titoli schermate, README e testi principali.

2. **Logo, icona app e splash screen** - PRIMA VERSIONE FATTA
   - Stile: attinente ai libri, ma moderno e "cool".
   - Idee: monogramma `COOL`, scaffale stilizzato, libro aperto, barcode/ISBN integrato in modo discreto.
   - Preparare asset per Android e iOS prima della build.

3. **Modello dati per piu' biblioteche** - PRIMA VERSIONE FATTA
   - Creare piu' liste/biblioteche distinte, ad esempio `Casa`, `Ufficio`, `Bambini`, `Prestati`.
   - Ogni libro appartiene a una biblioteca.
   - La Home deve permettere di scegliere la biblioteca attiva.
   - Export Excel con colonna `Biblioteca`.

4. **Posizioni di catalogazione riutilizzabili** - PRIMA VERSIONE FATTA
   - Gestire un elenco locale di posizioni, ad esempio `Studio - Scaffale A`, `Soggiorno`, `Camera`.
   - Nel form libro scegliere la posizione da menu invece di riscriverla.
   - Consentire comunque testo libero o creazione rapida di una nuova posizione.

5. **Sinossi da Google Books** - FATTO
   - Salvare la descrizione/sinossi quando Google Books la restituisce.
   - Mostrarla nel dettaglio libro.
   - Lasciarla modificabile o cancellabile manualmente.

6. **Filtri e ricerca in app** - PRIMA VERSIONE FATTA
   - Ricerca libera per titolo, autore, ISBN, editore e note.
   - Filtro per biblioteca/lista.
   - Filtro per posizione.
   - Filtro per autore.
   - Filtro per categoria.
   - Filtro per anno o intervallo anni.
   - Filtro per lingua, quando disponibile.
   - Filtro per libri senza posizione.
   - Filtro per libri inseriti di recente.
   - Ordinamenti: titolo, autore, anno, data inserimento, posizione.

7. **Lingua interfaccia**
   - Lingue: IT, EN, FR, ES, DE.
   - Selettore nelle impostazioni.
   - Prima tradurre l'interfaccia stabile, poi aggiungere nuove schermate.

8. **Import Excel con rimozione doppioni** - ABBANDONATO
   - Evolutiva rimossa dalla prima roadmap.
   - L'unione dei file prodotti da telefoni diversi resta un'operazione manuale fuori dall'app.

9. **Revisione export**
   - Rivedere struttura e leggibilita' di CSV, Excel e Word.
   - Valutare export completo e export filtrato come azioni distinte.
   - Verificare intestazioni, ordinamento colonne e nome file.
   - Word in formato `.docx` reale.
   - PDF rimosso: si puo' ricavare facilmente da Excel o Word.

## Dopo la build stand-alone di prova

1. **Build Android installabile**
   - Generare APK/AAB di test.
   - Verificare fotocamera, SQLite, export, sharing e Google Books con API key.

2. **Build iOS**
   - Richiede account Apple Developer per distribuzione reale.
   - Testare su iPhone fisico.

3. **Preparazione store**
   - Privacy policy.
   - Screenshot.
   - Descrizione app.
   - Icona definitiva.
   - Versionamento.
   - Controllo quote e restrizioni della Google Books API key.

## Note commerciali

La commercializzazione e' fattibile, ma va affrontata dopo avere stabilizzato:

- nome e brand COOL;
- modello dati;
- export;
- privacy policy;
- gestione API key Google Books;
- build firmate Android/iOS.
