import { describe, it, expect } from 'vitest';
import {
  buildImportItems,
  buildTemplate,
  detectDelimiter,
  detectHeader,
  foldHeader,
  getImportFileKind,
  isMarkdownTable,
  needsMappingConfirmation,
  parseDelimited,
  parseTextToRows,
  splitMeanings,
  toStudyItemFields,
  POSITIONAL_MAPPING,
} from '../importer';
import { buildXlsx, crc32, parseWorksheet, readXlsxRows, decodeXmlText } from '../xlsx';

describe('delimited parsing', () => {
  it('parses RFC 4180 quoted fields with commas, quotes, and line breaks', () => {
    const rows = parseDelimited('旅行,りょこう,Lữ Hành,"Du lịch, chuyến đi"\n"a ""b""",c,"x\ny",z', ',');
    expect(rows[0]).toEqual(['旅行', 'りょこう', 'Lữ Hành', 'Du lịch, chuyến đi']);
    expect(rows[1]).toEqual(['a "b"', 'c', 'x\ny', 'z']);
  });

  it('auto-detects tab, then semicolon, pipe, and comma by uniform column counts', () => {
    expect(detectDelimiter('a\tb\tc\nd\te\tf')).toBe('\t');
    expect(detectDelimiter('旅行;りょこう;Lữ Hành;Du lịch\n家族;かぞく;Gia Tộc;gia đình')).toBe(';');
    expect(detectDelimiter('a|b\nc|d')).toBe('|');
    expect(detectDelimiter('旅行,りょこう,,"Du lịch, chuyến đi"\n家族,かぞく,,gia đình')).toBe(',');
    expect(detectDelimiter('only one column')).toBeNull();
  });

  it('prefers the semicolon over natural-language commas', () => {
    expect(detectDelimiter('旅行;りょこう;Lữ Hành;Du lịch, chuyến đi\n家族;かぞく;Gia Tộc;gia đình, họ hàng')).toBe(';');
  });

  it('reads Markdown tables, stripping outer pipes and separator rows', () => {
    const md = buildTemplate('md');
    expect(isMarkdownTable(md)).toBe(true);
    const rows = parseTextToRows(md, { delimiter: 'auto' });
    expect(rows[0]).toEqual(['Từ vựng', 'Cách đọc', 'Âm Hán Việt', 'Nghĩa tiếng Việt']);
    expect(rows[3]).toEqual(['ファストフード', 'ふぁすとふーど', '', 'Đồ ăn nhanh']);
    expect(rows).toHaveLength(4);
  });

  it('supports explicit and custom delimiters and drops blank rows', () => {
    expect(parseTextToRows('a#b\n\n  \nc#d', { delimiter: 'custom', customDelimiter: '#' })).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
    expect(parseTextToRows('a;b', { delimiter: 'comma' })).toEqual([['a;b']]);
  });
});

describe('headers and mapping', () => {
  it('folds diacritics and case for alias matching', () => {
    expect(foldHeader('  Nghĩa Tiếng  Việt ')).toBe('nghia tieng viet');
    expect(foldHeader('Đọc')).toBe('doc');
  });

  it('detects a header row with at least two known aliases, in any column order', () => {
    const detection = detectHeader([
      ['Meaning', 'Word', 'Reading'],
      ['du lịch', '旅行', 'りょこう'],
    ]);
    expect(detection.hasHeader).toBe(true);
    expect(detection.mapping).toEqual({ japanese: 1, kana: 2, hanViet: -1, vietnamese: 0 });
    expect(needsMappingConfirmation(detection)).toBe(false);
  });

  it('falls back to positional mapping without a header and asks for confirmation', () => {
    const detection = detectHeader([['旅行', 'りょこう']]);
    expect(detection.hasHeader).toBe(false);
    expect(detection.mapping).toEqual({ japanese: 0, kana: 1, hanViet: -1, vietnamese: -1 });
    expect(needsMappingConfirmation(detection)).toBe(true);
  });
});

