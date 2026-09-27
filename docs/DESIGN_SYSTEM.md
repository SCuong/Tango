# Tango — Visual Design System

This document is the authoritative visual design system and UX specification for **Tango**. All future UI implementation, component authoring, styling, and asset creation must strictly adhere to the tokens, ergonomic rules, and aesthetic standards established here.

Before building or modifying user-facing components, contributors must consult:
1. `PROJECT_RULES.md`
2. `docs/DESIGN_SYSTEM.md` (this document)
3. Relevant product specifications (`docs/PRODUCT_SPEC.md`, `docs/UI_UX.md`, `docs/IMPORT_SPEC.md`)

---

## 1. Product Context & Core Identity

Tango is a dedicated Japanese vocabulary and Kanji learning web application tailored for Vietnamese learners. Its study workflow encompasses Vocabulary lessons, Kanji lessons, Practice Mode, Quick Test, Mixed Multi-Lesson Tests, Lesson Importing, and Review of Missed Words.

The interface supports two UI languages: **Vietnamese (Tiếng Việt)** and **English**. Japanese is the target study content.

Tango must feel like a calm, polished, thoughtfully crafted educational tool designed by an experienced product designer—never a generic template, SaaS admin dashboard, or boilerplate demo app.

---

## 2. Absolute Rule: Avoid Generic Template & SaaS Clichés

Tango strictly rejects visual clichés commonly associated with low-effort or template-driven web interfaces.

### Anti-Patterns Strictly Prohibited:
- **No generic template or SaaS dashboard layouts:** No sidebar menus stuffed with fake productivity stats, "Welcome back, User!" hero banners, or pointless telemetry widgets.
- **No exaggerated neon gradients or glowing borders:** No rainbow halos, iridescent chromatic aberrations, or radioactive accent buttons.
- **No floating gradient blobs or decorative geometric shapes:** Every element on screen must serve a clear study or navigation function.
- **No glassmorphism everywhere:** No blurry frosted-glass panels stacked over complex backgrounds that degrade text readability.
- **No nested cards inside cards inside cards:** Flat, intentional grouping with clean negative space.
- **No random emoji as primary UI icons:** Emojis are reserved exclusively for natural Japanese/Vietnamese study content. System navigation and status indicators use Tabler stroke iconography only (e.g. streak indicator `[IconFlame] 4`).
- **No excessive pill badges:** Do not turn every word or metadata label into a colored rounded badge.
- **No uniform 24px border-radius everywhere:** Shape language must be nuanced and scaled according to element size and hierarchy.
- **No giant empty whitespace:** Layouts must feel comfortable, information-dense where appropriate (word lists, preview tables), and focused during quizzes.
- **No bouncing, springing, or distracting animations:** Motion must be restrained (150–220ms), purposeful, and easily disabled via `prefers-reduced-motion`.

> **Guiding Axiom:** Study clarity and typographic legibility always take precedence over decorative visual trends.

---

## 3. Core Visual Direction: Soft Claymorphism Learning UI

Tango adopts **Soft Claymorphism** as its signature visual language. Claymorphism is applied in a mature, restrained manner that conveys warmth, tactility, and friendliness without devolving into cartoonish, inflated 3D bubbles.

### The Intended Feeling
- **Soft & Tactile:** Surfaces feel like smooth, matte ceramic or soft clay with subtle physical depth.
- **Calm & Welcoming:** Inviting for daily repeat sessions without causing visual fatigue.
- **Modern & Focused:** Crisp typography and deliberate contrast keep attention anchored on vocabulary acquisition.

### Where Claymorphism Belongs:
- Study Book cards and Learn by Type cards (Từ vựng, Hán tự)
- Lesson selection cards
- Primary action buttons (CTA, Start Quiz, Next Question)
- Multiple-choice answer buttons
- Theme selection swatches
- Import file drop zones
- Results & score summary cards

### Where Flat / Minimal Styling Belongs (Restrained Clay):
- Dense vocabulary lists and dictionary rows
- Settings configuration lists
- Import data preview tables
- Multi-line textareas and form inputs
- Navigation headers and breadcrumbs

### Physical Anatomy of a Tango Clay Element
1. **Subtle Elevation Shadow:** Soft dual-layer drop shadow simulating directional ambient light.
2. **Restrained Inner Highlight:** Faint top/left inner highlight simulating matte light catching a rounded bevel.
3. **Tactile Pressed State:** On click/tap, the element shifts slightly down (~1px), the outer shadow compresses, and the inner highlight softens, providing satisfying physical feedback.
4. **Never Extreme:** No high-contrast embossed text, no glossy plastic reflections, and no blurry neumorphic borders that degrade WCAG contrast.

### 3.1 Canonical Clay Interaction Recipe

All primary interactive clay surfaces (Study Book cards, Learn by Type cards, primary Home CTAs, tactile icon buttons, and future lesson-selection cards) adhere to this canonical interaction lifecycle. It is implemented by the shared `.clay-interactive` rule in `src/index.css` plus the `usePressFeedback` hook (`src/hooks/usePressFeedback.ts`):

- **Default:**
  - Semantic surface background (`--bg-surface` or category semantic surface)
  - Subtle semantic border (`--border-subtle` or category semantic border)
  - Visible but soft dual-layer elevation (`--shadow-clay-card` or `--shadow-clay-button`)
  - Restrained inner top highlight catching a rounded bevel
  - `transform: translateY(0)`
- **Hover (only on devices with a real hovering pointer):**
  - Gated by `@media (hover: hover) and (pointer: fine)` inside `.clay-interactive`, so touch screens never keep a sticky hover lift.
  - Tactile lift: `transform: translateY(-1px)`
  - Dedicated clay hover elevation: `--shadow-clay-card-hover`
  - Never applied while the control is pressed (`:not([data-pressed="true"])`).
  - Do not use Tailwind `hover:*` / `group-hover:*` utilities for clay elevation, and strictly NO generic Tailwind shadows (`hover:shadow-md`, `hover:shadow-lg`).
- **Pressed (explicit pointer state, never CSS `:active`):**
  - Mobile browsers can leave `:active` / `:hover` stuck after a touch is dragged off a control and released, so pressed depth is component state from `usePressFeedback`.
  - The press starts on pointer down (primary mouse button, touch, or pen) or `Space`, and clears on pointer up, pointer cancel, pointer leave, pointer moving outside the control bounds, blur, and any pointer/key release in the window.
  - Pointer capture is not used, so native click cancellation on drag-out is unchanged.
  - While pressed, the control swaps its resting shadow for `CLAY_PRESSED_CLASSES` (`translate-y-px shadow-clay-pressed`) and exposes `data-pressed="true"`.
- **Focus-Visible:**
  - High-contrast primary focus ring with clear 2px offset (`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page`)
  - Never relies on shadow alone for keyboard focus
- **Restraint Rule:** Dense vocabulary lists, dictionary tables, and administrative management tables retain flat surfaces with clean 1px dividers rather than clay cards.

---

## 4. Ergonomic UX Architecture

Tango is built around high-frequency, short-duration study sessions. Ergonomic comfort is a mandatory design requirement, not an afterthought.

