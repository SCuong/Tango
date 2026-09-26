# Tango — UI / UX Design Specification

This document defines the functional UX flows, screen layouts, interaction patterns, and ergonomics for Tango across mobile and desktop form factors.

> **Visual Design System Reference:** For the complete, authoritative design token architecture, Soft Claymorphism specifications, Light/Dark/Sakura palettes, typography, and Tabler Icons, see [`docs/DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md).

---

## 1. Visual Direction & Design Language

Tango is built for focused, daily retention drills. The visual design prioritizes mental clarity, high legibility, and rapid feedback.

### 1.1 Core Principles
- **Soft Claymorphism:** Tactile, friendly, calm, and modern. Avoids cartoonish 3D inflation, heavy gradients, glowing borders, or generic dashboard clutter.
- **Typographic Prominence:** Japanese characters (Kanji and Kana in `Noto Sans JP`) are the focal point with generous font sizes and ample negative space. Vietnamese and English UI text uses `Be Vietnam Pro`.
- **Multi-Theme Support:** Operates seamlessly across **Light (Sáng)**, **Dark (Tối)**, and **Sakura** themes via semantic design tokens (detailed in [`docs/DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md)).
- **Unified Icon System:** Powered exclusively by **Tabler Icons** (`@tabler/icons-react`).

---

## 2. Main Screens & Wireframes

### Screen 1: Home / Study Hub (Safe Study-Only Canvas)

The Home screen is dedicated purely to reading and studying. Administrative, import, or destructive controls are strictly barred from this screen to prevent accidental mis-taps (see [`docs/CONTENT_LIBRARY_SPEC.md`](./CONTENT_LIBRARY_SPEC.md)):

```text
┌───────────────────────────────────────────────┐
│ TANGO                          [IconSettings] │
│                                               │
│ GIÁO TRÌNH (STUDY BOOKS)                      │
│ ───────────────────────────────────────────── │
│ ┌──────────────────────┐ ┌──────────────────┐ │
│ │ [Cover]              │ │ [Cover]          │ │
│ │ 中級へ行こう         │ │ Mimikara         │ │
│ │ 8 bài · 164 mục      │ │ 5 bài · 110 mục  │ │
│ └──────────────────────┘ └──────────────────┘ │
│                                               │
│ HỌC THEO LOẠI (LEARN BY TYPE)                 │
│ ───────────────────────────────────────────── │
│ ┌───────────────────────────────────────────┐ │
│ │ [IconBook] Từ vựng (Vocabulary)           │ │
│ └───────────────────────────────────────────┘ │
│ ┌───────────────────────────────────────────┐ │
│ │ [IconWriting] Hán tự (Kanji)              │ │
│ └───────────────────────────────────────────┘ │
│                                               │
│        [ [IconBolt] Kiểm tra tổng hợp ]       │
└───────────────────────────────────────────────┘
```

- **Top Bar:** Wordmark `TANGO` and `[IconSettings]` (entry to preferences and Content Management).
- **GIÁO TRÌNH Cards:** Tapping a book opens its **Book Study View**. (Never triggers edit/delete).
- **HỌC THEO LOẠI:** Browse lessons by category across all textbooks.
- **[IconBolt] Kiểm tra tổng hợp:** Direct access to the global multi-lesson quiz builder across books.
- **Strict Safety Rule:** Zero Add, Import, Edit, or Delete controls on Home.

---

### Screen 2: Book Study View & Category Lists

#### 2.1 Book Study View (e.g. `中級へ行こう`)
Tapping a Study Book opens its dedicated, distraction-free study canvas:
- Book cover header, title, and total metrics (e.g. `8 bài học · 164 mục`).
- **Từ vựng Section:** Lesson count, item count, and `[ Mở Từ vựng ]` action.
- **Hán tự Section:** Lesson count, item count, and `[ Mở Hán tự ]` action.
- **[ Kiểm tra giáo trình ]:** Launches a combined quiz across all lessons in this textbook.

#### 2.2 Category View Inside a Book
Opening a category (e.g. `Hán tự` inside `中級へ行こう`) presents its lessons:
```text
← 中級へ行こう

HÁN TỰ (5 bài · 82 mục)

┌───────────────────────────────────────────────┐
│ Bài 1: Con người & Gia đình     16 mục · 90%  │
│ Bài 2: Hành động & Đi lại       18 mục · 75%  │
│ Bài 3: Công việc & Đời sống     14 mục · --   │
└───────────────────────────────────────────────┘

[ [IconCards] Kiểm tra nhiều bài ]
```
- Tapping a lesson opens **Lesson Detail**.
- **[ Kiểm tra nhiều bài ]:** Launches multi-lesson quiz selector scoped to this book and category.

