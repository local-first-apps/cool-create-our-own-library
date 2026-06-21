import { BookInput } from "../types/Book";
import { normalizeBookLanguage } from "../utils/bookLanguage";
import { isLikelyIsbn13, normalizeIsbn } from "../utils/isbn";

type GoogleBooksResponse = {
  totalItems?: number;
  items?: Array<{
    volumeInfo?: {
      title?: string;
      authors?: string[];
      publisher?: string;
      publishedDate?: string;
      description?: string;
      language?: string;
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
  }>;
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

  const firstItem = data.items?.[0];
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
    authors: first.authors?.join(", ") ?? null,
    publisher: first.publisher ?? null,
    publishedYear: first.publishedDate?.slice(0, 4) ?? null,
    category: first.categories?.[0] ?? null,
    language: normalizeBookLanguage(first.language),
    shelf: null,
    notes: null,
    synopsis: cleanGoogleText(first.description) ?? cleanGoogleText(firstItem?.searchInfo?.textSnippet),
    thumbnail: thumbnail ? thumbnail.replace(/^http:\/\//, "https://") : null
  };
}