### 4.1 Mobile Ergonomics (First-Class Platform)
- **Thumb Zone Anchor:** During active quizzes and test setups, all primary interactive controls and answer choices must sit in the lower 50% of the viewport (the natural thumb reach area).
- **Dominant Prompt Zone:** The upper half of the screen is dedicated entirely to the Japanese prompt and passive progress indicators.
- **Generous Touch Targets:**
  - Minimum touch target for any interactive button: **48px**.
  - Multiple-choice answer buttons: minimum height **56px** (comfortable for one-handed thumb tapping on phones).
  - Vertical spacing between answer choices: minimum **12px** to prevent accidental mis-taps.
- **Viewport Bounds:** Strict `100vw` layout with zero horizontal scrolling (`overflow-x: hidden`).
- **Safe Area Insets:** All bottom-docked action bars respect device safe areas (`env(safe-area-inset-bottom)`).

### 4.2 Desktop Ergonomics
- **Constrained Study Canvas:** On wide desktop screens, the active quiz interface is centered with a constrained max-width (`max-w-xl` / ~600px). This eliminates broad eye-scanning fatigue and preserves the focused rhythm of mobile drills.
- **Balanced Browsing Layouts:** Lesson lists and import interfaces expand into structured 2-column or 3-column grids (`max-w-4xl` to `max-w-6xl`) with clear hierarchy.
- **Clear Focus Indicators:** Prominent `:focus-visible` rings (2px-3px solid with 2px offset) ensuring complete keyboard navigability.

---

## 5. Iconography: Tabler Icons

Tango uses **Tabler Icons** (`@tabler/icons-react`) as its exclusive, unified UI icon system.

### Icon Rules
- **Consistency:** Use Tabler Icons exclusively. Do not mix with Lucide, Heroicons, Font Awesome, or custom icon sets.
- **Stroke Treatment:** Default stroke width is `2px` for normal interface controls, and `1.5px` for large standalone illustrations/badges.
- **Functional Use Only:** Icons are used to reinforce cognitive recognition (e.g. Back, Settings, Import, Practice, Test). Do not decorate buttons where plain text is clearer.
- **Accessible Tooltips:** Icon-only buttons (such as header actions) must include accessible `aria-label` attributes and native desktop tooltips.
- **No Emojis as UI Icons:** Never use emojis as replacements for UI action icons.

### Core Icon Mapping
| Context | Tabler Icon Name | Purpose |
|---|---|---|
| Vocabulary Category | `IconBook` | Indicates general vocabulary |
| Kanji Category | `IconLanguage` / `IconWriting` | Indicates Kanji character compounds |
| Mixed Test | `IconBolt` / `IconCards` | Combined multi-lesson quiz |
| Practice Mode | `IconBrain` | Low-stress learning |
| Quick Test | `IconClock` / `IconTarget` | Timed retention test |
| Import Lesson | `IconUpload` / `IconFileImport` | Pasting or uploading custom lessons |
| Settings | `IconSettings` | Theme & language preferences |
| Navigation Back | `IconArrowLeft` | Return to previous view |
| Correct Answer | `IconCheck` | Green confirmation checkmark |
| Incorrect Answer | `IconX` | Red mistake indicator |
| Warning / Incomplete | `IconAlertTriangle` | Non-blocking data warning |
| Sound Effects (MVP) | `IconVolume` / `IconVolumeOff` | Settings toggle for subtle tactile feedback (default OFF)* |

*\*Note: Spoken Japanese pronunciation / text-to-speech (TTS) remains out of scope for the MVP and is reserved for future consideration.*

---

## 6. Typography System

Tango requires seamless typographic harmony between Vietnamese diacritical accents, English interface labels, and Japanese Kanji/Kana glyphs.

### 6.1 Font Families

```css
/* Vietnamese and English Interface Font Stack */
--font-ui: "Be Vietnam Pro", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;

/* Japanese Content Font Stack */
--font-japanese: "Noto Sans JP", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", sans-serif;
```

- **Be Vietnam Pro:** Primary UI family for all Vietnamese and English interface text (navigation, buttons, stats, settings, definitions, metadata). It natively supports Vietnamese tonal marks without clipping ascenders/descenders.
- **Noto Sans JP:** Primary Japanese family for all study expressions, Kanji compounds, Hiragana, Katakana, and Furigana. Stroke details remain legible even at small sizes.

### 6.2 Type Scale & Hierarchy

| Token | Size | Line Height | Weight | Target Usage |
|---|---|---|---|---|
| `text-display` | 36px–40px | 1.25 | Bold (700) | Main Japanese Quiz Prompt (Kanji/Kana) |
| `text-h1` | 24px–28px | 1.3 | Bold (700) | Screen titles, Result score |
| `text-h2` | 20px–22px | 1.35 | SemiBold (600) | Section headers, Category card titles |
| `text-h3` | 17px–19px | 1.4 | SemiBold (600) | Lesson card titles, Quiz answer text |
| `text-body` | 15px–16px | 1.5 | Regular (400) / Medium (500) | Explanations, definitions, options subtext |
| `text-sub` | 13px–14px | 1.4 | Medium (500) | Kana reading subprompts, meta badges |
| `text-caption` | 11px–12px | 1.4 | SemiBold (600) | Progress counters, Hán Việt badges |

### 6.3 Typography Rules
1. **No Cramped Kanji:** Japanese body text must never drop below `16px`. Quiz prompts must use `36px` to `40px` so intricate Kanji strokes (e.g. `観`, `警`, `議`) are immediately distinct.
2. **Diacritic Protection:** Line heights on Vietnamese text are set to a minimum of `1.4` to prevent stacked diacritical marks (e.g. `ẩ`, `ễ`, `ớ`) from colliding with borders or adjacent lines.
3. **Weight Restraint:** Avoid heavy black weights (`900`) for Japanese characters, as heavy strokes cause complex Kanji to bleed together on mobile screens.
4. **Mixed-Script Study Titles:** User-provided study-content titles (e.g. Study Book titles such as `中級へ行こう 日本語の文型と表現55`) use `.font-study-title` (`"Be Vietnam Pro", var(--font-japanese)`): Latin and Vietnamese glyphs come from the UI font, Kana/Kanji from the Japanese stack. This prevents the browser from falling back to an arbitrary system CJK font that could render Chinese glyph forms under the Vietnamese document language.

---

## 7. Localization Strategy (Vietnamese & English UI)

Tango's user interface is fully localized in:
1. **Tiếng Việt (Vietnamese)** — Default
2. **English (English)**

*Japanese is the subject matter of study, not an interface locale.*

### Localization Rules
- **No Hard-Coded UI Strings:** All user-facing labels, button texts, error messages, and dialogs are referenced via a localization dictionary key.
- **Elastic Layout Tolerance:** English and Vietnamese phrases differ significantly in length (e.g. "Kiểm tra tổng hợp" vs. "Combined Test", "Ôn lại các từ đã sai" vs. "Review Missed Words"). All buttons, cards, and navigation bars use dynamic flex/grid sizing that accommodates variable text lengths without breaking or clipping.

---

## 8. Multi-Theme Token Architecture

