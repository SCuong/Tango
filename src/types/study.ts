/**
 * Category distinguishing the curriculum area.
 * Vocabulary and Kanji share the identical item schema and quiz engine.
 */
export type StudyCategory = 'vocabulary' | 'kanji';

/**
 * Organizational container representing a textbook or curriculum.
 * See docs/CONTENT_LIBRARY_SPEC.md for complete specifications.
 */
export interface StudyBook {
  id: string;              // Opaque collision-safe unique ID (e.g. "book_" + crypto.randomUUID())
  title: string;           // Display title, e.g. "中級へ行こう" (Required, non-empty; duplicates allowed)
  coverImageId?: string;   // Reference ID for cover binary Blob in IndexedDB (Optional)
  createdAt: string;       // ISO 8601 creation timestamp
  updatedAt: string;       // ISO 8601 last modified timestamp
}

/**
 * Shared core study item for both Vocabulary and Kanji lessons.
 * Fully synchronized with forgiving import rules (see docs/IMPORT_SPEC.md).
 */
export interface StudyItem {
  id: string;              // Stable unique identifier, e.g. "kanji-01-001" or "vocab-01-001"
  japanese: string;        // Japanese word/compound, e.g. "旅行" or "ファストフード" (Required)
  kana?: string;           // Optional reading in Hiragana/Katakana, e.g. "りょこう" or "ふぁすとふーど"
  hanViet?: string;        // Optional Sino-Vietnamese reading, e.g. "LỮ HÀNH" (omitted for loanwords)
  vietnamese: string[];    // Array of accepted Vietnamese definitions (allowed to be empty [])
}

/**
 * Standard Lesson container used for both Vocabulary and Kanji categories.
 * May optionally belong to a StudyBook via bookId.
 */
export interface Lesson {
  id: string;              // Unique lesson ID, e.g. "vocab-lesson-01" or "kanji-lesson-01"
  bookId?: string;         // Optional reference to StudyBook.id (unassigned lessons remain valid)
  category: StudyCategory; // 'vocabulary' | 'kanji'
  title: string;           // Display title, e.g. "Bài 1"
  subtitle?: string;       // Optional subtitle, e.g. "Đồ ăn nhanh" or "Giao thông & Đi lại"
  items: StudyItem[];      // Flat list of study items
}
