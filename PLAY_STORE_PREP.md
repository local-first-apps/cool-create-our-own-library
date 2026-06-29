# COOL - Play Store Preparation

Last updated: 2026-06-29

## App Identity

- App name: COOL
- Full name: COOL | Create Our Own Library
- Package name: it.local.cool
- Developer public name: Local First Apps
- Developer country: Italy
- Public contact email: cool.library.app@gmail.com
- Category: Books & Reference
- Price: 0.49 EUR
- Target audience: General audience, not specifically for children
- Ads: No
- In-app purchases: No
- Subscriptions: No
- Accounts: No
- Backend/cloud database: No

## Store Listing - English

### Short Description

A smart local catalog for people who love their books.

### Full Description

Your books deserve more than a shelf. COOL helps you turn your personal library into a clean, searchable catalog that stays on your phone.

COOL is a one-time purchase: no ads, no in-app purchases and no subscriptions.

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

COOL is designed for readers, collectors and home libraries that want a simple, private and independent way to keep books organized.

Launch positioning:

- introductory price: 0.49 EUR;
- one-time purchase;
- no ads;
- no in-app purchases;
- no subscriptions.

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

Current published legal URLs:

- Privacy Policy: https://local-first-apps.github.io/cool-create-our-own-library/privacy.html
- Terms of Service: https://local-first-apps.github.io/cool-create-our-own-library/terms.html

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