Tango features three distinct, meticulously tuned appearance themes:
1. **Light (Sáng) — Cool Pearl / Japanese Stationery:** A cool neutral pearl (blue-gray) canvas with porcelain-white cards and pearl-gray raised surfaces. Lavender Vocabulary, peach Kanji, and a strong indigo action color each keep their own hue. Bright and comfortable for long daytime sessions.
2. **Dark (Tối) — Midnight Ink:** A deep, low-saturation charcoal-navy canvas with lifted neutral navy cards. Violet-indigo Vocabulary, amber-brown Kanji, and a vivid indigo action color stand apart from the neutral surfaces. Never generic black, never an "everything blue" screen.
3. **Sakura (Sakura) — Warm Blossom Paper:** A warm blush Japanese-paper canvas with warm porcelain cards, blossom-tinted raised surfaces, and a rose-plum accent. It reads as "Sakura" without any flower decoration.

### 8.1 Calm Does Not Mean Colorless
Tango stays mature and restrained, but it never falls back to near-white or near-black palettes that make every theme feel generic.

- **Recognizable at first glance:** Each theme must have its own atmosphere even if category cards and CTA buttons are ignored.
- **Identity lives in the material, not only the accents:** Theme identity must be visible from the page canvas, surfaces, borders, and elevation. Cards must separate from the canvas by color before any shadow is considered.
- **Separate the three color roles:** Canvas creates atmosphere; category surfaces create identity; CTA creates action emphasis. These three roles must not collapse into the same hue family. In practice: keep the canvas and neutral card surfaces low-saturation, give each category surface its own clearly different hue, and reserve the most saturated color on screen for the CTA. Sakura is the reference: blush canvas, lavender/peach categories, plum-rose action.
- **Personality comes only from:** palette, material contrast, typography, the existing study illustrations, and hierarchy.
- **Never:** gradients, decorative blobs, Sakura petals, Japanese patterns, neon, glow, glassmorphism, or wallpaper illustrations.
- **Restraint:** Shadows stay soft and are tinted to each theme's material; never make them heavier to fake personality.
- **Settings previews:** The palettes in §9 are exactly what the Settings theme preview cards display (§16.5).

### Semantic Token Strategy
Components **never** reference raw hex colors. All components consume semantic CSS variables that adapt automatically to the active theme:

```css
:root {
  /* Surface & Background */
  --bg-page: ...;
  --bg-surface: ...;
  --bg-surface-elevated: ...;
  --border-subtle: ...;
  --border-strong: ...;

  /* Typography */
  --text-primary: ...;
  --text-secondary: ...;
  --text-muted: ...;

  /* Primary Brand Accent */
  --primary: ...;
  --primary-hover: ...;
  --primary-surface: ...;
  --primary-border-subtle: ...;

  /* Semantic Feedback */
  --success: ...;
  --success-surface: ...;
  --error: ...;
  --error-surface: ...;
  --error-border: ...;
  --warning: ...;

  /* 4 Positional Multiple-Choice Answer Identities */
  --answer-1-bg: ...;
  --answer-1-border: ...;
  --answer-1-text: ...;
  --answer-2-bg: ...;
  --answer-2-border: ...;
  --answer-2-text: ...;
  --answer-3-bg: ...;
  --answer-3-border: ...;
  --answer-3-text: ...;
  --answer-4-bg: ...;
  --answer-4-border: ...;
  --answer-4-text: ...;

  /* Category Semantic Identities */
  --category-vocabulary-surface: ...;
  --category-vocabulary-border: ...;
  --category-vocabulary-icon: ...;
  --category-vocabulary-text: ...;

  --category-kanji-surface: ...;
  --category-kanji-border: ...;
  --category-kanji-icon: ...;
  --category-kanji-text: ...;

  /* Primary Study CTA (solid clay action, e.g. Home Mixed Test) */
  --cta-surface: ...;
  --cta-border: ...;
  --cta-text: ...;
  --cta-text-secondary: ...;
  --cta-puck-surface: ...;
  --cta-puck-border: ...;

  /* Clay Elevation Shadows & Highlights */
  --shadow-clay-card: ...;
  --shadow-clay-card-hover: ...;
  --shadow-clay-button: ...;
  --shadow-clay-pressed: ...;
}
```

---

## 9. Theme Palette Specifications

### 9.1 Light Theme (Sáng) — Cool Pearl / Japanese Stationery
A cool neutral pearl (blue-gray) canvas that separates porcelain-white cards before shadows are considered, with pearl-gray raised surfaces and navy-ink typography. Vocabulary is a clearly lavender-violet surface, Kanji a warm apricot-peach surface, and Mixed Test a strong indigo action. Canvas, Vocabulary, and CTA never share the same blue-purple family.

| Token | Value | Visual Role |
|---|---|---|
| `--bg-page` | `#ECEFF3` | Cool neutral pearl canvas (blue-gray, not lavender); atmosphere only |
| `--bg-surface` | `#FFFFFF` | Porcelain-white card surface |
| `--bg-surface-elevated` | `#E1E5EC` | Cool pearl-gray raised/recessed panels and progress tracks |
| `--border-subtle` | `#D8DDE6` | Cool pearl hairline boundary (1px) |
| `--border-strong` | `#B8C0CD` | Defined cool-gray boundary (1px) |
| `--text-primary` | `#1A2033` | Deep navy-ink primary text |
| `--text-secondary` | `#475065` | Slate secondary text |
| `--text-muted` | `#5A6479` | Cool muted captions (AA on white and canvas) |
| `--primary` | `#4F46E5` | Tango indigo brand accent |
| `--primary-hover` | `#4338CA` | Deep indigo hover/active |
| `--primary-surface` | `#E3E4FD` | Indigo wash for selected items and cover placeholders |
| `--primary-border-subtle` | `#C0C3F4` | Indigo hairline boundary |
| `--category-vocabulary-surface` | `#E2DDFC` | Lavender-violet clay tile, clearly off the neutral canvas |
| `--category-vocabulary-border` | `#C6BDF3` | Soft violet tile border |
| `--category-vocabulary-icon` | `#5145E0` | Violet-indigo glyph and illustration color |
| `--category-vocabulary-text` | `#2D2677` | Deep violet label text |
| `--category-kanji-surface` | `#FCE2C6` | Apricot-peach clay tile surface |
| `--category-kanji-border` | `#EEC393` | Warm amber tile border |
| `--category-kanji-icon` | `#AD4D08` | Amber glyph and illustration color |
| `--category-kanji-text` | `#6B2F0E` | Deep amber-plum label text |
| `--cta-surface` | `#4A43D6` | Strong ink-indigo action color (7.0:1 white text) |
| `--cta-border` | `#3F38BD` | Deep indigo CTA edge |
| `--cta-text` | `#FFFFFF` | CTA title |
| `--cta-text-secondary` | `#E0E7FF` | CTA secondary text |
| `--cta-puck-surface` | `rgba(255, 255, 255, 0.16)` | Matte puck on CTA |
| `--cta-puck-border` | `rgba(255, 255, 255, 0.28)` | CTA puck rim highlight |
| `--shadow-clay-card` | `0 4px 14px -1px rgba(30, 38, 64, 0.10), 0 2px 6px -1px rgba(30, 38, 64, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.95)` | Neutral cool clay lift |
| `--shadow-clay-card-hover` | `0 8px 20px -2px rgba(30, 38, 64, 0.13), 0 3px 8px -1px rgba(30, 38, 64, 0.07), inset 0 1px 0 rgba(255, 255, 255, 1)` | Tactile hover lift |
| `--shadow-clay-button` | `0 4px 12px rgba(74, 67, 214, 0.26), 0 1px 3px rgba(30, 38, 64, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.40)` | Indigo CTA depth |
| `--shadow-clay-pressed` | `0 1px 2px rgba(30, 38, 64, 0.10), inset 0 2px 4px rgba(30, 38, 64, 0.08)` | Tactile pressed state |

