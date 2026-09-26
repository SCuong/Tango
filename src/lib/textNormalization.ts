/**
 * Tango — Text Processing & Unicode Normalization Utilities
 *
 * Governed strictly by:
 * - docs/ARCHITECTURE.md (Section 6)
 * - docs/IMPORT_SPEC.md (Section 10.1)
 * - docs/DATA_MODEL.md (Cross-Category Pool Deduplication)
 */

const COMBINED_KANA: Record<string, string> = {
  'ｶﾞ': 'ガ', 'ｷﾞ': 'ギ', 'ｸﾞ': 'グ', 'ｹﾞ': 'ゲ', 'ｺﾞ': 'ゴ',
  'ｻﾞ': 'ザ', 'ｼﾞ': 'ジ', 'ｽﾞ': 'ズ', 'ｾﾞ': 'ゼ', 'ｿﾞ': 'ゾ',
  'ﾀﾞ': 'ダ', 'ﾁﾞ': 'ヂ', 'ﾂﾞ': 'ヅ', 'ﾃﾞ': 'デ', 'ﾄﾞ': 'ド',
  'ﾊﾞ': 'バ', 'ﾋﾞ': 'ビ', 'ﾌﾞ': 'ブ', 'ﾍﾞ': 'ベ', 'ﾎﾞ': 'ボ',
  'ﾊﾟ': 'パ', 'ﾋﾟ': 'ピ', 'ﾌﾟ': 'プ', 'ﾍﾟ': 'ペ', 'ﾎﾟ': 'ポ',
  'ｳﾞ': 'ヴ', 'ﾜﾞ': 'ヷ', 'ｦﾞ': 'ヺ',
};

const SINGLE_KANA: Record<string, string> = {
  '｡': '。', '｢': '「', '｣': '」', '､': '、', '･': '・',
  'ｦ': 'ヲ', 'ｧ': 'ァ', 'ｨ': 'ィ', 'ｩ': 'ゥ', 'ｪ': 'ェ', 'ｫ': 'ォ',
  'ｬ': 'ャ', 'ｭ': 'ュ', 'ｮ': 'ョ', 'ｯ': 'ッ', 'ｰ': 'ー',
  'ｱ': 'ア', 'ｲ': 'イ', 'ｳ': 'ウ', 'ｴ': 'エ', 'ｵ': 'オ',
  'ｶ': 'カ', 'ｷ': 'キ', 'ｸ': 'ク', 'ｹ': 'ケ', 'ｺ': 'コ',
  'ｻ': 'サ', 'ｼ': 'シ', 'ｽ': 'ス', 'ｾ': 'セ', 'ｿ': 'ソ',
  'ﾀ': 'タ', 'ﾁ': 'チ', 'ﾂ': 'ツ', 'ﾃ': 'テ', 'ﾄ': 'ト',
  'ﾅ': 'ナ', 'ﾆ': 'ニ', 'ﾇ': 'ヌ', 'ﾈ': 'ネ', 'ﾉ': 'ノ',
  'ﾊ': 'ハ', 'ﾋ': 'ヒ', 'ﾌ': 'フ', 'ﾍ': 'ヘ', 'ﾎ': 'ホ',
  'ﾏ': 'マ', 'ﾐ': 'ミ', 'ﾑ': 'ム', 'ﾒ': 'メ', 'ﾓ': 'モ',
  'ﾔ': 'ヤ', 'ﾕ': 'ユ', 'ﾖ': 'ヨ',
  'ﾗ': 'ラ', 'ﾘ': 'リ', 'ﾙ': 'ル', 'ﾚ': 'レ', 'ﾛ': 'ロ',
  'ﾜ': 'ワ', 'ﾝ': 'ン',
  'ﾞ': '゛', 'ﾟ': '゜',
};

/**
 * Converts half-width Katakana (hankaku) to full-width Katakana (zenkaku).
 * Preserves all other characters intact.
 */
export function convertHalfWidthKatakana(input: string): string {
  if (!input) return '';
  // 1. Replace two-character voiced/semi-voiced katakana first
  const withVoiced = input.replace(/[ｶ-ﾄﾊ-ﾎｳﾜｦ][ﾞﾟ]/g, (match) => COMBINED_KANA[match] || match);
  // 2. Replace remaining single half-width katakana
  return withVoiced.replace(/[｡-ﾟ]/g, (match) => SINGLE_KANA[match] || match);
}

/**
 * Normalizes Japanese text (Kanji, Kana, expressions):
 * 1. Trims leading/trailing whitespace including full-width space (\u3000).
 * 2. Collapses internal whitespace sequences.
 * 3. Normalizes half-width Katakana to full-width Katakana.
 * 4. Normalizes Unicode to NFC.
 */
export function normalizeJapanese(text: string): string {
  if (!text) return '';
  const trimmed = text.replace(/^[\s\u3000]+|[\s\u3000]+$/g, '');
  const collapsed = trimmed.replace(/[\s\u3000]+/g, ' ');
  const fullWidthKatakana = convertHalfWidthKatakana(collapsed);
  return fullWidthKatakana.normalize('NFC');
}

/**
 * Normalizes Kana reading strings.
 * Returns empty string if undefined, null, or whitespace-only.
 */
export function normalizeKana(kana?: string | null): string {
  if (!kana) return '';
  return normalizeJapanese(kana);
}

/**
 * Normalizes Vietnamese text for storage and comparison:
 * 1. Trims leading/trailing whitespace.
 * 2. Collapses internal whitespace sequences.
 * 3. Normalizes Unicode to NFC (resolves decomposed vs composed diacritics).
 */
export function normalizeVietnamese(text: string): string {
  if (!text) return '';
  const trimmed = text.trim();
  const collapsed = trimmed.replace(/\s+/g, ' ');
  return collapsed.normalize('NFC');
}

/**
 * Authoritative pool deduplication key:
 * "normalized(japanese) + '::' + normalized(kana || '')"
 * Used across multi-lesson study aggregation and lesson import deduplication.
 */
export function getDeduplicationKey(japanese: string, kana?: string | null): string {
  return `${normalizeJapanese(japanese)}::${normalizeKana(kana)}`;
}

/**
 * Case-insensitive, NFC-normalized Vietnamese definition comparison for written quiz evaluation.
 */
export function matchesVietnamese(input: string, acceptedDefinitions: string[]): boolean {
  const normalizedInput = normalizeVietnamese(input).toLowerCase();
  if (!normalizedInput) return false;
  return acceptedDefinitions.some(
    (def) => normalizeVietnamese(def).toLowerCase() === normalizedInput
  );
}

/**
 * Evaluates written Japanese answer for vi_to_text quiz mode.
 * Learner may provide either the Japanese expression or the Kana reading.
 */
export function matchesJapaneseOrKana(
  input: string,
  targetJapanese: string,
  targetKana?: string | null
): boolean {
  const normalizedInput = normalizeJapanese(input);
  if (!normalizedInput) return false;

  if (normalizedInput === normalizeJapanese(targetJapanese)) {
    return true;
  }

  if (targetKana && normalizedInput === normalizeKana(targetKana)) {
    return true;
  }

  return false;
}
