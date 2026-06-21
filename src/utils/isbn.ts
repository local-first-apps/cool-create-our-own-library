export function normalizeIsbn(value: string | null | undefined): string {
  return (value ?? "").replace(/[^0-9Xx]/g, "").toUpperCase();
}

export function isLikelyIsbn13(value: string | null | undefined): boolean {
  const isbn = normalizeIsbn(value);
  return isbn.length === 13 && (isbn.startsWith("978") || isbn.startsWith("979"));
}

export function cleanOptionalText(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}
