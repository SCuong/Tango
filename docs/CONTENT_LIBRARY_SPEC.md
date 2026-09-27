# Tango — Content Library & Study Books Specification

This document is the authoritative specification for user-managed **Study Books (Giáo trình)**, the **Navigation Hierarchy**, **Content Management (Quản lý nội dung)**, and **Safe Content Deletion** in Tango.

---

## 1. Core Concept: Study Books / Giáo trình

Tango supports multiple study textbooks because Japanese learners typically study several curricula concurrently (for example, grammar/vocabulary from *中級へ行こう* alongside listening/vocabulary from *Mimikara*).

### 1.1 Structural Hierarchy

The product hierarchy is organized as follows:

```text
Study Book / Giáo trình
        ↓
  Study Category
(Vocabulary / Kanji)
        ↓
     Lesson
        ↓
    StudyItem
```

Conceptually:

```text
中級へ行こう
├── [IconBook] Từ vựng
│   ├── Bài 1
│   ├── Bài 2
│   └── Bài 3
└── [IconWriting] Hán tự
    ├── Bài 1
    ├── Bài 2
    └── Bài 3

Mimikara
├── [IconBook] Từ vựng
│   ├── Bài 1
│   └── ...
└── [IconWriting] Hán tự
    ├── Bài 1
    └── ...

Không thuộc giáo trình (Unassigned)
├── [IconBook] Từ vựng
│   └── Bài tự tạo
└── [IconWriting] Hán tự
    └── Bài tổng hợp
```

### 1.2 Core Architectural Principles
1. **Organizational Containers Only:** Study Books are metadata containers for grouping lessons. They do **not** require their own quiz engine or specialized data structures.
2. **Shared Foundation Preserved:** Lessons inside any Study Book adhere to the identical `Lesson` and `StudyItem` schemas defined in [`docs/DATA_MODEL.md`](./DATA_MODEL.md) and execute via the existing shared quiz runner.
3. **No Cross-Book Duplication:** Lessons belong to at most one Study Book (or remain unassigned).
4. **Lean MVP Scope:** A Study Book does **not** include ISBN, publisher info, author directory, edition tracking, store links, tags, social sharing, or cloud identifiers.

---

## 2. Canonical Data Model

### 2.1 `StudyBook` Interface

```typescript
export interface StudyBook {
  id: string;              // Opaque collision-safe unique ID (e.g. "book_" + crypto.randomUUID())
  title: string;           // Display title, e.g. "中級へ行こう" (Required, non-empty; duplicates allowed)
  coverImageId?: string;   // Reference ID for cover Blob in IndexedDB (Optional)
  createdAt: string;       // ISO 8601 creation timestamp
  updatedAt: string;       // ISO 8601 last modified timestamp
}
```

### 2.2 Updated `Lesson` Interface

```typescript
export interface Lesson {
  id: string;              // Unique lesson ID, e.g. "lesson_" + crypto.randomUUID() (or stable seed ID)
  bookId?: string;         // Optional reference to StudyBook.id
  category: StudyCategory; // 'vocabulary' | 'kanji'
  title: string;           // Display title, e.g. "Bài 1"
  subtitle?: string;       // Optional topic subtitle, e.g. "Giao thông & Đi lại"
  items: StudyItem[];      // Array of StudyItem entries
}
```

### 2.3 Model & ID Rules
- **Opaque Collision-Safe IDs:** StudyBook IDs are opaque identifiers (e.g. `book_${crypto.randomUUID()}`). They are **never derived from the book title**.
- **Title Independence:** Renaming or editing a book title never changes its immutable `id` or breaks `Lesson.bookId` links.
- **Duplicate Titles Allowed:** Multiple textbooks with the same title are permitted (e.g. different editions or study tiers).
- `StudyBook.title` is **strictly required** and cannot be empty or pure whitespace.
- `StudyBook.coverImageId` is **optional**.
- `Lesson.bookId` is **optional**. Lessons without `bookId` are valid and belong to the neutral group:
  - Vietnamese: `Không thuộc giáo trình`
  - English: `Unassigned`
- **One Canonical Mutable Lesson Store (`tango_v1_lessons`):** All runtime lessons (whether copied from bundled seed data, imported, or created manually) live in `tango_v1_lessons`. Bundled JSON files are one-time initial seed data only and are never queried directly by runtime study sessions once initialized.
- **Symmetry:** Vocabulary and Kanji lessons coexist within the same `StudyBook`. There are **no separate** `VocabularyBook` or `KanjiBook` entities.
- **Simplicity:** No `BookLink`, `BookRelationship`, or complex graph models exist.

---

## 3. Home Screen Philosophy: Safe Study-Only Surface

> [!IMPORTANT]
> **Home is exclusively for STUDYING, never for content management.**

Learners open Tango during busy commutes or short study breaks. Accidental taps on destructive or administrative buttons cause frustration and anxiety.

### Home Strict Rules:
- **NO** `+ Add Book` or `+ Thêm giáo trình` buttons on Home.
- **NO** `+ Add Lesson` or `+ Thêm bài` buttons on Home.
- **NO** `Import` or `Nhập bài mới` buttons on Home.
- **NO** `Edit`, `Rename`, or pencil icons on Home.
- **NO** `Delete` or trash can icons anywhere on Home.
- **NO** destructive swipe, long-press, or context menus on Home cards.

Every card or button on the Home study area leads toward **browsing, reading, or active quizzing**.

---

## 4. Home Screen Navigation Layout

Home mirrors the content hierarchy **Study Book → Category → Lesson → StudyItem**: books first and visually dominant, then category shortcuts, then the Mixed Test.