Selecting a lesson opens the **Lesson Detail view**, offering:
- Items preview (Japanese, Kana, Vietnamese, optional Hán Việt)
- "Luyện tập" (Practice Mode)
- "Kiểm tra nhanh" (Quick Test: 10 / 20 / 40 / Tất cả (N); candidate counts `10`, `20`, `40` shown dynamically only when `<= N`)

*Kanji lessons display flat lists of StudyItem entries, avoiding complex character trees.*

---

### Screen 3: Mixed Multi-Lesson Test (Kiểm tra tổng hợp)

A dedicated, mobile-friendly configuration modal/screen allowing users to combine any set of lessons across textbooks and categories:

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

Số câu
[ 10 ]  [ 20 ]  [ 40 ]  [ Tất cả (79) ]

Loại câu hỏi
☑ Kana → Japanese
☑ Japanese → Vietnamese
☑ Vietnamese → Japanese
☐ Written Answer

[ Bắt đầu kiểm tra (79 mục đã chọn) ]
```

*Note on Question Count:* Candidate count buttons (`10`, `20`, `40`) are shown dynamically only when `<= N` (total unique items in the combined selection). Selecting `Tất cả (N)` presents exactly $N$ questions (one initial question per unique item), never multiplying by question types.

---

### Screen 4: Quiz / Practice Question (Shared Engine)

Used uniformly for single lessons, multi-lessons, and mixed tests:

- **Top HUD:**
  - Cancel / Exit icon (with confirm dialog).
  - Clean progress bar across the top.
  - Counter: `4 / 20`.
  - Streak indicator: `🔥 4`.
- **Center Prompt Card:**
  - Large prompt text (e.g., `りょこう` or `du lịch`).
  - Centered, generous padding (32px-48px).
- **Bottom Thumb Area — 4 Options:**
  - Stacked full-width buttons (minimum 56px height).
  - Positional color identity (Amber, Blue, Violet, Rose) as defined in [`docs/DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md).
  - **CRITICAL:** Strictly **NO** visible answer letters (`A/B/C/D`), numbers (`1/2/3/4`), or keyboard hints (`[1]-[4]`) stamped on the buttons. Only the answer content is displayed.

---

### Screen 5: Answer Feedback & Explanations

#### 5.1 Correct Answer
- Selected button highlights with an Emerald Green outline/ring (`#059669`) and an `IconCheck`.
- Brief confirmation toast: "Chính xác! 👏" showing reading and meaning.
- Optional sound: If enabled in Settings (Off by default), plays a short, subtle ceramic chime (<200ms). Never blocks or delays auto-advance.
- Auto-advances in 750ms or on `Enter`/`Space`/Tap.

#### 5.2 Incorrect Answer Explanation
- The wrongly chosen button receives a Red outline (`#DC2626`) and `IconX`.
- The true correct choice highlights concurrently in Emerald Green with `IconCheck`.
- Optional sound: If enabled in Settings (Off by default), plays a gentle low-frequency warm tone (<200ms).
- An informative educational sheet slides in from the bottom:

**Item with Hán Việt:**
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

**Item without Hán Việt:**
```text
❌ Chưa chính xác

ファストフード
ふぁすとふーど

Nghĩa:
đồ ăn nhanh

[ Đã hiểu — Tiếp tục (Enter) ]
```

*Strict Rule: If `hanViet` is absent, the Hán Việt section disappears completely. No placeholder like "N/A" or "Không có".*

---

### Screen 6: Quiz Results Summary

- **Celebration Header:** "Hoàn thành bài kiểm tra!"
- **Metrics Grid (2x2):**
  - **Điểm số:** 450 pts
  - **Độ chính xác:** 85% (17/20)
  - **Chuỗi đúng dài nhất:** 8 liên tiếp
  - **Thời gian:** 1 phút 40 giây
- **Missed Items Section:** Displays cards for failed items.
- **Action Buttons:**
  1. **"Ôn lại các từ đã sai (3 từ)"** (High-emphasis primary button).
  2. **"Làm lại bài kiểm tra"** (Secondary button).
  3. **"Về trang chủ"** (Tertiary button).

---

### Screen 7: Review Missed Words (Ôn lại từ sai)

- Spawns a targeted study session consisting exclusively of the missed items.
- Works across both Vocabulary and Kanji items seamlessly.
- Exits back to summary once all weak items are cleared.

---

