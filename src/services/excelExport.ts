import { File, Paths } from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as XLSX from "xlsx";

import { Book } from "../types/Book";
import { formatAuthorLabel } from "../utils/authors";
import { DEFAULT_DEVICE_NAME } from "./settings";

const APP_NAME = "COOL | Create Our Own Library";
const EXCEL_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const CSV_MIME = "text/csv";
const PDF_MIME = "application/pdf";
const WORD_MIME = "application/msword";

export type ExportFormat = "csv" | "excel" | "word" | "pdf";
export type ExportFieldKey =
  | "id"
  | "isbn"
  | "title"
  | "authors"
  | "publisher"
  | "publishedYear"
  | "category"
  | "language"
  | "shelf"
  | "notes"
  | "synopsis"
  | "createdAt"
  | "updatedAt"
  | "device";

type ExportField = {
  key: ExportFieldKey;
  label: string;
  width: number;
  value: (book: Book, deviceName: string) => string | number;
};

type ColumnRule = {
  max: number;
  min: number;
  weight: number;
};

export const EXPORT_FIELDS: ExportField[] = [
  { key: "id", label: "ID locale", width: 10, value: (book) => book.id },
  { key: "isbn", label: "ISBN", width: 18, value: (book) => book.isbn ?? "" },
  { key: "title", label: "Titolo", width: 36, value: (book) => book.title },
  { key: "authors", label: "Autori", width: 28, value: (book) => (book.authors ? formatAuthorLabel(book.authors) : "") },
  { key: "publisher", label: "Editore", width: 24, value: (book) => book.publisher ?? "" },
  { key: "publishedYear", label: "Anno", width: 8, value: (book) => book.publishedYear ?? "" },
  { key: "category", label: "Categoria", width: 20, value: (book) => book.category ?? "" },
  { key: "language", label: "Lingua", width: 10, value: (book) => book.language ?? "" },
  { key: "shelf", label: "Scaffale/Stanza", width: 18, value: (book) => book.shelf ?? "" },
  { key: "notes", label: "Note", width: 32, value: (book) => book.notes ?? "" },
  { key: "synopsis", label: "Sinossi", width: 48, value: (book) => book.synopsis ?? "" },
  { key: "createdAt", label: "Data inserimento", width: 22, value: (book) => book.createdAt },
  { key: "updatedAt", label: "Ultima modifica", width: 22, value: (book) => book.updatedAt },
  { key: "device", label: "Dispositivo", width: 24, value: (_book, deviceName) => deviceName || DEFAULT_DEVICE_NAME }
];

export const DEFAULT_EXPORT_FIELD_KEYS = EXPORT_FIELDS.map((field) => field.key);

function selectedFields(fieldKeys?: ExportFieldKey[]): ExportField[] {
  const requested = fieldKeys && fieldKeys.length > 0 ? fieldKeys : DEFAULT_EXPORT_FIELD_KEYS;
  const fields = requested
    .map((key) => EXPORT_FIELDS.find((field) => field.key === key))
    .filter((field): field is ExportField => Boolean(field));
  return fields.length > 0 ? fields : EXPORT_FIELDS;
}

function toUint8Array(data: ArrayBuffer | Uint8Array | number[]): Uint8Array {
  if (data instanceof Uint8Array) {
    return data;
  }

  if (Array.isArray(data)) {
    return Uint8Array.from(data);
  }

  return new Uint8Array(data);
}

function bookRows(books: Book[], deviceName: string, fields: ExportField[]): Array<Array<string | number>> {
  return books.map((book) => fields.map((field) => field.value(book, deviceName)));
}

