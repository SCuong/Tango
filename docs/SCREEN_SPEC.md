# Tango Screen-by-Screen UI Specification

This document is the authoritative, screen-by-screen user interface and responsive interaction specification for **Tango**. It serves as the primary implementation blueprint for all frontend development, locking layouts, visual hierarchies, responsive transitions, gestures, keyboard shortcuts, and state handling across Mobile, Tablet, and Desktop.

---

## 1. Document Overview & Platform Architecture

Tango is built as **ONE unified responsive React Single Page Application (SPA) + Progressive Web App (PWA)**. The codebase does not maintain separate products for mobile, tablet, and desktop; instead, a single responsive layout engine adapts fluidly across three defined breakpoints:

| Breakpoint Tier | Viewport Width | Typical Hardware | Layout Strategy |
|---|---|---|---|
| **Mobile** | `< 640px` | Smartphones (iOS, Android, PWA installed on phone) | Single-column stacked flow, thumb-zone action placement, full-screen sub-routes, bottom sheets |
| **Tablet** | `640px – 1024px` | iPads, Android tablets, Foldables | 2-column content grids, centered modal dialogs, balanced ergonomic touch layout |
| **Desktop / Laptop** | `> 1024px` | Laptops, Desktops, PWA installed on macOS/Windows/Linux | Centered constrained canvas, 3 to 4-column card grids, master-detail panels, keyboard-first navigation |

### Platform Installation Invariants:
1. **Installed PWA on Laptop / Desktop:** Runs in a standalone window utilizing the **Desktop / Laptop** responsive layout.
2. **Installed PWA on Mobile Phone:** Runs in a standalone window utilizing the **Mobile** responsive layout with safe-area insets.
3. **No Native OS Divergence:** All platforms share the identical design language, components, local storage engine, and navigation logic.

---

## 2. Global Design & Interaction Foundations