### 9.2 Dark Theme (Tối) — Midnight Ink
A deep, low-saturation charcoal-navy canvas with lifted neutral navy cards and soft off-white text. Vocabulary is a violet-indigo clay, Kanji a warm amber-brown clay, and Mixed Test a vivid indigo action, so layers differ by identity and not only by brightness. Never neutral black and never monochrome navy.

| Token | Value | Visual Role |
|---|---|---|
| `--bg-page` | `#11151E` | Deep neutral charcoal-navy canvas (low saturation); atmosphere only |
| `--bg-surface` | `#1C222F` | Lifted neutral navy card surface |
| `--bg-surface-elevated` | `#262D3C` | Lighter neutral navy raised/recessed panels and progress tracks |
| `--border-subtle` | `#2D3444` | Neutral navy hairline boundary |
| `--border-strong` | `#404A5F` | Defined neutral boundary |
| `--text-primary` | `#EEF1F7` | Soft off-white text |
| `--text-secondary` | `#ABB4C6` | Cool gray secondary text |
| `--text-muted` | `#8993A8` | Muted gray metadata |
| `--primary` | `#8B8CF9` | Luminous indigo-violet brand accent |
| `--primary-hover` | `#A9AAFB` | Lighter indigo-violet hover |
| `--primary-surface` | `#2A2A58` | Indigo wash for selected items and cover placeholders |
| `--primary-border-subtle` | `#44438E` | Indigo accent boundary |
| `--category-vocabulary-surface` | `#2F2A5E` | Violet-indigo clay tile, distinct from neutral cards |
| `--category-vocabulary-border` | `#4A418F` | Violet tile border |
| `--category-vocabulary-icon` | `#B8AEFF` | Lavender-violet glyph and illustration color |
| `--category-vocabulary-text` | `#ECE8FF` | Pale violet label text |
| `--category-kanji-surface` | `#3A2A1C` | Warm amber-brown clay tile surface |
| `--category-kanji-border` | `#5F4530` | Warm amber-brown tile border |
| `--category-kanji-icon` | `#F6AE3D` | Warm amber glyph and illustration color |
| `--category-kanji-text` | `#FDEBCB` | Pale amber label text |
| `--cta-surface` | `#5A52EC` | Vivid primary indigo action color (5.5:1 white text) |
| `--cta-border` | `#7A73F3` | Luminous indigo CTA edge |
| `--cta-text` | `#FFFFFF` | CTA title |
| `--cta-text-secondary` | `#E6E8FF` | CTA secondary text |
| `--cta-puck-surface` | `rgba(255, 255, 255, 0.14)` | Matte puck on CTA |
| `--cta-puck-border` | `rgba(255, 255, 255, 0.24)` | CTA puck rim highlight |
| `--shadow-clay-card` | `0 4px 16px rgba(0, 2, 10, 0.45), 0 1px 3px rgba(0, 2, 10, 0.30), inset 0 1px 0 rgba(255, 255, 255, 0.06)` | Neutral night elevation |
| `--shadow-clay-card-hover` | `0 8px 24px rgba(0, 2, 10, 0.55), 0 2px 6px rgba(0, 2, 10, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.09)` | Night hover lift |
| `--shadow-clay-button` | `0 4px 14px rgba(0, 2, 10, 0.50), 0 1px 3px rgba(90, 82, 236, 0.30), inset 0 1px 0 rgba(255, 255, 255, 0.16)` | Vivid indigo CTA depth |
| `--shadow-clay-pressed` | `0 1px 2px rgba(0, 2, 10, 0.55), inset 0 2px 4px rgba(0, 2, 10, 0.40)` | Night pressed state |

### 9.3 Sakura Theme (Sakura) — Warm Blossom Paper
A warm blush Japanese-paper canvas with warm porcelain cards, blossom-tinted raised surfaces, deep plum-ink text, and a rose-plum primary. Vocabulary stays a compatible wisteria lavender; Kanji stays warm peach/plum. It is the reference for role separation: blush atmosphere, lavender/peach identity, plum-rose action. **No petals, patterns, neon, or candy pink.**

| Token | Value | Visual Role |
|---|---|---|
| `--bg-page` | `#F5E3E1` | Warm blush Japanese-paper canvas |
| `--bg-surface` | `#FFFAF8` | Warm porcelain card surface |
| `--bg-surface-elevated` | `#F0D8D6` | Blossom-tinted raised/recessed panels and progress tracks |
| `--border-subtle` | `#EACDCA` | Blush hairline boundary |
| `--border-strong` | `#D8AEAA` | Defined dusty-rose boundary |
| `--text-primary` | `#34181F` | Deep plum-ink text |
| `--text-secondary` | `#66434C` | Warm plum secondary text |
| `--text-muted` | `#7C5861` | Dusty plum metadata (AA on porcelain) |
| `--primary` | `#C2416A` | Blossom rose-plum brand accent |
| `--primary-hover` | `#A63458` | Deep rose hover/active |
| `--primary-surface` | `#FADFE7` | Petal wash for selected items and cover placeholders |
| `--primary-border-subtle` | `#EBB3C4` | Petal-rose boundary |
| `--category-vocabulary-surface` | `#E5E0F3` | Wisteria lavender clay tile surface |
| `--category-vocabulary-border` | `#CBC3E5` | Soft wisteria tile border |
| `--category-vocabulary-icon` | `#5A4FCF` | Wisteria-indigo glyph and illustration color |
| `--category-vocabulary-text` | `#2C2654` | Deep wisteria label text |
| `--category-kanji-surface` | `#F8D9C7` | Peach clay tile surface |
| `--category-kanji-border` | `#E9BBA0` | Warm peach tile border |
| `--category-kanji-icon` | `#B04A28` | Terracotta-plum glyph and illustration color |
| `--category-kanji-text` | `#5A2430` | Deep plum label text |
| `--cta-surface` | `#A8385C` | Solid plum-rose CTA (6.2:1 white text) |
| `--cta-border` | `#912E4F` | Deep plum CTA edge |
| `--cta-text` | `#FFFFFF` | CTA title |
| `--cta-text-secondary` | `#FDE7EE` | CTA secondary text |
| `--cta-puck-surface` | `rgba(255, 255, 255, 0.16)` | Matte puck on CTA |
| `--cta-puck-border` | `rgba(255, 255, 255, 0.28)` | CTA puck rim highlight |
| `--shadow-clay-card` | `0 4px 14px rgba(150, 80, 95, 0.13), 0 1px 4px rgba(150, 80, 95, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.95)` | Warm blossom lift |
| `--shadow-clay-card-hover` | `0 8px 22px rgba(150, 80, 95, 0.18), 0 2px 6px rgba(150, 80, 95, 0.09), inset 0 1px 0 rgba(255, 255, 255, 1)` | Warm blossom hover lift |
| `--shadow-clay-button` | `0 4px 12px rgba(168, 56, 92, 0.26), 0 1px 3px rgba(150, 80, 95, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.40)` | Plum-rose CTA depth |
| `--shadow-clay-pressed` | `0 1px 2px rgba(150, 80, 95, 0.18), inset 0 2px 4px rgba(150, 80, 95, 0.12)` | Warm blossom pressed state |

