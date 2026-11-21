/**
 * Tango — Minimal Native .xlsx Reader & Template Writer
 *
 * Governed by:
 * - docs/IMPORT_SPEC.md (§§5.2, 9, 14)
 * - CONTRIBUTING.md (§3 Dependency Discipline)
 *
 * An .xlsx file is a ZIP of XML parts. This module reads the ZIP central directory, inflates
 * entries with the browser-native `DecompressionStream('deflate-raw')`, and extracts cell text
 * from the first usable worksheet (shared strings, inline strings, numbers; Japanese phonetic
 * `<rPh>` runs are ignored). No third-party dependency is needed. The writer produces an
 * uncompressed ("stored") workbook for the downloadable template.
 */

const SIG_EOCD = 0x06054b50;
const SIG_CENTRAL = 0x02014b50;
const SIG_LOCAL = 0x04034b50;

interface ZipEntry {
  name: string;
  method: number;
  compressedSize: number;
  localHeaderOffset: number;
}

function readZipEntries(bytes: Uint8Array): Map<string, ZipEntry> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (view.getUint32(i, true) === SIG_EOCD) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('Not a ZIP archive');

  const count = view.getUint16(eocd + 10, true);
  let offset = view.getUint32(eocd + 16, true);
  const decoder = new TextDecoder();
  const entries = new Map<string, ZipEntry>();
  for (let i = 0; i < count; i++) {
    if (view.getUint32(offset, true) !== SIG_CENTRAL) throw new Error('Corrupt ZIP directory');
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);
    const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    entries.set(name, { name, method, compressedSize, localHeaderOffset });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('DecompressionStream is not supported in this browser');
  }
  const stream = new Blob([new Uint8Array(data)]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function readEntryText(bytes: Uint8Array, entry: ZipEntry): Promise<string> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const at = entry.localHeaderOffset;
  if (view.getUint32(at, true) !== SIG_LOCAL) throw new Error('Corrupt ZIP entry');
  const nameLength = view.getUint16(at + 26, true);
  const extraLength = view.getUint16(at + 28, true);
  const start = at + 30 + nameLength + extraLength;
  const data = bytes.subarray(start, start + entry.compressedSize);
  let raw: Uint8Array;
  if (entry.method === 0) raw = data;
  else if (entry.method === 8) raw = await inflateRaw(data);
  else throw new Error(`Unsupported ZIP compression method ${entry.method}`);
  return new TextDecoder().decode(raw);
}

/** Decodes XML entities and OOXML `_xHHHH_` escapes. */
export function decodeXmlText(value: string): string {
  return value
    .replace(/_x([0-9a-fA-F]{4})_/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

/** Concatenated `<t>` text of a string item, excluding phonetic `<rPh>` runs. */
function stringItemText(xml: string): string {
  const withoutPhonetics = xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '');
  const parts: string[] = [];
  const re = /<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(withoutPhonetics))) parts.push(decodeXmlText(match[1]));
  return parts.join('');
}

function parseSharedStrings(xml: string): string[] {
  const strings: string[] = [];
  const re = /<si\b[^>]*>([\s\S]*?)<\/si>|<si\b[^>]*\/>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml))) strings.push(match[1] ? stringItemText(match[1]) : '');
  return strings;
}

function columnIndex(ref: string): number {
  const letters = ref.replace(/[^A-Z]/gi, '').toUpperCase();
  let index = 0;
  for (const char of letters) index = index * 26 + (char.charCodeAt(0) - 64);
  return index - 1;
}

function attribute(tag: string, name: string): string | undefined {
  const match = new RegExp(`\\s${name}="([^"]*)"`).exec(tag);
  return match ? match[1] : undefined;
}

/** Parses a worksheet XML into rows of cell text (column positions preserved). */
export function parseWorksheet(xml: string, sharedStrings: string[]): string[][] {
  const rows: string[][] = [];
  const rowRe = /<row\b[^>]*>([\s\S]*?)<\/row>/g;
  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowRe.exec(xml))) {
    const cells: string[] = [];
    const cellRe = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
    let cellMatch: RegExpExecArray | null;
    let nextColumn = 0;
    while ((cellMatch = cellRe.exec(rowMatch[1]))) {
      const attrs = cellMatch[1];
      const body = cellMatch[2] ?? '';
      const ref = attribute(attrs, 'r');
      const column = ref ? columnIndex(ref) : nextColumn;
      nextColumn = column + 1;
      const type = attribute(attrs, 't');
      let text = '';
      if (type === 'inlineStr') {
        const inline = /<is\b[^>]*>([\s\S]*?)<\/is>/.exec(body);
        text = inline ? stringItemText(inline[1]) : '';
      } else {
        const valueMatch = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(body);
        const value = valueMatch ? decodeXmlText(valueMatch[1]) : '';
        if (type === 's') text = sharedStrings[Number(value)] ?? '';
        else if (type === 'b') text = value === '1' ? 'TRUE' : value === '0' ? 'FALSE' : value;
        else text = value;
      }
      while (cells.length < column) cells.push('');
      cells[column] = text;
    }
    rows.push(cells);
  }
  return rows;
}

