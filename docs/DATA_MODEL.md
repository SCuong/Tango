# Tango — Data Model Specification

This document defines the core data schemas, TypeScript interfaces, and client-side persistence models for Tango.

---

## 1. Architectural Entity Relationship

Vocabulary and Kanji lessons share the exact same item structure and feed into a single unified quiz engine.

```mermaid
erDiagram
    LESSON ||--|{ STUDY_ITEM : contains
    STUDY_ITEM ||--o{ ITEM_PROGRESS : tracks
    QUIZ_CONFIG ||--|{ LESSON : selects_multiple
    QUIZ_SESSION ||--|{ QUIZ_QUESTION : generates
    QUIZ_QUESTION }|--|| STUDY_ITEM : references
```

---

## 2. Core Study Item & Lesson Models

### 2.1 TypeScript Interfaces

```typescript
/**
 * Category distinguishing the curriculum area.
 * Vocabulary and Kanji share the identical item schema and quiz engine.
 */
export type StudyCategory = 'vocabulary' | 'kanji';

/**
 * Shared core study item for both Vocabulary and Kanji lessons.
 */
export interface StudyItem {
  id: string;              // Stable unique identifier, e.g. "kanji-01-001" or "vocab-01-001"
  japanese: string;        // Japanese word/compound, e.g. "旅行" or "ファストフード"
  kana: string;            // Reading in Hiragana/Katakana, e.g. "りょこう" or "ふぁすとふーど"
  hanViet?: string;        // Optional Sino-Vietnamese reading, e.g. "LỮ HÀNH" (omitted for loanwords)
  vietnamese: string[];    // Array of accepted Vietnamese definitions, e.g. ["du lịch"]
}
// Note: See docs/IMPORT_SPEC.md for import data requirements and field optionality considerations.

/**
 * Standard Lesson container used for both Vocabulary and Kanji categories.
 */
export interface Lesson {
  id: string;              // Unique lesson ID, e.g. "vocab-lesson-01" or "kanji-lesson-01"
  category: StudyCategory; // 'vocabulary' | 'kanji'
  title: string;           // Display title, e.g. "Bài 1"
  subtitle?: string;       // Optional subtitle, e.g. "Đồ ăn nhanh" or "Giao thông & Đi lại"
  items: StudyItem[];      // Flat list of study items
}
```

### 2.2 JSON Schema Examples

#### Example 1: Kanji Lesson Item (with Hán Việt)
```json
{
  "id": "kanji-lesson-01-001",
  "japanese": "旅行",
  "kana": "りょこう",
  "hanViet": "LỮ HÀNH",
  "vietnamese": ["du lịch"]
}
```

#### Example 2: Vocabulary Lesson Item without Hán Việt (Loanword)
```json
{
  "id": "vocab-lesson-01-001",
  "japanese": "ファストフード",
  "kana": "ふぁすとふーど",
  "vietnamese": ["đồ ăn nhanh"]
}
```
*Rule: When `hanViet` is omitted, UI components check `if (item.hanViet)` and conditionally omit the Hán Việt block entirely.*

#### Example 3: Full Lesson File (`src/data/kanji/lesson-01.json`)
```json
{
  "id": "kanji-lesson-01",
  "category": "kanji",
  "title": "Bài 1",
  "subtitle": "Hành động & Đi lại",
  "items": [
    {
      "id": "kanji-01-001",
      "japanese": "旅行",
      "kana": "りょこう",
      "hanViet": "LỮ HÀNH",
      "vietnamese": ["du lịch"]
    },
    {
      "id": "kanji-01-002",
      "japanese": "実際",
      "kana": "じっさい",
      "hanViet": "THỰC TẾ",
      "vietnamese": ["thực tế"]
    },
    {
      "id": "kanji-01-003",
      "japanese": "礼儀",
      "kana": "れいぎ",
      "hanViet": "LỄ NGHI",
      "vietnamese": ["lễ nghi", "phép lịch sự"]
    },
    {
      "id": "kanji-01-004",
      "japanese": "景観",
      "kana": "けいかん",
      "hanViet": "CẢNH QUAN",
      "vietnamese": ["cảnh quan"]
    }
  ]
}
```

---

## 3. Quiz & Practice Session Models

### 3.1 Multi-Lesson Quiz Configuration

Tango supports testing any arbitrary set of lessons—single lesson, multi-lesson, or a mixed test across Vocabulary and Kanji:

```typescript
export type QuestionType =
  | 'kana_to_kanji'      // Prompt: りょこう → Choose 旅行
  | 'kanji_to_vi'        // Prompt: 旅行 → Choose du lịch
  | 'vi_to_kanji'        // Prompt: du lịch → Choose 旅行
  | 'vi_to_text';        // Prompt: du lịch → Type 旅行 or りょこう

export type QuizMode = 'practice' | 'test';

export interface QuizConfig {
  lessonIds: string[];            // Array of selected lesson IDs (supports 1 to N lessons)
  mode: QuizMode;                 // 'practice' or 'test'
  questionCount: number | 'all';  // 10, 20, 40, or 'all'
  allowedTypes: QuestionType[];   // Enabled question formats
}
```

### 3.2 Active Question & Session State

```typescript
export interface QuizQuestion {
  id: string;                     // Question identifier in session, e.g. "q-1"
  type: QuestionType;
  prompt: string;                 // The prompt string displayed
  subPrompt?: string;             // Optional reading aid or instruction
  correctAnswer: string;          // Correct choice text or expected input
  options?: string[];             // 4 choices for multiple choice questions
  targetItem: StudyItem;          // Full reference to the underlying StudyItem
  userAnswer?: string;            // Answer submitted by learner
  isCorrect?: boolean;            // Evaluation flag
}

export interface QuizSessionResult {
  sessionId: string;
  lessonIds: string[];            // IDs of lessons included in this session
  mode: QuizMode;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number;               // 0 to 100 percentage
  bestStreak: number;
  timeSpentSeconds: number;
  missedItemIds: string[];        // StudyItem IDs failed during this quiz
  completedAt: string;            // ISO 8601 timestamp
}
```

---

## 4. Local Learning Progress & Mistake Tracking

Tracking user retention is handled via a unified, client-side store keyed by `StudyItem.id`. Because Vocabulary and Kanji items use the same item schema and ID convention, progress tracking is completely uniform.

```typescript
export interface ItemProgress {
  itemId: string;                 // References StudyItem.id
  totalAttempts: number;          // Total times tested
  correctCount: number;           // Times answered correctly
  incorrectCount: number;         // Times answered incorrectly
  lastMistakeAt?: string;         // ISO timestamp of last incorrect response
  lastStudiedAt: string;          // ISO timestamp of last interaction
  isMarkedWeak: boolean;          // Flagged if error rate exceeds threshold
}

export interface UserStudyState {
  version: number;                // Schema version for future migrations
  progressByItem: Record<string, ItemProgress>;
  recentResults: QuizSessionResult[];
}
```

### Mistake Review Lifecycle
1. When any question is answered incorrectly, `targetItem.id` is added to `QuizSessionResult.missedItemIds`.
2. Clicking **"Ôn lại từ sai" (Review Missed Words)** gathers the corresponding `StudyItem` records across all tested lessons and launches a focused practice session exclusively for those items.
3. Once an item is answered correctly in subsequent review sessions, `isMarkedWeak` is cleared.
