# Tango UI Specification — Quiz Session Screens (SCREEN 10 – 15)

> **Master Specification Reference:** [`docs/SCREEN_SPEC.md`](../SCREEN_SPEC.md) is the authoritative master index, route map, and responsive foundation for Tango.
> This domain file is authoritative for the detailed screen layouts, wireframes, and interaction flows of **Quiz Session Screens (SCREEN 10 through SCREEN 15)**.
>
> **Design Tokens & Components:** Styled exclusively using the Soft Claymorphism design system in [`docs/DESIGN_SYSTEM.md`](../DESIGN_SYSTEM.md).

---

## Screen Inventory

- [SCREEN 10: Active Quiz / Practice Session](#screen-10-active-quiz--practice-session)
- [SCREEN 11: Correct Answer Feedback](#screen-11-correct-answer-feedback)
- [SCREEN 12: Incorrect Answer Feedback & Explanation](#screen-12-incorrect-answer-feedback--explanation)
- [SCREEN 13: Quiz Exit Confirmation](#screen-13-quiz-exit-confirmation)
- [SCREEN 14: Quiz Results Summary](#screen-14-quiz-results-summary)
- [SCREEN 15: Review Missed Words (Ôn lại từ sai)](#screen-15-review-missed-words-ôn-lại-từ-sai)

---

### SCREEN 10: Active Quiz / Practice Session

#### Purpose:
The focused study environment where questions are answered. Minimalist, high contrast, zero unnecessary telemetry or decorative distractions.

#### Navigation & Header:
- **Top HUD:**
  - Left: `[IconX]` Exit button (triggers [SCREEN 13: Quiz Exit Confirmation](#screen-13-quiz-exit-confirmation)).
  - Center: High-contrast progress bar + Question counter (`4 / 20`).
  - Right: Streak counter (`[IconFlame] 4`). In Quick Test mode, also displays elapsed timer (`01:25`).

#### Center Prompt Card:
- Large prompt text (e.g. `りょこう` or `du lịch`). Font size: `28px–36px` on mobile, `40px–48px` on desktop in `Noto Sans JP` / `Be Vietnam Pro`.
- Optional sub-prompt for reading disambiguation.

#### Bottom Thumb-Zone Area (4 Positional Answer Choices):
- Stacked 4 choices with positional identity:
  - Choice 1: Amber tint
  - Choice 2: Sky Blue tint
  - Choice 3: Violet tint
  - Choice 4: Rose tint
- Minimum height `56px`, generous padding, large readable text.
- **CRITICAL:** Strictly **NO** visible `A/B/C/D`, `1/2/3/4`, or keyboard hint tags printed on the buttons. Only the answer content is displayed.

#### Desktop Keyboard Integration:
- Keys `1`, `2`, `3`, `4`: Select corresponding answer choice in the background.
- `Escape`: Trigger exit confirmation modal.

#### Wireframes:
```text
MOBILE (< 640px)
┌───────────────────────────────────────────────┐
│ [IconX]   ━━━━━━━░░░░░░░░░░   4/20   [IconFlame] 4 │
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
│ [IconX]     ━━━━━━━━━━━━━━░░░░░░░░░░   4/20   [IconFlame] 4 │
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
- **Button Highlight:** Selected choice highlights with Emerald Green ring (`--success`, `#059669`) and an inline `[IconCheck]`.
- **Toast:** Brief confirmation badge: `"[IconCheck] Chính xác!"`.
- **Auto-Advance:** Progresses to next question automatically in **750ms**, or immediately on `Enter`, `Space`, or screen tap.
- **Sound Effects:** If enabled in Settings (Off by default), plays subtle chime (<200ms). Never blocks progression.

---

### SCREEN 12: Incorrect Answer Feedback & Explanation

#### Visual & Audio Behavior:
- **Button Highlights:**
  - Selected wrong choice: Red ring (`--error`, `#DC2626`) and `[IconX]`.
  - True correct choice: Simultaneously highlighted with Emerald Green ring and `[IconCheck]`.
- **Sound Effects:** Gentle low-frequency tone (<200ms) if sound enabled.
- **Explanation Container:**
  - **Mobile (< 640px):** Slides in from the bottom as an interactive `BottomSheet`.
  - **Desktop (> 1024px):** Renders as an overlay card centered directly below the prompt.
- **Content:**
  - Status: `[IconX] Chưa chính xác`
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
│ [IconX] Chưa chính xác                        │
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
- Best streak (e.g. `[IconFlame] 8 liên tiếp`)
- Elapsed time (e.g. `01:40`)

#### Actions:
1. `[IconRefresh] Ôn lại các từ đã sai (3 từ)` — High-emphasis primary button (only rendered if mistakes exist).
2. `[IconRotateClockwise] Làm lại bài kiểm tra` — Secondary button.
3. `[IconHome] Về trang chủ` — Tertiary button.

#### Responsive Adaptation:
- **Mobile (< 640px):** 2x2 metric cards, stacked action buttons.
- **Desktop (> 1024px):** Centered `max-w-2xl` canvas, 4-column metric row, side-by-side action buttons.

---

### SCREEN 15: Review Missed Words (Ôn lại từ sai)

#### Purpose:
Launches a targeted review session containing only items failed in the recent quiz or marked weak in history.
- Reuses SCREEN 10 (Quiz Runner) scoped strictly to `missedItemIds`.
- Once all weak items are answered correctly, returns gracefully to SCREEN 14 or Home.
- **Empty State:** If launched when 0 items are weak, displays: *"Tuyệt vời! Bạn không có từ nào cần ôn lại."*.
