export function normalizeIsbn(value: string | null | undefined): string {
  return (value ?? "").replace(/[^0-9Xx]/g, "").toUpperCase();
}

export function isLikelyIsbn13(value: string | null | undefined): boolean {
  const isbn = normalizeIsbn(value);
  if (isbn.length !== 13 || (!isbn.startsWith("978") && !isbn.startsWith("979"))) {
    return false;
  }

  const digits = isbn.split("").map(Number);
  if (digits.some((digit) => Number.isNaN(digit))) {
    return false;
  }

  const sum = digits.slice(0, 12).reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 1 : 3), 0);
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === digits[12];
}

export function cleanOptionalText(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}
