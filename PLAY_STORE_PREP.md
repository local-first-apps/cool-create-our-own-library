# COOL - Play Store Preparation

Last updated: 2026-06-27

## App Identity

- App name: COOL
- Full name: COOL | Create Our Own Library
- Package name: it.local.cool
- Developer public name: Local First Apps
- Developer country: Italy
- Public contact email: cool.library.app@gmail.com
- Category: Books & Reference
- Price: 0.99 EUR
- Target audience: General audience, not specifically for children
- Ads: No
- In-app purchases: No
- Accounts: No
- Backend/cloud database: No

## Store Listing - Italian

### Short Description

Catalogo locale per organizzare la tua biblioteca personale.

### Full Description

COOL - Create Our Own Library ti aiuta a catalogare i libri della tua biblioteca personale direttamente sul telefono.

Puoi aggiungere un libro scansionando il codice ISBN, cercando per ISBN o titolo, oppure inserendo i dati manualmente. Quando disponibili, COOL recupera informazioni bibliografiche da Google Books, come titolo, autori, editore, anno, lingua, descrizione e copertina.

Ogni telefono mantiene il proprio database locale SQLite. Non sono necessari account, backend, sincronizzazione cloud o database remoti. I dati restano sul dispositivo, salvo esportazioni o condivisioni avviate volontariamente dall'utente.

Funzioni principali:

- catalogo libri locale;
- scansione ISBN con fotocamera;
- ricerca manuale per ISBN o titolo;
- inserimento e modifica dei dati del libro;
- foto copertina opzionale;
- posizioni di catalogazione, come stanza o scaffale;
- filtri per titolo, autore, categoria, lingua, posizione e anno;
- esportazione in CSV, Excel e Word;
- colonna Dispositivo negli export, utile per unire file prodotti da telefoni diversi.

COOL e' pensata per chi vuole organizzare una biblioteca domestica o personale in modo semplice, locale e indipendente.

## Store Listing - English

### Short Description

A local catalog to organize your personal library.

### Full Description

COOL - Create Our Own Library helps you catalog the books in your personal library directly on your phone.

You can add a book by scanning its ISBN barcode, searching by ISBN or title, or entering the data manually. When available, COOL retrieves bibliographic information from Google Books, including title, authors, publisher, year, language, description and cover image.

Each phone keeps its own local SQLite database. No account, backend, cloud sync or remote database is required. Data stays on the device unless the user chooses to export or share it.

Main features:

- local book catalog;
- ISBN barcode scanning with the camera;
- manual search by ISBN or title;
- book data editing;
- optional cover photo;
- shelf/room cataloging positions;
- filters by title, author, category, language, location and year;
- export to CSV, Excel and Word;
- Device column in exports, useful when merging files produced by different phones.

COOL is designed for people who want a simple, local and independent way to organize a home or personal library.

## Data Safety Draft

Recommended conservative declaration for Google Play Data safety.

### Data Collected Or Shared

COOL does not create accounts and does not send the local library database to Local First Apps servers. The app has no backend, no cloud synchronization, no advertising SDK and no analytics SDK.

However, when the user chooses to search a book through Google Books, the app sends the searched ISBN or title to the Google Books API. This should be declared conservatively as:

- Data type: App activity / In-app search history
- Collected/shared: Yes, with a third-party service, only for book lookup
- Required: No
- Purpose: App functionality
- Encrypted in transit: Yes, HTTPS

### Data Not Collected By The Developer

- Book catalog data saved in SQLite remains local.
- Device name entered in Settings remains local and is used only in exports.
- Cover photos taken by the user remain local.
- CSV, Excel and Word exports are created locally and shared only when the user chooses to share them.

### Data Deletion

Users can delete individual books in the app. Users can remove all local app data by uninstalling the app or clearing app data from the operating system settings.

## Privacy Policy Publication

Preferred free hosting: GitHub Pages.

Prepared files:

- docs/index.html
- docs/privacy.html
- docs/terms.html
- docs/styles.css
- docs/.nojekyll

Expected privacy policy URL after GitHub Pages setup:

https://<github-user>.github.io/<repository-name>/privacy.html

Replace the placeholder after the GitHub repository is created.

## Content Rating Notes

Expected answers:

- Not specifically designed for children
- No user-generated public content
- No violence
- No sexual content
- No gambling
- No alcohol/tobacco/drugs promotion
- No financial transactions inside the app, except paid app purchase handled by Google Play
- Uses camera only for ISBN barcode scanning and optional cover photo

Final rating must be completed through the Google Play Console questionnaire.

## Screenshots Checklist

Suggested Android phone screenshots:

1. Home with main actions and filters.
2. Scan ISBN screen.
3. Book detail screen with cover and metadata.
4. Library list with saved books.
5. Export modal.
6. Settings or Instructions screen.

Recommended Play assets:

- App icon: 512 x 512 PNG
- Feature graphic: 1024 x 500 PNG
- Phone screenshots: at least 4 portrait screenshots recommended

## AAB / Test Track

For Google Play, use an Android App Bundle, not the internal APK used for quick testing.

Expected EAS command when ready:

```powershell
eas build -p android --profile production
```

Then upload the generated `.aab` to a Google Play test track before production release.

## Pending Before Final Store Submission

- Create GitHub repository or connect existing repository.
- Enable GitHub Pages from `/docs`.
- Replace privacy URL placeholder in Play Console.
- Add final Google Play listing URL for the Feedback button in COOL.
- Confirm final AAB version code before upload.