```text
┌────────────────────────────────────────────────────────┐
│ TANGO                                   [IconSettings] │
│                                                        │
│ ┌────────────────────────┐ ┌─────────────────────────┐ │
│ │ ┌──────┐ 中級へ行こう  │ │ ┌──────┐ 耳から覚える  │ │
│ │ │Cover │ 8 bài · 164   │ │ │Cover │ 1 bài · 10    │ │
│ │ └──────┘ [━━━━░░] 65%  │ │ └──────┘ [━░░░░] 30%   │ │
│ └────────────────────────┘ └─────────────────────────┘ │
│ ┌────────────────────────┐ ┌─────────────────────────┐ │
│ │ [IconBook] Từ vựng     │ │ [IconWriting] Hán tự    │ │
│ └────────────────────────┘ └─────────────────────────┘ │
│ ┌────────────────────────────────────────────────────┐ │
│ │ [IconBolt] Kiểm tra tổng hợp (Mixed Test)      (→) │ │
│ └────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

- **Top Bar:** Wordmark `TANGO` and `[IconSettings]` only (`IconSettings` opens Settings; Content Management is accessed from the Study Content section inside Settings). No theme status or theme control on Home.
- **GIÁO TRÌNH (primary):** Large tactile book cards with 3:4 covers, stacked on mobile and in a 2-column grid on tablet/desktop (see [`docs/screens/STUDY_SCREENS.md`](./screens/STUDY_SCREENS.md#screen-01-home--study-hub)). The section label is screen-reader only. Tapping a card opens the **Book Study View**.
- **HỌC THEO LOẠI (secondary):** Compact Vocabulary / Kanji shortcuts to browse lessons by category across all books. The section label is screen-reader only.
- **Kiểm tra tổng hợp:** Compact CTA for global multi-lesson quiz selection.

### 4.1 Safe Empty States (Zero Management Clutter on Study Screens)
Because the Home screen intentionally excludes `+ Add Book` or `Import` buttons, Tango provides helpful, calming empty states that direct learners to Settings:

#### Empty Home (No Study Books):
```text
GIÁO TRÌNH

Chưa có giáo trình nào.
Bạn có thể thêm giáo trình trong:
Cài đặt → Quản lý nội dung.
```
*(English: "No study books yet. You can add study books from: Settings → Content Management.")*

#### Empty Category Inside Book:
- **Book with no Vocabulary lessons:** `"Chưa có bài học từ vựng nào trong giáo trình này."`
- **Book with no Kanji lessons:** `"Chưa có bài học Hán tự nào trong giáo trình này."`

#### Empty Category Across All Books ("Learn by Type"):
- `"Chưa có bài học nào trong mục này."`

#### Empty Review Screen ("Ôn lại từ sai"):
- `"Tuyệt vời! Bạn không có từ nào cần ôn lại. Hãy tiếp tục luyện tập bài mới."`

#### Empty Mixed Test (No Lessons Available):
- `"Chưa có bài học nào khả dụng để tạo bài kiểm tra tổng hợp."`

#### Quiz Configuration Empty State (N = 0):
When no eligible questions can be formed (either no lessons are selected or the enabled question types require fields missing from all selected items):
- Do NOT render `Tất cả (0)`
- Do NOT render fixed question count buttons (`10`, `20`, `40`)
- Disable or hide the Start Test action
- Show clear explanatory message:
  - **Vietnamese:** `"Không có câu hỏi phù hợp với các loại câu hỏi đã chọn."`
  - **English:** `"No eligible questions for the selected question types."`
- The user can adjust selected lessons, toggle question types, or navigate back safely. No error dialog is necessary.

*Ergonomic Mandate:* Empty states never inject quick "+ Add" or destructive buttons into the study canvas. The deliberate route through Settings preserves a serene, accidental-click-free learning experience.

---

## 5. Book Card Ergonomics & Cover Images

### 5.1 Card Ergonomics
- **Desktop:** Cover-oriented cards in a responsive grid (`2 to 4 columns`), showing cover image (or tasteful placeholder), title, lesson count, item count, and subtle progress indicator.
- **Mobile:** Compact tactile card with cover thumbnail, bold book title, lesson count, and minimum 56px touch target. No tiny management icons.
- **Tap Action:** Tapping the card opens the **Study View** of that book. It **never** triggers an edit or delete action.

### 5.2 Cover Image Specifications
- **Supported Formats:** `.jpg`, `.jpeg`, `.png`, `.webp`.
- **Display Treatment:** Rendered with CSS `object-fit: cover` within an aspect-ratio container (standard 3:4 book ratio on desktop; 1:1 or 3:4 thumbnail on mobile).
- **Placeholder Treatment:** When `coverImageId` is absent:
  - Render a calm, theme-aware ceramic clay placeholder using `IconBook`.
  - Strictly **NO** random emojis as placeholders.
  - Matches active theme (Slate/Indigo in Light, Deep Charcoal in Dark, Warm Rose in Sakura).

### 5.3 Cover Image Storage (Local-First IndexedDB)
- **Zero Base64 in `localStorage`:** Book covers are binary images. Storing them as large base64 strings in `localStorage` quickly breaches quota (typically 5MB) and degrades serialization performance.
- **Storage Strategy:**
  - Book metadata (`id`, `title`, `coverImageId`, `timestamps`) persists in `localStorage` (`tango_v1_books`).
  - Cover image binaries are stored as `Blob` entries in browser **IndexedDB** (`tango_v1_covers_idb`), keyed by `coverImageId`.
- **Cleanup Guarantee:** Replacing or deleting a cover image immediately deletes the obsolete Blob from IndexedDB to prevent orphaned storage leaks.

---

## 6. Opening a Study Book: The Book Study View

Tapping a textbook (e.g. `中級へ行こう`) from Home opens a dedicated, distraction-free **Book Study View**:

```text
← Trang chủ

