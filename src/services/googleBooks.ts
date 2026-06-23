import { BookInput } from "../types/Book";
import { normalizeBookLanguage } from "../utils/bookLanguage";
import { isLikelyIsbn13, normalizeIsbn } from "../utils/isbn";

type GoogleBooksResponse = {
  totalItems?: number;
  items?: GoogleBooksItem[];
};

type GoogleBooksItem = {
  volumeInfo?: {
    title?: string;
    subtitle?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    language?: string;
    pageCount?: number;
    categories?: string[];
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    industryIdentifiers?: Array<{
      type?: string;
      identifier?: string;
    }>;
  };
  searchInfo?: {
    textSnippet?: string;
  };
};

function cleanGoogleText(value?: string): string | null {
  const text = value
    ?.replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

  return text || null;
}

function itemIdentifiers(item: GoogleBooksItem): string[] {
  return (
    item.volumeInfo?.industryIdentifiers
      ?.map((identifier) => normalizeIsbn(identifier.identifier))
      .filter((identifier): identifier is string => Boolean(identifier)) ?? []
  );
}

function scoreGoogleBooksItem(item: GoogleBooksItem, requestedIsbn: string): number {
  const info = item.volumeInfo;
  if (!info) {
    return -1;
  }

  let score = itemIdentifiers(item).includes(requestedIsbn) ? 100 : 0;
  score += info.title ? 10 : 0;
  score += info.subtitle ? 3 : 0;
  score += info.authors?.length ? 8 : 0;
  score += info.publisher ? 7 : 0;
  score += info.publishedDate ? 5 : 0;
  score += info.description ? 9 : item.searchInfo?.textSnippet ? 4 : 0;
  score += info.pageCount ? 4 : 0;
  score += info.categories?.length ? 3 : 0;
  score += info.language ? 2 : 0;
  score += info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail ? 2 : 0;
  return score;
}

function selectBestGoogleBooksItem(items: GoogleBooksItem[] | undefined, requestedIsbn: string): GoogleBooksItem | null {
  if (!items?.length) {
    return null;
  }

  return [...items]
    .filter((item) => Boolean(item.volumeInfo))
    .sort((left, right) => scoreGoogleBooksItem(right, requestedIsbn) - scoreGoogleBooksItem(left, requestedIsbn))[0] ?? null;
}

function buildGoogleBooksUrl(isbn: string): string {
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set("q", `isbn:${isbn}`);

  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY;
  if (apiKey) {
    url.searchParams.set("key", apiKey);
  }

  return url.toString();
}

export async function fetchBookByIsbn(rawIsbn: string): Promise<BookInput | null> {
  const isbn = normalizeIsbn(rawIsbn);
  if (!isLikelyIsbn13(isbn)) {
    throw new Error("Codice non riconosciuto come ISBN");
  }

  let response: Response;
  try {
    response = await fetch(buildGoogleBooksUrl(isbn));
  } catch {
    throw new Error("Connessione internet assente o non disponibile durante il recupero dei dati.");
  }

  if (response.status === 429 || response.status === 403) {
    throw new Error("Google Books ha rifiutato la richiesta per quota o API key mancante/non valida.");
  }

  if (!response.ok) {
    throw new Error("Errore durante il recupero dei dati da Google Books.");
  }

  let data: GoogleBooksResponse;
  try {
    data = (await response.json()) as GoogleBooksResponse;
  } catch {
    throw new Error("Risposta non valida da Google Books.");
  }

  const firstItem = selectBestGoogleBooksItem(data.items, isbn);
  const first = firstItem?.volumeInfo;

  if (!first || !data.totalItems || !data.items?.length) {
    return null;
  }

  const identifier =
    first.industryIdentifiers?.find((item) => item.type === "ISBN_13")?.identifier ??
    first.industryIdentifiers?.[0]?.identifier ??
    isbn;

  const thumbnail = first.imageLinks?.thumbnail ?? first.imageLinks?.smallThumbnail ?? null;

  return {
    isbn: normalizeIsbn(identifier),
    title: first.title?.trim() || "Titolo non disponibile",
    subtitle: cleanGoogleText(first.subtitle),
    authors: first.authors?.join(", ") ?? null,
    publisher: cleanGoogleText(first.publisher),
    publishedYear: first.publishedDate?.slice(0, 4) ?? null,
    pageCount: first.pageCount ? String(first.pageCount) : null,
    category: first.categories?.[0] ?? null,
    language: normalizeBookLanguage(first.language),
    shelf: null,
    notes: null,
    synopsis: cleanGoogleText(first.description) ?? cleanGoogleText(firstItem?.searchInfo?.textSnippet),
    thumbnail: thumbnail ? thumbnail.replace(/^http:\/\//, "https://") : null
  };
}
