function formatSingleAuthor(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) {
    return value.trim();
  }

  const surname = parts[parts.length - 1];
  const names = parts.slice(0, -1).join(" ");
  return `${surname}, ${names}`;
}

export function formatAuthorLabel(value: string): string {
  return value
    .split(",")
    .map((part) => formatSingleAuthor(part))
    .join("; ");
}

export function compareAuthorsByLabel(a: string, b: string): number {
  return formatAuthorLabel(a).localeCompare(formatAuthorLabel(b));
}
