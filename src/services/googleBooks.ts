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

function scoreTitleSearchItem(item: GoogleBooksItem): number {
  const info = item.volumeInfo;
  if (!info) {
    return -1;
  }

  let score = 0;
  score += info.title ? 12 : 0;
  score += info.subtitle ? 3 : 0;
  score += info.authors?.length ? 8 : 0;
  score += info.publisher ? 6 : 0;
  score += info.publishedDate ? 4 : 0;
  score += info.description ? 7 : item.searchInfo?.textSnippet ? 3 : 0;
  score += info.pageCount ? 3 : 0;
  score += info.categories?.length ? 2 : 0;
  score += info.language ? 2 : 0;
  score += info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail ? 2 : 0;
  score += itemIdentifiers(item).some((identifier) => isLikelyIsbn13(identifier)) ? 3 : 0;
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

function buildGoogleBooksUrl(query: string, maxResults = 10): string {
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", String(maxResults));

  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY;
  if (apiKey) {
    url.searchParams.set("key", apiKey);
  }

  return url.toString();
}

async function fetchGoogleBooks(query: string, maxResults = 10): Promise<GoogleBooksResponse> {
  let response: Response;
  try {
    response = await fetch(buildGoogleBooksUrl(query, maxResults));
  } catch {
    throw new Error("Connessione internet assente o non disponibile durante il recupero dei dati.");
  }

  if (response.status === 429 || response.status === 403) {
    throw new Error("Google Books ha rifiutato la richiesta per quota o API key mancante/non valida.");
  }

  if (!response.ok) {
    throw new Error("Errore durante il recupero dei dati da Google Books.");
  }

  try {
    return (await response.json()) as GoogleBooksResponse;
  } catch {
    throw new Error("Risposta non valida da Google Books.");
  }
}

function mapGoogleBooksItem(item: GoogleBooksItem, fallbackIsbn = ""): BookInput | null {
  const info = item.volumeInfo;
  if (!info) {
    return null;
  }

  const identifier =
    info.industryIdentifiers?.find((industryIdentifier) => industryIdentifier.type === "ISBN_13")?.identifier ??
    info.industryIdentifiers?.[0]?.identifier ??
    fallbackIsbn;
  const thumbnail = info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail ?? null;

  return {
    isbn: normalizeIsbn(identifier),
    title: info.title?.trim() || "Titolo non disponibile",
    subtitle: cleanGoogleText(info.subtitle),
    authors: info.authors?.join(", ") ?? null,
    publisher: cleanGoogleText(info.publisher),
    publishedYear: info.publishedDate?.slice(0, 4) ?? null,
    pageCount: info.pageCount ? String(info.pageCount) : null,
    category: info.categories?.[0] ?? null,
    language: normalizeBookLanguage(info.language),
    shelf: null,
    notes: null,
    synopsis: cleanGoogleText(info.description) ?? cleanGoogleText(item.searchInfo?.textSnippet),
    thumbnail: thumbnail ? thumbnail.replace(/^http:\/\//, "https://") : null
  };
}

export async function fetchBookByIsbn(rawIsbn: string): Promise<BookInput | null> {
  const isbn = normalizeIsbn(rawIsbn);
  if (!isLikelyIsbn13(isbn)) {
    throw new Error("Codice non riconosciuto come ISBN");
  }

  const data = await fetchGoogleBooks(`isbn:${isbn}`, 10);
  const firstItem = selectBestGoogleBooksItem(data.items, isbn);

  if (!firstItem || !data.totalItems || !data.items?.length) {
    return null;
  }

  return mapGoogleBooksItem(firstItem, isbn);
}

export async function searchBooksByTitle(title: string, maxResults = 5): Promise<BookInput[]> {
  const query = title.trim();
  if (!query) {
    return [];
  }

  const data = await fetchGoogleBooks(`intitle:${query}`, Math.max(maxResults, 5));
  const items = data.items ?? [];
  return [...items]
    .filter((item) => Boolean(item.volumeInfo?.title))
    .sort((left, right) => scoreTitleSearchItem(right) - scoreTitleSearchItem(left))
    .slice(0, maxResults)
    .map((item) => mapGoogleBooksItem(item))
    .filter((book): book is BookInput => Boolean(book));
}