describe('buildImportItems (normalize, dedupe, merge, warn)', () => {
  it('removes exact duplicates, merges complementary rows, and flags conflicts', () => {
    const rows = [
      ['旅行', 'りょこう', 'Lữ Hành', ''],
      ['旅行', 'りょこう', '', 'Du lịch'], // complementary -> merged
      ['旅行', 'りょこう', 'Lữ Hành', 'Du lịch'], // now exact duplicate
      ['家族', 'かぞく', '', 'gia đình'],
      ['家族', 'かぞく', '', 'họ hàng'], // conflicting meaning -> keep first
      ['', 'かな', '', 'x'], // no Japanese -> invalid
      ['美しい', '', 'Mỹ', 'đẹp'], // missing kana -> warning
      ['ﾌｧｽﾄﾌｰﾄﾞ', '', '', ''], // half-width -> normalized; missing kana and meaning
    ];
    const summary = buildImportItems(rows, POSITIONAL_MAPPING, false);
    expect(summary.totalRows).toBe(8);
    expect(summary.invalidRows).toBe(1);
    expect(summary.mergedItems).toBe(1);
    expect(summary.duplicateRows).toBe(1);
    expect(summary.conflictItems).toBe(1);
    expect(summary.items.map((i) => i.japanese)).toEqual(['旅行', '家族', '美しい', 'ファストフード']);
    expect(summary.items[0]).toMatchObject({ hanViet: 'Lữ Hành', vietnamese: ['Du lịch'], warnings: [] });
    expect(summary.items[1].vietnamese).toEqual(['gia đình']);
    expect(summary.items[1].warnings).toEqual(['conflict']);
    expect(summary.items[2].warnings).toEqual(['noKana']);
    expect(summary.items[3].warnings).toEqual(['noKana', 'noMeaning']);
    expect(summary.warningItems).toBe(2);
  });

  it('treats different readings as different lexical groups', () => {
    const summary = buildImportItems(
      [
        ['上手', 'じょうず', '', 'giỏi'],
        ['上手', 'うわて', '', 'cao tay'],
      ],
      POSITIONAL_MAPPING,
      false
    );
    expect(summary.items).toHaveLength(2);
  });

  it('skips the header row and never fabricates missing fields', () => {
    const summary = buildImportItems(
      [
        ['Từ vựng', 'Nghĩa'],
        ['旅行', 'Du lịch, chuyến đi'],
      ],
      { japanese: 0, kana: -1, hanViet: -1, vietnamese: 1 },
      true
    );
    const fields = toStudyItemFields(summary.items[0]);
    expect(fields).toEqual({ japanese: '旅行', vietnamese: ['Du lịch', 'chuyến đi'] });
    expect('kana' in fields).toBe(false);
    expect('hanViet' in fields).toBe(false);
  });

  it('splits meanings on commas and semicolons with NFC normalization', () => {
    expect(splitMeanings('du lịch ,  chuyến đi; ')).toEqual(['du lịch', 'chuyến đi']);
    expect(splitMeanings('du lịch'.normalize('NFD'))).toEqual(['du lịch'.normalize('NFC')]);
  });
});

describe('templates and files', () => {
  it('builds templates that parse back into the same four columns', () => {
    for (const kind of ['txt', 'csv', 'md'] as const) {
      const rows = parseTextToRows(buildTemplate(kind), { delimiter: 'auto' });
      const detection = detectHeader(rows);
      expect(detection.hasHeader).toBe(true);
      const summary = buildImportItems(rows, detection.mapping, true);
      expect(summary.items.map((i) => i.japanese)).toEqual(['日本を訪れる', '旅行', 'ファストフード']);
      expect(summary.items[1].vietnamese).toEqual(['Du lịch', 'chuyến đi']);
    }
  });

  it('accepts only .txt, .csv, .md, .xlsx', () => {
    expect(getImportFileKind('list.CSV')).toBe('text');
    expect(getImportFileKind('list.md')).toBe('text');
    expect(getImportFileKind('list.xlsx')).toBe('xlsx');
    expect(getImportFileKind('list.xls')).toBeNull();
    expect(getImportFileKind('list.pdf')).toBeNull();
  });
});

