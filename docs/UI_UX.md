# Tango — UI / UX Design Specification

This document defines the visual system, interaction patterns, screen specifications, and ergonomic guidelines for Tango across mobile and desktop form factors.

---

## 1. Visual Direction & Design Language

Tango is built for focused, daily vocabulary retention. The visual design prioritizes mental clarity, high legibility, and rapid feedback.

### 1.1 Core Principles
- **Clarity Over Decoration:** Avoid heavy gradients, glowing glassmorphism, decorative cards-within-cards, or superfluous illustrations that draw attention away from the vocabulary.
- **Typographic Prominence:** Japanese characters (Kanji and Kana) are the centerpiece of the interface and must be displayed with generous font sizes, balanced line heights, and ample negative space.
- **Friendly & Encouraging Tone:** Modern, warm neutral canvas with a confident indigo primary tone. Correct feedback feels rewarding; incorrect feedback feels educational and constructive rather than punitive.

### 1.2 Color Palette

| Token | Hex Value | Semantic Purpose |
|---|---|---|
| **Background (Light)** | `#F8FAFC` (Slate 50) | Gentle, glare-free light background |
| **Surface Card** | `#FFFFFF` (Pure White) | Elevated card surface with subtle border |
| **Border / Divider** | `#E2E8F0` (Slate 200) | Crisp, thin structural borders (1px) |
| **Primary Brand** | `#4F46E5` (Indigo 600) | Primary actions, progress bars, active highlights |
| **Primary Hover/Tap**| `#4338CA` (Indigo 700) | Active tap state |
| **Text Primary** | `#0F172A` (Slate 900) | Maximum contrast for Kanji and main text |
| **Text Muted** | `#64748B` (Slate 500) | Secondary labels, readings, timestamps |
| **Success / Correct** | `#059669` (Emerald 600) | Correct answer indicators and accuracy badges |
| **Success Surface** | `#ECFDF5` (Emerald 50) | Subtle background for correct choice |
| **Error / Incorrect** | `#DC2626` (Red 600) | Incorrect indicator on mistake |
| **Error Surface** | `#FEF2F2` (Red 50) | Subtle background for explanation card |

### 1.3 Typography System
- **Japanese Character Font Stack:**
  `'Noto Sans JP', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif`
  - High-precision rendering of stroke details and Furigana.
- **Vietnamese & UI Font Stack:**
  `'Be Vietnam Pro', 'Inter', system-ui, -apple-system, sans-serif`
  - Full support for Vietnamese tone marks without clipping or awkward baseline shifts.
- **Type Scale:**
  - Prompt Kanji: `32px` to `40px` (font-bold)
  - Kana Reading: `18px` to `20px` (font-medium, Slate-500)
  - Vietnamese Meaning: `18px` to `22px` (font-semibold)
  - Choice Buttons: `16px` to `18px` (font-medium)
  - Meta/Hán Việt Badges: `13px` to `14px` (font-semibold, tracking-wide)

---

## 2. Main Screens & Wireframes

### Screen 1: Home / Vocabulary Sets
- **Header:** Minimalist logo ("Tango"), quick study streak badge.
- **Set Grid / List:** Cards showing available sets (e.g. "中級へ行こう — Bài 1: Đồ ăn nhanh").
- **Card Elements:**
  - Japanese Title (`第1課 ファストフード`)
  - Vietnamese Subtitle (`Bài 1: Thức ăn nhanh`)
  - Word count badge (`40 từ`)
  - Mastery progress bar (`65% hoàn thành`)
  - Quick action: "Bắt đầu học" (Start studying) button.

### Screen 2: Vocabulary Set Detail
- **Header:** Set title with back button.
- **Summary Action Bar:**
  - Primary Button: "Luyện tập" (Practice Mode)
  - Secondary Button: "Kiểm tra nhanh" (Quick Test — 10 / 20 / Tất cả)
- **Vocabulary Explorer:** Scrollable list of all words in the set.
  - Left: Japanese word + Kana reading.
  - Right: Vietnamese meaning + Hán Việt badge (if available).
  - Tapping a row opens an expanded preview with individual Kanji breakdown.

### Screen 3: Practice Setup (Modal or Dedicated View)
- **Mode Selection:**
  - "Luyện tập tự do" (Practice: immediate feedback, auto retry mistakes)
  - "Kiểm tra tính điểm" (Test: timed, score tracking, streak)
- **Question Count:** Segmented control: `[ 10 câu ]` | `[ 20 câu ]` | `[ Tất cả ]`
- **Question Types (Checkboxes):**
  - [x] Kana → Chữ Hán
  - [x] Chữ Hán → Tiếng Việt
  - [x] Tiếng Việt → Chữ Hán
  - [ ] Điền câu trả lời (Viết)
- **CTA:** Full-width "Bắt đầu ngay" (Start Now) button.

### Screen 4: Quiz / Practice Question
- **Top HUD:**
  - Cancel / Exit icon (with confirm prompt).
  - Clean progress bar across the top.
  - Question counter: `4 / 10`.
  - Current streak icon: `🔥 3`.
- **Center Prompt Card:**
  - Large prompt text (e.g., Kana: `かんこうきゃく` or Vietnamese: `khách du lịch`).
  - Ample padding (32px-48px), centered alignment.
