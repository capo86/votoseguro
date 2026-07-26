import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { VotoSeguroRecord } from "./votoSeguroApi";

const REPORT_TITLE = "LISTADO DE VOTO SEGURO";
const REPORT_SUBTITLE = "Partido Participacion Ciudadana - VotoSeguro";
const LOGO_URL = "/logo-ppc-oficial.png";
const ORANGE = "#F2820C";
const INK = "#151413";
const FIELD = "#FFFDF8";
const ZIP_UTF8_FLAG = 0x0800;
const ZIP_VERSION_NEEDED = 20;
const XLSX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const REPORT_COLUMNS = [
  "Cedula",
  "Votante",
  "Telefono",
  "Intendente",
  "Concejal",
  "Territorio",
  "Local",
  "Mesa / Orden",
  "Notificacion",
  "Usuario",
  "Carga",
] as const;

interface VotoSeguroReportOptions {
  scopeLabel: string;
}

export async function exportVotoSeguroToPdf(
  records: VotoSeguroRecord[],
  options: VotoSeguroReportOptions,
) {
  const generatedAt = new Date();
  const logoDataUrl = await loadLogoDataUrl();
  const doc = new jsPDF({ format: "a4", orientation: "landscape", unit: "pt" });

  autoTable(doc, {
    body: records.map(recordToReportRow),
    didDrawPage: () => {
      drawPdfHeader(doc, logoDataUrl, generatedAt, records.length, options.scopeLabel);
      drawPdfFooter(doc);
    },
    head: [[...REPORT_COLUMNS]],
    headStyles: {
      fillColor: hexToRgb(ORANGE),
      fontStyle: "bold",
      halign: "left",
      textColor: hexToRgb(INK),
    },
    margin: {
      bottom: 38,
      left: 24,
      right: 24,
      top: 112,
    },
    startY: 112,
    styles: {
      cellPadding: 4,
      font: "helvetica",
      fontSize: 6.8,
      lineColor: [224, 215, 205],
      lineWidth: 0.35,
      overflow: "linebreak",
      textColor: [42, 38, 34],
    },
    theme: "grid",
  });

  doc.save(buildReportFilename("pdf"));
}

export async function exportVotoSeguroToExcel(
  records: VotoSeguroRecord[],
  options: VotoSeguroReportOptions,
) {
  const generatedAt = new Date();
  const zipFiles: ZipFileInput[] = [
    { data: buildContentTypesXml(), path: "[Content_Types].xml" },
    { data: buildRootRelsXml(), path: "_rels/.rels" },
    { data: buildAppPropertiesXml(), path: "docProps/app.xml" },
    { data: buildCorePropertiesXml(generatedAt), path: "docProps/core.xml" },
    { data: buildWorkbookXml(), path: "xl/workbook.xml" },
    { data: buildWorkbookRelsXml(), path: "xl/_rels/workbook.xml.rels" },
    {
      data: buildWorksheetXml(records, generatedAt, options.scopeLabel),
      path: "xl/worksheets/sheet1.xml",
    },
  ];

  downloadBlob(
    createZipBlob(zipFiles, generatedAt),
    buildReportFilename("xlsx"),
  );
}

function recordToReportRow(record: VotoSeguroRecord) {
  return [
    record.cedula,
    record.nombreApellido,
    record.telefono,
    intendenteLabel(record),
    concejalLabel(record),
    territoryLabel(record),
    record.localVotacion || record.local || "-",
    mesaOrdenLabel(record),
    notificationLabel(record),
    loadedByLabel(record),
    formatReportDateTimeString(record.createdAt),
  ];
}

