# Tango UI Specification — Quiz Configuration Screens (SCREEN 07 – 09)

> **Master Specification Reference:** [`docs/SCREEN_SPEC.md`](../SCREEN_SPEC.md) is the authoritative master index, route map, and responsive foundation for Tango.
> This domain file is authoritative for the detailed screen layouts, wireframes, and interaction flows of **Quiz Configuration Screens (SCREEN 07 through SCREEN 09)**.
>
> **Design Tokens & Components:** Styled exclusively using the Soft Claymorphism design system in [`docs/DESIGN_SYSTEM.md`](../DESIGN_SYSTEM.md).

---

## Screen Inventory

- [SCREEN 07: Category Multi-Lesson Test Config](#screen-07-category-multi-lesson-test-config)
- [SCREEN 08: Book Test Config (Kiểm tra giáo trình)](#screen-08-book-test-config-kiểm-tra-giáo-trình)
- [SCREEN 09: Global Mixed Test (Kiểm tra tổng hợp)](#screen-09-global-mixed-test-kiểm-tra-tổng-hợp)

---

### Core Slicing & Eligible Question Rules (Canonical Engine)

All quiz configuration screens operate on the identical canonical question-slicing logic:
1. **Canonical Resolution Pipeline & Definition of $N$:**
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
   > **Pool Deduplication Key & Lexical Groups:** Items sharing `normalized(japanese) + '::' + normalized(kana || '')` are treated as one **deduplicated lexical group**. No synthetic merged `StudyItem` is created at runtime. For a candidate `QuestionType`, the group is compatible if at least one real member can generate that type. When generating the question, the first compatible real `StudyItem` in deterministic selected-lesson/item order serves as `targetItem`.
   >
   > **Multiple-Choice Distractor Contract:** For multiple-choice question types (`kana_to_japanese`, `japanese_to_vi`, `vi_to_japanese`), 4 distinct visible options (1 correct + 3 distinct distractors) are drawn strictly from other deduplicated lexical groups in the selected pool. A multiple-choice type is compatible only if the selected pool can supply 3 distinct distractors.
2. **Total vs Eligible Counts:** The interface explicitly communicates both: `X mục đã chọn · Y câu khả dụng` (raw selected count before filtering vs. $N$ eligible questions after deduplication and compatibility checks).
3. **Dynamic Candidate Count Buttons:**
   - Candidate options `10`, `20`, `40` are rendered **strictly when `<= N`**.
   - `Tất cả (N)` button displays the exact eligible count $N$. Selecting `Tất cả` yields exactly $N$ questions (one initial question per eligible lexical group), **never** multiplying by the number of question types selected.
4. **$N = 0$ Empty / Zero State:**
   - When 0 lessons are checked or selected types yield 0 eligible items:
     - Fixed count buttons (`10`, `20`, `40`) are hidden.
     - `Tất cả (0)` is **never rendered**.
     - Start Test CTA button is disabled (`opacity: 0.5`, non-interactive).
     - Inline warning is displayed: *"Không có câu hỏi phù hợp với các loại câu hỏi đã chọn."*.

---

### SCREEN 07: Category Multi-Lesson Test Config

#### Purpose:
Allows selecting multiple lessons within a specific category (`vocabulary` or `kanji`) in a single Study Book, configuring question counts and formats, and launching a combined test.

#### Routes & Navigation:
- **Route:** `/book/:bookId/category/:category/quiz-config`
- **Entry:** [SCREEN 03: Category View Inside Book](./STUDY_SCREENS.md#screen-03-category-view-inside-book) `[IconCards] Kiểm tra nhiều bài`.
- **Exit:**
  - `[IconArrowLeft]` Back / Cancel $\rightarrow$ SCREEN 03.
  - `[ [IconPlayerPlay] Bắt đầu kiểm tra ]` $\rightarrow$ [SCREEN 10: Active Quiz](./QUIZ_SESSION_SCREENS.md#screen-10-active-quiz--practice-session) (`/quiz/session`).

#### Responsive Layout:
- **Mobile (< 640px):** Single-column stacked canvas. Lesson checkboxes, candidate count pills, question type checkboxes, and sticky bottom CTA bar incorporating `env(safe-area-inset-bottom)`.
- **Tablet / Desktop (>= 640px):** Centered `max-w-2xl` canvas. Clean 2-section vertical layout: Lesson selection card on top; Quiz settings (question counts, question types, and start CTA) positioned directly below in normal document flow.

#### Wireframes:
```text
MOBILE (< 640px)
┌───────────────────────────────────────────────┐
│ [IconArrowLeft]  Kiểm tra Hán tự              │
├───────────────────────────────────────────────┤
│ 中級へ行こう                                  │
│                                               │
│ CHỌN BÀI KIỂM TRA:                            │
│ [X] Bài 1: Con người & Gia đình (16 mục)      │
│ [X] Bài 2: Hành động & Đi lại (18 mục)        │
│ [ ] Bài 3: Công việc & Đời sống (14 mục)      │
│ [X] Bài 4: Tự nhiên & Môi trường (18 mục)     │
│                                               │
│ 52 mục đã chọn · 48 câu khả dụng              │
│                                               │
│ SỐ CÂU HỎI:                                   │
│ [ 10 ]   [ 20 ]   [ 40 ]   [ Tất cả (48) ]    │
│                                               │
│ LOẠI CÂU HỎI:                                 │
│ [X] Kana → Chữ Hán/Từ                         │
│ [X] Từ/Chữ Hán → Tiếng Việt                   │
│ [X] Tiếng Việt → Chữ Hán/Từ                   │
│                                               │
│ [StickyBottomBar: [IconPlayerPlay] Bắt đầu ]  │
└───────────────────────────────────────────────┘

DESKTOP (> 1024px - max-w-2xl Centered)
┌────────────────────────────────────────────────────────┐
│ [IconArrowLeft] Quay lại danh sách bài học             │
├────────────────────────────────────────────────────────┤
│ KIỂM TRA HÁN TỰ — 中級へ行こう                         │
│                                                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │ DANH SÁCH BÀI HỌC                                  │ │
│ │ [X] Bài 1: Con người & Gia đình (16 mục · 90%)     │ │
│ │ [X] Bài 2: Hành động & Đi lại (18 mục · 75%)       │ │
│ │ [ ] Bài 3: Công việc & Đời sống (14 mục · --)      │ │
│ │ [X] Bài 4: Tự nhiên & Môi trường (18 mục · --)     │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ 52 mục đã chọn · 48 câu khả dụng                       │
│                                                        │
│ SỐ CÂU HỎI:                                            │
│ [ 10 ]   [ 20 ]   [ 40 ]   [ Tất cả (48) ]             │
│                                                        │
│ LOẠI CÂU HỎI:                                          │
│ [X] Kana → Chữ Hán/Từ                                  │
│ [X] Từ/Chữ Hán → Tiếng Việt                            │
│ [X] Tiếng Việt → Chữ Hán/Từ                            │
│                                                        │
│ [ [IconPlayerPlay] BẮT ĐẦU KIỂM TRA (ENTER) ]          │
└────────────────────────────────────────────────────────┘
```

---

### SCREEN 08: Book Test Config (Kiểm tra giáo trình)

#### Purpose:
Allows selecting any combination of Vocabulary and Kanji lessons across the currently opened Study Book, configuring question counts and formats, and launching a cross-category book exam.

#### Routes & Navigation:
- **Route:** `/book/:bookId/quiz-config`
- **Entry:** [SCREEN 02: Book Study View](./STUDY_SCREENS.md#screen-02-book-study-view) `[ [IconBolt] Kiểm tra giáo trình ]`.
- **Exit:**
  - `[IconArrowLeft]` Back $\rightarrow$ SCREEN 02.
  - `[ [IconPlayerPlay] Bắt đầu kiểm tra ]` $\rightarrow$ [SCREEN 10: Active Quiz](./QUIZ_SESSION_SCREENS.md#screen-10-active-quiz--practice-session) (`/quiz/session`).

#### Responsive Layout:
- **Mobile (< 640px):** Single-column stacked list with collapsible/expandable headers for `TỪ VỰNG` and `HÁN TỰ`. Checkboxes for each lesson. Bottom sticky bar for Start Test action.
- **Tablet / Desktop (>= 640px):** Centered `max-w-3xl` canvas. 2-column lesson selection layout (Left column: Vocabulary lessons; Right column: Kanji lessons). Bottom panel spans full width containing question counts, question types, and primary start CTA.

#### Wireframes:
```text
MOBILE (< 640px)
┌───────────────────────────────────────────────┐
│ [IconArrowLeft]  Kiểm tra giáo trình          │
├───────────────────────────────────────────────┤
│ 中級へ行こう (Toàn bộ sách)                   │
│                                               │
│ [IconBook] TỪ VỰNG:                           │
│ [X] Bài 1: Mở đầu & Làm quen (20 từ)          │
│ [X] Bài 2: Gia đình & Bạn bè (22 từ)          │
│ [ ] Bài 3: Du lịch & Đời sống (24 từ)         │
│                                               │
│ [IconWriting] HÁN TỰ:                         │
│ [X] Bài 1: Con người (16 mục)                 │
│ [X] Bài 2: Hành động (18 mục)                 │
│                                               │
│ 76 mục đã chọn · 70 câu khả dụng              │
│                                               │
│ SỐ CÂU HỎI:                                   │
│ [ 10 ]   [ 20 ]   [ 40 ]   [ Tất cả (70) ]    │
│                                               │
│ LOẠI CÂU HỎI:                                 │
│ [X] Kana → Chữ Hán/Từ                         │
│ [X] Từ/Chữ Hán → Tiếng Việt                   │
│ [X] Tiếng Việt → Chữ Hán/Từ                   │
│                                               │
│ [StickyBottomBar: [IconPlayerPlay] Bắt đầu ]  │
└───────────────────────────────────────────────┘

DESKTOP (> 1024px - max-w-3xl Centered)
┌────────────────────────────────────────────────────────────────────────┐
│ [IconArrowLeft] Quay lại 中級へ行こう                                  │
├────────────────────────────────────────────────────────────────────────┤
│ KIỂM TRA TOÀN BỘ GIÁO TRÌNH — 中級へ行こう                             │
│                                                                        │
│ ┌───────────────────────────────────┐ ┌──────────────────────────────┐ │
│ │ [IconBook] TỪ VỰNG                │ │ [IconWriting] HÁN TỰ         │ │
│ │ [X] Bài 1: Làm quen (20 từ)       │ │ [X] Bài 1: Con người (16 mục)│ │
│ │ [X] Bài 2: Gia đình (22 từ)       │ │ [X] Bài 2: Hành động (18 mục)│ │
│ │ [ ] Bài 3: Du lịch (24 từ)        │ │ [ ] Bài 3: Đời sống (14 mục) │ │
│ └───────────────────────────────────┘ └──────────────────────────────┘ │
│                                                                        │
│ 76 mục đã chọn · 70 câu khả dụng                                       │
│                                                                        │
│ SỐ CÂU HỎI:                                                            │
│ [ 10 ]   [ 20 ]   [ 40 ]   [ Tất cả (70) ]                             │
│                                                                        │
│ LOẠI CÂU HỎI:                                                          │
│ [X] Kana → Chữ Hán/Từ   [X] Từ → Tiếng Việt   [X] Tiếng Việt → Từ      │
│                                                                        │
│ [ [IconPlayerPlay] BẮT ĐẦU KIỂM TRA GIÁO TRÌNH (ENTER) ]               │
└────────────────────────────────────────────────────────────────────────┘
```

---

### SCREEN 09: Global Mixed Test (Kiểm tra tổng hợp)

#### Purpose:
The most expansive quiz builder in Tango. Combines arbitrary lessons across all textbooks and unassigned lessons into a single customized test session.

#### Routes & Navigation:
- **Route:** `/quiz/mixed-config`
- **Entry:** [SCREEN 01: Home](./STUDY_SCREENS.md#screen-01-home--study-hub) `[ [IconBolt] Kiểm tra tổng hợp ]`.
- **Exit:**
  - `[IconArrowLeft]` Back $\rightarrow$ Home (`/`).
  - `[ [IconPlayerPlay] Bắt đầu kiểm tra ]` $\rightarrow$ [SCREEN 10: Active Quiz](./QUIZ_SESSION_SCREENS.md#screen-10-active-quiz--practice-session) (`/quiz/session`).

#### Grouping Hierarchy:
1. **Study Book Groups:** Grouped under each book title, subdivided into `Từ vựng` and `Hán tự`.
2. **"Không thuộc giáo trình" (Unassigned):** Listed as a distinct final section with its standalone lessons.

#### Responsive Layout:
- **Mobile (< 640px):** Single-column stacked lists per textbook. Sticky bottom bar for the Start Test action.
- **Tablet / Desktop (>= 640px):** Centered `max-w-4xl` canvas. 2-column responsive layout: Left column (60%) contains the book and lesson selector with grouped accordions; Right column (40%) contains the sticky test configuration panel (question counts, question types, eligible tally, and primary start CTA).

#### Wireframes:
```text
MOBILE (< 640px)
┌───────────────────────────────────────────────┐
│ [IconArrowLeft]  Kiểm tra tổng hợp            │
├───────────────────────────────────────────────┤
│ 中級へ行こう                                  │
│   Từ vựng                                     │
│     [X] Bài 1 (20 từ)                         │
│     [ ] Bài 2 (22 từ)                         │
│   Hán tự                                      │
│     [X] Bài 1 (16 mục)                        │
│                                               │
│ Mimikara                                      │
│   Từ vựng                                     │
│     [X] Bài 3 (25 từ)                         │
│   Hán tự                                      │
│     [X] Bài 2 (18 mục)                        │
│                                               │
│ Không thuộc giáo trình                        │
│   Từ vựng                                     │
│     [ ] Du lịch (30 từ)                       │
│                                               │
│ 79 mục đã chọn · 72 câu khả dụng              │
│                                               │
│ SỐ CÂU HỎI:                                   │
│ [ 10 ]   [ 20 ]   [ 40 ]   [ Tất cả (72) ]    │
│                                               │
│ LOẠI CÂU HỎI:                                 │
│ [X] Kana → Chữ Hán/Từ                         │
│ [X] Từ/Chữ Hán → Tiếng Việt                   │
│ [X] Tiếng Việt → Chữ Hán/Từ                   │
│                                               │
│ [StickyBottomBar: [IconPlayerPlay] Bắt đầu ]  │
└───────────────────────────────────────────────┘

DESKTOP (> 1024px - max-w-4xl Centered)
┌────────────────────────────────────────────────────────────────────────┐
│ [IconArrowLeft] Quay lại Trang chủ               KIỂM TRA TỔNG HỢP     │
├────────────────────────────────────────────────────────────────────────┤
│ CHỌN BÀI HỌC (TẤT CẢ GIÁO TRÌNH)       CẤU HÌNH BÀI KIỂM TRA           │
│ ┌────────────────────────────────────┐ ┌─────────────────────────────┐ │
│ │ ▾ 中級へ行こう                     │ │ 79 mục đã chọn              │ │
│ │   Từ vựng:                         │ │ 72 câu khả dụng             │ │
│ │     [X] Bài 1: Làm quen (20 từ)    │ │                             │ │
│ │     [ ] Bài 2: Gia đình (22 từ)    │ │ SỐ CÂU HỎI:                 │ │
│ │   Hán tự:                          │ │ [ 10 ]  [ 20 ]  [ 40 ]      │ │
│ │     [X] Bài 1: Con người (16 mục)  │ │ [ Tất cả (72) ]             │ │
│ │                                    │ │                             │ │
│ │ ▾ Mimikara                         │ │ LOẠI CÂU HỎI:               │ │
│ │   Từ vựng:                         │ │ [X] Kana → Chữ Hán/Từ       │ │
│ │     [X] Bài 3: Từ nối (25 từ)      │ │ [X] Từ → Tiếng Việt         │ │
│ │   Hán tự:                          │ │ [X] Tiếng Việt → Từ         │ │
│ │     [X] Bài 2: Số đếm (18 mục)     │ │                             │ │
│ │                                    │ │ [ [IconPlayerPlay]          │ │
│ │ ▾ Không thuộc giáo trình           │ │   BẮT ĐẦU KIỂM TRA ]        │ │
│ │     [ ] JLPT N3 (30 từ)            │ │                             │ │
│ └────────────────────────────────────┘ └─────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```