---

## 10. Multiple-Choice Positional Color Identity

To establish rapid visual scanning and cognitive rhythm during repetitive quiz drills, Tango assigns **stable positional color identities** to the four multiple-choice answer slots.

### The Four Positional Hue Families
- **Position 1:** **Amber / Warm Yellow** family
- **Position 2:** **Sky / Soft Blue** family
- **Position 3:** **Violet / Purple** family
- **Position 4:** **Rose / Warm Pink** family

These color identities remain stable in their positions across successive questions, creating a rhythmic, familiar visual landscape for the learner.

### Palette Tokens Across Themes
| Position | Light Theme | Dark Theme | Sakura Theme |
|---|---|---|---|
| **Choice 1 (Amber)** | Bg: `#FEF9C3` (Yellow 100)<br>Border: `#FDE047`<br>Text: `#713F12` | Bg: `#2B2313`<br>Border: `#785412`<br>Text: `#FEF08A` | Bg: `#FFF8E7`<br>Border: `#F6D896`<br>Text: `#5A3E1B` |
| **Choice 2 (Blue)** | Bg: `#E0F2FE` (Sky 100)<br>Border: `#7DD3FC`<br>Text: `#075985` | Bg: `#102336`<br>Border: `#1E4E75`<br>Text: `#BAE6FD` | Bg: `#EDF4FA`<br>Border: `#B5D4EE`<br>Text: `#23496D` |
| **Choice 3 (Violet)**| Bg: `#F3E8FF` (Purple 100)<br>Border: `#D8B4FE`<br>Text: `#581C87` | Bg: `#241836`<br>Border: `#552D80`<br>Text: `#E9D5FF` | Bg: `#F5EEF8`<br>Border: `#D2B4DE`<br>Text: `#4A235A` |
| **Choice 4 (Rose)** | Bg: `#FFE4E6` (Rose 100)<br>Border: `#FDA4AF`<br>Text: `#881337` | Bg: `#33141F`<br>Border: `#7A223B`<br>Text: `#FECDD3` | Bg: `#FCEEF1`<br>Border: `#EBB3C0`<br>Text: `#641E2F` |

---

## 11. CRITICAL: Never Display A/B/C/D or 1/2/3/4 Beside Choices

> [!IMPORTANT]
> **Tango multiple-choice buttons must NEVER display letter indices (`A`, `B`, `C`, `D`), number indices (`1`, `2`, `3`, `4`), or keyboard hints (`[1]`, `[2]`, `[3]`, `[4]`) on the visible interface.**

### Strict Design Mandate:
- **NO** letter prefixes: `A. 旅行`, `B. 実際`, `C. 礼儀`, `D. 景観`
- **NO** numeric badges: `1 旅行`, `2 実際`, `3 礼儀`, `4 景観`
- **NO** keyboard hint badges: `[1]`, `[2]`, `[3]`, `[4]`
- **NO** letter circles or index tags.

### Correct Visible Quiz Screen Layout:
The visible quiz button displays **ONLY the answer content**, centered with clean, generous padding:

```text
┌──────────────────────────────────────────────┐
│                    旅行                      │  ← Position 1 (Amber hue)
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│                    実際                      │  ← Position 2 (Blue hue)
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│                    礼儀                      │  ← Position 3 (Violet hue)
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│                    景観                      │  ← Position 4 (Rose hue)
└──────────────────────────────────────────────┘
```

The four choices are distinguished organically by their physical stacked layout and their subtle positional color identity. They look like a clean, tactile deck of study cards rather than a formal classroom paper exam.

*Keyboard Accessibility Note:* Desktop keyboard number keys (`1`, `2`, `3`, `4`) continue to function silently in the background for rapid answering, but no visual numbers are stamped on the buttons.

---

## 12. Correctness & Feedback Logic (Independent of Positional Hues)

To avoid semantic confusion, positional answer colors **never use pure green or pure red** as their resting identity. 

Correctness is communicated clearly and universally through a combination of color rings, icons, and text feedback:

### 12.1 When Selected Answer is Correct:
- The selected button retains its resting background hue.
- A **bold Emerald Green border/ring (3px solid `#059669`)** wraps the button.
- An `IconCheck` icon appears cleanly on the right edge of the button.
- A brief affirmative confirmation toast slides up: `"Chính xác!"`.
- Automatically advances in `750ms` (or on tap/space/enter).

### 12.2 When Selected Answer is Incorrect:
- The incorrectly chosen button retains its resting background hue.
- A **bold Crimson Red border/ring (3px solid `#DC2626`)** wraps the wrong button.
- An `IconX` appears on the right edge of the wrong button.
- Concurrently, the **true correct button** highlights with an **Emerald Green border/ring (3px solid `#059669`)** and an `IconCheck` to immediately instruct the learner.
- An informative educational sheet slides in from the bottom displaying readings, definitions, and Hán Việt (if present).

### 12.3 Optional Tactile Audio Feedback (Muted & Calm)
To complement the Soft Claymorphism aesthetic, Tango supports optional, gentle audio feedback for quiz drills:
- **Default State:** Strictly **OFF** by default (`soundEnabled: false`). Never plays any sound until explicitly enabled by the user in Settings.
- **Aesthetic Character:** Tactile, warm, organic, and muted (e.g. subtle wooden chime or soft ceramic tap for correct; gentle low-frequency wooden tap for incorrect).
- **Duration:** Very short (< 200ms) with soft attack and decay to prevent acoustic fatigue.
- **Strictly Non-Blocking:** Sound playback is completely decoupled from UI transitions and never delays auto-advancing, timer counts, or feedback rendering.
- **Anti-Patterns Prohibited:**
  - NO loud arcade / game-show sounds (buzzers, trumpets, fanfare, coin rings).
  - NO voice clips or speech synthesis.
  - NO repetitive clicks on ordinary navigation or button taps.
- **Full Visual Parity:** Visual indicators (`IconCheck`, `IconX`, emerald/crimson rings, toast) remain 100% complete and authoritative. The application is fully usable with sound disabled.

---

## 13. Clay Interaction States & Motion

All interactive Clay surfaces (cards, buttons, choices) share a predictable, physical state lifecycle:

