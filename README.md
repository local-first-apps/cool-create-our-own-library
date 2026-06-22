# COOL - Create Our Own Library

App mobile per iOS e Android, realizzata con Expo, React Native e TypeScript, per catalogare libri personali tramite ISBN/EAN-13, archivio locale SQLite, filtri ed export.

## Stato del progetto

- Nome app: `COOL`.
- Nome esteso: `Create Our Own Library`.
- SDK Expo: `54`.
- Cartella operativa consigliata: `C:\COOL`.
- Nessun backend, Render, Firebase, Supabase, database remoto o sincronizzazione cloud.

## Caratteristiche principali

- Archivio SQLite locale su ogni telefono.
- Ogni telefono ha il proprio database.
- Scansione codici EAN-13 tramite `expo-camera` e `CameraView`.
- Recupero metadati da Google Books API tramite ISBN.
- Salvataggio di titolo, autori, editore, anno, categoria, lingua, copertina e sinossi quando disponibili.
- Inserimento manuale quando Google Books non restituisce dati o manca l'ISBN.
- Modifica ed eliminazione dei libri salvati.
- Posizioni di catalogazione riutilizzabili, ad esempio scaffale o stanza.
- Filtri per testo, autore, categoria, lingua, posizione e anno.
- Visualizzazione completa della biblioteca o vista filtrata.
- Nome dispositivo salvato localmente.
- Export CSV, Excel e Word.
- Export completo o limitato ai risultati filtrati.
- Selezione dei campi esportabili e ordine parziale delle colonne.
- ISBN esportato come testo in Excel.
- Pagina `Istruzioni`, `Privacy` e `Termini di servizio` integrati nell'app.

## Installazione dipendenze

Da `C:\COOL`:

```powershell
npm.cmd install
```

## Avvio con Expo Go

Imposta la chiave Google Books e avvia Expo:

```powershell
cd C:\COOL
$env:EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY="LA_TUA_CHIAVE"
npx.cmd expo start -c
```

Poi apri l'app con Expo Go su iOS o Android.

Finche' usi Expo Go, PowerShell deve restare aperto. Con una build stand-alone l'app funzionera' senza PC e senza Expo Go.

## Google Books API

L'app usa Google Books API solo per recuperare i metadati dei libri partendo dall'ISBN.

La chiave viene letta da:

```text
EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY
```

La chiave viene usata dal telefono per chiamare Google Books. Il database resta locale sul dispositivo.

## Permessi fotocamera

Il file `app.json` configura `expo-camera` con:

- messaggio di permesso fotocamera;
- `barcodeScannerEnabled: true`;
- `recordAudioAndroid: false`.

L'app chiede il permesso quando si apre la schermata `Scansiona libro`.

## Uso rapido

1. Alla prima apertura scegli il nome della biblioteca.
2. Usa `Scansiona libro` per leggere il codice ISBN/EAN-13.
3. Controlla i dati recuperati da Google Books.
4. Usa `Modifica dati` se vuoi correggere o completare la scheda prima del salvataggio.
5. Indica posizione, note o altri dati utili.
6. Usa `Aggiungi manualmente` se il libro non viene trovato.
7. Usa `Visualizza biblioteca` per l'elenco completo.
8. Usa i filtri in Home per creare una vista filtrata.
9. Usa `Esporta` per generare CSV, Excel o Word.
10. Usa `Impostazioni` per nome biblioteca, nome dispositivo, lingua, privacy e termini.
11. Usa `Istruzioni` per una guida sintetica dentro l'app.

## Export

Il pulsante `Esporta` permette di scegliere:

- risultati filtrati o biblioteca completa;
- campi da esportare;
- ordine parziale delle colonne;
- formato: CSV, Excel o Word.

I file usano il nome della biblioteca e data/ora di export.

Note:

- Excel viene generato in `.xlsx`.
- Word viene generato come `.docx`.
- Il PDF non e' previsto: si puo' ricavare facilmente da Excel o Word se necessario.

## Uso su piu' telefoni

L'app non sincronizza i dati tra dispositivi. Ogni telefono ha il proprio database SQLite locale.

Uso consigliato:

1. Scansiona una parte dei libri sul telefono 1.
2. Scansiona un'altra parte dei libri sul telefono 2.
3. Esporta un file da ogni telefono.
4. Unisci manualmente i file su PC/Mac.
5. Rimuovi duplicati usando l'ISBN come chiave principale.

Se manca l'ISBN, usa come chiave secondaria:

```text
Titolo + Autori + Anno
```

Il campo `Dispositivo` aiuta a capire da quale telefono proviene ogni riga.

## Build Android di prova

La prima build consigliata e' un APK di test, non ancora un file per Google Play.

Passaggi previsti:

```powershell
cd C:\COOL
npm.cmd install -g eas-cli
eas.cmd login
eas.cmd build:configure
eas.cmd build -p android --profile preview
```

Il profilo `preview` e' pensato per generare un APK installabile direttamente sul telefono.

La chiave Google Books dovra' essere configurata anche per EAS Build, ad esempio come variabile ambiente/segreto EAS.

## Note tecniche

- Database locale: `biblioteca-domestica.db`.
- Tabella principale: `books`.
- Duplicati ISBN bloccati sul singolo telefono.
- Libri senza ISBN possono essere salvati piu' volte.
- Posizioni riutilizzabili salvate in `locations`.
- Impostazioni locali salvate in `settings`.
- Biblioteca predefinita: `Biblioteca principale`.
- Nome dispositivo predefinito: `Dispositivo non specificato`.

## Roadmap

Le priorita' successive sono raccolte in `TODO.md`.
