import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as XLSX from "xlsx";

import { Book } from "../types/Book";
import { formatAuthorLabel } from "../utils/authors";
import { DEFAULT_DEVICE_NAME } from "./settings";

const APP_NAME = "COOL | Create Our Own Library";
const EXCEL_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const CSV_MIME = "text/csv";
const WORD_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export type ExportFormat = "csv" | "excel" | "word";
export type ExportFieldKey =
  | "id"
  | "isbn"
  | "title"
  | "subtitle"
  | "authors"
  | "publisher"
  | "publishedYear"
  | "pageCount"
  | "category"
  | "language"
  | "shelf"
  | "notes"
  | "synopsis"
  | "createdAt"
  | "updatedAt"
  | "device";
export type ExportLabels = Partial<Record<ExportFieldKey, string>>;

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
  { key: "subtitle", label: "Sottotitolo", width: 32, value: (book) => book.subtitle ?? "" },
  { key: "authors", label: "Autori", width: 28, value: (book) => (book.authors ? formatAuthorLabel(book.authors) : "") },
  { key: "publisher", label: "Editore", width: 24, value: (book) => book.publisher ?? "" },
  { key: "publishedYear", label: "Anno", width: 8, value: (book) => book.publishedYear ?? "" },
  { key: "pageCount", label: "Numero pagine", width: 12, value: (book) => book.pageCount ?? "" },
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

function selectedFields(fieldKeys?: ExportFieldKey[], labels?: ExportLabels): ExportField[] {
  const requested = fieldKeys && fieldKeys.length > 0 ? fieldKeys : DEFAULT_EXPORT_FIELD_KEYS;
  const fields = requested
    .map((key) => EXPORT_FIELDS.find((field) => field.key === key))
    .filter((field): field is ExportField => Boolean(field));
  const selected = fields.length > 0 ? fields : EXPORT_FIELDS;
  return selected.map((field) => ({ ...field, label: labels?.[field.key] ?? field.label }));
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
    pageCount: { max: 7, min: 4, weight: 0.55 },
    publishedYear: { max: 6, min: 4, weight: 0.5 },
    publisher: { max: 16, min: 7, weight: 1 },
    shelf: { max: 13, min: 6, weight: 0.9 },
    subtitle: { max: 20, min: 8, weight: 1.25 },
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

  if (field.key === "id" || field.key === "isbn" || field.key === "publishedYear" || field.key === "pageCount") {
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

function escapeXml(value: string | number): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function docxText(value: string | number, bold = false, color = "111827", size = 18): string {
  const lines = String(value).split(/\r?\n/);
  const runs = lines.map((line, index) => {
    const text = `<w:t xml:space="preserve">${escapeXml(line)}</w:t>`;
    const br = index < lines.length - 1 ? "<w:br/>" : "";
    return `<w:r><w:rPr>${bold ? "<w:b/>" : ""}<w:color w:val="${color}"/><w:sz w:val="${size}"/></w:rPr>${text}${br}</w:r>`;
  });
  return runs.join("");
}

function docxCell(value: string | number, width: number, shaded = false, bold = false): string {
  return `<w:tc>
    <w:tcPr>
      <w:tcW w:w="${Math.max(1, Math.round(width))}" w:type="dxa"/>
      ${shaded ? '<w:shd w:fill="DBEAFE"/>' : ""}
      <w:tcMar>
        <w:top w:w="70" w:type="dxa"/>
        <w:left w:w="70" w:type="dxa"/>
        <w:bottom w:w="70" w:type="dxa"/>
        <w:right w:w="70" w:type="dxa"/>
      </w:tcMar>
    </w:tcPr>
    <w:p>${docxText(value, bold, "111827", shaded ? 16 : 15)}</w:p>
  </w:tc>`;
}

function makeDocx(books: Book[], deviceName: string, fields: ExportField[], libraryName: string): Uint8Array {
  const columnWidths = documentColumnWidths(books, deviceName, fields);
  const tableWidth = 14400;
  const docxWidths = columnWidths.map((width) => (width / 100) * tableWidth);
  const header = `<w:tr>${fields.map((field, index) => docxCell(field.label, docxWidths[index], true, true)).join("")}</w:tr>`;
  const rows = bookRows(books, deviceName, fields)
    .map(
      (row) =>
        `<w:tr>${row
          .map((value, index) => docxCell(value, docxWidths[index]))
          .join("")}</w:tr>`
    )
    .join("");

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r><w:rPr><w:b/><w:color w:val="2563EB"/><w:sz w:val="32"/></w:rPr><w:t>COOL</w:t></w:r>
      <w:r><w:rPr><w:b/><w:color w:val="111827"/><w:sz w:val="24"/></w:rPr><w:t xml:space="preserve"> | Create Our Own Library</w:t></w:r>
    </w:p>
    <w:p>${docxText(`Biblioteca: ${libraryName} | Libri esportati: ${books.length} | Data export: ${new Date().toLocaleString()}`, false, "475569", 16)}</w:p>
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="${tableWidth}" w:type="dxa"/>
        <w:tblLayout w:type="fixed"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="4" w:color="94A3B8"/>
          <w:left w:val="single" w:sz="4" w:color="94A3B8"/>
          <w:bottom w:val="single" w:sz="4" w:color="94A3B8"/>
          <w:right w:val="single" w:sz="4" w:color="94A3B8"/>
          <w:insideH w:val="single" w:sz="4" w:color="CBD5E1"/>
          <w:insideV w:val="single" w:sz="4" w:color="CBD5E1"/>
        </w:tblBorders>
      </w:tblPr>
      ${header}
      ${rows}
    </w:tbl>
    <w:sectPr>
      <w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/>
      <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="360" w:footer="360" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  const zip = XLSX.CFB.utils.cfb_new();
  XLSX.CFB.utils.cfb_add(zip, "[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);
  XLSX.CFB.utils.cfb_add(zip, "_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);
  XLSX.CFB.utils.cfb_add(zip, "word/document.xml", documentXml);
  return XLSX.CFB.write(zip, { type: "buffer" }) as Uint8Array;
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
  fieldKeys?: ExportFieldKey[],
  labels?: ExportLabels
): Promise<string> {
  if (books.length === 0) {
    throw new Error("Nessun libro presente da esportare.");
  }

  const fields = selectedFields(fieldKeys, labels);
  const sortedBooks = sortBooksForExport(books, deviceName, fields);
  const baseName = `${safeFilePart(libraryName)}_${fileStamp()}`;

  if (format === "csv") {
    const file = new File(Paths.document, `${baseName}.csv`);
    file.create({ overwrite: true });
    file.write(makeCsv(sortedBooks, deviceName, fields, libraryName));
    return shareFile(file, CSV_MIME, "Esporta CSV");
  }

  if (format === "word") {
    const file = new File(Paths.document, `${baseName}.docx`);
    file.create({ overwrite: true });
    file.write(makeDocx(sortedBooks, deviceName, fields, libraryName));
    return shareFile(file, WORD_MIME, "Esporta Word", "org.openxmlformats.wordprocessingml.document");
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
