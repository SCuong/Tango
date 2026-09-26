# Tango — Product Specification (MVP)

This specification defines the functional requirements and user experience for the Minimum Viable Product (MVP) of Tango.

---

## 1. Study Hierarchy, Categories & Shared Study Item Model

Tango organizes study content under a clean, 4-tier learning hierarchy (detailed in [`docs/CONTENT_LIBRARY_SPEC.md`](./CONTENT_LIBRARY_SPEC.md)):
```text
Study Book / Giáo trình (e.g. 中級へ行こう, Mimikara)
        ↓
  Study Category ([IconBook] Từ vựng / [IconWriting] Hán tự)
        ↓
     Lesson (e.g. Bài 1, Bài 2)
        ↓
    StudyItem (Shared core item model)
```

Study content is partitioned into two primary categories:
- **[IconBook] Từ vựng (Vocabulary):** General words, idioms, loanwords, and phrases.
- **[IconWriting] Hán tự (Kanji):** Kanji vocabulary compounds and readings.

These are distinct in user navigation, but **technically identical** in data representation.

### 1.1 Shared Item Structure

Every study item—whether from a Vocabulary or Kanji lesson—conforms to the exact same schema:

| Field | Type | Requirement | Example 1 (Kanji Item) | Example 2 (Katakana Item) |
|---|---|---|---|---|
| `id` | `string` | Required | `"kanji-lesson-01-001"` | `"vocab-lesson-01-001"` |
| `japanese` | `string` | Required | `"旅行"` | `"ファストフード"` |
| `kana` | `string` | **Optional** (`kana?: string`) | `"りょこう"` | `"ふぁすとふーど"` |
| `hanViet` | `string` | **Optional** (`hanViet?: string`) | `"LỮ HÀNH"` | *(omitted)* |
| `vietnamese` | `string[]` | Required array (allowed to be empty `[]`) | `["du lịch"]` | `["đồ ăn nhanh"]` |

### 1.2 Clean Presentation Rule
- When `hanViet` is absent (such as in Katakana loanwords or words without Sino-Vietnamese roots), the UI **must completely hide** the Hán Việt section.
- **Never display empty placeholders** such as *"N/A"*, *"None"*, or *"Không có"*.

### 1.3 MVP Simplicity Guard: No Individual Kanji Trees
- The MVP does **NOT** require or use individual character breakdowns (e.g. `{ character: "観", hanViet: "QUAN" }`).
- Kanji lessons are treated as flat lists of `StudyItem` compounds, not complex hierarchical trees or character relationship graphs. This keeps data authoring friction-free and the client architecture lean.

---

## 2. Lesson Structure & Study Books Organization

Both study categories share the identical `Lesson` model, optionally associated with a `StudyBook`:

```typescript
type StudyCategory = 'vocabulary' | 'kanji';

interface Lesson {
  id: string;
  bookId?: string;     // Optional reference to StudyBook.id
  category: StudyCategory;
  title: string;       // e.g., "Bài 1"
  subtitle?: string;   // e.g., "Du lịch & Giao thông" or "Chủ đề thức ăn nhanh"
  items: StudyItem[];
}
```

### Visual Separation, Technical Reuse
- **Vocabulary Section:** Displays Vocabulary lessons (`Bài 1`, `Bài 2`, `Bài 3`...).
- **Kanji Section:** Displays Kanji lessons (`Bài 1`, `Bài 2`, `Bài 3`...).
- Both categories reuse the **exact same** item components, lesson list views, progress models, and quiz engine.
- Duplicate implementations (e.g., `VocabularyQuiz` vs. `KanjiQuiz`) are strictly prohibited.
- For complete specifications on Study Books, book cover storage in IndexedDB, and the separate Content Management flow, see [`docs/CONTENT_LIBRARY_SPEC.md`](./CONTENT_LIBRARY_SPEC.md).

---

## 3. Quiz Question Types (MVP)

All four question types operate identically on items from either category:

### Type 1: Kana → Japanese (`kana_to_japanese`)
- **Prompt:** `りょこう`
- **Goal:** Identify the correct Japanese written form.
- **Options (4 choices — rendered without A/B/C/D indices):**
  - 実際
  - **旅行** *(Correct)*
  - 礼儀
  - 景観

### Type 2: Japanese → Vietnamese (`japanese_to_vi`)
- **Prompt:** `旅行` (`りょこう`)
- **Goal:** Select the matching Vietnamese meaning.
- **Options (4 choices — rendered without A/B/C/D indices):**
  - thực tế
  - **du lịch** *(Correct)*
  - lễ nghi
  - cảnh quan

### Type 3: Vietnamese → Japanese (`vi_to_japanese`)
- **Prompt:** `du lịch`
- **Goal:** Select the corresponding Japanese word.
- **Options (4 choices — rendered without A/B/C/D indices):**
  - 景観
  - 礼儀
  - **旅行** *(Correct)*
  - 実際

### Type 4: Vietnamese → Written Answer (`vi_to_text`)
- **Prompt:** `du lịch`
- **User Types:**
  - Japanese Kanji: `旅行`
  - Or reading (depending on test configuration): `りょこう`
- **Validation:** Normalized comparison, trimming whitespace.

---

## 4. Critical Feature: Mixed Multi-Lesson Tests (Kiểm tra tổng hợp)

A fundamental capability of Tango is enabling learners to combine **any combination of lessons** into a single cohesive test session.