All screens must strictly comply with the established Tango design specifications:
- **Design System:** [`docs/DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) — Soft Claymorphism (tactile, matte ceramic elevation; no glossy bubbles or neon glows).
- **Typography:**
  - Vietnamese / English UI: `Be Vietnam Pro`
  - Japanese Learning Content: `Noto Sans JP` (prominent sizing, generous line-height)
- **Iconography:** Exclusively `Tabler Icons` (no generic emojis for UI controls).
- **Color Themes:** Three switchable themes (`light`, `dark`, `sakura`) driven by semantic CSS variables.
- **Answer Choices:** Strictly **NO** visible `A/B/C/D`, `1/2/3/4`, or keyboard hint tags stamped on buttons.
- **Audio Scope:** Web Audio UI feedback is optional and strictly **OFF by default**. No speech synthesis / TTS.
- **Content Safety:** **Hard delete only** (no trash, no recycle bin, no restore). Destructive actions reside strictly in Content Management under Settings.
- **Touch & Click Targets:**
  - Standard action buttons: Minimum height `48px`.
  - Quiz choice buttons: Minimum height `56px`.
  - Minimum gap between adjacent touch targets: `12px` (mobile), `16px` for destructive dialog buttons.

---

## 3. Reusable UI Components & Overlays Specification

To prevent visual inconsistencies, all screens reuse the following core component primitives:

### 3.1 Top Bar (`TopBar`)
- **Structure:** Left: Wordmark `TANGO` (or `[IconArrowLeft]` Back button on sub-screens); Center: Screen Title (on sub-screens); Right: Theme Swatch / Toggle and `[IconSettings]` Settings button.
- **Responsiveness:**
  - Mobile: Height `56px`, padding `0 16px`. Title truncated with ellipsis if exceeding available space.
  - Tablet/Desktop: Height `64px`, padding `0 24px`, max-width `max-w-4xl` centered.

### 3.2 Primary & Secondary Clay Buttons (`Button`)
- **Primary Clay:** Surface `--primary`, text white, subtle outer shadow `--shadow-clay-button`, inner top highlight. Hover: `--primary-hover`. Active/Pressed: shifts down 1px, shadow compresses.
- **Secondary / Neutral Clay:** Surface `--bg-surface`, border 1px `--border-subtle`, text `--text-primary`.
- **Destructive Error:** Surface `--error-surface`, border 1px `--error-border`, text `--error`.

### 3.3 Multiple-Choice Positional Answer Button (`AnswerOption`)
- **4 Positional Hues:** Position 1 (Amber), Position 2 (Sky Blue), Position 3 (Violet), Position 4 (Rose).
- **Format:** Height >= 56px, rounded corners `--radius-xl` (20px), text centered in `Noto Sans JP` / `Be Vietnam Pro`.
- **States:** Default (positional tint), Hover (subtle lift), Pressed (depressed 1px), Correct (Emerald ring `--success` + `IconCheck`), Incorrect (Red ring `--error` + `IconX`).

### 3.4 Checkbox Selection Row (`CheckboxRow`)
- **Format:** Tactile card row with `IconSquare` / `IconSquareCheckFilled` on the left, primary label (lesson title), and item count badge on the right. Min height 48px.

### 3.5 Segmented Control (`SegmentedControl`)
- **Format:** Enclosed pill container (`--bg-surface-elevated`) with sliding clay pill for the active choice. Zero harsh borders.

### 3.6 Bottom Sheet (`BottomSheet`)
- **Mobile Only:** Slides up from bottom edge with rounded top corners (`--radius-2xl`), semi-opaque backdrop (`backdrop-blur-sm`), handle indicator at top center, touch-drag to dismiss where non-critical.
- **Desktop Adaptation:** Automatically renders as a centered `Modal` dialog on Tablet and Desktop (> 640px).

### 3.7 Centered Modal Dialog (`Modal`)
- **Format:** Centered floating card (`--bg-surface`), backdrop blur, max width `max-w-md` to `max-w-lg`. Cancel button receives initial focus. `Escape` key dismisses non-destructive modals.

### 3.8 Sticky Bottom Action Bar (`StickyBottomBar`)
- **Mobile Only:** Affixed to bottom viewport (`bottom: 0`, `left: 0`, `right: 0`), padding `12px 16px`, incorporating `env(safe-area-inset-bottom)`. Background `--bg-page` with frosted glass blur (`backdrop-blur-md`) and top border 1px `--border-subtle`.
- **Desktop Adaptation:** Dissolves into the regular page flow directly beneath the form or selector.

### 3.9 Empty State (`EmptyState`)
- **Format:** Centered card with gentle clay surface, large muted Tabler icon (48px), bold explanatory headline, secondary guidance text, and optional safe navigation button. Never contains destructive controls.

---

## 4. Master Screen Inventory & Specifications

---

### SCREEN 01: Home / Study Hub

#### Purpose:
The learner's primary gateway. Exclusively focused on reading, exploring textbooks, browsing by category, and launching tests. Contains zero management controls.

#### Routes & Navigation:
- **Route:** `/`
- **Entry:** Application launch, clicking `TANGO` logo, or "Về trang chủ" action.
- **Exit:**
  - Tapping a Study Book card $\rightarrow$ SCREEN 02 (Book Study View).
  - Tapping `[IconBook] Từ vựng` or `[IconWriting] Hán tự` $\rightarrow$ SCREEN 04 (Learn by Type).
  - Tapping `[IconBolt] Kiểm tra tổng hợp` $\rightarrow$ SCREEN 09 (Global Mixed Test).
  - Tapping `[IconSettings]` $\rightarrow$ SCREEN 16 (Settings).

#### Responsive Layout Strategy:
- **Mobile (< 640px):** Single-column vertical flow. Study Books are displayed as a **vertical stacked list of compact tactile cards** (canonical mobile choice to eliminate horizontal swipe conflicts).
- **Tablet (640px – 1024px):** 2-column responsive grid for Study Books with 3:4 book cover aspect ratio. 2-column grid for Learn by Type.
- **Desktop (> 1024px):** Centered container (`max-w-4xl`). 3 to 4-column responsive grid for Study Books. Learn by Type as a balanced 2-column card row. Full-width Mixed Test action card.

#### Wireframe:
```text
MOBILE (< 640px)
┌───────────────────────────────────────────────┐
│ TANGO                   [Theme] [IconSettings]│
├───────────────────────────────────────────────┤
│ Bạn muốn học gì hôm nay?                      │
│                                               │
│ GIÁO TRÌNH (STUDY BOOKS)                      │
│ ┌───────────────────────────────────────────┐ │
│ │ [Thumb 1:1] 中級へ行こう                   │ │
│ │             8 bài · 164 mục · 85%         │ │
│ └───────────────────────────────────────────┘ │
│ ┌───────────────────────────────────────────┐ │
│ │ [Thumb 1:1] Mimikara                      │ │
│ │             5 bài · 110 mục · 40%         │ │
│ └───────────────────────────────────────────┘ │
│                                               │
│ HỌC THEO LOẠI (LEARN BY TYPE)                 │
│ ┌───────────────────┐   ┌───────────────────┐ │
│ │ [IconBook]        │   │ [IconWriting]     │ │
│ │ Từ vựng (13 bài)  │   │ Hán tự (11 bài)   │ │
│ └───────────────────┘   └───────────────────┘ │
│                                               │
│ ┌───────────────────────────────────────────┐ │
│ │ [IconBolt] Kiểm tra tổng hợp (Mixed Test) │ │
│ │ Kết hợp nhiều bài học để kiểm tra         │ │
│ └───────────────────────────────────────────┘ │
└───────────────────────────────────────────────┘

DESKTOP (> 1024px - max-w-4xl Centered)
┌────────────────────────────────────────────────────────────────────────┐
│ TANGO                                            [Theme] [IconSettings]│
├────────────────────────────────────────────────────────────────────────┤
│ Bạn muốn học gì hôm nay?                                               │
│                                                                        │
│ GIÁO TRÌNH (STUDY BOOKS)                                               │
│ ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐   │
│ │ [Cover 3:4]       │  │ [Cover 3:4]       │  │ [Cover 3:4]       │   │
│ │                   │  │                   │  │                   │   │
│ │ 中級へ行こう      │  │ Mimikara          │  │ Somatome N3       │   │
│ │ 8 bài · 164 mục   │  │ 5 bài · 110 mục   │  │ 6 bài · 120 mục   │   │
│ └───────────────────┘  └───────────────────┘  └───────────────────┘   │
│                                                                        │
│ HỌC THEO LOẠI                                                          │
│ ┌───────────────────────────────────┐ ┌──────────────────────────────┐ │
│ │ [IconBook] Từ vựng (Vocabulary)   │ │ [IconWriting] Hán tự (Kanji) │ │
│ │ 13 bài học trong tất cả giáo trình│ │ 11 bài học trong tất cả sách │ │
│ └───────────────────────────────────┘ └──────────────────────────────┘ │
│                                                                        │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ [IconBolt] KIỂM TRA TỔNG HỢP (MIXED TEST)                          │ │
│ │ Tùy chọn kết hợp không giới hạn bài học từ tất cả các giáo trình   │ │
│ └────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

#### States:
- **Empty Home State:** When `books` is empty, displays `EmptyState` explaining: *"Chưa có giáo trình nào. Bạn có thể thêm giáo trình trong: Cài đặt → Quản lý nội dung."* with button `[ Đi tới Cài đặt ]`.
- **Keyboard (Desktop):** Arrow keys navigate cards; `Enter` opens active card; `Alt+S` or `?` opens Settings.

---

### SCREEN 02: Book Study View

#### Purpose:
The dedicated overview for a single textbook. Presents curriculum divided into Vocabulary and Kanji, total progress, and direct book-level test initiation.

#### Routes & Navigation:
- **Route:** `/book/:bookId`
- **Entry:** Clicking a book card on Home.
- **Exit:**
  - `[IconArrowLeft]` Back button $\rightarrow$ Home (`/`).
  - Tapping `[ Mở Từ vựng ]` $\rightarrow$ SCREEN 03 (Category View: Vocab).
  - Tapping `[ Mở Hán tự ]` $\rightarrow$ SCREEN 03 (Category View: Kanji).
  - Tapping `[IconBolt] Kiểm tra giáo trình` $\rightarrow$ SCREEN 08 (Book Test Configuration).

#### Responsive Layout:
- **Mobile (< 640px):** Single-column stacked canvas. Compact book header with 1:1 cover thumbnail, book title, item counts, two category action cards, and a sticky or fixed bottom CTA button for `[ Kiểm tra giáo trình ]`.
- **Desktop (> 1024px):** Centered canvas (`max-w-2xl`). Rich cover image presentation (3:4 ratio), expansive progress stats, side-by-side or stacked category cards, and prominent clay button `[ Kiểm tra giáo trình ]`.

#### Wireframe:
```text
MOBILE (< 640px)
┌───────────────────────────────────────────────┐
│ [IconArrowLeft]  Chi tiết giáo trình          │
├───────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────┐ │
│ │ [Thumb]  中級へ行こう                     │ │
│ │          8 bài học · 164 mục · Đã học 65% │ │
│ └───────────────────────────────────────────┘ │
│                                               │
│ PHÂN LOẠI HỌC TẬP                             │
│ ┌───────────────────────────────────────────┐ │
│ │ [IconBook] TỪ VỰNG                        │ │
│ │ 3 bài học · 82 từ             [ Mở xem ]  │ │
│ └───────────────────────────────────────────┘ │
│ ┌───────────────────────────────────────────┐ │
│ │ [IconWriting] HÁN TỰ                      │ │
│ │ 5 bài học · 82 mục            [ Mở xem ]  │ │
│ └───────────────────────────────────────────┘ │
│                                               │
│ [ [IconBolt] Kiểm tra giáo trình này ]        │
└───────────────────────────────────────────────┘

DESKTOP (> 1024px - max-w-2xl Centered)
┌────────────────────────────────────────────────────────┐
│ [IconArrowLeft] Quay lại Trang chủ                     │
├────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────┐ │
│ │ [Cover 3:4]  中級へ行こう                          │ │
│ │              8 bài học · 164 mục học               │ │
│ │              Tiến độ tổng quát: 65%                │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │ [IconBook] TỪ VỰNG (VOCABULARY)                    │ │
│ │ 3 bài học · 82 từ                      [ Mở xem ]  │ │
│ └────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────┐ │
│ │ [IconWriting] HÁN TỰ (KANJI)                       │ │
│ │ 5 bài học · 82 mục                     [ Mở xem ]  │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ [ [IconBolt] KIỂM TRA TOÀN BỘ GIÁO TRÌNH NÀY ]         │
└────────────────────────────────────────────────────────┘
```

#### States:
- **Empty Category:** If a book has 0 lessons in a category, that category card shows: *"Chưa có bài học nào"* and the open button is disabled.

---

### SCREEN 03: Category View Inside Book

#### Purpose:
Lists all lessons belonging to one category (`vocabulary` or `kanji`) within a specific Study Book.

#### Routes & Navigation:
- **Route:** `/book/:bookId/category/:category`
- **Entry:** SCREEN 02 `[ Mở Từ vựng ]` or `[ Mở Hán tự ]`.
- **Exit:**
  - `[IconArrowLeft]` Back button $\rightarrow$ SCREEN 02.
  - Tapping a lesson row $\rightarrow$ SCREEN 05 (Lesson Detail).
  - Tapping `[IconCards] Kiểm tra nhiều bài` $\rightarrow$ SCREEN 07 (Category Multi-Lesson Config).

#### Responsive Layout:
- **Mobile (< 640px):** Single-column lesson list. Each row is a minimum 56px touch target with title, item count, and accuracy badge. Bottom sticky bar holds `[ Kiểm tra nhiều bài ]`.
- **Desktop (> 1024px):** Centered `max-w-4xl` canvas. 2-column responsive lesson card grid with top action bar containing `[ Kiểm tra nhiều bài ]`.

#### Wireframe:
```text
MOBILE (< 640px)
┌───────────────────────────────────────────────┐
│ [IconArrowLeft]  Hán tự · 中級へ行こう        │
├───────────────────────────────────────────────┤
│ 5 bài học · 82 mục                            │
│                                               │
│ ┌───────────────────────────────────────────┐ │
│ │ Bài 1: Con người & Gia đình   16 mục · 90%│ │
│ ├───────────────────────────────────────────┤ │
│ │ Bài 2: Hành động & Đi lại     18 mục · 75%│ │
│ ├───────────────────────────────────────────┤ │
│ │ Bài 3: Công việc & Đời sống   14 mục · -- │ │
│ ├───────────────────────────────────────────┤ │
│ │ Bài 4: Tự nhiên & Môi trường  18 mục · -- │ │
│ ├───────────────────────────────────────────┤ │
│ │ Bài 5: Xã hội & Giao tiếp     16 mục · -- │ │
│ └───────────────────────────────────────────┘ │
│                                               │
│ [ [IconCards] Kiểm tra nhiều bài trong mục ]  │
└───────────────────────────────────────────────┘
```

---

### SCREEN 04: Learn by Type (Học theo loại)

#### Purpose:
Category-centric perspective displaying all lessons of a specific category (`vocabulary` or `kanji`) grouped by parent Study Book, including "Không thuộc giáo trình" (Unassigned).

#### Routes & Navigation:
- **Route:** `/learn/:category`
- **Entry:** Home screen `[IconBook] Từ vựng` or `[IconWriting] Hán tự`.
- **Exit:** `[IconArrowLeft]` Back $\rightarrow$ Home (`/`). Tapping any lesson row $\rightarrow$ SCREEN 05 (Lesson Detail).

#### Responsive Behavior:
- **Group Structure:** Sections are grouped by book title with a subtle badge and thumbnail. Groups are **always expanded** for immediate scanning.
- **Mobile (< 640px):** Single-column stacked lists per book group.
- **Desktop (> 1024px):** Centered `max-w-4xl` layout with grouped cards in a 2-column grid.

#### Wireframe (Desktop):
```text
DESKTOP (> 1024px - max-w-4xl Centered)
┌────────────────────────────────────────────────────────────────────────┐
│ [IconArrowLeft] HÁN TỰ (TẤT CẢ GIÁO TRÌNH)                             │
├────────────────────────────────────────────────────────────────────────┤
│ ▾ 中級へ行こう (5 bài · 82 mục)                                        │
│ ┌───────────────────────────────────┐ ┌──────────────────────────────┐ │
│ │ Bài 1: Con người (16 mục · 90%)   │ │ Bài 2: Đi lại (18 mục · 75%) │ │
│ ├───────────────────────────────────┤ ├──────────────────────────────┤ │
│ │ Bài 3: Đời sống (14 mục · --)     │ │ Bài 4: Môi trường (18 mục)   │ │
│ └───────────────────────────────────┘ └──────────────────────────────┘ │
│                                                                        │
│ ▾ Mimikara (2 bài · 38 mục)                                            │
│ ┌───────────────────────────────────┐ ┌──────────────────────────────┐ │
│ │ Bài 1: Khởi đầu (20 mục · 80%)    │ │ Bài 2: Nâng cao (18 mục)     │ │
│ └───────────────────────────────────┘ └──────────────────────────────┘ │
│                                                                        │
│ ▾ Không thuộc giáo trình (1 bài · 20 mục)                              │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ 20 từ Kanji JLPT N3 (20 mục · --)                                  │ │
│ └────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

---

### SCREEN 05: Lesson Detail

#### Purpose:
Presents the overview of an individual lesson. Allows launching study actions deliberately without unexpected quiz auto-starts.

#### Routes & Navigation:
- **Route:** `/lesson/:lessonId`
- **Entry:** Tapping any lesson row in SCREEN 03, SCREEN 04, or SCREEN 02.
- **Exit:**
  - `[IconArrowLeft]` Back $\rightarrow$ Parent Category or Home.
  - `[IconBrain] Luyện tập` $\rightarrow$ SCREEN 10 (Practice Mode).
  - `[IconClock] Kiểm tra nhanh` $\rightarrow$ SCREEN 10 (Quick Test Mode).
  - `[IconList] Xem danh sách từ` $\rightarrow$ SCREEN 06 (View Items).
  - `[IconRefresh] Ôn từ sai` $\rightarrow$ SCREEN 15 (Review Missed Words).

#### Action Card Placement Rule:
> **Study Action Cards appear FIRST (above preview)** on both mobile and desktop to give learners immediate access to practicing without scrolling past dozens of words.

#### Wireframe:
```text
MOBILE (< 640px)
┌───────────────────────────────────────────────┐
│ [IconArrowLeft]  Hán tự · 中級へ行こう        │
├───────────────────────────────────────────────┤
│ Bài 2: Hành động & Đi lại                     │
│ 18 mục học · Tỷ lệ thuộc: 75%                 │
│                                               │
│ HÀNH ĐỘNG HỌC TẬP                             │
│ ┌───────────────────────────────────────────┐ │
│ │ [IconBrain] Luyện tập (Practice Mode)     │ │
│ │ Học từng mục, không tính giờ              │ │
│ └───────────────────────────────────────────┘ │
│ ┌───────────────────────────────────────────┐ │
│ │ [IconClock] Kiểm tra nhanh (Quick Test)   │ │
│ │ Trắc nghiệm: 10 / Tất cả (18)             │ │
│ └───────────────────────────────────────────┘ │
│ ┌───────────────────────────────────────────┐ │
│ │ [IconList] Xem danh sách từ (18 mục)      │ │
│ └───────────────────────────────────────────┘ │
│ ┌───────────────────────────────────────────┐ │
│ │ [IconRefresh] Ôn từ sai (2 từ cần ôn)     │ │
│ └───────────────────────────────────────────┘ │
└───────────────────────────────────────────────┘
```

---

### SCREEN 06: View Lesson Items (Danh sách từ)

#### Purpose:
Dedicated readable, peaceful reference view of all `StudyItem` records in a lesson.

#### Routes & Navigation:
- **Route:** `/lesson/:lessonId/items`
- **Entry:** SCREEN 05 `[IconList] Xem danh sách từ`.
- **Exit:** `[IconArrowLeft]` Back $\rightarrow$ SCREEN 05.

#### Content & Hán Việt Rule:
Each item displays:
1. `japanese`: Large Japanese text in `Noto Sans JP`.
2. `kana`: Reading in Hiragana/Katakana (if present).
3. `vietnamese`: Array of meanings rendered as comma-separated text.
4. `hanViet`: Sino-Vietnamese reading in uppercase tags (e.g. `[ LỮ HÀNH ]`).
> **Strict Rule:** If `hanViet` is absent, the Hán Việt container is **completely hidden**. No placeholder text like "N/A" or "Không có".

#### Layout:
- **Mobile (< 640px):** Vertical stacked cards with 12px separation.
- **Desktop (> 1024px):** Centered `max-w-3xl` structured list with clean table-like alignment.

#### Wireframe (Mobile):
```text
MOBILE (< 640px)
┌───────────────────────────────────────────────┐
│ [IconArrowLeft]  Danh sách từ (18 mục)        │
├───────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────┐ │
│ │ 旅行                [ LỮ HÀNH ]           │ │
│ │ りょこう                                  │ │
│ │ du lịch, chuyến đi                        │ │
│ └───────────────────────────────────────────┘ │
│ ┌───────────────────────────────────────────┐ │
│ │ ファストフード                            │ │
│ │ ふぁすとふーど                            │ │
│ │ đồ ăn nhanh                               │ │
│ └───────────────────────────────────────────┘ │
└───────────────────────────────────────────────┘
```

---

### SCREEN 07: Category Multi-Lesson Test Config

#### Purpose:
Allows selecting multiple lessons within a specific category and book, configuring question counts and formats, and launching a combined test.

#### Routes & Navigation:
- **Route:** `/book/:bookId/category/:category/quiz-config`
- **Entry:** SCREEN 03 `[ Kiểm tra nhiều bài ]`.
- **Exit:** `[IconArrowLeft]` Cancel/Back $\rightarrow$ SCREEN 03. `[ Bắt đầu kiểm tra ]` $\rightarrow$ SCREEN 10 (Quiz).

#### Slicing & Eligible Question Rules:
- Displays `X mục đã chọn · Y câu khả dụng`.
- $N$ = Eligible unique items after deduplication and question-type compatibility filtering.
- Dynamic Candidate Counts: Buttons `10`, `20`, `40` only rendered when `<= N`.
- `Tất cả (N)` uses eligible count $N$, never multiplying by question types.
- If $N = 0$, hides count buttons, disables CTA, and shows: *"Không có câu hỏi phù hợp với các loại câu hỏi đã chọn."*

#### Wireframe:
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
│ [ [IconPlayerPlay] Bắt đầu kiểm tra ]         │
└───────────────────────────────────────────────┘
```

---

### SCREEN 08: Book Test Config (Kiểm tra giáo trình)

#### Purpose:
Allows selecting any combination of Vocabulary and Kanji lessons across the currently opened Study Book.

#### Routes & Navigation:
- **Route:** `/book/:bookId/quiz-config`
- **Entry:** SCREEN 02 `[ Kiểm tra giáo trình ]`.
- **Exit:** `[IconArrowLeft]` Back $\rightarrow$ SCREEN 02. `[ Bắt đầu kiểm tra ]` $\rightarrow$ SCREEN 10.
- **Layout:** Reuses the exact selector and question-count mechanics as SCREEN 07, organized into two distinct sections: `TỪ VỰNG` and `HÁN TỰ`.

---

### SCREEN 09: Global Mixed Test (Kiểm tra tổng hợp)

#### Purpose:
The most powerful quiz builder in Tango. Combines arbitrary lessons across all textbooks and unassigned lessons.

#### Routes & Navigation:
- **Route:** `/quiz/mixed-config`
- **Entry:** Home screen `[IconBolt] Kiểm tra tổng hợp`.
- **Exit:** `[IconArrowLeft]` Back $\rightarrow$ Home (`/`). `[ Bắt đầu kiểm tra ]` $\rightarrow$ SCREEN 10.

#### Grouping Hierarchy:
1. Book Title
   - Vocabulary lessons
   - Kanji lessons
2. "Không thuộc giáo trình" (Unassigned)
   - Standalone lessons

#### Wireframe:
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
│ SỐ CÂU:                                       │
│ [ 10 ]   [ 20 ]   [ 40 ]   [ Tất cả (72) ]    │
│                                               │
│ [ [IconPlayerPlay] Bắt đầu kiểm tra ]         │
└───────────────────────────────────────────────┘
```

---

### SCREEN 10: Active Quiz / Practice Session

#### Purpose:
The focused study environment where questions are answered. Minimalist, zero distractions.

#### Navigation & Header:
- Top HUD:
  - Left: `[IconX]` Exit button (triggers SCREEN 13 Exit Confirm).
  - Center: High-contrast progress bar + Question counter (`4 / 20`).
  - Right: Streak flame counter (`🔥 4`). In Quick Test, elapsed timer (`01:25`).

#### Center Prompt Card:
- Large prompt text (e.g. `りょこう` or `du lịch`). Font size: `28px–36px` on mobile, `40px–48px` on desktop.
- Optional sub-prompt for reading disambiguation.

#### Bottom Thumb-Zone Area (4 Positional Answer Choices):
- Stacked 4 choices with positional identity:
  - Choice 1: Amber tint
  - Choice 2: Sky Blue tint
  - Choice 3: Violet tint
  - Choice 4: Rose tint
- Minimum height `56px`, generous padding, large text.
- **CRITICAL:** Strictly **NO** visible `A/B/C/D`, `1/2/3/4`, or keyboard hint tags.

#### Desktop Keyboard Integration:
- Keys `1`, `2`, `3`, `4`: Select corresponding answer choice in background.
- `Escape`: Trigger exit confirmation modal.

#### Wireframe:
```text
MOBILE (< 640px)
┌───────────────────────────────────────────────┐
│ [IconX]   ━━━━━━━░░░░░░░░░░   4/20   🔥 4     │
├───────────────────────────────────────────────┤
│                                               │
│               りょこう                        │
│                                               │
│                                               │
│ ┌───────────────────────────────────────────┐ │
│ │                  du lịch                  │ │
│ └───────────────────────────────────────────┘ │
│ ┌───────────────────────────────────────────┐ │
│ │                 thực tế                   │ │
│ └───────────────────────────────────────────┘ │
│ ┌───────────────────────────────────────────┐ │
│ │                 lễ nghi                   │ │
│ └───────────────────────────────────────────┘ │
│ ┌───────────────────────────────────────────┐ │
│ │                cảnh quan                  │ │
│ └───────────────────────────────────────────┘ │
└───────────────────────────────────────────────┘

DESKTOP (> 1024px - max-w-xl Centered Study Canvas)
┌────────────────────────────────────────────────────────┐
│ [IconX]     ━━━━━━━━━━━━━━░░░░░░░░░░   4/20     🔥 4   │
├────────────────────────────────────────────────────────┤
│                                                        │
│                                                        │
│                       りょこう                         │
│                                                        │
│                                                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │                      du lịch                       │ │
│ └────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────┐ │
│ │                      thực tế                       │ │
│ └────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────┐ │
│ │                      lễ nghi                       │ │
│ └────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────┐ │
│ │                     cảnh quan                      │ │
│ └────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

---

### SCREEN 11: Correct Answer Feedback

#### Visual & Audio Behavior:
- **Button Highlight:** Selected choice highlights with Emerald Green ring (`--success`, `#059669`) and an inline `IconCheck`.
- **Toast:** Brief confirmation badge: *"Chính xác! 👏"*.
- **Auto-Advance:** Progresses to next question automatically in **750ms**, or immediately on `Enter`, `Space`, or screen tap.
- **Sound Effects:** If enabled in Settings (Off by default), plays subtle chime (<200ms). Never blocks progression.

---

### SCREEN 12: Incorrect Answer Feedback & Explanation

#### Visual & Audio Behavior:
- **Button Highlights:**
  - Selected wrong choice: Red ring (`--error`, `#DC2626`) and `IconX`.
  - True correct choice: Simultaneously highlighted with Emerald Green ring and `IconCheck`.
- **Sound Effects:** Gentle low-frequency tone (<200ms) if sound enabled.
- **Explanation Container:**
  - **Mobile (< 640px):** Slides in from the bottom as an interactive `BottomSheet`.
  - **Desktop (> 1024px):** Renders as an overlay card centered directly below the prompt.
- **Content:**
  - Status: `❌ Chưa chính xác`
  - Word: `旅行` (Japanese)
  - Reading: `りょこう` (Kana)
  - Hán Việt: `LỮ HÀNH` (Hidden completely if absent)
  - Meaning: `du lịch, chuyến đi`
  - Primary Button: `[ Đã hiểu — Tiếp tục (Enter) ]`

#### Wireframe:
```text
MOBILE BOTTOM SHEET
┌───────────────────────────────────────────────┐
│                    ═════                      │
│ ❌ Chưa chính xác                             │
│                                               │
│ 旅行                                          │
│ りょこう                                      │
│                                               │
│ Hán Việt: LỮ HÀNH                             │
│ Nghĩa: du lịch, chuyến đi                     │
│                                               │
│ [ [IconArrowRight] Đã hiểu — Tiếp tục ]       │
└───────────────────────────────────────────────┘
```

---

### SCREEN 13: Quiz Exit Confirmation

#### Purpose:
Prevents accidental abandonment of an ongoing quiz session.

#### Presentation:
- **Mobile & Desktop:** Centered `Modal` dialog with semi-opaque backdrop blur.
- **Copy:**
  - Title: *"Dừng bài kiểm tra?"*
  - Body: *"Tiến độ của bài kiểm tra hiện tại sẽ không được lưu vào lịch sử."*
  - Actions:
    - Primary Button: `[ Tiếp tục học ]` (receives initial focus)
    - Secondary Button: `[ Thoát ]` (neutral outline)

---

### SCREEN 14: Quiz Results Summary

#### Purpose:
Post-quiz assessment metrics and mistake review triggers.

#### Metrics Grid:
- Points / Correct count (e.g. `17 / 20`)
- Accuracy percentage (e.g. `85%`)
- Best streak (e.g. `🔥 8 liên tiếp`)
- Elapsed time (e.g. `01:40`)

#### Actions:
1. `[IconRefresh] Ôn lại các từ đã sai (3 từ)` — High-emphasis primary button (only shown if mistakes exist).
2. `[IconRotateClockwise] Làm lại bài kiểm tra` — Secondary button.
3. `[IconHome] Về trang chủ` — Tertiary button.

#### Responsive Adaptation:
- **Mobile (< 640px):** 2x2 metric cards, stacked action buttons.
- **Desktop (> 1024px):** Centered `max-w-2xl` canvas, 4-column metric row, side-by-side action buttons.

---

### SCREEN 15: Review Missed Words (Ôn lại từ sai)

#### Purpose:
Launches a targeted session containing only items failed in the recent quiz or marked weak.
- Reuses SCREEN 10 (Quiz Runner) scoped strictly to `missedItemIds`.
- Once all weak items are answered correctly, returns gracefully to SCREEN 14 or Home.
- **Empty State:** If launched when 0 items are weak, displays: *"Tuyệt vời! Bạn không có từ nào cần ôn lại."*

---

### SCREEN 16: Settings (Cài đặt)

#### Purpose:
Preferences management and intentional gateway to Content Management.

#### Routes & Navigation:
- **Route:** `/settings`
- **Entry:** Top bar `[IconSettings]` from Home or study views.
- **Exit:** `[IconArrowLeft]` Back or `[IconX]` Close $\rightarrow$ Previous screen.

#### Canonical Responsive Presentation:
- **Mobile (< 640px):** **Full-screen route** (`/settings`) with `[IconArrowLeft]` top back button.
- **Tablet / Desktop (>= 640px):** **Centered modal dialog** (`max-w-lg`) with backdrop blur and `[IconX]` top-right close button.

#### Content Sections:
1. **Giao diện & Tùy chọn:**
   - **Language:** Segmented control `[ Tiếng Việt ]` | `[ English ]`
   - **Theme:** 3 visual clay swatches `[ Sáng / Light ]` | `[ Tối / Dark ]` | `[ Sakura / Sakura ]`
   - **Sound Effects:** Segmented control `[ Off / Tắt ]` | `[ On / Bật ]` (Default: **Off**)
2. **Nội dung học (Study Content):**
   - Clickable row: `Quản lý giáo trình và bài học` $\rightarrow$ navigates to SCREEN 17.

#### Wireframe (Mobile & Desktop Modal):
```text
SETTINGS PANEL
┌───────────────────────────────────────────────┐
│ CÀI ĐẶT                              [IconX]  │
├───────────────────────────────────────────────┤
│ GIAO DIỆN & TÙY CHỌN                          │
│                                               │
│ Ngôn ngữ giao diện                            │
│ [ (•) Tiếng Việt ]     [ ( ) English ]        │
│                                               │
│ Chủ đề màu sắc                                │
│ [ Sáng ]          [ Tối ]          [ Sakura ] │
│                                               │
│ Âm thanh hiệu ứng                             │
│ [ (•) Tắt (Off) ]      [ ( ) Bật (On) ]       │
│                                               │
│ NỘI DUNG HỌC                                  │
│ ┌───────────────────────────────────────────┐ │
│ │ Quản lý giáo trình và bài học   [IconChevronRight] │
│ │ Thêm, sửa, nhập và phân loại nội dung     │ │
│ └───────────────────────────────────────────┘ │
└───────────────────────────────────────────────┘
```

---

### SCREEN 17: Content Management (Quản lý nội dung)

#### Purpose:
The single protected administrative hub for adding, editing, reassigning, and deleting content.

#### Routes & Navigation:
- **Route:** `/settings/content-management`
- **Entry:** Settings row "Quản lý giáo trình và bài học".
- **Exit:** `[IconArrowLeft]` Back $\rightarrow$ Settings.
- **Actions:**
  - `[IconPlus] Thêm giáo trình` $\rightarrow$ SCREEN 18.
  - `[ Quản lý ]` beside a book $\rightarrow$ SCREEN 19.
  - `[IconFileImport] Thêm / Nhập bài học mới` $\rightarrow$ SCREEN 21.

#### Canonical Responsive Layout:
- **Mobile (< 640px):** Full-screen stacked list. Books listed first, followed by Lesson actions.
- **Desktop (> 1024px):** **Structured 2-column management dashboard** (`max-w-4xl`):
  - Left Column (60%): Study Books list with `[ Quản lý ]` and `+ Thêm giáo trình`.
  - Right Column (40%): Lessons & Import quick tools (`Thêm / Nhập bài học mới`, `Chuyển giáo trình`).

#### Wireframe (Desktop 2-Column):
```text
DESKTOP (> 1024px - max-w-4xl Centered)
┌────────────────────────────────────────────────────────────────────────┐
│ [IconArrowLeft] Quay lại Cài đặt             QUẢN LÝ NỘI DUNG          │
├────────────────────────────────────────────────────────────────────────┤
│ GIÁO TRÌNH (STUDY BOOKS)               BÀI HỌC (LESSONS)               │
│ ┌────────────────────────────────────┐ ┌─────────────────────────────┐ │
│ │ [Thumb] 中級へ行こう    [ Quản lý ]│ │ [IconFileImport]            │ │
│ │         8 bài · 164 mục            │ │ Thêm / Nhập bài học mới     │ │
│ ├────────────────────────────────────┤ └─────────────────────────────┘ │
│ │ [Thumb] Mimikara        [ Quản lý ]│ ┌─────────────────────────────┐ │
│ │         5 bài · 110 mục            │ │ [IconArrowsExchange]        │ │
│ └────────────────────────────────────┘ │ Chuyển giáo trình cho bài   │ │
│                                        │ Di chuyển bài học giữa sách │ │
│ [ [IconPlus] Thêm giáo trình mới ]     └─────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

---

### SCREEN 18: Add Study Book (Thêm giáo trình)

#### Purpose:
Creates a new `StudyBook` record.

#### Presentation:
- **Mobile (< 640px):** Full-screen form route with top `[IconArrowLeft]` cancel and bottom sticky `[ Tạo giáo trình ]`.
- **Tablet / Desktop (>= 640px):** Centered `Modal` dialog (`max-w-md`).

#### Form Fields & Validation:
1. `Tên giáo trình *`: Required text input. Real-time validation (cannot be empty). Duplicate titles are explicitly allowed.
2. `Ảnh bìa (không bắt buộc)`: Native file picker (`.jpg`, `.jpeg`, `.png`, `.webp`). Live preview box with 3:4 ratio.
3. Actions: `[ Hủy ]` and `[ Tạo giáo trình ]` (disabled if title empty).

---

### SCREEN 19: Manage Study Book (Quản lý giáo trình)

#### Purpose:
Inspects and modifies a single Study Book: title rename, cover replace/remove, lesson roster, and book Danger Zone.

#### Routes & Navigation:
- **Route:** `/settings/content-management/book/:bookId`
- **Entry:** SCREEN 17 `[ Quản lý ]` beside book.
- **Exit:** `[IconArrowLeft]` Back $\rightarrow$ SCREEN 17.

#### Lesson Row Safety Rule:
> **No Direct Delete Beside Lesson Rows:** Lesson rows inside the book manager show **only `[ Quản lý ]`**. They **never** include an adjacent inline delete icon.

#### Wireframe:
```text
MOBILE (< 640px)
┌───────────────────────────────────────────────┐
│ [IconArrowLeft]  Quản lý: 中級へ行こう        │
├───────────────────────────────────────────────┤
│ Tên giáo trình                                │
│ [ 中級へ行こう                              ] │
│                                               │
│ Ảnh bìa:                                      │
│ [Preview]  [ Thay ảnh ]  [ Xóa ảnh bìa ]      │
│                                               │
│ DANH SÁCH BÀI HỌC (8 bài)                     │
│ • Bài 1: Từ vựng (20 mục)         [ Quản lý ] │
│ • Bài 2: Từ vựng (22 mục)         [ Quản lý ] │
│ • Bài 1: Hán tự (16 mục)          [ Quản lý ] │
│                                               │
│ [ [IconPlus] Thêm bài vào giáo trình này ]    │
│                                               │
│ ───────────────────────────────────────────── │
│ VÙNG NGUY HIỂM (DANGER ZONE)                  │
│ Xóa vĩnh viễn giáo trình và toàn bộ bài học.  │
│ [ [IconTrash] Xóa giáo trình này ]            │
└───────────────────────────────────────────────┘
```

---

### SCREEN 20: Manage Lesson (Quản lý bài học)

#### Purpose:
Dedicated administrative screen for a single lesson.

#### Routes & Navigation:
- **Route:** `/settings/content-management/lesson/:lessonId`
- **Entry:** Tapping `[ Quản lý ]` beside a lesson row in SCREEN 19 or SCREEN 17.
- **Exit:** `[IconArrowLeft]` Back $\rightarrow$ Previous screen.

#### Capabilities & Safety:
- Rename lesson title & subtitle.
- Change category (`vocabulary` ↔ `kanji`).
- Reassign parent Study Book (or select "Không thuộc giáo trình").
- **Safety Guarantee:** Changing parent book or category modifies only metadata; it **never** changes `Lesson.id`, item IDs, or resets progress.
- Primary Action: `[ Lưu thay đổi ]` (explicit save required).
- Danger Zone: Contains `[ Xóa bài học này ]` (triggers SCREEN 26).

---

### SCREEN 21: Add / Import Lesson: Input Stage (Bước 1)

#### Purpose:
First stage of the authoritative lesson importer.

#### Form Elements:
1. Target Study Book dropdown (preselected if opened from book manager).
2. Category selector: `[ (•) Từ vựng ]` | `[ ( ) Hán tự ]`.
3. Lesson title text input.
4. Input mode toggle: `[ Dán văn bản ]` | `[ Tải tệp lên ]`.
5. Supported formats: `.txt`, `.csv`, `.tsv`, `.md`, `.xlsx`.
6. Delimiter selector: `[ Tự động ]` | `[ Tab ]` | `[ Chấm phẩy ; ]` | `[ Pipe | ]` | `[ Phẩy , ]`.
7. Next button: `[ Tiếp tục: Kiểm tra dữ liệu ]`.

---

### SCREEN 22: Import Column Mapping / Parsing (Bước 2)

#### Purpose:
Shown when auto-detection requires user confirmation or adjustment of column headers.

#### Mapping Target Fields:
- `japanese` (Bắt buộc)
- `kana` (Tùy chọn)
- `hanViet` (Tùy chọn)
- `vietnamese` (Tùy chọn)

#### Mobile Safeguard:
- On mobile (< 640px), mapping uses **clean stacked dropdown cards** for each field rather than a squished desktop table.

---

### SCREEN 23: Import Preview & Validation (Bước 3)

#### Purpose:
Pre-import verification summary displaying parsed items, deduplication results, and non-blocking warnings.

#### Elements:
- Header summary: Target Book, Category, Title, Total parsed rows.
- Badges: Valid count, Duplicate count (auto-merged), Conflict count, Warning count (`⚠`).
- Preview content:
  - Mobile: Stacked preview cards showing first 5 rows with badge pills.
  - Desktop: Scrollable table (`max-h-96`) showing all parsed rows.
- Actions: `[ Quay lại chỉnh sửa ]` and `[ Xác nhận nhập bài ]`.

---

### SCREEN 24: Import Result / Completion (Bước 4)

#### Purpose:
Clean success state confirming persistent storage to `tango_v1_lessons`.

#### Elements:
- Icon: Emerald `IconCircleCheckFilled`.
- Headline: *"Nhập bài học thành công!"*.
- Summary: e.g. *"Đã lưu 39 mục học vào Bài 3: Đời sống (Hán tự) trong giáo trình 中級へ行こう."*.
- Actions:
  - `[ Bắt đầu học bài này ngay ]` (Primary CTA $\rightarrow$ SCREEN 05).
  - `[ Về Quản lý nội dung ]` (Secondary CTA $\rightarrow$ SCREEN 17).

---

### SCREEN 25: Delete Study Book Confirmation

#### Purpose:
Destructive modal dialog confirming permanent deletion of a Study Book and all contained lessons.

#### Ergonomics & Safeguards:
- **Mobile (< 640px):** Stacked full-width buttons with **16px vertical gap**. `[ Hủy bỏ ]` sits on top; `[ Xóa vĩnh viễn ]` sits below with semantic error red styling (`--error`).
- **Desktop (> 1024px):** Centered modal (`max-w-md`). `[ Hủy bỏ ]` sits on the left with initial focus.
- **Copy:** Explicitly states book title, total lesson count, and total item count. Warns that all study data and cover images will be permanently erased and cannot be undone.

---

### SCREEN 26: Delete Lesson Confirmation

#### Purpose:
Destructive modal dialog confirming permanent deletion of an individual lesson.

#### Ergonomics & Safeguards:
- Same button separation and focus rules as SCREEN 25.
- Copy states: Lesson title, category, parent book name, and item count.
- Confirms that the parent Study Book remains intact.

---

### SCREEN 27: Remove Cover Confirmation

#### Purpose:
Confirms removal of a book cover image.

#### Copy & Scope Safeguard:
- Headline: *"Xóa ảnh bìa giáo trình?"*.
- Body: *"Giáo trình và toàn bộ bài học bên trong vẫn được giữ nguyên 100%. Chỉ ảnh bìa sẽ được gỡ bỏ."*.
- Actions: `[ Hủy ]` and `[ Xóa ảnh bìa ]`.

---

## 5. Mobile Navigation & Safe-Area Rules

1. **Back Navigation:** Every sub-screen possesses an explicit top-left `[IconArrowLeft]` button returning predictably to its immediate parent.
2. **Hardware Back Button (Android / PWA):** Listens to browser history (`popstate`). Back button closes open sheets and modals before navigating backwards in the route hierarchy.
3. **Form Protection:** If a user modifies text in Add Book or Import and attempts to go back, a lightweight prompt confirms: *"Bỏ các thay đổi chưa lưu?"*.
4. **Safe-Area Insets:** Top header includes `env(safe-area-inset-top)`. Bottom sticky bars include `env(safe-area-inset-bottom)`.
5. **No Horizontal Scroll:** The `<html>` and `<body>` viewports strictly enforce `overflow-x: hidden`. All list cards and text wrap cleanly.

---

## 6. Desktop & Laptop Productivity Rules

1. **Constrained Content Max-Widths:**
   - Browsing & Management: `max-w-4xl` (~896px).
   - Book Study View: `max-w-2xl` (~672px).
   - Active Quiz Study Canvas: `max-w-xl` (~576px).
2. **Invisible Keyboard Shortcuts:**
   - Multiple choice choices: Keys `1`, `2`, `3`, `4`.
   - Confirm / Advance / Dismiss: `Enter` or `Space`.
   - Exit dialog trigger: `Escape`.
   - Strictly no visible shortcut tags stamped on buttons.
3. **Focus States:** Every interactive element has high-contrast `:focus-visible` styling (`2px solid var(--primary)` with 2px offset).

---

## 7. Tablet Layout Rules

1. **Browsing Screens (Home, Category, Learn by Type):** Form a 2-column grid.
2. **Quiz Screen:** Uses the Desktop centered constrained canvas (`max-w-xl`) to prevent excessive eye travel.
3. **Overlays:** Uses centered modal dialogs rather than mobile bottom sheets.

---

## 8. Loading & Async Operations Specification

Because Tango is a local-first application using `localStorage` and `IndexedDB`, page transitions are instantaneous. Loading indicators are used **only** during genuine asynchronous file operations:
1. **Reading & Parsing `.xlsx` / Large Files:** Displays a small ceramic spinner with text: *"Đang xử lý dữ liệu..."*.
2. **Compressing & Storing Cover Blob:** Shows a brief inline spinner inside the preview box: *"Đang lưu ảnh..."*.
3. **Initial Seed Copy (First Launch):** Seamless, instantaneous splash transition; no simulated artificial progress bars.

---

## 9. Validation & Error Handling Specification

1. **Empty Book Title:** Shows red border and inline message: *"Vui lòng nhập tên giáo trình."*. Create CTA disabled.
2. **Invalid Cover Format:** Shows inline warning: *"Chỉ hỗ trợ tệp ảnh .jpg, .png, .webp."*.
3. **N = 0 Quiz State:** When selected lessons or question types yield 0 questions:
   - Does NOT render `Tất cả (0)`.
   - Does NOT render fixed count buttons.
   - Start Test CTA is disabled.
   - Inline message: *"Không có câu hỏi phù hợp với các loại câu hỏi đã chọn."*.
4. **Storage Quota Exceeded:** Shows modal explaining device storage is full, recommending deleting unused book covers or lessons.

---

## 10. Master Screen Coverage Matrix

| Screen ID | Screen Name | Mobile (< 640px) | Tablet (640px–1024px) | Desktop (> 1024px) | Empty State Handling | Keyboard Shortcuts | Destructive Actions |
|---|---|---|---|---|---|---|---|
| **SCREEN 01** | Home / Study Hub | Stacked list of book cards | 2-col book card grid | 3-4 col book card grid (`max-w-4xl`) | Full empty card with link to Settings | `Enter` (open), `Alt+S` (settings) | None |
| **SCREEN 02** | Book Study View | Stacked cards + sticky CTA | Centered `max-w-2xl` | Centered `max-w-2xl` | Disabled category card if 0 lessons | `Esc` (back), `Enter` (test) | None |
| **SCREEN 03** | Category View Inside Book | Full-width lesson list | 2-col lesson grid | 2-col lesson grid (`max-w-4xl`) | Empty message if 0 lessons in cat | `Esc` (back) | None |
| **SCREEN 04** | Learn by Type | Stacked groups by book | 2-col grouped cards | 2-col grouped cards (`max-w-4xl`) | Message if no lessons exist | `Esc` (back) | None |
| **SCREEN 05** | Lesson Detail | Actions top + items below | Centered `max-w-2xl` | Centered `max-w-2xl` | N/A (valid lesson required) | `1`-`4` (actions), `Esc` (back) | None |
| **SCREEN 06** | View Lesson Items | Stacked item cards | 2-col cards | Table-like rows (`max-w-3xl`) | Message if lesson empty | `Esc` (back) | None |
| **SCREEN 07** | Category Multi-Lesson Config | Full-screen selector | Centered modal | Centered modal (`max-w-xl`) | `N=0` empty message + disabled CTA | `Esc` (close), `Enter` (start) | None |
| **SCREEN 08** | Book Test Config | Full-screen selector | Centered modal | Centered modal (`max-w-xl`) | `N=0` empty message + disabled CTA | `Esc` (close), `Enter` (start) | None |
| **SCREEN 09** | Global Mixed Test | Full-screen tree selector | Centered modal | Centered modal (`max-w-2xl`) | `N=0` empty message + disabled CTA | `Esc` (close), `Enter` (start) | None |
| **SCREEN 10** | Active Quiz / Practice | Full-screen thumb zone | Centered `max-w-xl` | Centered canvas `max-w-xl` | Handled before launch | `1`-`4` (choice), `Esc` (exit) | None |
| **SCREEN 11** | Correct Answer Feedback | Emerald ring + auto-advance | Centered | Centered | N/A | `Enter`/`Space` (advance) | None |
| **SCREEN 12** | Incorrect Explanation | Slide-up bottom sheet | Centered overlay | Centered overlay card | N/A | `Enter`/`Space` (continue) | None |
| **SCREEN 13** | Quiz Exit Confirmation | Centered modal | Centered modal | Centered modal (`max-w-md`) | N/A | `Esc` (cancel), `Enter` (keep) | None |
| **SCREEN 14** | Quiz Results Summary | 2x2 grid + stacked buttons | 4-col metric row | 4-col metrics (`max-w-2xl`) | N/A | `Enter` (review), `Esc` (home) | None |
| **SCREEN 15** | Review Missed Words | Reuses quiz runner | Reuses quiz runner | Reuses quiz runner | Message: "Không có từ cần ôn" | `1`-`4` (choice), `Esc` (exit) | None |
| **SCREEN 16** | Settings | Full-screen route | Centered modal | Centered modal (`max-w-lg`) | N/A | `Esc` (close) | None |
| **SCREEN 17** | Content Management | Full-screen stacked list | 2-col stacked grid | 2-col dashboard (`max-w-4xl`) | Empty book list prompt | `Esc` (back) | None |
| **SCREEN 18** | Add Study Book | Full-screen form route | Centered modal | Centered modal (`max-w-md`) | N/A | `Esc` (cancel), `Enter` (save) | None |
| **SCREEN 19** | Manage Study Book | Stacked overview + Danger | 2-col layout | 2-col layout (`max-w-4xl`) | Message if 0 lessons | `Esc` (back) | Danger Zone |
| **SCREEN 20** | Manage Lesson | Stacked form + Danger | Centered form card | Centered card (`max-w-2xl`) | N/A | `Esc` (back), `Ctrl+S` (save) | Danger Zone |
| **SCREEN 21** | Import Lesson: Input Stage | Stacked input form | Centered `max-w-2xl` | 2-col setup (`max-w-4xl`) | N/A | `Esc` (back) | None |
| **SCREEN 22** | Import Column Mapping | Stacked dropdown cards | Centered table | Centered table (`max-w-3xl`) | N/A | `Esc` (back) | None |
| **SCREEN 23** | Import Preview & Validation | Stacked preview cards | Scrollable table | Scrollable table (`max-w-4xl`) | Shows 0 valid rows message | `Esc` (back), `Enter` (import)| None |
| **SCREEN 24** | Import Completion | Centered success card | Centered card | Centered card (`max-w-lg`) | N/A | `Enter` (open lesson) | None |
| **SCREEN 25** | Delete Book Confirmation | Bottom sheet (16px gap) | Centered modal | Centered modal (`max-w-md`) | N/A | `Esc` (cancel) | HARD DELETE |
| **SCREEN 26** | Delete Lesson Confirmation | Bottom sheet (16px gap) | Centered modal | Centered modal (`max-w-md`) | N/A | `Esc` (cancel) | HARD DELETE |
| **SCREEN 27** | Remove Cover Confirmation | Bottom sheet | Centered modal | Centered modal (`max-w-md`) | N/A | `Esc` (cancel) | Non-destructive |