function columnRule(field: ExportField): ColumnRule {
  const rules: Record<ExportFieldKey, ColumnRule> = {
    authors: { max: 20, min: 9, weight: 1.4 },
    category: { max: 12, min: 5, weight: 1 },
    createdAt: { max: 10, min: 6, weight: 0.8 },
    device: { max: 12, min: 6, weight: 0.9 },
    id: { max: 5, min: 3, weight: 0.45 },
    isbn: { max: 11, min: 7, weight: 0.7 },
    language: { max: 5, min: 3, weight: 0.45 },
    notes: { max: 24, min: 8, weight: 1.7 },
    publishedYear: { max: 6, min: 4, weight: 0.5 },
    publisher: { max: 16, min: 7, weight: 1 },
    shelf: { max: 13, min: 6, weight: 0.9 },
    synopsis: { max: 28, min: 9, weight: 1.9 },
    title: { max: 22, min: 10, weight: 1.5 },
    updatedAt: { max: 10, min: 6, weight: 0.8 }
  };
  return rules[field.key];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function visibleTextLength(value: string | number): number {
  const text = String(value).trim();
  if (!text) {
    return 0;
  }

  const words = text.split(/\s+/);
  const longestWord = words.reduce((longest, word) => Math.max(longest, word.length), 0);
  return Math.max(longestWord * 1.4, Math.min(text.length, 90));
}

function documentColumnWidths(books: Book[], deviceName: string, fields: ExportField[]): number[] {
  const rawScores = fields.map((field) => {
    const rule = columnRule(field);
    const contentScore = books.reduce(
      (largest, book) => Math.max(largest, visibleTextLength(field.value(book, deviceName))),
      visibleTextLength(field.label)
    );
    return clamp(contentScore * rule.weight, rule.min, rule.max);
  });
  const total = rawScores.reduce((sum, score) => sum + score, 0) || 1;
  return rawScores.map((score) => (score / total) * 100);
}

function excelColumnWidths(books: Book[], deviceName: string, fields: ExportField[]): Array<{ wch: number }> {
  return fields.map((field) => {
    const rule = columnRule(field);
    const contentWidth = books.reduce(
      (largest, book) => Math.max(largest, Math.ceil(visibleTextLength(field.value(book, deviceName)))),
      field.label.length + 2
    );
    return { wch: Math.round(clamp(contentWidth, field.width * 0.55, rule.max * 2.4)) };
  });
}

function compareNumericText(a: string | number, b: string | number): number {
  const left = String(a).replace(/\D/g, "").replace(/^0+/, "") || "0";
  const right = String(b).replace(/\D/g, "").replace(/^0+/, "") || "0";

  if (left.length !== right.length) {
    return left.length - right.length;
  }

  return left.localeCompare(right);
}

function compareExportValues(field: ExportField, a: Book, b: Book, deviceName: string): number {
  const left = field.value(a, deviceName);
  const right = field.value(b, deviceName);
  const leftEmpty = String(left).trim() === "";
  const rightEmpty = String(right).trim() === "";

  if (leftEmpty && rightEmpty) {
    return 0;
  }

  if (leftEmpty) {
    return 1;
  }

  if (rightEmpty) {
    return -1;
  }

  if (field.key === "id" || field.key === "isbn" || field.key === "publishedYear") {
    return compareNumericText(left, right);
  }

  return String(left).localeCompare(String(right), undefined, { sensitivity: "base" });
}

function sortBooksForExport(books: Book[], deviceName: string, fields: ExportField[]): Book[] {
  const firstField = fields[0];
  if (!firstField) {
    return books;
  }

  return [...books].sort((a, b) => {
    const primary = compareExportValues(firstField, a, b, deviceName);
    if (primary !== 0) {
      return primary;
    }

    return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
  });
}

function fileStamp(): string {
  return new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "")
    .replace("T", "_");
}

function safeFilePart(value: string): string {
  return (
    value
      .trim()
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "") || "biblioteca"
  );
}