┌────────────────────────────────────────────────────────┐
│ [Cover Image]                                          │
│                                                        │
│ 中級へ行こう                                           │
│ 8 bài học · 164 mục                                    │
└────────────────────────────────────────────────────────┘

TỪ VỰNG
──────────────────────────────────────────────────────────
3 bài · 82 mục

[ Mở Từ vựng ]


HÁN TỰ
──────────────────────────────────────────────────────────
5 bài · 82 mục

[ Mở Hán tự ]


[ [IconBolt] Kiểm tra giáo trình ]
```

### Rules:
- Displays summary statistics for the book (lesson count, total items).
- Divided into the two canonical categories: **Từ vựng** and **Hán tự**.
- **[ Kiểm tra giáo trình ]:** Launches a mixed quiz across lessons belonging exclusively to this textbook.
- **Zero Destructive Controls:** No rename, delete, or cover-replacement buttons appear in this study view.

---

## 7. Complete Navigation Hierarchy

Tango follows a strict, predictable 5-level hierarchy:

```text
Level 1: HOME
          ↓
Level 2: STUDY BOOK
          ↓
Level 3: CATEGORY
          ↓
Level 4: LESSON
          ↓
Level 5: STUDY ACTION (Practice / Quick Test / Review)
```

### Example Navigation Paths:

#### Path A: Standard Textbook Drill
```text
Home
  → [Book Card] 中級へ行こう
    → [Category] Hán tự
      → [Lesson] Bài 2: Hành động & Đi lại
        → [Action] Luyện tập (Practice)
```

#### Path B: Vocabulary Drill in Another Book
```text
Home
  → [Book Card] Mimikara
    → [Category] Từ vựng
      → [Lesson] Bài 4: Nơi chốn
        → [Action] Kiểm tra nhanh (Quick Test)
```

#### Path C: "Learn by Type" Drill
```text
Home
  → [Category Entry] Hán tự
    → [Group: 中級へ行こう] Bài 1
      → [Action] Luyện tập
```

### Contextual Awareness
At every stage, clear breadcrumb headers and back navigation (`[IconArrowLeft]`) orient the learner:
- In Category View: `← 中級へ行こう · Hán tự`
- In Lesson View: `← Hán tự · 中級へ行こう · Bài 2`

---

## 8. Category View Inside a Book

When the user taps `[ Mở Hán tự ]` inside `中級へ行こう`:

```text
← 中級へ行こう

HÁN TỰ (5 bài · 82 mục)

┌────────────────────────────────────────────────────────┐
│ Bài 1: Con người & Gia đình              16 mục · 90%  │
│ Bài 2: Hành động & Đi lại                18 mục · 75%  │
│ Bài 3: Công việc & Đời sống              14 mục · --   │
│ Bài 4: Tự nhiên & Môi trường             18 mục · --   │
│ Bài 5: Xã hội & Giao tiếp                16 mục · --   │
└────────────────────────────────────────────────────────┘

[ [IconCards] Kiểm tra nhiều bài ]
```

- Displays only the lessons matching both `bookId === currentBook.id` (opaque collision-safe identifier, e.g. `book_e2b1f8c0-8356-4d44-933e-46cf2dc1b918`) and `category === 'kanji'`.
- Tapping any lesson row navigates to **Lesson Detail**.
- **[ Kiểm tra nhiều bài ]:** Opens multi-lesson selection scoped to this book and category.

---

## 9. Lesson Detail View

Tapping a lesson row opens the **Lesson Detail**:

```text
← Hán tự · 中級へ行こう

Bài 2: Hành động & Đi lại
18 mục học

┌────────────────────────────────────────────────────────┐
│ [IconBrain] Luyện tập (Practice Mode)                  │
│ Học từng mục, không áp lực thời gian                   │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ [IconClock] Kiểm tra nhanh (Quick Test)                │
│ Trắc nghiệm: 10 / 20 / 40 / Tất cả (N)                 │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ [IconList] Xem danh sách từ                            │
│ 18 mục (Chữ Hán, Cách đọc, Hán Việt, Nghĩa)            │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ [IconRefresh] Ôn từ sai (2 từ cần ôn)                  │
└────────────────────────────────────────────────────────┘
```

- Study actions are triggered deliberately at the lesson level.
- Users are never plunged unexpectedly into a test without first seeing the lesson overview.
- **Canonical Definition of N:** $N$ is strictly the number of **deduplicated lexical groups supporting at least one enabled compatible QuestionType** (deduplication key: `normalized(japanese) + '::' + normalized(kana || '')`). See [`docs/DATA_MODEL.md §3.2`](./DATA_MODEL.md) for the canonical contract. Multiple-choice compatibility requires the selected pool to produce 3 distinct distractors from other lexical groups; no synthetic merged StudyItem is created at runtime.
- **Dynamic Candidate Counts Rule:** In Quick Test and multi-lesson quizzes, fixed candidate counts (`10`, `20`, `40`) are displayed dynamically only when `<= N`. When $N > 0$, the full pool option `Tất cả (N)` presents exactly $N$ initial questions for the $N$ eligible lexical groups (never multiplied by question types).
- **The N = 0 State:** If $N = 0$, `Tất cả (0)` and fixed count buttons are **never** rendered. The Start Test action is disabled/hidden, and an explanatory empty state is shown ("Không có câu hỏi phù hợp với các loại câu hỏi đã chọn." / "No eligible questions for the selected question types.").

---

## 10. Multi-Lesson Testing Scopes

Tango provides three distinct scopes for multi-lesson testing, all powered by the **exact same shared quiz engine** with zero code duplication:

| Test Scope | Entry Point | Target Lessons | Pool Mechanism |
|---|---|---|---|
| **1. Category Multi-Lesson** | Category View inside a Book | Multiple lessons within one category and book | Aggregates selected `lessonIds: string[]` |
| **2. Book Mixed Test** | Book Study View (`Kiểm tra giáo trình`) | Multiple lessons across Vocab and Kanji within that book | Aggregates selected `lessonIds: string[]` |
| **3. Global Mixed Test** | Home (`Kiểm tra tổng hợp`) | Any combination of lessons across all books & categories | Aggregates selected `lessonIds: string[]` |

### 10.1 Category Multi-Lesson Test Selector
```text
KIỂM TRA HÁN TỰ
中級へ行こう

