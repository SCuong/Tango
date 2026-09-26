# Tango — Data Model Specification

This document defines the core data schemas, TypeScript interfaces, and client-side persistence models for Tango.

---

## 1. Architectural Entity Relationship

Vocabulary and Kanji lessons share the exact same item structure and feed into a single unified quiz engine. Study Books act as optional organizational containers above lessons (see [`docs/CONTENT_LIBRARY_SPEC.md`](./CONTENT_LIBRARY_SPEC.md)).

```mermaid
erDiagram
    STUDY_BOOK |o--o{ LESSON : organizes
    LESSON ||--|{ STUDY_ITEM : contains
    STUDY_ITEM ||--o{ ITEM_PROGRESS : tracks
    QUIZ_CONFIG ||--|{ LESSON : selects_multiple
    QUIZ_SESSION ||--|{ QUIZ_QUESTION : generates
    QUIZ_QUESTION }|--|| STUDY_ITEM : references
```

*Cardinality Note: One `StudyBook` organizes zero or many `Lesson`s (`o{`). One `Lesson` belongs to zero or one `StudyBook` (`|o`). Lessons without a `bookId` belong to the neutral group `Không thuộc giáo trình` (Unassigned).*

---

## 2. Core Study Models: StudyBook, Lesson, & StudyItem

### 2.1 TypeScript Interfaces

```typescript
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
 * ID & Title Independence Rules:
 * - StudyBook IDs are opaque, collision-safe identifiers (e.g. generated via browser crypto.randomUUID()).
 * - IDs are NEVER derived from the title. Renaming a book never alters its id or breaks Lesson.bookId links.
 * - Duplicate titles are explicitly permitted (learners may track separate volumes or editions).
 * - User-created lessons/items also receive opaque collision-safe IDs; bundled seed files use stable IDs.
 */

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
  | 'kana_to_japanese'   // Prompt: りょこう → Choose 旅行
  | 'japanese_to_vi'     // Prompt: 旅行 → Choose du lịch
  | 'vi_to_japanese'     // Prompt: du lịch → Choose 旅行
  | 'vi_to_text';        // Prompt: du lịch → Type 旅行 or りょこう

export type QuizMode = 'practice' | 'test';

export interface QuizConfig {
  lessonIds: string[];            // Array of selected lesson IDs (supports 1 to N lessons)
  mode: QuizMode;                 // 'practice' or 'test'
  questionCount: number | 'all';  // Candidate fixed counts (10, 20, 40) or 'all'
  allowedTypes: QuestionType[];   // Enabled question formats
}
```

### 3.2 Question Count & Pool Generation Rules

#### Canonical Pool Resolution Pipeline & Definition of N
```text
selected lessonIds
         ↓
collect StudyItems from tango_v1_lessons (in deterministic lesson/item order)
         ↓
deduplicate by normalized Japanese + Kana into lexical groups:
normalized(japanese) + '::' + normalized(kana || '')
         ↓
filter groups against enabled QuestionTypes:
  • Target field availability (e.g. non-empty Vietnamese meaning, Kana reading)
  • Distractor contract for multiple-choice types (must yield 3 distinct distractors from other groups)
         ↓
eligible lexical groups
         ↓
         N
```

> **Canonical Definition of N:**
> `N` is strictly defined as the number of **deduplicated lexical groups supporting at least one enabled compatible QuestionType**.
> 
> **Distinction Between Selected Items and N:** The raw selected count represents all content in the chosen lessons before filtering (e.g. `79 mục đã chọn`). `N` represents the eligible questions after deduplication and type filtering (e.g. `72 câu khả dụng`). Fixed count buttons and `Tất cả (N)` strictly use `N`, never the raw selected count.

#### Cross-Lesson Deduplication & Lexical Groups
- **Deduplication Key:** `normalized(japanese) + '::' + normalized(kana || '')`. Items sharing this key are treated as one **deduplicated lexical group**.
- **No Synthetic Merging:** Tango does **not** synthesize merged StudyItems at runtime.
- **Group Compatibility:** For any candidate `QuestionType`, a lexical group is compatible if at least one real member of that group satisfies the field requirements for that type.
- **Deterministic Target Selection:** When generating a question for a compatible group, the first compatible real `StudyItem` in deterministic selected-lesson/item order serves as `targetItem`. This prevents $N$ from fluctuating based on which duplicate is encountered first, while preserving valid, real `StudyItem.id` references for mistake tracking (`missedItemIds`) and progress persistence (`ItemProgress`).

#### Multiple-Choice Distractor Contract
For multiple-choice question formats (`kana_to_japanese`, `japanese_to_vi`, `vi_to_japanese`):
- A generated question must contain **exactly 4 distinct visible option strings**: 1 correct answer and 3 distinct distractors.
- Distractors are drawn **strictly from other deduplicated lexical groups** within the currently selected lesson pool.
- Tango **never** sources distractors from unselected lessons and **never** invents synthetic or placeholder answers.
- A multiple-choice `QuestionType` is compatible for a target group only when the selected pool contains enough distinct answer values to supply **3 distinct distractors** for that type.
- Therefore, question-type compatibility strictly requires both:
  1. Target item field availability, and
  2. Pool ability to generate the required 4 distinct option strings.

