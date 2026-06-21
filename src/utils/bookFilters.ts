import { Book } from "../types/Book";

export type BookFilterParams = {
  search?: string;
  selectedAuthors?: string[];
  selectedCategories?: string[];
  selectedLanguages?: string[];
  selectedLocations?: string[];
  selectedYears?: string[];
  yearFrom?: string | null;
  yearTo?: string | null;
};

export function matchesSearch(book: Book, query?: string): boolean {
  const normalized = query?.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return [
    book.title,
    book.authors,
    book.isbn,
    book.publisher,
    book.publishedYear,
    book.category,
    book.language,
    book.shelf,
    book.notes,
    book.synopsis
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalized));
}

function yearInRange(year: string | null, from?: string | null, to?: string | null): boolean {
  if (!year || (!from && !to)) {
    return false;
  }

  const numericYear = Number(year);
  const numericFrom = from ? Number(from) : Number.NEGATIVE_INFINITY;
  const numericTo = to ? Number(to) : Number.POSITIVE_INFINITY;
  if (Number.isNaN(numericYear)) {
    return false;
  }

  return numericYear >= Math.min(numericFrom, numericTo) && numericYear <= Math.max(numericFrom, numericTo);
}

function matchesYear(book: Book, filters: BookFilterParams): boolean {
  const selectedYears = filters.selectedYears ?? [];
  const hasRange = Boolean(filters.yearFrom || filters.yearTo);

  if (selectedYears.length === 0 && !hasRange) {
    return true;
  }

  return selectedYears.includes(book.publishedYear ?? "") || yearInRange(book.publishedYear, filters.yearFrom, filters.yearTo);
}

export function filterBooks(books: Book[], filters: BookFilterParams): Book[] {
  return books.filter((book) => {
    const selectedAuthors = filters.selectedAuthors ?? [];
    const selectedCategories = filters.selectedCategories ?? [];
    const selectedLanguages = filters.selectedLanguages ?? [];
    const selectedLocations = filters.selectedLocations ?? [];
    const authorMatches = selectedAuthors.length === 0 || selectedAuthors.includes(book.authors ?? "");
    const categoryMatches = selectedCategories.length === 0 || selectedCategories.includes(book.category ?? "");
    const languageMatches = selectedLanguages.length === 0 || selectedLanguages.includes(book.language ?? "");
    const locationMatches = selectedLocations.length === 0 || selectedLocations.includes(book.shelf ?? "");
    const yearMatches = matchesYear(book, filters);

    return authorMatches && categoryMatches && languageMatches && locationMatches && yearMatches && matchesSearch(book, filters.search);
  });
}