Chọn bài kiểm tra:
☑ Bài 1: Con người & Gia đình (16 mục)
☑ Bài 2: Hành động & Đi lại (18 mục)
☐ Bài 3: Công việc & Đời sống (14 mục)
☑ Bài 4: Tự nhiên & Môi trường (18 mục)

Số câu hỏi:
[ 10 ]  [ 20 ]  [ 40 ]  [ Tất cả (52) ]

[ Bắt đầu kiểm tra ]
```

### 10.2 Book Mixed Test Selector (`Kiểm tra giáo trình`)
```text
KIỂM TRA GIÁO TRÌNH
中級へ行こう

TỪ VỰNG
☑ Bài 1 (20 từ)
☑ Bài 2 (22 từ)

HÁN TỰ
☑ Bài 1 (16 mục)
☐ Bài 2 (18 mục)

Số câu hỏi:
[ 10 ]  [ 20 ]  [ 40 ]  [ Tất cả (N) ]

[ Bắt đầu kiểm tra ]
```

### 10.3 Global Mixed Test Across Books (`Kiểm tra tổng hợp`)
```text
KIỂM TRA TỔNG HỢP

中級へ行こう
  Từ vựng
    ☑ Bài 1 (20 từ)
    ☐ Bài 2 (22 từ)
  Hán tự
    ☑ Bài 1 (16 mục)

Mimikara
  Từ vựng
    ☑ Bài 3 (25 từ)
    ☐ Bài 4 (20 từ)
  Hán tự
    ☑ Bài 2 (18 mục)

Không thuộc giáo trình
  Từ vựng
    ☐ Từ vựng du lịch (30 từ)

79 mục đã chọn · 72 câu khả dụng

Số câu hỏi:
[ 10 ]  [ 20 ]  [ 40 ]  [ Tất cả (72) ]

[ Bắt đầu kiểm tra ]
```

### Technical Note:
1. **Shared Pipeline:** In all scopes (Category, Book, Global), the selector outputs an array of `lessonIds: string[]`.
2. **Canonical Pool Resolution Pipeline & Definition of N:**
   ```text
   selected lessonIds
            ↓
   collect StudyItems from tango_v1_lessons (in deterministic lesson/item order)
            ↓
   deduplicate by normalized Japanese + Kana into lexical groups:
   normalized(japanese) + '::' + normalized(kana || '')
            ↓
   filter groups against enabled QuestionTypes & pool distractors:
     • Target field availability (non-empty Vietnamese meaning, Kana reading)
     • Distractor contract for multiple-choice types (must yield 3 distinct distractors from other groups)
            ↓
   eligible lexical groups
            ↓
            N
   ```
   `N` is strictly the number of **deduplicated lexical groups supporting at least one enabled compatible QuestionType** (see [`docs/DATA_MODEL.md §3.2`](./DATA_MODEL.md) for the canonical contract).
   - **Lexical Groups & No Synthetic Merging:** Items sharing `normalized(japanese) + '::' + normalized(kana || '')` form a single lexical group. Tango does not synthesize merged StudyItems at runtime.
   - **Compatibility Requirements:** Both field compatibility (e.g. non-empty Vietnamese meaning, Kana reading) and distractor compatibility (pool ability to produce 3 distinct distractors from other lexical groups for multiple-choice types) must be respected. When generating a question, the first compatible real item in deterministic order serves as `targetItem`.
   - **Distinction Between Selected Items and Eligible Questions (N):** The selected/raw item count (e.g. `79 mục đã chọn`) represents the total items in the selected lessons before eligibility filtering. `N` represents the eligible lexical groups after both deduplication and compatibility filtering (e.g. `72 câu khả dụng`).
   - `Tất cả (N)` always uses the eligible count $N$ (e.g. `Tất cả (72)`), never the raw selected count.
3. **Dynamic Candidate Slicing:** Candidate fixed buttons (`10`, `20`, `40`) are rendered dynamically only when `<= N`.
4. **Authoritative `questionCount: 'all'` Rule:** Selecting `Tất cả (N)` generates **exactly one initial question per eligible lexical group** ($N$ eligible groups = $N$ initial questions). It **NEVER multiplies** item count by the number of active question types. Each lexical group is assigned exactly one enabled compatible question type.
5. **Practice Mode Note:** Practice Mode may requeue missed items after the initial set, so total interactions during practice may exceed $N$.
6. **The N = 0 State:** If $N = 0$, `Tất cả (0)` and fixed count buttons are **not** rendered, the Start Test action is disabled/hidden, and an explanatory empty state is shown: `"Không có câu hỏi phù hợp với các loại câu hỏi đã chọn."` / `"No eligible questions for the selected question types."` Users can adjust lesson selections, toggle question types, or go back without error modals.

---

## 11. "Learn by Type" Alternative Navigation

When the learner taps `[IconBook] Từ vựng` or `[IconWriting] Hán tự` from the Home screen, Tango displays all lessons of that category grouped by textbook:

```text
← Trang chủ