describe('native xlsx support', () => {
  it('computes standard CRC-32', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
  });

  it('round-trips the written template through the reader', async () => {
    const rows = await readXlsxRows(buildXlsx([['Từ vựng', 'Cách đọc'], ['旅行', 'りょこう'], ['A & <B>', '']]));
    expect(rows).toEqual([
      ['Từ vựng', 'Cách đọc'],
      ['旅行', 'りょこう'],
      ['A & <B>'],
    ]);
  });

  it('reads deflate-compressed entries through DecompressionStream', async () => {
    // Re-pack the template with deflate (method 8) to exercise the inflate path
    const stored = buildXlsx([['旅行', 'du lịch']]);
    const deflated = await repackWithDeflate(stored);
    expect(await readXlsxRows(deflated)).toEqual([['旅行', 'du lịch']]);
  });

  it('parses shared strings, skips phonetic runs, and keeps column positions', () => {
    const sheet =
      '<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="C1" t="inlineStr"><is><t>du lịch</t></is></c></row>' +
      '<row r="2"><c r="B2"><v>42</v></c><c r="C2" s="1"/></row></sheetData></worksheet>';
    expect(parseWorksheet(sheet, ['旅行'])).toEqual([
      ['旅行', '', 'du lịch'],
      ['', '42', ''],
    ]);
    expect(decodeXmlText('a_x000D_b &amp; &#x65E5;')).toBe('a\rb & 日');
  });
});

/** Rebuilds a stored ZIP with raw-deflate entries (test helper). */
async function repackWithDeflate(zip: Uint8Array): Promise<Uint8Array> {
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  const entries: { name: Uint8Array; data: Uint8Array; crc: number; size: number }[] = [];
  let offset = 0;
  while (view.getUint32(offset, true) === 0x04034b50) {
    const size = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const name = zip.slice(offset + 30, offset + 30 + nameLength);
    const data = zip.slice(offset + 30 + nameLength, offset + 30 + nameLength + size);
    entries.push({ name, data, crc: view.getUint32(offset + 14, true), size });
    offset += 30 + nameLength + size;
  }
  const deflate = async (data: Uint8Array) =>
    new Uint8Array(
      await new Response(new Blob([new Uint8Array(data)]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer()
    );
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let at = 0;
  for (const entry of entries) {
    const packed = await deflate(entry.data);
    const local = new Uint8Array(30 + entry.name.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(8, 8, true);
    lv.setUint32(14, entry.crc, true);
    lv.setUint32(18, packed.length, true);
    lv.setUint32(22, entry.size, true);
    lv.setUint16(26, entry.name.length, true);
    local.set(entry.name, 30);
    const c = new Uint8Array(46 + entry.name.length);
    const cv = new DataView(c.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(10, 8, true);
    cv.setUint32(16, entry.crc, true);
    cv.setUint32(20, packed.length, true);
    cv.setUint32(24, entry.size, true);
    cv.setUint16(28, entry.name.length, true);
    cv.setUint32(42, at, true);
    c.set(entry.name, 46);
    parts.push(local, packed);
    central.push(c);
    at += local.length + packed.length;
  }
  const size = central.reduce((s, p) => s + p.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, size, true);
  ev.setUint32(16, at, true);
  const all = [...parts, ...central, end];
  const out = new Uint8Array(all.reduce((s, p) => s + p.length, 0));
  let o = 0;
  for (const p of all) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

describe('ragged comma-separated input', () => {
  it('detects commas when rows omit trailing empty columns', () => {
    const text = 'Từ vựng,Cách đọc,Âm Hán Việt,Nghĩa tiếng Việt\nファストフード,ふぁすとふーど\n旅行,りょこう,Lữ Hành,"Du lịch, chuyến đi"';
    expect(detectDelimiter(text)).toBe(',');
    const rows = parseTextToRows(text, { delimiter: 'auto' });
    expect(rows[1]).toEqual(['ファストフード', 'ふぁすとふーど']);
    const detection = detectHeader(rows);
    expect(detection.hasHeader).toBe(true);
    expect(buildImportItems(rows, detection.mapping, true).items).toHaveLength(2);
  });
});