- **Bottom / Thumb Area: Answer Options:**
  - 4 full-width stacked button choices.
  - Generous height (minimum 56px per choice).
  - Clear label letters (`A`, `B`, `C`, `D` on mobile; `1`, `2`, `3`, `4` keyboard hints on desktop).

### Screen 5: Answer Feedback States

#### 5.1 Correct Answer
- Selected button turns Emerald green.
- Brief confirmation bar slides up: "Chính xác! 👏" with Kana + Meaning.
- Auto-advances smoothly after 800ms, or immediately on tap/space/enter.

#### 5.2 Incorrect Answer & Explanation Panel
- Selected choice highlights in soft Red; correct choice highlights in Emerald Green.
- An informative **Explanation Sheet** slides in from bottom:
  ```
  ❌ Chưa chính xác
  Đáp án đúng: 観光客 (かんこうきゃく)
  Nghĩa: khách tham quan, khách du lịch

  Hán Việt: QUAN QUANG KHÁCH
  • 観 (QUAN): xem, nhìn (quan sát)
  • 光 (QUANG): ánh sáng (quang cảnh)
  • 客 (KHÁCH): khách (hành khách)

  [ Đã hiểu — Tiếp tục (Enter) ]
  ```
- *Strict Rule:* If the word is Katakana (e.g. `ハンバーガー`), the Hán Việt and Kanji breakdown sections are completely hidden.

### Screen 6: Quiz Results Summary
- **Celebration Header:** "Hoàn thành bài kiểm tra!" with star or badge.
- **Score Grid (2x2):**
  - **Điểm số:** 450 pts
  - **Độ chính xác:** 80% (8/10)
  - **Chuỗi đúng dài nhất:** 5 liên tiếp
  - **Thời gian:** 1 phút 15 giây
- **Missed Words Section:**
  - Visual cards for words answered incorrectly.
- **Action Buttons:**
  1. **"Ôn lại các từ đã sai (2 từ)"** (High-emphasis primary button).
  2. **"Làm lại bài này"** (Secondary button).
  3. **"Về danh sách bài học"** (Tertiary / Ghost button).

### Screen 7: Review Missed Words
- Instantly launches a focused session consisting exclusively of the 2-3 missed items.
- Focuses heavily on Type 2 and Type 3 questions to solidify active recall.
- Exits back to Set Detail once all weak words are successfully answered.

---

## 3. Mobile Usability (First-Class Requirement)

Mobile phones represent the primary device during daily vocabulary retention drills. Ergonomics must be flawless:

1. **Thumb-Zone Optimization:**
   - All interactive choices and next-step CTAs reside in the lower 50% of the screen.
   - Top area is strictly reserved for the prompt and passive progress indicators.
2. **Generous Touch Targets:**
   - Minimum tap target height: `52px` for answer choices; `48px` for action buttons.
   - Minimum vertical spacing between choices: `12px` to prevent accidental mis-taps.
3. **Zero Horizontal Scroll:**
   - Layout strictly conforms to `100vw` with `overflow-x: hidden`.
   - Text wraps naturally without awkward hyphenation.
4. **Single-Focus Viewport:**
   - The screen contains only the active question. No sidebars, no extraneous links, and no distracting banners during a quiz.

---

## 4. Desktop Ergonomics & Productivity

Desktop users benefit from larger screens and physical keyboards without losing the focused aesthetic:

1. **Constrained Study Container:**
   - Instead of stretching cards across an ultra-wide monitor, the quiz area is centered with a max-width of `640px` (`max-w-xl`), mirroring the focused ergonomics of high-quality study tools.
2. **Keyboard-First Navigation:**
   - Number keys `1`, `2`, `3`, `4`: Select choices A, B, C, D directly.
   - `Enter` / `Space`: Confirm, advance after explanation, or dismiss modal.
   - `Escape`: Trigger exit/pause confirmation.
   - Visual key hints (`[1]`, `[2]`, `[3]`, `[4]`) are subtly rendered beside each option on desktop only.
3. **Accessibility:**
   - Visible keyboard `:focus-visible` rings with proper contrast.
   - Full keyboard tab navigation through all interactive elements.

---

## 5. Responsive Adaptation Matrix

| Component / Screen | Mobile (< 640px) | Tablet (640px - 1024px) | Desktop (> 1024px) |
|---|---|---|---|
| **Navigation** | Sticky top bar with minimalist back/home icon | Centered header bar | Clean top header with breadcrumb navigation |
| **Set Grid** | 1 column, stacked vertical cards | 2 columns grid | 3 columns grid with max-w-6xl |
| **Quiz Container** | Full screen (100% width, 16px padding) | Centered card (max-w-lg) | Centered focused canvas (max-w-xl) |
| **Option Buttons** | Full width stacked, 56px height | Full width stacked, 60px height | Full width with keyboard hints `[1]-[4]` |
| **Prompt Typography** | 32px Kanji font size | 36px Kanji font size | 40px Kanji font size |
| **Explanation View** | Bottom sheet sliding up | Centered modal overlay | Centered modal overlay with full breakdown |
| **Results Summary** | 2x2 compact metrics, full-width actions | 4-column metrics row | 4-column metrics row, side-by-side action buttons |
