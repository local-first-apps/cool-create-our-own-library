import * as SQLite from "expo-sqlite";

import { Book, BookInput, SaveBookResult } from "../types/Book";
import { nowIso } from "../utils/date";
import { normalizeBookLanguage } from "../utils/bookLanguage";
import { cleanOptionalText, normalizeIsbn } from "../utils/isbn";

const DB_NAME = "biblioteca-domestica.db";
export const DEFAULT_LIBRARY_NAME = "Biblioteca principale";

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DB_NAME);
  }

  return databasePromise;
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Error && /unique|constraint/i.test(error.message);
}

async function ensureColumn(db: SQLite.SQLiteDatabase, table: string, column: string, definition: string): Promise<void> {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (columns.some((item) => item.name === column)) {
    return;
  }

  await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

async function saveLocationIfPresent(value?: string | null): Promise<void> {
  const name = cleanOptionalText(value);
  if (!name) {
    return;
  }

  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO locations (name, createdAt)
     VALUES (?, ?)
     ON CONFLICT(name) DO NOTHING`,
    name,
    nowIso()
  );
}

export async function initDatabase(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      isbn TEXT,
      title TEXT NOT NULL,
      authors TEXT,
      publisher TEXT,
      publishedYear TEXT,
      category TEXT,
      language TEXT,
      library TEXT,
      shelf TEXT,
      notes TEXT,
      synopsis TEXT,
      thumbnail TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_books_isbn_unique
      ON books(isbn)
      WHERE isbn IS NOT NULL AND isbn != '';

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS locations (
      name TEXT PRIMARY KEY NOT NULL,
      createdAt TEXT
    );
  `);

  await ensureColumn(db, "books", "library", "TEXT");
  await ensureColumn(db, "books", "synopsis", "TEXT");
  await ensureColumn(db, "books", "language", "TEXT");
  await db.execAsync(`
    UPDATE books SET language = 'IT' WHERE LOWER(language) IN ('it', 'ita', 'italiano', 'italian');
    UPDATE books SET language = 'EN' WHERE LOWER(language) IN ('en', 'eng', 'inglese', 'english');
    UPDATE books SET language = 'FR' WHERE LOWER(language) IN ('fr', 'fra', 'francese', 'french', 'francais');
    UPDATE books SET language = 'ES' WHERE LOWER(language) IN ('es', 'spagnolo', 'spanish', 'espanol', 'español');
    UPDATE books SET language = 'DE' WHERE LOWER(language) IN ('de', 'ger', 'deu', 'tedesco', 'german', 'deutsch');
  `);
  await db.runAsync(
    "UPDATE books SET library = ? WHERE library IS NULL OR library = ''",
    DEFAULT_LIBRARY_NAME
  );
  await db.runAsync(
    `INSERT OR IGNORE INTO locations (name, createdAt)
     SELECT DISTINCT shelf, ?
     FROM books
     WHERE shelf IS NOT NULL AND shelf != ''`,
    nowIso()
  );
}

export async function getBooks(library?: string | null): Promise<Book[]> {
  const db = await getDatabase();
  const selectedLibrary = cleanOptionalText(library);

  if (selectedLibrary) {
    return db.getAllAsync<Book>(
      `SELECT * FROM books
       WHERE COALESCE(library, ?) = ?
       ORDER BY title COLLATE NOCASE ASC, authors COLLATE NOCASE ASC`,
      DEFAULT_LIBRARY_NAME,
      selectedLibrary
    );
  }

  return db.getAllAsync<Book>(
    `SELECT * FROM books
     ORDER BY title COLLATE NOCASE ASC, authors COLLATE NOCASE ASC`
  );
}

export async function getLibraries(): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ library: string | null }>(
    `SELECT DISTINCT COALESCE(library, ?) AS library
     FROM books
     WHERE COALESCE(library, '') != ''
     ORDER BY library COLLATE NOCASE ASC`,
    DEFAULT_LIBRARY_NAME
  );
  const names = rows.map((row) => row.library).filter((value): value is string => Boolean(value));
  return names.includes(DEFAULT_LIBRARY_NAME) ? names : [DEFAULT_LIBRARY_NAME, ...names];
}

export async function renameLibrary(oldName: string, newName: string): Promise<string> {
  const from = cleanOptionalText(oldName) ?? DEFAULT_LIBRARY_NAME;
  const to = cleanOptionalText(newName) ?? DEFAULT_LIBRARY_NAME;
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE books SET library = ? WHERE COALESCE(library, ?) = ?",
    to,
    DEFAULT_LIBRARY_NAME,
    from
  );
  return to;
}

