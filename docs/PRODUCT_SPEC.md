# Tango — Product Specification (MVP)

This specification defines the functional requirements and user experience for the Minimum Viable Product (MVP) of Tango.

---

## 1. Study Categories & Shared Study Item Model

Tango organizes study content into two primary categories:
- **📘 Từ vựng (Vocabulary):** General words, idioms, loanwords, and phrases.
- **漢 Hán tự (Kanji):** Kanji vocabulary compounds and readings.

These are distinct in user navigation, but **technically identical** in data representation.

### 1.1 Shared Item Structure

Every study item—whether from a Vocabulary or Kanji lesson—conforms to the exact same schema:

| Field | Type | Requirement | Example 1 (Kanji Item) | Example 2 (Katakana Item) |
|---|---|---|---|---|
| `id` | `string` | Required | `"kanji-lesson-01-001"` | `"vocab-lesson-01-001"` |
| `japanese` | `string` | Required | `"旅行"` | `"ファストフード"` |
| `kana` | `string` | Required | `"りょこう"` | `"ふぁすとふーど"` |
| `hanViet` | `string` | **Optional** | `"LỮ HÀNH"` | *(omitted)* |
| `vietnamese` | `string[]` | Required | `["du lịch"]` | `["đồ ăn nhanh"]` |

### 1.2 Clean Presentation Rule
- When `hanViet` is absent (such as in Katakana loanwords or words without Sino-Vietnamese roots), the UI **must completely hide** the Hán Việt section.
- **Never display empty placeholders** such as *"N/A"*, *"None"*, or *"Không có"*.

### 1.3 MVP Simplicity Guard: No Individual Kanji Trees
- The MVP does **NOT** require or use individual character breakdowns (e.g. `{ character: "観", hanViet: "QUAN" }`).
- Kanji lessons are treated as flat lists of `StudyItem` compounds, not complex hierarchical trees or character relationship graphs. This keeps data authoring friction-free and the client architecture lean.

---

## 2. Lesson Structure & Organization

Both study categories share the identical `Lesson` model:

```typescript
type StudyCategory = 'vocabulary' | 'kanji';

interface Lesson {
  id: string;
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

---

## 3. Quiz Question Types (MVP)

All four question types operate identically on items from either category:

### Type 1: Kana → Japanese
- **Prompt:** `りょこう`
- **Goal:** Identify the correct Japanese written form.
- **Options (4 choices):**
  - A. 実際
  - B. **旅行** *(Correct)*
  - C. 礼儀
  - D. 景観

### Type 2: Japanese → Vietnamese
- **Prompt:** `旅行` (`りょこう`)
- **Goal:** Select the matching Vietnamese meaning.
- **Options (4 choices):**
  - A. thực tế
  - B. **du lịch** *(Correct)*
  - C. lễ nghi
  - D. cảnh quan

### Type 3: Vietnamese → Japanese
- **Prompt:** `du lịch`
- **Goal:** Select the corresponding Japanese word.
- **Options (4 choices):**
  - A. 景観
  - B. 礼儀
  - C. **旅行** *(Correct)*
  - D. 実際

### Type 4: Vietnamese → Written Answer (Text Input)
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
               Deduplicate by item ID
                         ↓
            Build Question Pool (shuffled)
                         ↓
       Slice to requested count (10 / 20 / 40 / All)
                         ↓
             Shared Single Quiz Engine
```

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
```
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
```
❌ Chưa chính xác

ファストフード
ふぁすとふーど

Nghĩa:
đồ ăn nhanh

[ Đã hiểu — Tiếp tục (Enter) ]
```

*Note: For Example B, the Hán Việt section disappears entirely. No placeholder text.*

---

## 7. End of Quiz & Mistake Review

- **Completion Summary:** Score, accuracy %, highest streak, elapsed time.
- **Missed Items List:** Displayed cleanly with readings and meanings.
- **Core Action — "Review Missed Words" (Ôn lại từ sai):**
  - Instantly spawns a focused practice session consisting *strictly* of the items answered incorrectly during the quiz, regardless of which lessons they originated from.

---

## 8. Future Import Concept (Roadmap)

To support custom content seamlessly without architectural friction:
- **Import Format:** Line-delimited plaintext rows:
  ```text
  旅行 | りょこう | LỮ HÀNH | du lịch
  実際 | じっさい | THỰC TẾ | thực tế
  礼儀 | れいぎ | LỄ NGHI | lễ nghi
  景観 | けいかん | CẢNH QUAN | cảnh quan
  ファストフード | ふぁすとふーど | | đồ ăn nhanh
  ```
- During import, the user selects whether the lesson belongs to **Vocabulary** or **Kanji**.
- *Status:* Importer is out of scope for the current MVP implementation, but the data schemas are designed to ingest this format cleanly.

---

## 9. Scope Guard (Explicitly Excluded from MVP)

The following items are strictly out of scope:
- Individual Kanji character relationship graphs, trees, or radical decompositions
- Separate quiz engines or duplicated UI components for Vocabulary vs. Kanji
- AI chatbots, external LLM APIs, or AI content generation
- Backend servers, authentication, and cloud synchronization
- Audio synthesis, voice recognition, or handwriting canvas
- Complex state libraries or unneeded third-party dependencies