| State | Visual Treatment | CSS / Transform |
|---|---|---|
| **Default** | Resting subtle elevation, dual-layer shadow, top highlight | `transform: translateY(0)` |
| **Hover (hover-capable fine pointers only)** | Subtle lift (+1px upward), shadow expands faintly | `@media (hover: hover) and (pointer: fine)`: `transform: translateY(-1px)`, transition `150ms ease` |
| **Pressed** | Tactile depression (+1px downward), shadow compresses | Explicit state (`usePressFeedback`, `data-pressed="true"`): `translate-y-px shadow-clay-pressed`; never CSS `:active` |
| **Focus-Visible** | High-contrast focus ring (2px solid primary, 2px offset) | `outline: 2px solid var(--primary); outline-offset: 2px` |
| **Disabled** | Opacity 50%, flat shadow, cursor not-allowed | `opacity: 0.5; filter: grayscale(20%)` |

### Motion Timing Standards
- Short micro-transitions: **150ms–200ms** with `ease-out`.
- Modal / Bottom Sheet transitions: **250ms–300ms** with `cubic-bezier(0.16, 1, 0.3, 1)`.
- Always respect `@media (prefers-reduced-motion: reduce)`: replace all translations with instant opacity cuts.

---

## 14. Radius & Shape Hierarchy

To avoid the cliché "everything is 24px" template aesthetic, border radii are deliberately scaled by component size:

| Radius Token | Value | Target Components |
|---|---|---|
| `--radius-sm` | `6px` | Inline tags, small badges, scrollbar thumbs |
| `--radius-md` | `10px` | Form inputs, dropdown menus, table preview cells |
| `--radius-lg` | `16px` | Secondary buttons, modal dialogs, search bars |
| `--radius-xl` | `20px` | Quiz answer buttons, lesson list cards, stat cards |
| `--radius-2xl`| `26px` | Study Book cards and Learn by Type cards |
| `--radius-full`| `9999px`| Pill filters, avatar circles, icon action buttons |

---

## 15. Spacing Scale

A strict 4px/8px modular spacing scale guarantees visual rhythm:

```css
--space-1:  4px;
--space-2:  8px;
--space-3: 12px;
--space-4: 16px;   /* Standard mobile edge padding */
--space-5: 20px;
--space-6: 24px;   /* Card internal padding */
--space-8: 32px;   /* Section separation */
--space-10: 40px;  /* Prompt vertical breathing room */
--space-12: 48px;  /* Minimum touch target height */
--space-14: 56px;  /* Quiz answer button height */
```

---

## 16. Screen Design Specifications

### 16.1 Home Screen (Safe Study Hub)
Home follows Tango's content hierarchy: **Study Book → Category → Lesson → StudyItem**. Study Books are the primary content; category shortcuts and the Mixed Test are secondary.

- **Top Bar:** Opaque theme canvas (`bg-page`) with a hairline `border-b border-subtle`, so it belongs to each theme instead of reading as a separate white panel; zero translucent frosted glass or blur. Contains only the `TANGO` wordmark and a tactile `rounded-full` `IconSettings` button (48px). No theme status or theme control: theme selection lives only in Settings (§16.5). Content Management is reached through Settings.
- **No visible greeting, no visible section labels:** Home renders no greeting line and no visible "Giáo trình" / "Học theo loại" headings. Semantic structure is kept with visually hidden headings (`sr-only` `h1` for the page and `h2` per section).
- **Progressive disclosure:** Home shows identity + progress + primary actions, not inventory statistics. Study Book = cover + title + Study Coverage. Vocabulary / Kanji = Japanese glyph + localized category name. Mixed Test = concise action label. Lesson/item counts are deferred to Book Study View, Learn by Type, and other detail screens. Avoid redundant icon + glyph + title combinations. No visible section labels or greeting. Theme controls remain Settings-only.
- **Composition order:** Study Books → Vocabulary / Kanji shortcuts → Mixed Test.
- **Study Books (primary, visually dominant):**
  - Neutral clay cards (`bg-surface`, `shadow-clay-card`) with a large 3:4 cover (`w-20` mobile, `w-24` tablet, `w-28` desktop), the book title, and one Study Coverage bar with its percentage. No lesson/item counts on Home.
  - Mobile: stacked horizontal cards. Tablet/desktop: a 2-column primary book grid inside `max-w-4xl` (never squeezed into a 3-4 column secondary grid).
  - Titles use `.font-study-title` (§6.3), wrap up to 3 lines (`line-clamp-3`), and expose the full title on hover via the native `title` attribute.
  - Fallback cover: theme-aware primary-tinted placeholder with a spine band and `IconBook` (no emojis).
  - Tapping opens the **Book Study View**. (Never triggers edit/delete).
- **Vocabulary / Kanji shortcuts (secondary):** A compact 2-column row of typography-led semantic clay tiles (`min-h-[72px]`) below the books. The Japanese category name is the visual identity (`語彙` / `漢字`, `font-japanese`, `lang="ja"`, `aria-hidden`, in `--category-*-icon`), with the localized name (`Từ vựng` / `Hán tự`) under it in `--category-*-text`. Surfaces keep `--category-vocabulary-*` (cool indigo / slate) and `--category-kanji-*` (warm amber / plum). No Tabler icon puck and no counts; the button's `aria-label` carries the localized name.
- **Mixed Test (concise CTA):** Solid `--cta-*` surface with `shadow-clay-button`, showing only the title `Kiểm tra tổng hợp` and one trailing `IconArrowRight` (no subtitle, no icon pucks). Same compact height as the category shortcuts. Full width under the shortcuts on mobile/tablet; the third column of the shortcut row on desktop (`lg:grid-cols-[3fr_2fr]`). It stays recognizable as an action but never outweighs the books.
- **Interaction:** All interactive cards and buttons follow the canonical clay recipe (§3.1): `.clay-interactive` for pointer-gated hover lift, `usePressFeedback` for explicit pressed depth, and the primary focus ring with 2px page offset. Arrow-key order: books, Vocabulary, Kanji, Mixed Test.
- **Zero-Book Empty State:** The same primary book area renders a compact recessed clay shelf (`bg-surface-elevated`, `shadow-clay-pressed`): icon puck, *"Chưa có giáo trình nào."*, the Settings → Content Management hint, and a tactile `[IconSettings] Cài đặt` button. Never a large floating card. Never places an "+ Add Book" button directly on Home.
- **Strict Study-Only Rule:** Zero Add, Import, Edit, or Delete controls appear on Home. Administrative and destructive actions reside strictly in **Settings → Quản lý nội dung (Content Management)** (see [`docs/CONTENT_LIBRARY_SPEC.md`](./CONTENT_LIBRARY_SPEC.md)).

### 16.2 Lesson List & Category Screens
- **Header:** Category / book title with `IconArrowLeft` back action (safe study navigation only; no administrative buttons).
- **Lesson Rows:** Clean, readable card list displaying lesson number, topic subtitle, item count, and accuracy badge.
- **Restraint Rule:** Individual list rows use flat surfaces with clean 1px dividers, preserving clay elevation for the primary "Bắt đầu học" button.

### 16.3 Quiz Screen Canvas
- **Top HUD:**
  - Exit `IconX` button.
  - Clean progress bar (indigo primary fill, smooth CSS width transition).
  - Minimalist progress text: `4 / 20`.
  - Streak flame: `[IconFlame] 4`.