export async function getLocations(): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ name: string }>(
    "SELECT name FROM locations ORDER BY name COLLATE NOCASE ASC"
  );
  return rows.map((row) => row.name);
}

export async function getBookById(id: number): Promise<Book | null> {
  const db = await getDatabase();
  const book = await db.getFirstAsync<Book>("SELECT * FROM books WHERE id = ?", id);
  return book ?? null;
}

export async function getBookByIsbn(isbn: string): Promise<Book | null> {
  const db = await getDatabase();
  const normalized = normalizeIsbn(isbn);

  if (!normalized) {
    return null;
  }

  const book = await db.getFirstAsync<Book>("SELECT * FROM books WHERE isbn = ?", normalized);
  return book ?? null;
}

export async function saveBook(input: BookInput): Promise<SaveBookResult> {
  const title = input.title.trim();
  if (!title) {
    throw new Error("Il titolo e' obbligatorio.");
  }

  const isbn = cleanOptionalText(normalizeIsbn(input.isbn));
  if (isbn) {
    const existing = await getBookByIsbn(isbn);
    if (existing) {
      return { duplicate: true, book: existing };
    }
  }

  const db = await getDatabase();
  const timestamp = nowIso();
  const library = cleanOptionalText(input.library) ?? DEFAULT_LIBRARY_NAME;
  const shelf = cleanOptionalText(input.shelf);
  let result: SQLite.SQLiteRunResult;

  try {
    result = await db.runAsync(
      `INSERT INTO books (
        isbn, title, authors, publisher, publishedYear, category, language, library, shelf, notes,
        synopsis, thumbnail, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      isbn,
      title,
      cleanOptionalText(input.authors),
      cleanOptionalText(input.publisher),
      cleanOptionalText(input.publishedYear),
      cleanOptionalText(input.category),
      normalizeBookLanguage(input.language),
      library,
      shelf,
      cleanOptionalText(input.notes),
      cleanOptionalText(input.synopsis),
      cleanOptionalText(input.thumbnail),
      timestamp,
      timestamp
    );
  } catch (error) {
    if (isbn && isUniqueConstraintError(error)) {
      const duplicate = await getBookByIsbn(isbn);
      if (duplicate) {
        return { duplicate: true, book: duplicate };
      }
    }

    throw error;
  }

  const book = await getBookById(result.lastInsertRowId);
  if (!book) {
    throw new Error("Il libro e' stato salvato, ma non e' stato possibile rileggerlo.");
  }

  await saveLocationIfPresent(shelf);
  return { duplicate: false, book };
}

export async function updateBook(id: number, input: BookInput): Promise<Book> {
  const title = input.title.trim();
  if (!title) {
    throw new Error("Il titolo e' obbligatorio.");
  }

  const isbn = cleanOptionalText(normalizeIsbn(input.isbn));
  if (isbn) {
    const existing = await getBookByIsbn(isbn);
    if (existing && existing.id !== id) {
      throw new Error("Questo ISBN e' gia' presente nella biblioteca.");
    }
  }

  const db = await getDatabase();
  const shelf = cleanOptionalText(input.shelf);
  await db.runAsync(
    `UPDATE books SET
      isbn = ?,
      title = ?,
      authors = ?,
      publisher = ?,
      publishedYear = ?,
      category = ?,
      language = ?,
      library = ?,
      shelf = ?,
      notes = ?,
      synopsis = ?,
      thumbnail = ?,
      updatedAt = ?
     WHERE id = ?`,
    isbn,
    title,
    cleanOptionalText(input.authors),
    cleanOptionalText(input.publisher),
    cleanOptionalText(input.publishedYear),
    cleanOptionalText(input.category),
    normalizeBookLanguage(input.language),
    cleanOptionalText(input.library) ?? DEFAULT_LIBRARY_NAME,
    shelf,
    cleanOptionalText(input.notes),
    cleanOptionalText(input.synopsis),
    cleanOptionalText(input.thumbnail),
    nowIso(),
    id
  );

  const book = await getBookById(id);
  if (!book) {
    throw new Error("Libro non trovato dopo la modifica.");
  }

  await saveLocationIfPresent(shelf);
  return book;
}

export async function deleteBook(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM books WHERE id = ?", id);
}

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string | null }>("SELECT value FROM settings WHERE key = ?", key);
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO settings (key, value)
     VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    key,
    value
  );
}