function makeWorkbook(books: Book[], deviceName: string, fields: ExportField[], libraryName: string): XLSX.WorkBook {
  const headers = fields.map((field) => field.label);
  const rows = [
    [APP_NAME],
    [`Biblioteca: ${libraryName}`, `Libri esportati: ${books.length}`, `Data export: ${new Date().toLocaleString()}`],
    [],
    headers,
    ...bookRows(books, deviceName, fields)
  ];
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet["!cols"] = excelColumnWidths(books, deviceName, fields);

  const isbnIndex = fields.findIndex((field) => field.key === "isbn");
  if (isbnIndex >= 0) {
    for (let index = 0; index < books.length; index += 1) {
      const cellAddress = XLSX.utils.encode_cell({ c: isbnIndex, r: index + 4 });
      const cell = sheet[cellAddress];
      if (cell) {
        cell.t = "s";
        cell.v = books[index].isbn ?? "";
        cell.z = "@";
      }
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Biblioteca");
  return workbook;
}

function escapeCsv(value: string | number): string {
  const text = String(value).replace(/"/g, '""');
  return `"${text}"`;
}

function makeCsv(books: Book[], deviceName: string, fields: ExportField[], libraryName: string): string {
  const metadata = [
    [APP_NAME],
    [`Biblioteca: ${libraryName}`, `Libri esportati: ${books.length}`, `Data export: ${new Date().toLocaleString()}`],
    []
  ];
  const rows = [fields.map((field) => field.label), ...bookRows(books, deviceName, fields)];
  return [...metadata, ...rows].map((row) => row.map(escapeCsv).join(";")).join("\r\n");
}

function escapeHtml(value: string | number): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function makeDocumentHtml(books: Book[], deviceName: string, fields: ExportField[], libraryName: string): string {
  const columnWidths = documentColumnWidths(books, deviceName, fields);
  const colgroup = fields
    .map((_field, index) => `<col style="width:${columnWidths[index].toFixed(2)}%;">`)
    .join("");
  const rows = bookRows(books, deviceName, fields)
    .map(
      (row) =>
        `<tr>${row
          .map((value) => `<td>${escapeHtml(value)}</td>`)
          .join("")}</tr>`
    )
    .join("");
  const header = fields.map((field) => `<th>${escapeHtml(field.label)}</th>`).join("");

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>${APP_NAME}</title>
    <style>
      @page { size: A4 landscape; margin: 12mm; }
      @page WordSection1 { size: 841.95pt 595.35pt; margin: 34pt 34pt 34pt 34pt; mso-page-orientation: landscape; }
      html, body { margin: 0; padding: 0; width: 100%; }
      body { box-sizing: border-box; color: #111827; font-family: Arial, sans-serif; padding: 0; }
      .page { box-sizing: border-box; page: WordSection1; width: 100%; }
      .header { align-items: center; border-bottom: 2px solid #2563EB; display: flex; gap: 10px; margin-bottom: 8px; padding-bottom: 7px; }
      .logo { align-items: center; background: #2563EB; border-radius: 7px; color: #ffffff; display: flex; font-size: 16px; font-weight: 800; height: 36px; justify-content: center; width: 64px; }
      .app { font-size: 17px; font-weight: 800; }
      .meta { color: #475569; font-size: 9px; margin-top: 2px; }
      table { border-collapse: collapse; font-size: 8px; table-layout: fixed; width: 100%; mso-table-layout-alt: fixed; }
      th { background: #DBEAFE; border: 1px solid #94a3b8; color: #111827; font-size: 7.5px; line-height: 1.12; padding: 3px; text-align: left; vertical-align: top; white-space: normal; word-break: break-word; overflow-wrap: anywhere; }
      td { border: 1px solid #cbd5e1; line-height: 1.18; padding: 3px; vertical-align: top; white-space: normal; word-break: break-word; overflow-wrap: anywhere; }
    </style>
  </head>
  <body>
    <div class="page WordSection1">
      <div class="header">
        <div class="logo">COOL</div>
        <div>
          <div class="app">${APP_NAME}</div>
          <div class="meta">Biblioteca: ${escapeHtml(libraryName)} | Libri esportati: ${books.length} | Data export: ${escapeHtml(new Date().toLocaleString())}</div>
        </div>
      </div>
      <table>
        <colgroup>${colgroup}</colgroup>
        <thead><tr>${header}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </body>
</html>`;
}

async function shareFile(file: File, mimeType: string, dialogTitle: string, UTI?: string): Promise<string> {
  const sharingAvailable = await Sharing.isAvailableAsync();
  if (!sharingAvailable) {
    throw new Error("La condivisione non e' disponibile su questo dispositivo.");
  }

  await Sharing.shareAsync(file.uri, {
    mimeType,
    dialogTitle,
    UTI
  });

  return file.uri;
}

export async function exportBooks(
  books: Book[],
  deviceName: string,
  format: ExportFormat,
  libraryName = "biblioteca",
  fieldKeys?: ExportFieldKey[]
): Promise<string> {
  if (books.length === 0) {
    throw new Error("Nessun libro presente da esportare.");
  }

  const fields = selectedFields(fieldKeys);
  const sortedBooks = sortBooksForExport(books, deviceName, fields);
  const baseName = `${safeFilePart(libraryName)}_${fileStamp()}`;

  if (format === "csv") {
    const file = new File(Paths.document, `${baseName}.csv`);
    file.create({ overwrite: true });
    file.write(makeCsv(sortedBooks, deviceName, fields, libraryName));
    return shareFile(file, CSV_MIME, "Esporta CSV");
  }

  if (format === "word") {
    const file = new File(Paths.document, `${baseName}.doc`);
    file.create({ overwrite: true });
    file.write(makeDocumentHtml(sortedBooks, deviceName, fields, libraryName));
    return shareFile(file, WORD_MIME, "Esporta Word", "com.microsoft.word.doc");
  }

  if (format === "pdf") {
    const pdf = await Print.printToFileAsync({
      base64: true,
      height: 793,
      html: makeDocumentHtml(sortedBooks, deviceName, fields, libraryName),
      width: 1122
    });

    if (!pdf.base64) {
      throw new Error("Non e' stato possibile generare il PDF.");
    }

    const file = new File(Paths.document, `${baseName}.pdf`);
    file.create({ overwrite: true });
    file.write(pdf.base64, { encoding: "base64" });
    return shareFile(file, PDF_MIME, "Esporta PDF", "com.adobe.pdf");
  }

  const workbook = makeWorkbook(sortedBooks, deviceName, fields, libraryName);
  const workbookData = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array"
  }) as ArrayBuffer | Uint8Array | number[];

  const file = new File(Paths.document, `${baseName}.xlsx`);
  file.create({ overwrite: true });
  file.write(toUint8Array(workbookData));
  return shareFile(file, EXCEL_MIME, "Esporta Excel", "org.openxmlformats.spreadsheetml.sheet");
}

export async function exportBooksToExcel(books: Book[], deviceName: string): Promise<string> {
  return exportBooks(books, deviceName, "excel");
}