function resolveSheetPath(target: string): string {
  const clean = target.replace(/^\//, '');
  return clean.startsWith('xl/') ? clean : `xl/${clean}`;
}

/**
 * Reads the first usable worksheet (the first, in workbook order, that has a non-empty cell)
 * and returns its rows with completely blank rows removed (IMPORT_SPEC §9).
 */
export async function readXlsxRows(data: ArrayBuffer | Uint8Array): Promise<string[][]> {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const entries = readZipEntries(bytes);
  const text = async (name: string) => {
    const entry = entries.get(name);
    return entry ? readEntryText(bytes, entry) : null;
  };

  const sharedXml = await text('xl/sharedStrings.xml');
  const sharedStrings = sharedXml ? parseSharedStrings(sharedXml) : [];

  // Sheet order comes from workbook.xml; paths from its relationships
  const sheetPaths: string[] = [];
  const workbook = await text('xl/workbook.xml');
  const rels = await text('xl/_rels/workbook.xml.rels');
  if (workbook && rels) {
    const targets = new Map<string, string>();
    const relRe = /<Relationship\b([^>]*)\/?>/g;
    let relMatch: RegExpExecArray | null;
    while ((relMatch = relRe.exec(rels))) {
      const id = attribute(relMatch[1], 'Id');
      const target = attribute(relMatch[1], 'Target');
      if (id && target) targets.set(id, resolveSheetPath(target));
    }
    const sheetRe = /<sheet\b([^>]*)\/?>/g;
    let sheetMatch: RegExpExecArray | null;
    while ((sheetMatch = sheetRe.exec(workbook))) {
      const id = attribute(sheetMatch[1], 'r:id');
      const path = id ? targets.get(id) : undefined;
      if (path) sheetPaths.push(path);
    }
  }
  if (sheetPaths.length === 0) {
    sheetPaths.push(
      ...Array.from(entries.keys())
        .filter((name) => /^xl\/worksheets\/[^/]+\.xml$/.test(name))
        .sort()
    );
  }

  for (const path of sheetPaths) {
    const xml = await text(path);
    if (!xml) continue;
    const rows = parseWorksheet(xml, sharedStrings)
      .map((row) => row.map((cell) => cell.trim()))
      .filter((row) => row.some((cell) => cell !== ''));
    if (rows.length > 0) return rows;
  }
  return [];
}

/* ==========================================================================
   Template writer (stored ZIP, inline strings)
   ========================================================================== */

let crcTable: Uint32Array | null = null;

export function crc32(data: Uint8Array): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/** Builds an uncompressed ZIP archive from named text files. */
export function buildStoredZip(files: { name: string; content: string }[]): Uint8Array {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = encoder.encode(file.content);
    const crc = crc32(data);

    const local = new Uint8Array(30 + name.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, SIG_LOCAL, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0x0800, true); // UTF-8 names
    lv.setUint16(8, 0, true); // stored
    lv.setUint32(14, crc, true);
    lv.setUint32(18, data.length, true);
    lv.setUint32(22, data.length, true);
    lv.setUint16(26, name.length, true);
    local.set(name, 30);
    localParts.push(local, data);

    const central = new Uint8Array(46 + name.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, SIG_CENTRAL, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, name.length, true);
    cv.setUint32(42, offset, true);
    central.set(name, 46);
    centralParts.push(central);

    offset += local.length + data.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, SIG_EOCD, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);

  const parts = [...localParts, ...centralParts, end];
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function columnName(index: number): string {
  let name = '';
  let n = index + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

/** Minimal single-sheet workbook with inline-string cells. */
export function buildXlsx(rows: string[][], sheetName = 'Tango'): Uint8Array {
  const sheetRows = rows
    .map((row, r) => {
      const cells = row
        .map((value, c) =>
          value === ''
            ? ''
            : `<c r="${columnName(c)}${r + 1}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`
        )
        .join('');
      return `<row r="${r + 1}">${cells}</row>`;
    })
    .join('');
  const xmlHead = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  return buildStoredZip([
    {
      name: '[Content_Types].xml',
      content: `${xmlHead}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
    },
    {
      name: '_rels/.rels',
      content: `${xmlHead}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    },
    {
      name: 'xl/workbook.xml',
      content: `${xmlHead}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      content: `${xmlHead}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
    },
    {
      name: 'xl/worksheets/sheet1.xml',
      content: `${xmlHead}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`,
    },
  ]);
}
