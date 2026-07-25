import type { Candidato } from "../types/candidato";

const REPORT_TITLE = "LISTADO DE CANDIDATOS";
const REPORT_SUBTITLE = "Partido Participacion Ciudadana - VotoSeguro";
const LOGO_URL = "/logo-ppc-oficial.png";
const ORANGE = "#F2820C";
const INK = "#151413";
const FIELD = "#FFFDF8";

const REPORT_COLUMNS = [
  "Candidato",
  "Tipo",
  "Cargo",
  "Lista",
  "Departamento",
  "Ciudad",
  "Localidad",
  "Estado",
] as const;

export async function exportCandidatesToPdf(candidatos: Candidato[]) {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const autoTable = autoTableModule.default;
  const generatedAt = new Date();
  const logoDataUrl = await loadLogoDataUrl();
  const doc = new jsPDF({ format: "a4", orientation: "landscape", unit: "pt" });

  autoTable(doc, {
    body: candidatos.map(candidateToReportRow),
    didDrawPage: () => {
      drawPdfHeader(doc, logoDataUrl, generatedAt, candidatos.length);
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
      left: 36,
      right: 36,
      top: 104,
    },
    startY: 104,
    styles: {
      cellPadding: 6,
      font: "helvetica",
      fontSize: 8,
      lineColor: [224, 215, 205],
      lineWidth: 0.4,
      overflow: "linebreak",
      textColor: [42, 38, 34],
    },
    theme: "grid",
  });

  doc.save(buildReportFilename("pdf"));
}

export async function exportCandidatesToExcel(candidatos: Candidato[]) {
  const JSZip = (await import("jszip")).default;
  const generatedAt = new Date();
  const logoBlob = await loadLogoBlob();
  const hasLogo = Boolean(logoBlob);
  const zip = new JSZip();

  zip.file("[Content_Types].xml", buildContentTypesXml(hasLogo));
  zip.file("_rels/.rels", buildRootRelsXml());
  zip.file("docProps/app.xml", buildAppPropertiesXml());
  zip.file("docProps/core.xml", buildCorePropertiesXml(generatedAt));
  zip.file("xl/workbook.xml", buildWorkbookXml());
  zip.file("xl/_rels/workbook.xml.rels", buildWorkbookRelsXml());
  zip.file("xl/styles.xml", buildStylesXml());
  zip.file("xl/worksheets/sheet1.xml", buildWorksheetXml(candidatos, generatedAt, hasLogo));

  if (logoBlob) {
    zip.file("xl/worksheets/_rels/sheet1.xml.rels", buildWorksheetRelsXml());
    zip.file("xl/drawings/drawing1.xml", buildDrawingXml());
    zip.file("xl/drawings/_rels/drawing1.xml.rels", buildDrawingRelsXml());
    zip.file("xl/media/logo.png", await logoBlob.arrayBuffer());
  }

  const buffer = await zip.generateAsync({
    compression: "DEFLATE",
    type: "blob",
  });

  downloadBlob(
    buffer,
    buildReportFilename("xlsx"),
  );
}

function candidateToReportRow(candidato: Candidato) {
  return [
    candidato.nombreCandidato,
    candidato.tipo.nombre,
    candidato.cargo || "-",
    candidato.numeroLista || "-",
    candidato.departamento || "-",
    candidato.ciudad || "-",
    candidato.localidad || "-",
    candidato.activo ? "Activo" : "Inactivo",
  ];
}

function drawPdfHeader(
  doc: import("jspdf").jsPDF,
  logoDataUrl: string | null,
  generatedAt: Date,
  totalRows: number,
) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(FIELD);
  doc.rect(0, 0, pageWidth, 92, "F");
  doc.setDrawColor(242, 130, 12);
  doc.setLineWidth(3);
  doc.line(36, 88, pageWidth - 36, 88);

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", 36, 22, 48, 48);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(21, 20, 19);
  doc.text(REPORT_TITLE, 96, 38);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(90, 80, 70);
  doc.text(REPORT_SUBTITLE, 96, 55);
  doc.text(`Generado: ${formatReportDateTime(generatedAt)} | Registros: ${totalRows}`, 96, 70);
}

function drawPdfFooter(doc: import("jspdf").jsPDF) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageNumber = doc.getNumberOfPages();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(110, 100, 90);
  doc.text(`Pagina ${pageNumber}`, pageWidth - 78, pageHeight - 20);
  doc.text("Creado por Cleto Perez y Juan Bellenzier", 36, pageHeight - 20);
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

  return `listado-candidatos-${date}.${extension}`;
}

