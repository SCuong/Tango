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
- **Answer layout preference** (Settings, default **Grid**): a 2×2 grid or 4 stacked rows. Grid falls back to Stacked for the whole question when any answer is too long for a 2×2 card (more than about 2 lines of Vietnamese/English, a Japanese answer that would wrap, or an unbreakable word) or the screen is too narrow; the fallback is per question and never overwrites the saved preference. Written-answer questions are unaffected. Details: [`DESIGN_SYSTEM.md` §12.4](../DESIGN_SYSTEM.md#124-answer-layout-preference-grid-22--stacked-14).
- In the grid, all four cards share one height and keep reading order (1 2 / 3 4); feedback rings and icons behave exactly as in the stacked layout, with no layout change when feedback appears.
- 4 choices with positional identity:
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
MOBILE (< 640px) — GRID (default, short answers)
┌───────────────────────────────────────────────┐
│ [IconX]   ━━━━━━━░░░░░░░░░░   4/20   [IconFlame] 4 │
├───────────────────────────────────────────────┤
│                                               │
│               りょこう                        │
│                                               │
│ ┌────────────────────┐ ┌────────────────────┐ │
│ │      du lịch       │ │      thực tế       │ │
│ └────────────────────┘ └────────────────────┘ │
│ ┌────────────────────┐ ┌────────────────────┐ │
│ │      lễ nghi       │ │     cảnh quan      │ │
│ └────────────────────┘ └────────────────────┘ │
└───────────────────────────────────────────────┘

MOBILE (< 640px) — STACKED (preference, or the grid's long-answer fallback)
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
- **Explanation Container** — chosen in Settings ("Hiển thị lời giải khi sai", `tango_v1_preferences.incorrectFeedback`):
  - **Popup (`Cửa sổ`, default):**
    - **Mobile (< 640px):** Slides in from the bottom as an interactive `BottomSheet`.
    - **Desktop (> 1024px):** Renders as an overlay card centered directly below the prompt.
    - Modal dialog: backdrop, focus trap, Continue focused, and a history marker so browser Back asks to exit (SCREEN 13).
  - **Inline (`Dưới đáp án`):** the same content directly below the whole answer area (after the 2×2 grid, the last stacked answer, or the written-answer input), full answer width, never a grid cell. A dashed error-surface box in the normal page flow: no dialog, backdrop, blur, history marker, or focus trap; announced politely; Continue takes focus and the box scrolls into view only when needed (`block: 'nearest'`, instant under reduced motion). The answer highlights (red wrong, green correct, muted others) and the answer layout stay as they are.
  - Both styles share one content block and the same `Đã hiểu — Tiếp tục` action; wrong answers never auto-advance.
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

INLINE (below the answers)
│ [ 旅行 ✕ ]              [ 実際 ]              │
│ [ 礼儀 ✓ ]              [ 景観 ]              │
│ ┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐ │
│ ┆ [IconX] Chưa chính xác                    ┆ │
│ ┆ 礼儀                                      ┆ │
│ ┆ れいぎ                                    ┆ │
│ ┆ Nghĩa: lễ nghi                            ┆ │
│ ┆ [ Đã hiểu — Tiếp tục ]                    ┆ │
│ └╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘ │
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
- **Browser Back** during an active session opens this dialog instead of leaving; `Escape` and the HUD `[IconX]` open it too. `Thoát` returns to the screen that started the session and discards the session (no progress or history is written).

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
3. **Contextual return** — quiet tertiary button: returns to the study context the quiz started from (see *Return context* below), e.g. `[IconArrowLeft] Về Hán tự`.

#### Return context:
Quiz Results returns to the quiz's originating study context, not always Home.

| Quiz started from | Returns to | VI | EN | Icon |
|---|---|---|---|---|
| Category Quiz Config (SCREEN 07) | `/book/:bookId/category/:category` | `Về Từ vựng` / `Về Hán tự` | `Back to Vocabulary` / `Back to Kanji` | `IconArrowLeft` |
| Book Quiz Config (SCREEN 08) | `/book/:bookId` | `Về giáo trình` | `Back to book` | `IconArrowLeft` |
| Lesson Practice / Quick Test / lesson Review (SCREEN 05) | `/lesson/:lessonId` | `Về bài học` | `Back to lesson` | `IconArrowLeft` |
| Mixed Quiz Config, the Test root (SCREEN 09) | `/quiz/mixed-config` | `Về Kiểm tra` | `Back to Test` | `IconCards` |
| Unknown (no metadata) | `/` | `Về trang chủ` | `Back to Home` | `IconHome` |

- **Explicit runtime metadata:** each entry point sets `QuizSessionConfig.returnTarget` (a typed, restricted subset of the app routes) when the session starts. It is never inferred from question types, answers, or lessons, never passed to the quiz engine, and never written to `tango_v1_history`.
- **Preserved across Retry and Review Missed:** Retry reuses the same config; Review Missed launched from Results carries the ORIGINAL return target (Kanji → Test → Results → Review Missed → Results → `Về Hán tự`), never the previous Results screen.
- **Fallback = Home** when the metadata is missing (an old or test-created session).
- **History:** the return action goes back through browser history to the existing origin entry when it is an earlier in-app screen, so browser Back from the origin never bounces into Results or the quiz session; after a deep link or reload it replaces Results with the origin instead.
- **Keyboard:** `Escape` takes the same contextual return; `Enter` (focus on the page) still starts Review Missed.

#### Responsive Adaptation:
- **Mobile (< 640px):** 2x2 metric cards, stacked action buttons.
- **Desktop (> 1024px):** Centered `max-w-2xl` canvas, 4-column metric row, side-by-side action buttons.

---

### SCREEN 15: Review Missed Words (Ôn lại từ sai)

#### Purpose:
Launches a targeted review session containing only items failed in the recent quiz or marked weak in history.
- Reuses SCREEN 10 (Quiz Runner) scoped strictly to `missedItemIds` (from Results) or to the lesson's weak items (from Lesson Detail), using the engine's review focus (see [`docs/DATA_MODEL.md` §4.3](../DATA_MODEL.md)).
- A correct answer in a review session clears the item's weak flag.
- Once all weak items are answered correctly, returns gracefully to SCREEN 14, whose return action still leads to the original quiz's study context (or Home when there is none).
- **Empty State:** If launched when 0 items are weak, displays: *"Tuyệt vời! Bạn không có từ nào cần ôn lại."*.
