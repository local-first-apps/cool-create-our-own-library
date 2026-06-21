export const BOOK_LANGUAGE_OPTIONS = ["IT", "EN", "FR", "ES", "DE", "PT", "NL", "PL", "RU", "LA", "EL", "JA", "ZH", "AR"];

const LANGUAGE_ALIASES: Record<string, string> = {
  arabo: "AR",
  arabe: "AR",
  arabic: "AR",
  cinese: "ZH",
  chinese: "ZH",
  de: "DE",
  deu: "DE",
  deutsch: "DE",
  el: "EL",
  en: "EN",
  eng: "EN",
  english: "EN",
  es: "ES",
  español: "ES",
  espanol: "ES",
  fra: "FR",
  francais: "FR",
  francese: "FR",
  french: "FR",
  fr: "FR",
  ger: "DE",
  german: "DE",
  greco: "EL",
  greek: "EL",
  inglese: "EN",
  italiano: "IT",
  italian: "IT",
  ita: "IT",
  it: "IT",
  japonais: "JA",
  japanese: "JA",
  latino: "LA",
  latin: "LA",
  nederlands: "NL",
  nl: "NL",
  olandese: "NL",
  pl: "PL",
  polacco: "PL",
  polish: "PL",
  portugues: "PT",
  português: "PT",
  portoghese: "PT",
  portuguese: "PT",
  pt: "PT",
  russo: "RU",
  russian: "RU",
  ru: "RU",
  spagnolo: "ES",
  spanish: "ES",
  tedesco: "DE",
  zh: "ZH"
};

export function normalizeBookLanguage(value?: string | null): string | null {
  const cleaned = value?.trim();
  if (!cleaned) {
    return null;
  }

  const lower = cleaned.toLowerCase();
  const mapped = LANGUAGE_ALIASES[lower] ?? cleaned.toUpperCase();
  return BOOK_LANGUAGE_OPTIONS.includes(mapped) ? mapped : null;
}