### Screen 8: Settings (Cài đặt)

A clean, minimalist preferences modal/sheet:
- **Language (Ngôn ngữ):** Segmented control `[ Tiếng Việt ]` | `[ English ]`.
- **Theme (Giao diện):** 3 live color swatches `[ Sáng / Light ]` | `[ Tối / Dark ]` | `[ Sakura / Sakura ]`.
- **Sound Effects (Âm thanh hiệu ứng):** Segmented toggle `[ Off / On ]` (Default: **Off** / Tắt). Never plays sound unless explicitly enabled.
- **Nội dung học (Study Content):** Dedicated section with row **"Quản lý giáo trình và bài học" (Manage books and lessons)** linking to the Content Management screen.
- Preferences automatically persist to local storage.

---

### Screen 9: Content Management (Quản lý nội dung) & Safe Deletion

A protected administrative screen accessed intentionally via **Settings → Quản lý giáo trình và bài học**:
- **Giáo trình (Study Books):** List of textbooks with `[ Quản lý ]` inspector and `[IconPlus] Thêm giáo trình`.
- **Bài học (Lessons):** Lesson rows inside book management provide `[ Quản lý ]`, opening a dedicated **Quản lý bài học (Lesson Management)** view. There are **strictly no inline adjacent delete buttons** on lesson rows.
- **Thêm bài mới:** `[IconFileImport] Thêm / Nhập bài học mới` (launches lesson importer with target book selector).
- **Danger Zone (Vùng nguy hiểm):** Located deep inside individual book and lesson management views.
- **Hard Delete Only:** Deleting a book or lesson permanently removes records and related data via an ordered, idempotent cascade. No soft delete, no recycle bin, no trash folder.
- **Accidental Tap Safeguards:** Requires explicit modal confirmation clearly stating book/lesson name and total items; delete button is visually separated with semantic error styling and never default focused.
- See [`docs/CONTENT_LIBRARY_SPEC.md`](./CONTENT_LIBRARY_SPEC.md) for full wireframes and cascade behaviors.

---

## 3. Mobile Usability (First-Class Requirement)

1. **Thumb-Zone Optimization:**
   - All interactive choices and primary action buttons reside in the lower 50% of the screen.
   - The top half is reserved for passive progress and the question prompt.
2. **Generous Touch Targets:**
   - Minimum tap target height: `56px` for quiz choices; `48px` for action buttons.
   - Spacing between options: minimum `12px` to prevent accidental mis-taps.
3. **Zero Horizontal Overflow:**
   - Full layout strictly fits within `100vw` (`overflow-x: hidden`).
4. **Single-Focus Viewport:**
   - During a quiz, sidebars and extraneous navigation are hidden to maximize focus.

---

## 4. Desktop Ergonomics & Productivity

1. **Centered Study Canvas:**
   - Study view is centered with a constrained max-width (`max-w-xl` / ~600px) to prevent wide eye scanning.
2. **Keyboard-First Navigation:**
   - Number keys `1`, `2`, `3`, `4`: Select choices directly in the background (no visible numbers on buttons).
   - `Enter` / `Space`: Confirm, dismiss explanation, or advance.
   - `Escape`: Trigger exit confirmation.
3. **Accessibility:**
   - Visible `:focus-visible` rings with high-contrast outlines.
   - Semantic buttons and ARIA labels.

---

## 5. Responsive Adaptation Matrix

| Component / Screen | Mobile (< 640px) | Tablet (640px - 1024px) | Desktop (> 1024px) |
|---|---|---|---|
| **Home Screen** | Stacked Study Book cards, Learn by Type buttons, Mixed Test CTA | 2-column Study Book grid with compact sidebar / action bar | 3 to 4-column Study Book card grid (max-w-4xl), Learn by Type quick links, Mixed Test banner |
| **Mixed Test Selector**| Full-screen modal, stacked checkboxes | Centered modal (max-w-lg) | Centered modal (max-w-xl) |
| **Lesson List** | Single column list | 2-column grid | 2-column grid (max-w-4xl) |
| **Quiz Container** | Full screen (100% width, 16px padding) | Centered canvas (max-w-lg) | Centered canvas (max-w-xl) |
| **Option Buttons** | Full width stacked, 56px height | Full width stacked, 58px height | Full width stacked (clean content-only, no indices) |
| **Explanation View** | Bottom sheet sliding up | Centered modal overlay | Centered modal overlay |
| **Results Summary** | 2x2 compact metrics, stacked buttons | 4-column metrics row | 4-column metrics row, side-by-side buttons |