HÁN TỰ (TẤT CẢ GIÁO TRÌNH)

中級へ行こう
  Bài 1: Con người & Gia đình (16 mục)
  Bài 2: Hành động & Đi lại (18 mục)
  Bài 3: Công việc & Đời sống (14 mục)

Mimikara
  Bài 1: Khởi đầu (20 mục)
  Bài 2: Môi trường (18 mục)

Không thuộc giáo trình
  Bài tự tạo: 20 từ Kanji JLPT N3 (20 mục)
```

- Provides a clean category-centric perspective without duplicating data.
- Lessons remain organized and contextually bound to their parent books.

---

## 12. Settings & Content Management Architecture

Content modification operations are deliberately placed inside a separate, protected screen.

### 12.1 Settings Entry
In the Settings screen (`Cài đặt`), beneath preferences (Language, Theme, Sound Effects), a dedicated section is displayed:

```text
CÀI ĐẶT

Giao diện & Tùy chọn
...

Nội dung học (Study Content)
──────────────────────────────────────────────────────────
Quản lý giáo trình và bài học                [IconChevronRight]
Manage books and lessons
```

Tapping this row opens the dedicated **Quản lý nội dung (Content Management)** screen.

---

## 13. Content Management Screen

```text
← Cài đặt

QUẢN LÝ NỘI DUNG

GIÁO TRÌNH (STUDY BOOKS)
──────────────────────────────────────────────────────────
┌────────────────────────────────────────────────────────┐
│ [Thumb]  中級へ行こう                     [ Quản lý ]  │
│          8 bài · 164 mục                               │
├────────────────────────────────────────────────────────┤
│ [Thumb]  Mimikara                         [ Quản lý ]  │
│          5 bài · 110 mục                               │
└────────────────────────────────────────────────────────┘

[ [IconPlus] Thêm giáo trình ]


BÀI HỌC (LESSONS)
──────────────────────────────────────────────────────────
[ [IconFileImport] Thêm / Nhập bài học mới ]

KHÔNG THUỘC GIÁO TRÌNH (Chỉ hiển thị khi có bài lẻ)
──────────────────────────────────────────────────────────
• 20 từ Kanji N3 (20 mục)                   [ Quản lý ]
• Chữ Hán cơ bản (15 mục)                   [ Quản lý ]
```

### Principles:
- This is the **only** area where adding, editing, or deleting structural content is initiated.
- Unassigned lessons are managed directly here via `[ Quản lý ]` $\rightarrow$ Lesson Management.
- Lessons assigned to books are managed via Book `[ Quản lý ]` $\rightarrow$ Lesson `[ Quản lý ]`.
- Lesson reassignment (moving between books or unassigned) happens strictly within Lesson Management via the parent book selector. No separate global move action exists.
- Navigation back (`[IconArrowLeft]`) returns safely to Settings.

---

## 14. Add & Edit Study Book Workflows

### 14.1 Add Study Book (`Thêm giáo trình`)
Tapping `[IconPlus] Thêm giáo trình` opens a focused modal/sheet:

```text
THÊM GIÁO TRÌNH MỚI

Tên giáo trình *
[ Nhập tên sách (ví dụ: 中級へ行こう)          ]

Ảnh bìa (không bắt buộc)
[ [IconPhoto] Chọn ảnh bìa ]  (Hỗ trợ .jpg, .jpeg, .png, .webp)

[ Preview: Ảnh bìa đã chọn ]

[ Hủy ]                              [ Tạo giáo trình ]
```

- **Validation:** Title cannot be empty.
- **Cover:** Optional. User can preview before saving.
- **Duplicate Titles:** Allowed (learners may track different volumes or editions). Uniqueness is governed by `StudyBook.id`.

### 14.2 Manage / Edit Study Book
Tapping `[ Quản lý ]` beside a book opens its management inspector:

```text
← Quản lý nội dung

QUẢN LÝ: 中級へ行こう

Tên giáo trình
[ 中級へ行こう                                 ]

Ảnh bìa
[ [IconPhoto] Thay đổi ảnh ]    [ [IconTrash] Xóa ảnh bìa ]
[ Preview ]

Danh sách bài học trong giáo trình (8 bài)
• Bài 1: Từ vựng (20 mục)                 [ Quản lý ]
• Bài 2: Từ vựng (22 mục)                 [ Quản lý ]
• Bài 1: Hán tự (16 mục)                  [ Quản lý ]
...

[ [IconPlus] Thêm bài vào giáo trình này ]

──────────────────────────────────────────────────────────
VÙNG NGUY HIỂM (DANGER ZONE)

Xóa giáo trình này
Thao tác này sẽ xóa vĩnh viễn giáo trình và toàn bộ
bài học bên trong.

