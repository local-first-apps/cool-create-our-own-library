import { Settings } from "../types/Settings";
import { cleanOptionalText } from "../utils/isbn";
import { DEFAULT_LIBRARY_NAME, getSetting, setSetting } from "./db";

export const DEFAULT_DEVICE_NAME = "Dispositivo non specificato";
export const DEFAULT_LANGUAGE = "IT";
export const SUPPORTED_LANGUAGES = ["IT", "EN", "FR", "ES", "DE"];
const DEVICE_NAME_KEY = "deviceName";
const ACTIVE_LIBRARY_KEY = "activeLibrary";
const LANGUAGE_KEY = "language";

export async function getSettings(): Promise<Settings> {
  const deviceName = cleanOptionalText(await getSetting(DEVICE_NAME_KEY)) ?? DEFAULT_DEVICE_NAME;
  const language = cleanOptionalText(await getSetting(LANGUAGE_KEY)) ?? DEFAULT_LANGUAGE;
  return { deviceName, language };
}

export async function saveDeviceName(value: string): Promise<Settings> {
  const deviceName = cleanOptionalText(value) ?? DEFAULT_DEVICE_NAME;
  await setSetting(DEVICE_NAME_KEY, deviceName);
  return getSettings();
}

export async function saveLanguage(value: string): Promise<Settings> {
  const language = SUPPORTED_LANGUAGES.includes(value) ? value : DEFAULT_LANGUAGE;
  await setSetting(LANGUAGE_KEY, language);
  return getSettings();
}

export async function getActiveLibrary(): Promise<string> {
  return cleanOptionalText(await getSetting(ACTIVE_LIBRARY_KEY)) ?? DEFAULT_LIBRARY_NAME;
}

export async function getStoredActiveLibrary(): Promise<string | null> {
  return cleanOptionalText(await getSetting(ACTIVE_LIBRARY_KEY));
}

export async function saveActiveLibrary(value: string): Promise<string> {
  const library = cleanOptionalText(value) ?? DEFAULT_LIBRARY_NAME;
  await setSetting(ACTIVE_LIBRARY_KEY, library);
  return library;
}