function formatReportDateTime(value: Date) {
  return new Intl.DateTimeFormat("es-PY", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");

  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function buildContentTypesXml(hasLogo: boolean) {
  return xmlHeader(`\
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  ${hasLogo ? '<Default Extension="png" ContentType="image/png"/>' : ""}
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${hasLogo ? '<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>' : ""}
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
    <sheet name="Candidatos" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`);
}

function buildWorkbookRelsXml() {
  return xmlHeader(`\
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);
}

function buildWorksheetRelsXml() {
  return xmlHeader(`\
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/>
</Relationships>`);
}

function buildDrawingRelsXml() {
  return xmlHeader(`\
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/logo.png"/>
</Relationships>`);
}

function buildDrawingXml() {
  return xmlHeader(`\
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <xdr:oneCellAnchor>
    <xdr:from>
      <xdr:col>0</xdr:col>
      <xdr:colOff>95250</xdr:colOff>
      <xdr:row>0</xdr:row>
      <xdr:rowOff>95250</xdr:rowOff>
    </xdr:from>
    <xdr:ext cx="628650" cy="628650"/>
    <xdr:pic>
      <xdr:nvPicPr>
        <xdr:cNvPr id="1" name="Logo PPC"/>
        <xdr:cNvPicPr>
          <a:picLocks noChangeAspect="1"/>
        </xdr:cNvPicPr>
      </xdr:nvPicPr>
      <xdr:blipFill>
        <a:blip r:embed="rId1"/>
        <a:stretch>
          <a:fillRect/>
        </a:stretch>
      </xdr:blipFill>
      <xdr:spPr>
        <a:prstGeom prst="rect">
          <a:avLst/>
        </a:prstGeom>
      </xdr:spPr>
    </xdr:pic>
    <xdr:clientData/>
  </xdr:oneCellAnchor>
</xdr:wsDr>`);
}

function buildStylesXml() {
  return xmlHeader(`\
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="5">
    <font><sz val="10"/><color rgb="FF151413"/><name val="Source Sans 3"/></font>
    <font><b/><sz val="18"/><color rgb="FF151413"/><name val="Arial"/></font>
    <font><b/><sz val="11"/><color rgb="FF4B443D"/><name val="Arial"/></font>
    <font><b/><sz val="10"/><color rgb="FF6A6258"/><name val="Arial"/></font>
    <font><b/><sz val="10"/><color rgb="FF151413"/><name val="Arial"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF2820C"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="3">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border><left/><right/><top/><bottom style="thin"><color rgb="FF151413"/></bottom/><diagonal/></border>
    <border><left/><right/><top/><bottom style="thin"><color rgb="FFE8DFD4"/></bottom/><diagonal/></border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="6">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
    <xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>
    <xf numFmtId="0" fontId="4" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1">
      <alignment vertical="center"/>
    </xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="2" xfId="0" applyFont="1" applyBorder="1">
      <alignment vertical="top" wrapText="1"/>
    </xf>
  </cellXfs>
  <cellStyles count="1">
    <cellStyle name="Normal" xfId="0" builtinId="0"/>
  </cellStyles>
  <dxfs count="0"/>
  <tableStyles count="0" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16"/>
</styleSheet>`);
}

function buildWorksheetXml(candidatos: Candidato[], generatedAt: Date, hasLogo: boolean) {
  const lastRow = Math.max(5, candidatos.length + 5);

  return xmlHeader(`\
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <dimension ref="A1:H${lastRow}"/>
  <sheetViews>
    <sheetView workbookViewId="0">
      <pane ySplit="5" topLeftCell="A6" activePane="bottomLeft" state="frozen"/>
      <selection pane="bottomLeft"/>
    </sheetView>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="20"/>
  <cols>
    <col min="1" max="1" width="34" customWidth="1"/>
    <col min="2" max="2" width="13" customWidth="1"/>
    <col min="3" max="3" width="18" customWidth="1"/>
    <col min="4" max="4" width="10" customWidth="1"/>
    <col min="5" max="5" width="18" customWidth="1"/>
    <col min="6" max="6" width="24" customWidth="1"/>
    <col min="7" max="7" width="24" customWidth="1"/>
    <col min="8" max="8" width="12" customWidth="1"/>
  </cols>
  <sheetData>
    <row r="1" ht="24" customHeight="1">${textCell("B1", REPORT_TITLE, 1)}</row>
    <row r="2" ht="18" customHeight="1">${textCell("B2", REPORT_SUBTITLE, 2)}</row>
    <row r="3" ht="18" customHeight="1">${textCell("B3", `Generado: ${formatReportDateTime(generatedAt)} | Registros: ${candidatos.length}`, 3)}</row>
    <row r="4" ht="8" customHeight="1"/>
    <row r="5" ht="23" customHeight="1">${REPORT_COLUMNS.map((column, index) =>
      textCell(`${columnName(index + 1)}5`, column, 4),
    ).join("")}</row>
    ${candidatos.map((candidato, index) => buildCandidateWorksheetRow(candidato, index + 6)).join("")}
  </sheetData>
  <autoFilter ref="A5:H${lastRow}"/>
  <mergeCells count="3">
    <mergeCell ref="B1:H1"/>
    <mergeCell ref="B2:H2"/>
    <mergeCell ref="B3:H3"/>
  </mergeCells>
  <pageMargins left="0.3" right="0.3" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>
  <pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/>
  ${hasLogo ? '<drawing r:id="rId1"/>' : ""}
</worksheet>`);
}

function buildCandidateWorksheetRow(candidato: Candidato, rowNumber: number) {
  return `<row r="${rowNumber}">${candidateToReportRow(candidato)
    .map((value, index) => textCell(`${columnName(index + 1)}${rowNumber}`, value, 5))
    .join("")}</row>`;
}

function textCell(reference: string, value: string, styleId: number) {
  return `<c r="${reference}" t="inlineStr" s="${styleId}"><is><t>${escapeXml(value)}</t></is></c>`;
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