[ [IconAlertTriangle] Xóa giáo trình ]
```

User capabilities in this screen:
- Rename book title
- Replace cover image (replaces IndexedDB blob)
- Remove cover image (cleans IndexedDB blob, clears `coverImageId`)
- Add or import a lesson directly into this book
- Open dedicated **Lesson Management** for any listed lesson via `[ Quản lý ]`
- Permanently delete the entire Study Book via the Danger Zone

> [!NOTE]
> **No Inline Lesson Deletion:** To prevent accidental destructive taps, lesson rows contain only `[ Quản lý ]`. There is **strictly no adjacent delete button** on lesson rows in the book overview.

### 14.3 Dedicated Lesson Management View (`Quản lý bài học`)
Tapping `[ Quản lý ]` on any lesson row opens its dedicated administrative view:

```text
← Quản lý: 中級へ行こう

QUẢN LÝ BÀI HỌC: Bài 1: Từ vựng

Tên bài học
[ Bài 1: Từ vựng                                ]

Phân loại (Category)
[ (•) Từ vựng ]    [ ( ) Hán tự ]

Giáo trình (Parent Study Book)
[ 中級へ行こう ▼ ]
(Có thể chuyển sang giáo trình khác hoặc "Không thuộc giáo trình")

Mục học trong bài (20 mục)
┌────────────────────────────────────────────────────────┐
│ 1. 案内 (あんない) — hướng dẫn                          │
│ 2. 連絡 (れんらく) — liên lạc                           │
│ 3. 相談 (そうだん) — thảo luận                          │
│ ...                                                    │
└────────────────────────────────────────────────────────┘

──────────────────────────────────────────────────────────
VÙNG NGUY HIỂM (DANGER ZONE)

Xóa bài học này
Thao tác này sẽ xóa vĩnh viễn bài học và toàn bộ 20 mục học bên trong.

[ [IconAlertTriangle] Xóa bài học ]
```

User capabilities in Lesson Management:
- Edit lesson title
- Switch category (`vocabulary` ↔ `kanji`)
- Move lesson to another Study Book (or mark as Unassigned)
- Inspect underlying study items
- Permanently delete the individual lesson via its dedicated Danger Zone (triggers explicit confirmation modal)

---

## 15. Lesson Import with Book Association

The authoritative lesson import workflow defined in [`docs/IMPORT_SPEC.md`](./IMPORT_SPEC.md) is updated to include textbook assignment:

```text
THÊM BÀI HỌC MỚI

1. Chọn giáo trình
   [ 中級へ行こう ▼ ]
   (Danh sách giáo trình hiện có + "Không thuộc giáo trình")

2. Chọn phân loại
   [ [IconBook] Từ vựng ]   [ [IconWriting] Hán tự ]

3. Tên bài học
   [ Bài 3: Đời sống & Môi trường               ]

4. Phương thức nhập & dữ liệu
   ...