- **Prompt Stage (Centered):**
  - Generous vertical whitespace.
  - Kanji / Expression: `36px–40px` bold, high-contrast text.
  - Subprompt (if kana reading or clue): `16px` muted text.
- **Answer Stage (Bottom Thumb Reach):**
  - 4 full-width stacked answer buttons (height `56px–64px`).
  - Colors: Positional Amber, Blue, Violet, Rose hues.
  - Text: `18px–20px` centered, bold/medium weight.
  - Strictly **NO** letters, numbers, or keyboard badges printed.

### 16.4 Explanation Sheet
- Slides smoothly from bottom on mobile; renders as a centered modal card on desktop.
- Displays:
  - Red indicator + correct answer in Japanese and Kana.
  - Vietnamese definition.
  - Hán Việt reading (if present; section hidden cleanly if absent).
- Dismiss CTA: Full-width button `[ Đã hiểu — Tiếp tục ]` (triggers on `Enter`/`Space`).

### 16.5 Settings Screen
- Full-screen route on mobile; centered modal card (`max-w-lg`) on tablet and desktop (see [`docs/SCREEN_SPEC.md`](./SCREEN_SPEC.md)).
- **Language Section:** Segmented clay toggle: `[ Tiếng Việt ]` | `[ English ]`.
- **Theme Section (Chủ đề màu sắc):**
  - Three visual preview cards, never a plain text toggle: `Sáng / Light`, `Tối / Dark`, `Sakura`.
  - The previews display the §9 palettes (Cool Pearl, Midnight Ink, Warm Blossom Paper).
  - Each card renders a miniature of its own theme using that theme's tokens: page background, a surface card, and the primary accent (e.g. a small accent bar or button), plus the localized theme name.
  - Selected state: primary focus-style ring and an `IconCheck` badge (never color alone); the option is a real radio choice (`role="radiogroup"` / `role="radio"`, `aria-checked`).
  - Selecting a card applies the theme immediately and persists it to `tango_v1_preferences.theme`.
  - Theme selection exists **only** in Settings. Home and other study screens show no theme status or theme control.
- **Sound Effects Section (Âm thanh hiệu ứng):**
  - Segmented toggle: `[ Off / On ]` (Tắt / Bật).
  - Default: **Off** (Tắt). Never plays audio until explicitly enabled.
  - Persisted in local storage (`tango_v1_preferences.soundEnabled`).
- **Nội dung học Section (Study Content):**
  - Row button linking to Content Management (`Quản lý giáo trình và bài học`).

### 16.6 Content Management & Danger Zone Design
- **Content Management Surface:** Structured, dense lists with restrained clay buttons (>= 48px touch targets).
- **Danger Zone (Vùng nguy hiểm):** Bordered with a muted semantic warning/error line.
- **Destructive Confirmation Dialog:**
  - High-emphasis modal with semi-opaque backdrop (`backdrop-blur-sm`).
  - Destructive action button: Semantic error red token (`--error`, `--error-surface`, `--error-border`).
  - Cancel button: Neutral surface, visually distinct, safe spacing from delete button, holds initial focus.
  - Never default-focus the destructive action; `Enter` does not execute deletion.
  - See [`docs/CONTENT_LIBRARY_SPEC.md`](./CONTENT_LIBRARY_SPEC.md) for UX dialog specifications.

---

## 17. Accessibility & Inclusivity Standards

1. **Contrast Ratio Compliance:**
   - All primary text against its surface meets **WCAG AA (minimum 4.5:1)**; large Japanese prompt text meets **WCAG AAA (minimum 7:1)**.
   - Text inside the 4 positional answer buttons is specifically chosen to exceed 5.5:1 contrast against its respective hue background in all three themes.
2. **Never Color Alone:**
   - Answer selection and correctness never rely solely on color shifts. Every state change includes structural rings, icon indicators (`IconCheck` / `IconX`), and text descriptions.
3. **Screen Reader Semantic Hierarchy:**
   - Screen readers announce the prompt as a level-1 heading.
   - Answer buttons are semantic `<button>` elements with accessible descriptions (e.g. `aria-label="Lựa chọn: 旅行"`).
4. **Motion Sensitivity:**
   - Respects `prefers-reduced-motion: reduce`. All clay translations and sliding bottom sheets transition instantly via simple opacity changes when reduced motion is requested.

---

## 18. Master CSS Design Token Implementation Matrix

Below is the concrete CSS token definition matrix to be implemented in `src/index.css`:

