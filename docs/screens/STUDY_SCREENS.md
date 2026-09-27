# Tango UI Specification — Study Screens (SCREEN 01 – 06)

> **Master Specification Reference:** [`docs/SCREEN_SPEC.md`](../SCREEN_SPEC.md) is the authoritative master index, route map, and responsive foundation for Tango.
> This domain file is authoritative for the detailed screen layouts, wireframes, and interaction flows of **Study Screens (SCREEN 01 through SCREEN 06)**.
>
> **Design Tokens & Components:** Styled exclusively using the Soft Claymorphism design system in [`docs/DESIGN_SYSTEM.md`](../DESIGN_SYSTEM.md). Every screen here follows its [Canonical Cross-Screen UI Baseline](../DESIGN_SYSTEM.md#canonical-cross-screen-ui-baseline); this file only specializes composition per screen.
>
> **Study Metrics & Progress Indicators Contract:**
> - **Book Progress (SCREEN 01, 02):** Percentage values displayed on book cards and book headers represent **Study Coverage** (`coveragePercent`), i.e. the percentage of items in the book that have been tested at least once (`progress.totalAttempts > 0`).
> - **Lesson Accuracy (SCREEN 03, 04, 05):** Badges and metrics displayed on lesson rows and lesson headers represent **Answer Accuracy** (`accuracyPercent`), i.e. `(correctCount / totalAttempts) * 100`. When unattempted (`totalAttempts === 0`), the UI renders `--`.
> - **No "Mastery" / "Tỷ lệ thuộc":** Tango MVP intentionally does NOT define or calculate an arbitrary "mastery" or "tỷ lệ thuộc" score. Progress indicators are strictly partitioned into Study Coverage (breadth) and Answer Accuracy (correctness).

---

## Screen Inventory

- [SCREEN 01: Home / Study Hub](#screen-01-home--study-hub)
- [SCREEN 02: Book Study View](#screen-02-book-study-view)
- [SCREEN 03: Category View Inside Book](#screen-03-category-view-inside-book)
- [SCREEN 04: Learn by Type (Học theo loại)](#screen-04-learn-by-type-học-theo-loại)
- [SCREEN 05: Lesson Detail](#screen-05-lesson-detail)
- [SCREEN 06: View Lesson Items (Danh sách từ)](#screen-06-view-lesson-items-danh-sách-từ)

---

### SCREEN 01: Home / Study Hub

#### Purpose:
The learner's primary gateway. Exclusively focused on reading, exploring textbooks, browsing by category, and launching tests. Contains zero management controls (administrative actions reside strictly in [Settings → Content Management](./SETTINGS_CONTENT_SCREENS.md#screen-17-content-management)).

> Home is the **reference implementation** of the [design baseline](../DESIGN_SYSTEM.md#canonical-cross-screen-ui-baseline), not a layout template. Other screens adapt the same language to their own purpose instead of copying Home's composition.

#### Routes & Navigation:
- **Route:** `/` — one of the three primary destinations (Home / Test / Settings, see [`DESIGN_SYSTEM.md` §16.0](../DESIGN_SYSTEM.md#160-primary-navigation-home--test--settings)).
- **Entry:** Application launch, the `TANGO` wordmark, the Home tab of the primary navigation, or "Về trang chủ".
- **Exit:**
  - Tapping a Study Book card $\rightarrow$ [SCREEN 02: Book Study View](#screen-02-book-study-view) (`/book/:bookId`).
  - Tapping the `語彙 Từ vựng` or `漢字 Hán tự` shortcut $\rightarrow$ [SCREEN 04: Learn by Type](#screen-04-learn-by-type-học-theo-loại) (`/learn/:category`).
  - Primary navigation **Kiểm tra / Test** $\rightarrow$ [SCREEN 09: Global Mixed Test](./QUIZ_CONFIG_SCREENS.md#screen-09-global-mixed-test-kiểm-tra-tổng-hợp) (`/quiz/mixed-config`).
  - Primary navigation **Cài đặt / Settings** (or `Alt+S`) $\rightarrow$ [SCREEN 16: Settings](./SETTINGS_CONTENT_SCREENS.md#screen-16-settings-cài-đặt) (`/settings`).

#### Responsive Layout Strategy:
- **Hierarchy:** Study Book → Category → Lesson → StudyItem. Study Books are the primary, visually dominant content; Vocabulary / Kanji shortcuts are secondary. Home does **not** own a Test CTA: Test is a primary destination.
- **Top Bar:** Opaque theme canvas (`bg-page`) with no divider line (zero blur); content scrolling underneath fades out through a short page-colored feather. Mobile: the `TANGO` wordmark only. From `sm` up: the wordmark plus the compact Home / Test / Settings header navigation. No theme status or theme control on Home.
- **Primary navigation (mobile):** the floating clay bottom bar with Home active; Home reserves its height so `Xem tất cả` and the category tiles are never covered.
- **No greeting, no visible section labels:** Semantic structure uses visually hidden headings (`sr-only` page `h1`, `sr-only` `h2` for "Giáo trình" and "Học theo loại").
- **Progressive disclosure:** Home shows identity + progress + primary actions, not inventory statistics. Study Book = cover + title + Study Coverage (first 2 books, the rest behind `Xem tất cả`). Vocabulary / Kanji = Japanese glyph + localized category name + illustration. Lesson/item counts are deferred to detail screens. No visible section labels or greeting. Theme controls remain Settings-only.
- **Composition order (all breakpoints):** Study Books → Vocabulary / Kanji shortcuts.
- **Study Books:** Only the first 2 books render as large cards. When more exist, a compact, centered dashed-outline `Xem tất cả ⌄` / `View all ⌄` bridge (≈62% width on mobile, natural width on desktop, 48px tall; `aria-expanded`, `aria-controls="home-more-books"`) reveals the rest in place and then reads `Thu gọn` / `Show less`. Home never offers drag-reordering; ordering belongs to the future full Books list / management view.
- **Mobile (< 640px):** Stacked horizontal book cards where the large 3:4 cover (`w-24`), full title (up to 3 lines), and Study Coverage bar fill the card. Below them, a 2-column Vocabulary / Kanji shortcut row; the floating primary navigation sits below the content.
- **Tablet (640px – 1024px):** Book cards in a 2-column grid (cover `w-28`); shortcuts as above; header navigation instead of the bottom bar.
- **Desktop (> 1024px):** Centered container (`max-w-4xl`). Book cards in a 2-column primary grid (cover `w-32`). One full-width Vocabulary / Kanji shortcut row below.
- **Book titles:** `.font-study-title` (UI font for Latin/Vietnamese, Japanese stack for Kana/Kanji), `line-clamp-3`, full title in the native `title` attribute for hover.
- **Category shortcuts:** Equal-height, symmetrical tinted clay tiles (`min-h-[112px]`, `sm:min-h-[128px]`): `語彙` / `漢字` glyph pinned top-left, illustration pinned top-right, localized name pinned bottom-left. Text never wraps (`whitespace-nowrap`); below 380px the glyph and illustration shrink, keeping the 2-column layout clean at 360px and 390px. Still smaller than the book cards.
- **Ambience:** Restrained per-theme Japanese scene behind all content (Light: daylight shoji window, seigaiha fan, one mist band; Dark: moon, lit shoji window, paper lantern, fireflies; Sakura: blossom branch, kasumi clouds, a few falling petals), fixed, `aria-hidden`, very low opacity, motifs cut by the viewport feathered out toward the cut edge, static under reduced motion (see [`docs/DESIGN_SYSTEM.md` §8.2](../DESIGN_SYSTEM.md#82-restrained-japanese-ambience-explicit-exception)).
- **Tactile Clay Recipe:** Every interactive Home card and button uses `.clay-interactive` (hover lift only under `@media (hover: hover) and (pointer: fine)`) plus `usePressFeedback` (explicit `data-pressed` state, never CSS `:active`). Book cards and category tiles sink 1px (`translate-y-px shadow-clay-pressed`). Drag-out or cancel never navigates. The `View all` bridge is a compact dashed-outline text control, not a clay card. Focus ring: `focus-visible:ring-2 ring-primary ring-offset-2 ring-offset-page`. See [`docs/DESIGN_SYSTEM.md` §3.1](../DESIGN_SYSTEM.md#31-canonical-clay-interaction-recipe).

#### Wireframes:
```text
MOBILE (< 640px)
┌───────────────────────────────────────────────┐
│ TANGO                                         │  <- wordmark only, no divider
│ ┌───────────────────────────────────────────┐ │
│ │ ┌─────────┐  中級へ行こう 日本語の文型と │ │  <- first 2 books only:
│ │ │  Cover  │  表現55 第2版                │ │     large 3:4 cover, title,
│ │ │   3:4   │                              │ │     Study Coverage
│ │ └─────────┘  [━━━━━━░░░░░░░]        45%  │ │
│ └───────────────────────────────────────────┘ │
│ ┌───────────────────────────────────────────┐ │
│ │ ┌─────────┐  耳から覚える 日本語能力試験 │ │
│ │ │  Cover  │  文法トレーニング N3         │ │
│ │ └─────────┘  [━━━░░░░░░░░░░]        30%  │ │
│ └───────────────────────────────────────────┘ │
│          ┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐          │  <- dashed bridge, only
│          ╎    Xem tất cả ⌄     ╎          │     when > 2 books
│          └╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘          │
│ ┌────────────────────┐ ┌────────────────────┐ │
│ │ 語彙         [あ]  │ │ 漢字         [字]  │ │  <- glyph + name + illustration
│ │ Từ vựng            │ │ Hán tự             │ │
│ └────────────────────┘ └────────────────────┘ │
│            (quiet theme ambience behind)      │
│  ╭─────────────────────────────────────────╮  │  <- floating primary nav
│  │  (⌂)        [▯▯] Kiểm tra      (⚙)     │  │     (root screens only)
│  │ Trang chủ                     Cài đặt   │  │
│  ╰─────────────────────────────────────────╯  │
└───────────────────────────────────────────────┘

DESKTOP (> 1024px - max-w-4xl Centered)
┌────────────────────────────────────────────────────────────────────────┐
│ TANGO                          [⌂ Trang chủ]  [▯ Kiểm tra]  [⚙ Cài đặt]│
│ ┌──────────────────────────────────┐ ┌───────────────────────────────┐ │
│ │ ┌────────┐ 中級へ行こう 日本語の │ │ ┌────────┐ 耳から覚える      │ │
│ │ │ Cover  │ 文型と表現55 第2版    │ │ │ Cover  │ 日本語能力試験    │ │
│ │ │  3:4   │                       │ │ │  3:4   │ 文法トレーニング  │ │
│ │ └────────┘ [━━━━━░░░░░]     45%  │ │ └────────┘ [━━░░░░░░]   30%  │ │
│ └──────────────────────────────────┘ └───────────────────────────────┘ │
│                        ┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐                        │
│                        ╎    Xem tất cả ⌄    ╎                        │
│                        └╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘                        │
│ ┌─────────────────────────────────┐ ┌────────────────────────────────┐ │
│ │ 語彙                      [あ]  │ │ 漢字                      [字] │ │
│ │ Từ vựng                         │ │ Hán tự                         │ │
│ └─────────────────────────────────┘ └────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

#### Keyboard Navigation (Desktop):
- Arrow keys move through Home study cards in order: visible Study Books, Vocabulary, Kanji. `Enter` / `Space` open the focused card; `Tab` reaches the `View all` toggle and the header navigation; `Alt+S` opens Settings.

#### Empty State:
- If 0 books exist, the primary book area renders a compact recessed clay shelf (`bg-surface-elevated`, `shadow-clay-pressed`) instead of a large floating card: icon puck, *"Chưa có giáo trình nào."*, and *"Bạn có thể thêm giáo trình trong: Cài đặt → Quản lý nội dung."* It has no button of its own: Settings is a primary destination. The category shortcuts follow directly below. Never places an "+ Add Book" button directly on Home.

```text
EMPTY (0 Study Books) - same primary book area
┌──────────────────────────────────────────────────────────────────────┐
│ [IconBooks]  Chưa có giáo trình nào.                                 │
│              Bạn có thể thêm giáo trình trong: Cài đặt → Quản lý ... │
└──────────────────────────────────────────────────────────────────────┘
```

---

### SCREEN 02: Book Study View

#### Purpose:
The dedicated overview for a single textbook. Presents curriculum divided into Vocabulary and Kanji, total progress, and direct book-level test initiation.

#### Routes & Navigation:
- **Route:** `/book/:bookId`
- **Entry:** Clicking a book card on Home.
- **Exit:**
  - `[IconArrowLeft]` Back button $\rightarrow$ Home (`/`).
  - Tapping `[ Mở Từ vựng ]` $\rightarrow$ [SCREEN 03: Category View Inside Book](#screen-03-category-view-inside-book) (`/book/:bookId/category/vocabulary`).
  - Tapping `[ Mở Hán tự ]` $\rightarrow$ [SCREEN 03: Category View Inside Book](#screen-03-category-view-inside-book) (`/book/:bookId/category/kanji`).
  - Tapping `[IconBolt] Kiểm tra giáo trình` $\rightarrow$ [SCREEN 08: Book Test Config](./QUIZ_CONFIG_SCREENS.md#screen-08-book-test-config) (`/book/:bookId/quiz-config`).

#### Canonical Responsive Layout:
- **Mobile (< 640px):** Single-column stacked canvas. Compact book header with 1:1 cover thumbnail, book title, item counts. Category action cards for Vocabulary and Kanji are vertically stacked. The test CTA `[ [IconBolt] Kiểm tra giáo trình này ]` uses `StickyBottomBar`, affixed to the bottom viewport and respecting `env(safe-area-inset-bottom)`.
- **Tablet / Desktop (>= 640px):** Centered canvas (`max-w-2xl`). Rich cover image presentation (3:4 ratio), expansive progress stats. Category cards for Vocabulary and Kanji are **side-by-side in a 2-column row**. The test CTA button returns to **normal document flow** directly beneath the category cards.

#### Wireframes:
```text
MOBILE (< 640px)
┌───────────────────────────────────────────────┐
│ [IconArrowLeft]  Chi tiết giáo trình          │
├───────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────┐ │
│ │ [Thumb 1:1]  中級へ行こう                 │ │
│ │              8 bài học · 164 mục · Đã 65% │ │
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
│ [StickyBottomBar: [IconBolt] Kiểm tra sách ]  │
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
│ ┌──────────────────────────┐ ┌───────────────────────┐ │
│ │ [IconBook] TỪ VỰNG       │ │ [IconWriting] HÁN TỰ   │ │
│ │ 3 bài · 82 từ            │ │ 5 bài · 82 mục         │ │
│ │ [ Mở xem ]               │ │ [ Mở xem ]             │ │
│ └──────────────────────────┘ └───────────────────────┘ │
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
  - `[IconArrowLeft]` Back button $\rightarrow$ [SCREEN 02: Book Study View](#screen-02-book-study-view).
  - Tapping a lesson row $\rightarrow$ [SCREEN 05: Lesson Detail](#screen-05-lesson-detail).
  - Tapping `[IconCards] Kiểm tra nhiều bài` $\rightarrow$ [SCREEN 07: Category Multi-Lesson Config](./QUIZ_CONFIG_SCREENS.md#screen-07-category-multi-lesson-test-config).

#### Responsive Layout:
- **Mobile (< 640px):** Single-column lesson list. Each row is a minimum 56px touch target with title, item count, and accuracy badge. Bottom sticky bar holds `[ Kiểm tra nhiều bài ]`.
- **Desktop (> 1024px):** Centered `max-w-4xl` canvas. 2-column responsive lesson card grid with top action bar containing `[ Kiểm tra nhiều bài ]`.

#### Wireframes:
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
│ [StickyBottomBar: [IconCards] Kiểm tra nhiều] │
└───────────────────────────────────────────────┘

DESKTOP (> 1024px - max-w-4xl Centered)
┌────────────────────────────────────────────────────────────────────────┐
│ [IconArrowLeft] Quay lại 中級へ行こう             [IconCards] Kiểm tra │
├────────────────────────────────────────────────────────────────────────┤
│ HÁN TỰ (KANJI) — 5 bài học · 82 mục                                    │
│                                                                        │
│ ┌───────────────────────────────────┐ ┌──────────────────────────────┐ │
│ │ Bài 1: Con người (16 mục · 90%)   │ │ Bài 2: Đi lại (18 mục · 75%) │ │
│ ├───────────────────────────────────┤ ├──────────────────────────────┤ │
│ │ Bài 3: Đời sống (14 mục · --)     │ │ Bài 4: Môi trường (18 mục)   │ │
│ ├───────────────────────────────────┤ ├──────────────────────────────┤ │
│ │ Bài 5: Xã hội (16 mục · --)       │ │                              │ │
│ └───────────────────────────────────┘ └──────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

---

### SCREEN 04: Learn by Type (Học theo loại)

#### Purpose:
Category-centric perspective displaying all lessons of a specific category (`vocabulary` or `kanji`) grouped by parent Study Book, including "Không thuộc giáo trình" (Unassigned).

#### Routes & Navigation:
- **Route:** `/learn/:category`
- **Entry:** Home screen `[IconBook] Từ vựng` or `[IconWriting] Hán tự`.
- **Exit:**
  - `[IconArrowLeft]` Back $\rightarrow$ Home (`/`).
  - Tapping any lesson row $\rightarrow$ [SCREEN 05: Lesson Detail](#screen-05-lesson-detail).

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
  - `[IconBrain] Luyện tập` $\rightarrow$ [SCREEN 10: Active Quiz (Practice Mode)](./QUIZ_SESSION_SCREENS.md#screen-10-active-quiz--practice-session).
  - `[IconClock] Kiểm tra nhanh` $\rightarrow$ [SCREEN 10: Active Quiz (Quick Test Mode)](./QUIZ_SESSION_SCREENS.md#screen-10-active-quiz--practice-session).
  - `[IconList] Xem danh sách từ` $\rightarrow$ [SCREEN 06: View Lesson Items](#screen-06-view-lesson-items-danh-sách-từ).
  - `[IconRefresh] Ôn từ sai` $\rightarrow$ [SCREEN 15: Review Missed Words](./QUIZ_SESSION_SCREENS.md#screen-15-review-missed-words-ôn-lại-từ-sai).

#### Action Card Placement Rule:
> **Study Action Cards appear FIRST (above preview)** on both mobile and desktop to give learners immediate access to practicing without scrolling past dozens of words.

#### Wireframe:
```text
MOBILE (< 640px)
┌───────────────────────────────────────────────┐
│ [IconArrowLeft]  Hán tự · 中級へ行こう        │
├───────────────────────────────────────────────┤
│ Bài 2: Hành động & Đi lại                     │
│ 18 mục học · Độ chính xác: 75%                │
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
- **Exit:** `[IconArrowLeft]` Back $\rightarrow$ [SCREEN 05: Lesson Detail](#screen-05-lesson-detail).

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