```

### Preselection Rule:
If import is launched from inside a book's management screen (`Content Management → 中級へ行こう → Thêm bài`), `bookId` defaults automatically to `中級へ行こう`.

### Preview Verification:
The import preview summary explicitly reflects the association:
```text
Giáo trình:  中級へ行こう
Phân loại:   Hán tự
Tên bài:     Bài 3: Đời sống & Môi trường
Số lượng:    39 mục
```

---

## 16. Content Safety & HARD DELETE ONLY Policy

Tango adopts an uncompromising, transparent content deletion policy designed specifically for a local-first study app.

> [!IMPORTANT]
> **Tango uses HARD DELETE ONLY.**
>
> There is **NO** soft delete (`softDeletedAt`), **NO** recycle bin, **NO** trash folder, **NO** archive-as-delete, **NO** 30-day recovery grace period, and **NO** restore workflow.

### 16.1 Rationale for Hard Delete
1. **Clean Local Storage:** On a local-first device, hidden "soft deleted" blobs and lessons consume storage silently.
2. **Mental Model Simplicity:** The user understands that deleting means removing. There is no confusing second step to "empty the trash".
3. **Accidental Tap Prevention via Architecture:** Because destructive buttons are strictly barred from the Home and study screens, deletion requires intentional navigation to Content Management followed by an explicit confirmation dialog.

### 16.2 Twelve Accidental Tap Prevention Rules
1. **Home contains zero destructive actions.**
2. **Book Study View contains zero destructive actions.**
3. **Category View contains zero destructive actions.**
4. **Lesson Study View contains zero destructive actions.**
5. **Destructive actions exist exclusively within Content Management.**
6. **Deletion is NEVER triggered by swipe gestures.**
7. **Deletion is NEVER triggered by long-press gestures.**
8. **Deletion NEVER appears as an isolated tiny icon without text.**
9. **Permanent deletion ALWAYS requires an explicit modal confirmation.**
10. **The confirmation dialog explicitly states the exact name and item count of what will be deleted.**
11. **The confirmation dialog warns that the action cannot be undone.**
12. **Cancel and Delete buttons are visually and spatially separated; Delete is never the default focused button.**

---

## 17. Delete Study Book UX & Cascade Behavior

### 17.1 Confirmation Dialog

Tapping `[ Xóa giáo trình ]` inside the Danger Zone displays a high-contrast modal:

#### Vietnamese Localization:
```text
┌────────────────────────────────────────────────────────┐
│ Xóa vĩnh viễn giáo trình?                              │
│                                                        │
│ Bạn sắp xóa:                                           │
│ 中級へ行こう                                           │
│ 8 bài học · 164 mục                                    │
│                                                        │
│ Toàn bộ bài học, nội dung và dữ liệu học liên quan     │
│ đến giáo trình này sẽ bị xóa vĩnh viễn khỏi thiết bị.  │
│                                                        │
│ Hành động này không thể hoàn tác.                      │
│                                                        │
│ [ Hủy bỏ ]                    [ Xóa vĩnh viễn ]        │
└────────────────────────────────────────────────────────┘
```

#### English Localization:
```text
┌────────────────────────────────────────────────────────┐
│ Permanently delete this book?                          │
│                                                        │
│ You are about to delete:                               │
│ 中級へ行こう                                           │
│ 8 lessons · 164 items                                  │
│                                                        │
│ All lessons, study content, and related local learning │
│ data for this book will be permanently deleted from    │
│ this device.                                           │
│                                                        │
│ This action cannot be undone.                          │
│                                                        │
│ [ Cancel ]                    [ Delete permanently ]   │
└────────────────────────────────────────────────────────┘
```

### 17.2 Dialog Ergonomic Rules:
- The destructive button uses semantic error styling (Crimson / Red fill or border).
- `[ Hủy bỏ ]` is visually neutral, easy to reach, and has initial focus.
- Pressing `Enter` when the dialog opens **cancels** or does nothing; it **never** triggers deletion.
- On mobile, `[ Hủy bỏ ]` and `[ Xóa vĩnh viễn ]` are stacked with generous spacing (at least 16px vertical gap) to eliminate mis-taps.

### 17.3 Delete Book Cascade Guarantees:

When permanent deletion of a Study Book is confirmed, Tango executes an **ordered, idempotent hard-delete cascade** spanning browser `localStorage` and `IndexedDB`. Because web browsers do not provide atomic transactions across `localStorage` and `IndexedDB`, this sequence is executed deterministically in an order that guarantees consistency and is safe to retry if interrupted.

Before mutating any persistent storage, Tango resolves and retains all required identifiers in memory:
- `deletedBookId`
- `coverImageId` (resolved from `StudyBook.coverImageId` before deletion)
- `affectedLessonIds`
- `affectedStudyItemIds`
- `affectedHistoryIds`

#### Conceptual Hard-Delete Ordering for Study Book Deletion:
1. **Resolve Full Deletion Scope & Identifiers in Memory:** Retrieve `deletedBookId`, `coverImageId`, all `affectedLessonIds` where `lesson.bookId === deletedBookId`, all `affectedStudyItemIds` belonging to those lessons, and all `affectedHistoryIds` (resolved from `session.lessonIds` matching `affectedLessonIds` or `session.missedItemIds` matching `affectedStudyItemIds`).
2. **Clear In-Memory & Active References:** Clear any active multi-lesson selector checkboxes, navigation breadcrumbs, or in-flight review filters referencing `affectedLessonIds`.
3. **Purge Affected ItemProgress:** In `tango_v1_progress`, delete all `ItemProgress` and mistake-tracking records matching `affectedStudyItemIds`.
4. **Delete Entire Affected QuizSessionResult History Records:** Scan `tango_v1_history`. If any stored `QuizSessionResult` references any deleted `lessonId` (in its `session.lessonIds` array) or any affected `StudyItem.id` (in its persisted `session.missedItemIds` array), **delete that entire session record**. Partial or corrupt history records are never retained.
5. **Delete Cover Blob from IndexedDB Using the Already-Resolved `coverImageId`:** Asynchronously delete the binary image blob from the `covers` object store in `tango_v1_covers_idb` matching `coverImageId` (if one was assigned). Deleting the cover blob while book metadata is still intact ensures that if an interruption occurs, retry logic can still read `coverImageId`.
6. **Delete Affected Lesson Records:** Permanently remove all `affectedLessonIds` from `tango_v1_lessons`. Because bundled JSON files are one-time initial seed data (marked by `tango_v1_library_init`), deleting lessons from `tango_v1_lessons` guarantees they are never resurrected on app reload, PWA update, or cache refresh.
7. **Delete StudyBook Metadata from `tango_v1_books` LAST:** Delete the `StudyBook` record from `tango_v1_books` as the final mutation step.
8. **Verify No Dangling References Remain:** Confirm that no orphaned lesson, progress, history, or image references remain.

> [!IMPORTANT]
> **Key Invariant:** `StudyBook` metadata is deleted **last** because it contains the canonical reference needed to locate and verify the cover Blob in IndexedDB.

*Result: Zero orphaned IDs, zero ghost storage, zero broken navigation links, zero resurrection of deleted lessons.*

---

## 18. Delete Lesson UX

Lessons can only be deleted individually from within the dedicated **Lesson Management (Quản lý bài học)** view's Danger Zone (`Content Management → Book Management → [ Quản lý ] on lesson → Vùng nguy hiểm → [ Xóa bài học ]`):

```text
┌────────────────────────────────────────────────────────┐
│ Xóa vĩnh viễn bài học?                                 │
│                                                        │
│ Bài 3: Đời sống & Môi trường — Hán tự                  │
│ Giáo trình: 中級へ行こう                               │
│                                                        │
│ 39 mục học sẽ bị xóa vĩnh viễn.                        │
│ Tiến độ học liên quan đến các mục này cũng sẽ bị xóa.  │
│                                                        │
│ Hành động này không thể hoàn tác.                      │
│                                                        │
│ [ Hủy bỏ ]                    [ Xóa vĩnh viễn ]        │
└────────────────────────────────────────────────────────┘
```

### 18.1 Lesson Cascade Behavior:
When confirmed, Tango executes the ordered, idempotent lesson deletion cascade:
1. **Resolve Scope & Identifiers in Memory:** Resolve `targetLessonId`, its nested `affectedStudyItemIds`, and all `affectedHistoryIds` (matching `session.lessonIds` containing `targetLessonId` or `session.missedItemIds` referencing `affectedStudyItemIds`).
2. **Clear In-Memory & Active References:** Clear any active multi-lesson selector checkboxes or active filters referencing `targetLessonId`.
3. **Purge Affected ItemProgress:** In `tango_v1_progress`, delete all records for `affectedStudyItemIds`.
4. **Delete Entire Affected Quiz History Records:** Remove any `QuizSessionResult` from `tango_v1_history` matching `affectedHistoryIds`.
5. **Delete Target Lesson Record from `tango_v1_lessons` LAST:** Remove `targetLessonId` from `tango_v1_lessons` as the final mutation step (permanent hard delete; will not resurrect).
6. **Verify Parent Study Book:** The parent `StudyBook` remains intact, with its lesson count and total item count updated.

---

## 19. Remove Cover Image UX

Removing a cover image is an independent, non-destructive operation on book data:

```text
┌────────────────────────────────────────────────────────┐
│ Xóa ảnh bìa?                                           │
│                                                        │
│ Giáo trình "中級へ行こう" và toàn bộ bài học           │
│ bên trong vẫn được giữ nguyên.                         │
│ Chỉ ảnh bìa sẽ bị xóa khỏi giáo trình.                 │
│                                                        │
│ [ Hủy ]                        [ Xóa ảnh bìa ]         │
└────────────────────────────────────────────────────────┘
```

- **Cover Blob Deletion:** Deletes the binary image blob from the `covers` object store in IndexedDB (`tango_v1_covers_idb`).
- **Metadata Update:** Clears `StudyBook.coverImageId = undefined` in `tango_v1_books`.
- **Card Fallback:** Reverts card display to the theme-aware ceramic clay placeholder.
- **Strict Decoupling from Book Deletion:** Removing a cover image is strictly decoupled from book hard-delete semantics. It only affects the cover image blob and property. The `StudyBook` record itself, all its `Lesson` records in `tango_v1_lessons`, nested `StudyItem` records, `ItemProgress` in `tango_v1_progress`, and `QuizSessionResult` records in `tango_v1_history` remain 100% intact and untouched.

---

## 20. Moving Lessons Between Books & Category Switch Safety

In Lesson Management (`/settings/content-management/lesson/:lessonId`), a lesson's book assignment or category can be updated via the parent book selector:

```text
QUẢN LÝ BÀI HỌC — CHUYỂN GIÁO TRÌNH
Bài 3: Đời sống & Môi trường

