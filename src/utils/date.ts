export function nowIso(): string {
  return new Date().toISOString();
}

export function todayFileStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}