```css
/* Base Spacing & Sizing */
:root {
  --font-ui: "Be Vietnam Pro", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-japanese: "Noto Sans JP", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", sans-serif;

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-2xl: 26px;
  --radius-full: 9999px;
  
  --transition-fast: 150ms ease-out;
  --transition-normal: 220ms ease-out;
}

/* 1. LIGHT THEME (Default): Cool Pearl / Japanese Stationery */
[data-theme="light"], :root {
  --bg-page: #ECEFF3;
  --bg-surface: #FFFFFF;
  --bg-surface-elevated: #E1E5EC;
  --border-subtle: #D8DDE6;
  --border-strong: #B8C0CD;

  --text-primary: #1A2033;
  --text-secondary: #475065;
  --text-muted: #5A6479;

  --primary: #4F46E5;
  --primary-hover: #4338CA;
  --primary-surface: #E3E4FD;
  --primary-border-subtle: #C0C3F4;

  --success: #059669;
  --success-surface: #ECFDF5;
  --error: #DC2626;
  --error-surface: #FEF2F2;
  --error-border: #FCA5A5;
  --warning: #D97706;

  /* 4 Positional Answer Choices */
  --answer-1-bg: #FEF9C3; --answer-1-border: #FDE047; --answer-1-text: #713F12;
  --answer-2-bg: #E0F2FE; --answer-2-border: #7DD3FC; --answer-2-text: #075985;
  --answer-3-bg: #F3E8FF; --answer-3-border: #D8B4FE; --answer-3-text: #581C87;
  --answer-4-bg: #FFE4E6; --answer-4-border: #FDA4AF; --answer-4-text: #881337;

  /* Category Semantic Identities */
  --category-vocabulary-surface: #E2DDFC;
  --category-vocabulary-border: #C6BDF3;
  --category-vocabulary-icon: #5145E0;
  --category-vocabulary-text: #2D2677;

  --category-kanji-surface: #FCE2C6;
  --category-kanji-border: #EEC393;
  --category-kanji-icon: #AD4D08;
  --category-kanji-text: #6B2F0E;

  /* Primary Study CTA (solid clay action) */
  --cta-surface: #4A43D6;
  --cta-border: #3F38BD;
  --cta-text: #FFFFFF;
  --cta-text-secondary: #E0E7FF;
  --cta-puck-surface: rgba(255, 255, 255, 0.16);
  --cta-puck-border: rgba(255, 255, 255, 0.28);

  /* Clay Shadows (neutral cool pearl) */
  --shadow-clay-card: 0 4px 14px -1px rgba(30, 38, 64, 0.10), 0 2px 6px -1px rgba(30, 38, 64, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.95);
  --shadow-clay-card-hover: 0 8px 20px -2px rgba(30, 38, 64, 0.13), 0 3px 8px -1px rgba(30, 38, 64, 0.07), inset 0 1px 0 rgba(255, 255, 255, 1);
  --shadow-clay-button: 0 4px 12px rgba(74, 67, 214, 0.26), 0 1px 3px rgba(30, 38, 64, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.40);
  --shadow-clay-pressed: 0 1px 2px rgba(30, 38, 64, 0.10), inset 0 2px 4px rgba(30, 38, 64, 0.08);
}

/* 2. DARK THEME: Midnight Ink */
[data-theme="dark"] {
  --bg-page: #11151E;
  --bg-surface: #1C222F;
  --bg-surface-elevated: #262D3C;
  --border-subtle: #2D3444;
  --border-strong: #404A5F;

  --text-primary: #EEF1F7;
  --text-secondary: #ABB4C6;
  --text-muted: #8993A8;

  --primary: #8B8CF9;
  --primary-hover: #A9AAFB;
  --primary-surface: #2A2A58;
  --primary-border-subtle: #44438E;

  --success: #10B981;
  --success-surface: #064E3B;
  --error: #EF4444;
  --error-surface: #7F1D1D;
  --error-border: #B91C1C;
  --warning: #F59E0B;

  /* 4 Positional Answer Choices (Muted Rich Dark Hues) */
  --answer-1-bg: #2B2313; --answer-1-border: #785412; --answer-1-text: #FEF08A;
  --answer-2-bg: #102336; --answer-2-border: #1E4E75; --answer-2-text: #BAE6FD;
  --answer-3-bg: #241836; --answer-3-border: #552D80; --answer-3-text: #E9D5FF;
  --answer-4-bg: #33141F; --answer-4-border: #7A223B; --answer-4-text: #FECDD3;

  /* Category Semantic Identities */
  --category-vocabulary-surface: #2F2A5E;
  --category-vocabulary-border: #4A418F;
  --category-vocabulary-icon: #B8AEFF;
  --category-vocabulary-text: #ECE8FF;

  --category-kanji-surface: #3A2A1C;
  --category-kanji-border: #5F4530;
  --category-kanji-icon: #F6AE3D;
  --category-kanji-text: #FDEBCB;

  /* Primary Study CTA (solid clay action) */
  --cta-surface: #5A52EC;
  --cta-border: #7A73F3;
  --cta-text: #FFFFFF;
  --cta-text-secondary: #E6E8FF;
  --cta-puck-surface: rgba(255, 255, 255, 0.14);
  --cta-puck-border: rgba(255, 255, 255, 0.24);

  /* Clay Shadows (neutral night elevation) */
  --shadow-clay-card: 0 4px 16px rgba(0, 2, 10, 0.45), 0 1px 3px rgba(0, 2, 10, 0.30), inset 0 1px 0 rgba(255, 255, 255, 0.06);
  --shadow-clay-card-hover: 0 8px 24px rgba(0, 2, 10, 0.55), 0 2px 6px rgba(0, 2, 10, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.09);
  --shadow-clay-button: 0 4px 14px rgba(0, 2, 10, 0.50), 0 1px 3px rgba(90, 82, 236, 0.30), inset 0 1px 0 rgba(255, 255, 255, 0.16);
  --shadow-clay-pressed: 0 1px 2px rgba(0, 2, 10, 0.55), inset 0 2px 4px rgba(0, 2, 10, 0.40);
}

/* 3. SAKURA THEME: Warm Blossom Paper */
[data-theme="sakura"] {
  --bg-page: #F5E3E1;
  --bg-surface: #FFFAF8;
  --bg-surface-elevated: #F0D8D6;
  --border-subtle: #EACDCA;
  --border-strong: #D8AEAA;

  --text-primary: #34181F;
  --text-secondary: #66434C;
  --text-muted: #7C5861;

  --primary: #C2416A;
  --primary-hover: #A63458;
  --primary-surface: #FADFE7;
  --primary-border-subtle: #EBB3C4;

  --success: #059669;
  --success-surface: #ECFDF5;
  --error: #DC2626;
  --error-surface: #FEF2F2;
  --error-border: #FCA5A5;
  --warning: #D97706;

  /* 4 Positional Answer Choices (Blossom Garden Harmony) */
  --answer-1-bg: #FFF8E7; --answer-1-border: #F6D896; --answer-1-text: #5A3E1B;
  --answer-2-bg: #EDF4FA; --answer-2-border: #B5D4EE; --answer-2-text: #23496D;
  --answer-3-bg: #F5EEF8; --answer-3-border: #D2B4DE; --answer-3-text: #4A235A;
  --answer-4-bg: #FCEEF1; --answer-4-border: #EBB3C0; --answer-4-text: #641E2F;

  /* Category Semantic Identities */
  --category-vocabulary-surface: #E5E0F3;
  --category-vocabulary-border: #CBC3E5;
  --category-vocabulary-icon: #5A4FCF;
  --category-vocabulary-text: #2C2654;

  --category-kanji-surface: #F8D9C7;
  --category-kanji-border: #E9BBA0;
  --category-kanji-icon: #B04A28;
  --category-kanji-text: #5A2430;

  /* Primary Study CTA (solid clay action) */
  --cta-surface: #A8385C;
  --cta-border: #912E4F;
  --cta-text: #FFFFFF;
  --cta-text-secondary: #FDE7EE;
  --cta-puck-surface: rgba(255, 255, 255, 0.16);
  --cta-puck-border: rgba(255, 255, 255, 0.28);

  /* Clay Shadows (warm blossom lift) */
  --shadow-clay-card: 0 4px 14px rgba(150, 80, 95, 0.13), 0 1px 4px rgba(150, 80, 95, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.95);
  --shadow-clay-card-hover: 0 8px 22px rgba(150, 80, 95, 0.18), 0 2px 6px rgba(150, 80, 95, 0.09), inset 0 1px 0 rgba(255, 255, 255, 1);
  --shadow-clay-button: 0 4px 12px rgba(168, 56, 92, 0.26), 0 1px 3px rgba(150, 80, 95, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.40);
  --shadow-clay-pressed: 0 1px 2px rgba(150, 80, 95, 0.18), inset 0 2px 4px rgba(150, 80, 95, 0.12);
}
```

---

## 19. Final Design Checklist for Future UI Sessions

When implementing any screen or component in Tango, verify:
- [ ] Is it styled using semantic tokens rather than raw hex codes?
- [ ] Is Japanese text rendered in `Noto Sans JP` with generous font size and line height?
- [ ] Is Vietnamese/English text rendered in `Be Vietnam Pro` with diacritic clearance?
- [ ] Are all UI icons sourced exclusively from `Tabler Icons`?
- [ ] Are multiple-choice answer buttons completely free of `A/B/C/D`, `1/2/3/4`, or keyboard hint tags?
- [ ] Does the element look soft, tactile, and restrained—avoiding bloated cartoon 3D or generic, flat, template-like styling?
- [ ] Are mobile touch targets at least 48px high (and quiz answer buttons at least 56px)?
- [ ] Does the layout work seamlessly across Light, Dark, and Sakura themes?
- [ ] Is motion restrained (150–220ms) and compliant with `prefers-reduced-motion`?
