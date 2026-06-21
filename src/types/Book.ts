export type Book = {
  id: number;
  isbn: string | null;
  title: string;
  authors: string | null;
  publisher: string | null;
  publishedYear: string | null;
  category: string | null;
  language: string | null;
  library: string | null;
  shelf: string | null;
  notes: string | null;
  synopsis: string | null;
  thumbnail: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BookInput = {
  isbn?: string | null;
  title: string;
  authors?: string | null;
  publisher?: string | null;
  publishedYear?: string | null;
  category?: string | null;
  language?: string | null;
  library?: string | null;
  shelf?: string | null;
  notes?: string | null;
  synopsis?: string | null;
  thumbnail?: string | null;
};

export type DuplicateBookResult = {
  duplicate: true;
  book: Book;
};

export type SavedBookResult = {
  duplicate: false;
  book: Book;
};

export type SaveBookResult = DuplicateBookResult | SavedBookResult;