#### Vietnamese Primary Meaning & Written-Answer Rules
- **Primary Meaning:** For quiz prompts and multiple-choice answer strings, the primary Vietnamese meaning is defined as the **first non-empty normalized entry in `StudyItem.vietnamese`**. The complete `vietnamese[]` array remains accessible for explanation sheets and detailed displays.
- An item with no non-empty Vietnamese definition is incompatible with `japanese_to_vi`, `vi_to_japanese`, and `vi_to_text`.
- **Written-Answer Mode (`vi_to_text`):**
  - Prompt: Primary Vietnamese meaning.
  - Accepted inputs: Normalized `StudyItem.japanese`, and also normalized `StudyItem.kana` when Kana exists.
  - Requires no separate configuration flag.
  - Has no multiple-choice option buttons (`options` is undefined).

#### Authoritative `questionCount: 'all'` Rule
- Selecting `questionCount: 'all'` generates **exactly one initial question per eligible lexical group** ($N$ eligible groups = $N$ initial questions).
- It does **NOT** multiply by the number of enabled question types (e.g., 52 eligible groups = 52 initial questions, never 52 × 4 = 208).
- For each group, exactly **ONE** enabled compatible QuestionType is selected:
  - If `kana` is missing across the group: skips `kana_to_japanese`.
  - If no non-empty `vietnamese` exists across the group: skips `japanese_to_vi`, `vi_to_japanese`, and `vi_to_text`.
  - If 3 distinct distractors cannot be formed from the pool: skips that multiple-choice type.
  - If a group supports none of the enabled question types, it is excluded from `N`.
- *Practice Mode Note:* In Practice Mode, missed items may be re-queued after the initial question set until answered correctly, so total interactions in the session may exceed `N`.

#### Dynamic Fixed Count Options
Candidate fixed question count options are `10`, `20`, `40`. The UI only renders fixed count buttons where:
```text
candidate <= N
```
- Example $N = 7$: `[ Tất cả (7) ]`
- Example $N = 16$: `[ 10 ]  [ Tất cả (16) ]`
- Example $N = 27$: `[ 10 ]  [ 20 ]  [ Tất cả (27) ]`
- Example $N = 81$: `[ 10 ]  [ 20 ]  [ 40 ]  [ Tất cả (81) ]`
- Disabled or impossible count buttons are never rendered.

#### The N = 0 State (Empty / Incompatible Selection)
If $N = 0$:
- Do **NOT** render `Tất cả (0)`
- Do **NOT** render fixed question count buttons
- Disable or hide the Start Test action appropriately
- Render a clear, non-blocking explanatory empty state:
  - **Vietnamese:** `"Không có câu hỏi phù hợp với các loại câu hỏi đã chọn."`
  - **English:** `"No eligible questions for the selected question types."`
- The user can freely toggle question types, change selected lessons, or navigate back safely. No disruptive error modals are used.

### 3.3 Active Question & Session State

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

## 4. Local Learning Progress & Persistence Architecture

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

export type AppTheme = 'light' | 'dark' | 'sakura';
export type AppLanguage = 'vi' | 'en';

export interface UserPreferences {
  theme: AppTheme;               // 'light' (default) | 'dark' | 'sakura'
  language: AppLanguage;         // 'vi' (default) | 'en'
  soundEnabled: boolean;         // Default: false (strictly OFF until user enables)
}

/**
 * Aggregated runtime client-side state in TypeScript memory.
 * Physical persistence is partitioned across dedicated storage keys.
 */
export interface UserStudyState {
  version: number;                // Schema version for future migrations
  preferences: UserPreferences;
  books: Record<string, StudyBook>; // All textbooks keyed by StudyBook.id
  lessons: Record<string, Lesson>;  // Canonical mutable Lesson store
  progressByItem: Record<string, ItemProgress>;
  recentResults: QuizSessionResult[];
}
```

### 4.1 Physical Storage Keys (Partitioned Persistence)
`UserStudyState` is an aggregated in-memory model. Browser storage is intentionally partitioned across distinct keys:
- `tango_v1_books`: `Record<string, StudyBook>` in `localStorage`
- `tango_v1_lessons`: Canonical mutable `Record<string, Lesson>` in `localStorage` (all seeded, imported, and user-created lessons)
- `tango_v1_progress`: `Record<string, ItemProgress>` in `localStorage`
- `tango_v1_history`: `QuizSessionResult[]` in `localStorage`
- `tango_v1_preferences`: `UserPreferences` in `localStorage`
- `tango_v1_library_init`: Initialization marker in `localStorage` ensuring bundled seed data is copied only once
- `tango_v1_covers_idb`: Binary book cover `Blob`s in browser IndexedDB (object store)

### 4.2 Deterministic Quiz History Cleanup Rule
`QuizSessionResult` records do not store full question details; they persist lightweight summary metadata (`sessionId`, `lessonIds`, `missedItemIds`, score, streak, time, completedAt). When a lesson or StudyBook is permanently deleted, Tango scans `tango_v1_history` and deletes any `QuizSessionResult` where:
- `session.lessonIds` contains an affected lesson ID, or
- `session.missedItemIds` contains an affected StudyItem ID.

Any affected history session is **deleted entirely** rather than partially rewritten (preserving partial summaries with missing lesson context would corrupt score and accuracy records). Unaffected quiz histories remain untouched.

### 4.3 Mistake Review Lifecycle
1. When any question is answered incorrectly, `targetItem.id` is added to `QuizSessionResult.missedItemIds`.
2. Clicking **"Ôn lại từ sai" (Review Missed Words)** gathers the corresponding `StudyItem` records across all tested lessons and launches a focused practice session exclusively for those items.
3. Once an item is answered correctly in subsequent review sessions, `isMarkedWeak` is cleared.
