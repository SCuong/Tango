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

### Screen 1: Home / Dual Study Categories
The home screen clearly presents two distinct learning pathways plus the unified Mixed Test and Import entry points:

```text
┌───────────────────────────────────────────────┐
│                     TANGO                     │
│               Bạn muốn học gì?                │
│                                               │
│  ┌─────────────────────────────────────────┐  │
│  │ [IconBook] TỪ VỰNG                      │  │
│  │ 3 bài · 60 từ                           │  │
│  └─────────────────────────────────────────┘  │
│                                               │
│  ┌─────────────────────────────────────────┐  │
│  │ [IconWriting] HÁN TỰ                    │  │
│  │ 3 bài · 55 từ                           │  │
│  └─────────────────────────────────────────┘  │
│                                               │
│        [ [IconBolt] Kiểm tra tổng hợp (Mixed) ]│
│        [ [IconFileImport] Nhập bài mới ]       │
└───────────────────────────────────────────────┘
```

- **[IconBook] Từ vựng Card:** Enters the Vocabulary lesson list.
- **[IconWriting] Hán tự Card:** Enters the Kanji lesson list.
- **[IconBolt] Kiểm tra tổng hợp CTA:** Directly opens the multi-lesson selector.
- **[IconFileImport] Nhập bài mới CTA:** Opens the unified Lesson Importer (see [`docs/IMPORT_SPEC.md`](./IMPORT_SPEC.md)).

---

### Screen 2: Lesson List (Vocabulary or Kanji)

Both categories use the same clean list layout:

```text
← TỪ VỰNG (hoặc HÁN TỰ)              [ + Nhập bài mới ]

┌───────────────────────────────────────────────┐
│ Bài 1: Đồ ăn nhanh             20 từ  ·  80%  │
│ Bài 2: Đồ gia dụng             20 từ  ·  55%  │
│ Bài 3: Giao thông & Đi lại     20 từ  ·  --   │
└───────────────────────────────────────────────┘
```

Selecting a lesson opens the **Lesson Detail view**, offering:
- Items preview (Japanese, Kana, Vietnamese, optional Hán Việt)
- "Luyện tập" (Practice Mode)
- "Kiểm tra nhanh" (Quick Test: 10 / 20 / Tất cả)

*Kanji lessons display flat lists of StudyItem entries, avoiding complex character trees.*

---

### Screen 3: Mixed Multi-Lesson Test (Kiểm tra tổng hợp)

A dedicated, mobile-friendly configuration modal/screen allowing users to combine any set of lessons:

```text
KIỂM TRA TỔNG HỢP

TỪ VỰNG
☑ Bài 1 — 20 từ
☑ Bài 2 — 20 từ
☐ Bài 3 — 20 từ

HÁN TỰ
☑ Bài 1 — 20 từ
☐ Bài 2 — 20 từ
☐ Bài 3 — 20 từ

Số câu
[ 10 ]  [ 20 ]  [ 40 ]  [ Tất cả ]

Loại câu hỏi
☑ Kana → Japanese
☑ Japanese → Vietnamese
☑ Vietnamese → Japanese
☐ Written Answer

[ Bắt đầu kiểm tra (60 từ trong nhóm) ]
```

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
- Preferences automatically persist to local storage.

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
| **Home Screen** | Stacked full-width category cards | 2-column category grid | 2-column category grid (max-w-2xl) |
| **Mixed Test Selector**| Full-screen modal, stacked checkboxes | Centered modal (max-w-lg) | Centered modal (max-w-xl) |
| **Lesson List** | Single column list | 2-column grid | 2-column grid (max-w-4xl) |
| **Quiz Container** | Full screen (100% width, 16px padding) | Centered canvas (max-w-lg) | Centered canvas (max-w-xl) |
| **Option Buttons** | Full width stacked, 56px height | Full width stacked, 58px height | Full width stacked (clean content-only, no indices) |
| **Explanation View** | Bottom sheet sliding up | Centered modal overlay | Centered modal overlay |
| **Results Summary** | 2x2 compact metrics, stacked buttons | 4-column metrics row | 4-column metrics row, side-by-side buttons |