function drawPdfHeader(
  doc: import("jspdf").jsPDF,
  logoDataUrl: string | null,
  generatedAt: Date,
  totalRows: number,
  scopeLabel: string,
) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(FIELD);
  doc.rect(0, 0, pageWidth, 100, "F");
  doc.setDrawColor(242, 130, 12);
  doc.setLineWidth(3);
  doc.line(24, 96, pageWidth - 24, 96);

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", 24, 22, 48, 48);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(21, 20, 19);
  doc.text(REPORT_TITLE, 84, 36);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(90, 80, 70);
  doc.text(REPORT_SUBTITLE, 84, 53);
  doc.text(
    `Alcance: ${scopeLabel} | Generado: ${formatReportDateTime(generatedAt)} | Registros: ${totalRows}`,
    84,
    69,
  );
}

function drawPdfFooter(doc: import("jspdf").jsPDF) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageNumber = doc.getNumberOfPages();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(110, 100, 90);
  doc.text(`Pagina ${pageNumber}`, pageWidth - 78, pageHeight - 20);
  doc.text("Creado por Cleto Perez y Juan Bellenzier", 24, pageHeight - 20);
}

async function loadLogoDataUrl() {
  const blob = await loadLogoBlob();

  if (!blob) {
    return null;
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function loadLogoBlob() {
  const response = await fetch(LOGO_URL).catch(() => null);

  if (!response?.ok) {
    return null;
  }

  return response.blob();
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function buildReportFilename(extension: "pdf" | "xlsx") {
  const date = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());

  return `listado-voto-seguro-${date}.${extension}`;
}

function formatReportDateTime(value: Date) {
  return new Intl.DateTimeFormat("es-PY", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

function formatReportDateTimeString(value?: string) {
  if (!value) {
    return "-";
  }

  return formatReportDateTime(new Date(value));
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");

  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function buildContentTypesXml() {
  return xmlHeader(`\
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`);
}

function buildRootRelsXml() {
  return xmlHeader(`\
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`);
}

function buildAppPropertiesXml() {
  return xmlHeader(`\
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>VotoSeguro</Application>
  <Company>Partido Participacion Ciudadana</Company>
</Properties>`);
}

function buildCorePropertiesXml(generatedAt: Date) {
  const timestamp = generatedAt.toISOString();

  return xmlHeader(`\
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:creator>VotoSeguro</dc:creator>
  <cp:lastModifiedBy>VotoSeguro</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${timestamp}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${timestamp}</dcterms:modified>
</cp:coreProperties>`);
}

function buildWorkbookXml() {
  return xmlHeader(`\
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Voto Seguro" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`);
}

function buildWorkbookRelsXml() {
  return xmlHeader(`\
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`);
}

function buildWorksheetXml(records: VotoSeguroRecord[], generatedAt: Date, scopeLabel: string) {
  const lastRow = Math.max(5, records.length + 5);
  const lastColumn = columnName(REPORT_COLUMNS.length);

  return xmlHeader(`\
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:${lastColumn}${lastRow}"/>
  <sheetViews>
    <sheetView workbookViewId="0">
      <pane ySplit="5" topLeftCell="A6" activePane="bottomLeft" state="frozen"/>
      <selection pane="bottomLeft"/>
    </sheetView>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="20"/>
  <cols>
    <col min="1" max="1" width="12" customWidth="1"/>
    <col min="2" max="2" width="32" customWidth="1"/>
    <col min="3" max="3" width="14" customWidth="1"/>
    <col min="4" max="4" width="34" customWidth="1"/>
    <col min="5" max="5" width="34" customWidth="1"/>
    <col min="6" max="6" width="34" customWidth="1"/>
    <col min="7" max="7" width="34" customWidth="1"/>
    <col min="8" max="8" width="18" customWidth="1"/>
    <col min="9" max="9" width="24" customWidth="1"/>
    <col min="10" max="10" width="28" customWidth="1"/>
    <col min="11" max="11" width="18" customWidth="1"/>
  </cols>
  <sheetData>
    <row r="1" ht="24" customHeight="1">${textCell("A1", REPORT_SUBTITLE)}</row>
    <row r="2" ht="24" customHeight="1">${textCell("A2", REPORT_TITLE)}</row>
    <row r="3" ht="18" customHeight="1">${textCell("A3", `Alcance: ${scopeLabel} | Generado: ${formatReportDateTime(generatedAt)} | Registros: ${records.length}`)}</row>
    <row r="4" ht="8" customHeight="1"/>
    <row r="5" ht="23" customHeight="1">${REPORT_COLUMNS.map((column, index) =>
      textCell(`${columnName(index + 1)}5`, column),
    ).join("")}</row>
    ${records.map((record, index) => buildRecordWorksheetRow(record, index + 6)).join("")}
  </sheetData>
  <autoFilter ref="A5:${lastColumn}${lastRow}"/>
  <pageMargins left="0.3" right="0.3" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>
  <pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/>
</worksheet>`);
}

function buildRecordWorksheetRow(record: VotoSeguroRecord, rowNumber: number) {
  return `<row r="${rowNumber}">${recordToReportRow(record)
    .map((value, index) => textCell(`${columnName(index + 1)}${rowNumber}`, value))
    .join("")}</row>`;
}

interface ZipFileInput {
  data: string | ArrayBuffer;
  path: string;
}

interface ZipFileEntry {
  crc: number;
  data: Uint8Array;
  name: Uint8Array;
  offset: number;
}

function createZipBlob(files: ZipFileInput[], modifiedAt: Date) {
  const chunks: Uint8Array[] = [];
  const centralDirectory: Uint8Array[] = [];
  const entries: ZipFileEntry[] = [];
  let offset = 0;

  files.forEach((file) => {
    const data = toBytes(file.data);
    const name = toBytes(file.path);
    const crc = crc32(data);
    const localHeader = buildLocalFileHeader(name, data.length, crc, modifiedAt);

    entries.push({ crc, data, name, offset });
    chunks.push(localHeader, data);
    offset += localHeader.length + data.length;
  });

  entries.forEach((entry) => {
    centralDirectory.push(buildCentralDirectoryHeader(entry, modifiedAt));
  });

  const centralDirectorySize = centralDirectory.reduce((total, chunk) => total + chunk.length, 0);
  const centralDirectoryOffset = offset;
  const endRecord = buildEndOfCentralDirectory(entries.length, centralDirectorySize, centralDirectoryOffset);
  const blobParts = [...chunks, ...centralDirectory, endRecord].map(copyToArrayBuffer);

  return new Blob(blobParts, {
    type: XLSX_MIME_TYPE,
  });
}

function buildLocalFileHeader(name: Uint8Array, size: number, crc: number, modifiedAt: Date) {
  const header = new Uint8Array(30 + name.length);
  const view = new DataView(header.buffer);
  const { dosDate, dosTime } = toDosDateTime(modifiedAt);

  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, ZIP_VERSION_NEEDED, true);
  view.setUint16(6, ZIP_UTF8_FLAG, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, dosTime, true);
  view.setUint16(12, dosDate, true);
  view.setUint32(14, crc, true);
  view.setUint32(18, size, true);
  view.setUint32(22, size, true);
  view.setUint16(26, name.length, true);
  view.setUint16(28, 0, true);
  header.set(name, 30);

  return header;
}

function buildCentralDirectoryHeader(entry: ZipFileEntry, modifiedAt: Date) {
  const header = new Uint8Array(46 + entry.name.length);
  const view = new DataView(header.buffer);
  const { dosDate, dosTime } = toDosDateTime(modifiedAt);

  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, ZIP_VERSION_NEEDED, true);
  view.setUint16(6, ZIP_VERSION_NEEDED, true);
  view.setUint16(8, ZIP_UTF8_FLAG, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, dosTime, true);
  view.setUint16(14, dosDate, true);
  view.setUint32(16, entry.crc, true);
  view.setUint32(20, entry.data.length, true);
  view.setUint32(24, entry.data.length, true);
  view.setUint16(28, entry.name.length, true);
  view.setUint16(30, 0, true);
  view.setUint16(32, 0, true);
  view.setUint16(34, 0, true);
  view.setUint16(36, 0, true);
  view.setUint32(38, 0, true);
  view.setUint32(42, entry.offset, true);
  header.set(entry.name, 46);

  return header;
}

function buildEndOfCentralDirectory(entryCount: number, centralDirectorySize: number, centralDirectoryOffset: number) {
  const header = new Uint8Array(22);
  const view = new DataView(header.buffer);

  view.setUint32(0, 0x06054b50, true);
  view.setUint16(4, 0, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, entryCount, true);
  view.setUint16(10, entryCount, true);
  view.setUint32(12, centralDirectorySize, true);
  view.setUint32(16, centralDirectoryOffset, true);
  view.setUint16(20, 0, true);

  return header;
}

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;

  for (const byte of bytes) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function toBytes(value: string | ArrayBuffer) {
  if (typeof value === "string") {
    return new TextEncoder().encode(value);
  }

  return new Uint8Array(value);
}

function copyToArrayBuffer(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.length);

  copy.set(bytes);

  return copy.buffer;
}

function toDosDateTime(value: Date) {
  const year = Math.max(value.getFullYear(), 1980);

  return {
    dosDate: ((year - 1980) << 9) | ((value.getMonth() + 1) << 5) | value.getDate(),
    dosTime: (value.getHours() << 11) | (value.getMinutes() << 5) | Math.floor(value.getSeconds() / 2),
  };
}

function buildCrcTable() {
  const table = new Uint32Array(256);

  for (let index = 0; index < table.length; index += 1) {
    let crc = index;

    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }

    table[index] = crc >>> 0;
  }

  return table;
}

const CRC_TABLE = buildCrcTable();

function textCell(reference: string, value: string) {
  return `<c r="${reference}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
}

function columnName(index: number) {
  let column = "";
  let current = index;

  while (current > 0) {
    const remainder = (current - 1) % 26;
    column = String.fromCharCode(65 + remainder) + column;
    current = Math.floor((current - remainder) / 26);
  }

  return column;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function xmlHeader(body: string) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n${body}`;
}

function concejalLabel(record: VotoSeguroRecord) {
  const name = record.concejalNombre ?? record.candidatoNombre;
  const list = record.concejalNumeroLista ?? record.candidatoNumeroLista;

  return `${name} - ${list ? `Lista ${list}` : "Lista -"}`;
}

function intendenteLabel(record: VotoSeguroRecord) {
  if (!record.intendenteNombre) {
    return "Sin intendente";
  }

  return `${record.intendenteNombre} - ${
    record.intendenteNumeroLista ? `Lista ${record.intendenteNumeroLista}` : "Lista -"
  }`;
}

function territoryLabel(record: VotoSeguroRecord) {
  return [record.departamento, record.distrito, record.zona].filter(Boolean).join(" / ") || "-";
}

function mesaOrdenLabel(record: VotoSeguroRecord) {
  const mesa = record.mesa || "-";
  const orden = record.orden || "-";
  return `Mesa ${mesa} - Orden ${orden}`;
}

function loadedByLabel(record: VotoSeguroRecord) {
  const userName = record.loadedByNombre || "Usuario";
  const locality = record.loadedByLocalidad ? ` - ${record.loadedByLocalidad}` : "";

  return `${userName}${locality}`;
}

function notificationLabel(record: VotoSeguroRecord) {
  if (record.fechaRenotificacion) {
    return `Renotificado - ${formatReportDateTimeString(record.fechaRenotificacion)}`;
  }

  if (record.fechaNotificacion) {
    return `Notificado - ${formatReportDateTimeString(record.fechaNotificacion)}`;
  }

  return record.fueNotificado ? "Notificado" : "Pendiente";
}