### 4.1 Supported Combinations
- **Single Lesson:** e.g., Vocabulary Bài 1 OR Kanji Bài 1.
- **Same-Category Multi-Lesson:** e.g., Kanji Bài 1 + Kanji Bài 3.
- **Cross-Category Mixed Test:**
  - Vocabulary Bài 1 + Kanji Bài 1
  - Vocabulary Bài 1 + Vocabulary Bài 2 + Kanji Bài 1 + Kanji Bài 2

### 4.2 Unified Study Pool Flow
```
Selected Lesson IDs: ["vocab-01", "vocab-02", "kanji-01"]
                         ↓
               Collect all StudyItems
                         ↓
   Deduplicate by normalized Japanese + Kana
                         ↓
            Build Question Pool (shuffled)
                         ↓
       Slice to requested count (10 / 20 / 40 / All)
                         ↓
             Shared Single Quiz Engine
```

> **Deduplication Key:** Because the same Japanese vocabulary expression may appear in both Vocabulary and Kanji lessons (with different item IDs), deduplication must **not** rely solely on `item.id`. Instead, the study pool deduplicates items using `normalized(japanese) + '::' + normalized(kana || '')`.

---

## 5. Study Modes

### 5.1 Practice Mode (Luyện tập tự do)
- **Purpose:** Low-stress learning and discovery.
- **Behavior:**
  - Immediate feedback after each question.
  - Words answered incorrectly are automatically re-queued later in the session until mastered.
  - No penalties or game-over states.
  - Freely exitable at any point.

### 5.2 Quick Test (Kiểm tra tính điểm)
- **Purpose:** Assessment, time-boxed retention check.
- **Question Counts:** `[ 10 câu ]` | `[ 20 câu ]` | `[ 40 câu ]` | `[ Tất cả ]`
- **HUD Elements:**
  - Question progress (`4 / 20`)
  - Running score
  - Streak counter (`🔥 5`)
  - Elapsed time counter

---

## 6. Feedback & Explanation Mechanics

### 6.1 Correct Answer Feedback
- Rapid confirmation (brief emerald indicator).
- Displays word, reading, and primary meaning.
- Auto-advances quickly (750ms) or immediately on `Enter`/`Space`/Tap.

### 6.2 Incorrect Answer Explanation
When an incorrect answer is submitted, the study flow pauses to present an educational breakdown:

**Example A (Item with Hán Việt):**
```text
❌ Chưa chính xác

旅行
りょこう

Hán Việt:
LỮ HÀNH

Nghĩa:
du lịch

[ Đã hiểu — Tiếp tục (Enter) ]
```

**Example B (Item without Hán Việt):**
```text
❌ Chưa chính xác

ファストフード
ふぁすとふーど

Nghĩa:
đồ ăn nhanh

[ Đã hiểu — Tiếp tục (Enter) ]
```

*Note: For Example B, the Hán Việt section disappears entirely. No placeholder text.*

### 6.3 Optional Sound Feedback (Off by Default)
- **Status:** Disabled (**OFF**) by default. Sounds are never played until explicitly enabled by the user in Settings (`Sound effects: On`).
- **Characteristics:** Short (< 200ms), soft, non-intrusive tactile tones matching Tango's Soft Claymorphism personality (gentle ceramic/wooden tap for correct, soft low chime for incorrect).
- **Non-Blocking & Visual Parity:** Sounds never delay question transitions, and visual indicators remain 100% complete and authoritative. No loud arcade sounds, voices, or repetitive navigation clicks.
- **Persistence:** Stored locally in `tango_v1_preferences.soundEnabled`.

---

## 7. End of Quiz & Mistake Review

- **Completion Summary:** Score, accuracy %, highest streak, elapsed time.
- **Missed Items List:** Displayed cleanly with readings and meanings.
- **Core Action — "Review Missed Words" (Ôn lại từ sai):**
  - Instantly spawns a focused practice session consisting *strictly* of the items answered incorrectly during the quiz, regardless of which lessons they originated from.

---

## 8. Lesson Import (Core MVP Feature)

Lesson import is a primary, first-class feature of the Tango MVP, enabling learners to immediately import classroom and textbook materials into either study category:
- **Unified Processing:** Both Vocabulary and Kanji lessons use the identical importer, parser, and validation pipeline.
- **Target Book Assignment:** Lessons may be assigned to an existing Study Book or left unassigned (`Không thuộc giáo trình`).
- **Safe Administrative Placement:** The importer is accessed intentionally through Content Management under Settings (keeping the Home screen study-focused).
- **Flexible Delimiters:** Supports Tab, Semicolon (`;`), Pipe (`|`), and Comma (`,`) with RFC 4180 CSV compliance.
- **Multiple Formats:** Direct text paste, `.txt`, `.csv`, `.md` (Markdown tables), and `.xlsx` (Excel).
- **Forgiving & Non-Blocking:** Automatically removes exact duplicates, safely merges complementary items, flags conflicts, and issues non-blocking warnings (`⚠`) for missing optional fields.
- **Authoritative Specification:** See [`docs/IMPORT_SPEC.md`](./IMPORT_SPEC.md) for the complete parsing pipeline, UI wireframes, duplicate rules, and template schemas.

---

## 9. Scope Guard (Explicitly Excluded from MVP)

The following items are strictly out of scope:
- Individual Kanji character relationship graphs, trees, or radical decompositions
- Separate quiz engines or duplicated UI components for Vocabulary vs. Kanji
- Soft delete, recycle bin, trash recovery workflows, or archive systems (Tango uses explicit hard delete only)
- Social book sharing, public marketplace, or ISBN/metadata lookups
- AI chatbots, external LLM APIs, or AI content generation
- Backend servers, authentication, and cloud synchronization
- Audio synthesis, voice recognition, or handwriting canvas
- Complex state libraries or unneeded third-party dependencies