Giáo trình trực thuộc:
[ Mimikara ▼ ]

[ Hủy ]                          [ Lưu thay đổi ]
```

- **Preservation of IDs & Progress:** Reassigning `Lesson.bookId` (or switching category `vocabulary` ↔ `kanji`) modifies only organizational metadata on the existing `Lesson` record. It preserves `Lesson.id`, nested `StudyItem.id`s, `ItemProgress` in `tango_v1_progress`, and quiz histories in `tango_v1_history`. Items and lessons are never recreated or duplicated.
- **Explicit Save Required:** Changes require an explicit tap on `[ Lưu thay đổi ]` (no accidental auto-commit on dropdown focus).

---

## 21. Responsive Layout Adaptations
*(See [`docs/SCREEN_SPEC.md`](./SCREEN_SPEC.md) for full screen-by-screen wireframes and interaction specs)*

| Screen / Area | Mobile (< 640px) | Desktop / Tablet (>= 640px) |
|---|---|---|
| **Home: Study Books** | Vertical stacked tactile cards with 1:1 thumbnails | 2 to 4-column responsive card grid with 3:4 cover ratio |
| **Book Study View** | Centered vertical stack, compact cover banner | Centered canvas (`max-w-2xl`), rich cover presentation |
| **Category Inside Book** | Full-width lesson list with 56px touch rows | Structured 2-column grid (`max-w-4xl`) |
| **Content Management** | Stacked vertical list with sub-routes (touch targets >= 48px) | Structured 2-column management layout (`max-w-4xl`) |
| **Delete Dialog** | Full-width stacked buttons with 16px separation (Cancel on top) | Centered modal with safe horizontal button separation |

---

## 22. Localization Terminology Matrix

| Vietnamese (VI) | English (EN) | Usage Context |
|---|---|---|
| **Giáo trình** | Study Books | Home section header, navigation |
| **Học theo loại** | Learn by Type | Home category drill header |
| **Không thuộc giáo trình** | Unassigned | Group header for standalone lessons |
| **Quản lý nội dung** | Content Management | Screen title under Settings |
| **Quản lý giáo trình và bài học** | Manage books and lessons | Row item in Settings screen |
| **Thêm giáo trình** | Add Study Book | Action button in Content Management |
| **Tên giáo trình** | Book title | Form label |
| **Ảnh bìa** | Cover image | Form label and preview |
| **Chọn ảnh bìa** | Choose cover | File picker trigger |
| **Thay đổi ảnh** | Change cover | Cover replacement action |
| **Xóa ảnh bìa** | Remove cover | Cover removal action |
| **Vùng nguy hiểm** | Danger Zone | Container for destructive actions |
| **Xóa giáo trình** | Delete Study Book | Danger zone action trigger |
| **Xóa vĩnh viễn** | Delete permanently | Confirmation dialog primary CTA |
| **Hành động này không thể hoàn tác.** | This action cannot be undone. | Destructive confirmation explanation |
| **Kiểm tra giáo trình** | Test Study Book | Book study view action |
| **Kiểm tra nhiều bài** | Multi-Lesson Test | Category view action |
