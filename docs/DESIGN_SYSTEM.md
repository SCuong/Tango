# Tango — Visual Design System

This document is the authoritative visual design system and UX specification for **Tango**. All future UI implementation, component authoring, styling, and asset creation must strictly adhere to the tokens, ergonomic rules, and aesthetic standards established here.

Before building or modifying user-facing components, contributors must consult:
1. `PROJECT_RULES.md`
2. `docs/DESIGN_SYSTEM.md` (this document), starting with the [Canonical Cross-Screen UI Baseline](#canonical-cross-screen-ui-baseline)
3. Relevant screen and product specifications (`docs/SCREEN_SPEC.md`, `docs/screens/*.md`, `docs/CONTENT_LIBRARY_SPEC.md`, `docs/PRODUCT_SPEC.md`, `docs/UI_UX.md`, `docs/IMPORT_SPEC.md`)

---

## Canonical Cross-Screen UI Baseline

> [!IMPORTANT]
> This section is the **locked, authoritative baseline** for every Tango screen. It summarizes the rules; the numbered sections below hold the details and tokens. Screen documents may **specialize** these rules for their purpose but must **never redefine** Tango's visual or interaction language. When anything else conflicts with this section, this section wins.

**Home is a reference implementation of this design language, not a layout template.** Future screens must not copy Home's composition by default. Dense lists, content management, import tables, and quiz screens adapt the same language (tokens, clay hierarchy, interaction contract, typography, ambience rules) to their own purpose: for example, flat rows with 1px dividers for dense lists, and a narrow focused canvas for quizzes.

### B1. Visual Identity
- **Brand: the Tango cat wordmark is canonical.** The owner-supplied cat + `TANGO` artwork (`src/assets/brand/tango-wordmark.webp`, its white background removed so no rectangle shows on any theme) is Tango's primary brand in **every** theme (Light, Dark, Sakura, and Meo's World). Never redraw, recolor, crop, or re-proportion it (cat, typography, colors, face, tail, paws) and never tile it as wallpaper. Its main use is the TopBar brand button that returns Home (≈40px tall on mobile, ≈44px from `sm`, natural aspect ratio, decorative `alt=""` because the button carries the accessible name). The wordmark is wide, so favicon and PWA icons are not derived from it.
- Mature **Soft Claymorphism** (§3): matte, tactile, restrained; never cartoon 3D, glossy plastic, or blurry neumorphism.
- **Calm does not mean colorless** (§8.1): every theme has its own atmosphere, visible from canvas, surfaces, borders, and elevation, not only from accents.
- **Japanese personality without generic SaaS appearance** (§2): no dashboards of fake stats, no admin-template look.
- **Content always outranks decoration:** study content (book covers, titles, Japanese prompts) is always the strongest element on screen.
- **Never:** glassmorphism as a surface style, neon or glow, random decorative blobs, emoji as UI icons, or cards nested inside cards.

### B2. Theme Ambience (§8.2)
- **Light — Cool Pearl / Japanese daytime:** shoji window and washi paper feeling, one restrained geometric Japanese motif (seigaiha), cool pearl/indigo accents.
- **Dark — Midnight Ink / Japanese night:** moonlight, a warmly lit shoji window or paper lantern, a few warm firefly points; never cyberpunk.
- **Sakura — Warm Blossom Paper:** a restrained blossom branch, a few petals, soft kasumi/washi feeling in rose/plum.
- **Meo's World (special easter-egg theme):** the one deliberate exception to restraint. The brand mascot takes over the environment with a full cat background (§9.4), while content surfaces stay readable islands.
- Ambience is **decorative only**: behind all content, `aria-hidden`, `pointer-events: none`, low contrast, and never competing with content.
- **Deterministic:** fixed positions, never re-randomized per render; objects are never flipped or turned upside-down.
- **Motion:** only a few very slow translate/fade motions where appropriate; `prefers-reduced-motion` makes the layer fully static.
- **Feather, don't chop:** decorative motifs cut by an edge fade out toward that edge (alpha mask) instead of ending in a hard line.

### B3. Color-Role Hierarchy (§8.1, §9)
- **Canvas = atmosphere. Category surfaces = identity. CTA = action emphasis.**
- These three roles must never collapse into the same hue family: keep canvas and neutral cards low-saturation, give each category its own clearly different hue, and reserve the most saturated color on screen for the primary action.
- Components use semantic tokens only; never raw hex values.

### B4. Content Hierarchy & Progressive Disclosure
- Browsing screens show only the information needed to choose the next action (identity + progress + primary actions).
- Detailed inventory and statistics (lesson/item counts, accuracy breakdowns) belong on detail screens.
- Real content (e.g. Study Books with their covers) visually outranks shortcuts and generic actions.

### B5. Clay Hierarchy (§3, §3.1, §13)
| Level | Used for | Treatment |
|---|---|---|
| **Content cards** | Study Books, lesson cards, results cards | Soft clay elevation (`--shadow-clay-card`), neutral or semantic surface |
| **Secondary controls** | Category shortcuts, icon buttons, segmented controls, secondary buttons | Restrained clay; press = 1px sink with compressed shadow (`CLAY_PRESSED_CLASSES`) |
| **Primary CTA** | The main action of a screen (`Bắt đầu kiểm tra`, `Kiểm tra giáo trình`, `Đã hiểu — Tiếp tục`) | Visibly raised physical button: `--cta-*` surface plus a solid depth lip (`--cta-depth`, `.cta-raised`) |
| **Flat** | Dense lists, dictionary rows, settings lists, import tables, form inputs | Flat surface with 1px dividers; no clay stacking. Interactive flat rows use `.flat-interactive`: pressed = background tint from `usePressFeedback`, hover tint only on fine pointers |
| **Destructive** | Danger Zone actions, confirm-delete buttons | Restrained `--error-surface` / `--error-border` / `--error-text`; never the raised primary treatment |

- The pressed state must look like the control **physically compressing** (moving down onto its lip or base), not merely gaining or losing a shadow.
- Quiz answer choices keep their own positional treatment (§10–§12); they are not primary CTAs.

### B6. Interaction Contract (§3.1)
- Press state comes from `usePressFeedback`, **never** CSS `:active`.
- Hover effects only under `@media (hover: hover) and (pointer: fine)`; never Tailwind `hover:*` / `group-hover:*` for clay elevation.
- Drag-out, pointer cancel, blur, and releases outside the control reset the press cleanly and **never** navigate or act.
- A primary raised navigation CTA may guarantee ~100ms of visible press feedback before navigating (`MIN_PRESS_FEEDBACK_MS`). Longer presses act immediately on release; keyboard `Enter` acts immediately. No perceptible artificial lag.
- Every interactive element has a `focus-visible` primary ring with a 2px page-colored offset; focus never relies on shadow alone.
- Minimum touch target **48px** (quiz answers 56px).
- `prefers-reduced-motion`: transitions become instant and ambience is static; state changes (pressed depth, selection) stay visible.

### B7. Typography (§6)
- **Be Vietnam Pro** for Vietnamese/English UI; the **Noto Sans JP** stack for Japanese content.
- `.font-study-title` for mixed-script user titles (Latin/Vietnamese from the UI font, Kana/Kanji from the Japanese stack).
- Vietnamese diacritics must never clip (line-height ≥ 1.4 for body text; no tight clipping containers).
- Japanese must never wrap into awkward vertical columns on narrow viewports: reduce size/tracking or change layout instead (`whitespace-nowrap` for short Japanese labels).

### B8. Mobile (First-Class Target, §4.1)
- Design mobile first; explicitly validate at **~360px and ~390px**.
- Zero horizontal scrolling.
- Do not simply shrink the desktop layout; compose for the small screen.
- Paired cards (e.g. two category tiles) stay equal in size and visually balanced.
- Reduce typography and spacing before allowing broken wrapping; use a deliberate responsive fallback only when a layout genuinely cannot fit.
- High-frequency actions respect the thumb zone; bottom action bars respect safe-area insets.

### B9. Desktop / Laptop (§4.2)
- Centered, constrained canvases (`max-w-4xl` for browsing; `max-w-xl`–`max-w-2xl` for quiz and focused study).
- Use extra width intentionally (e.g. 2-column book grids, shortcut rows); never stretch mobile cards edge to edge.
- Browsing layouts may use 2–3 columns where it is meaningful; quiz and study focus screens stay narrow.

### B10. Illustrations & Japanese Motifs
- An illustration must improve recognition or identity (e.g. the Vocabulary `あ` / Kanji `字` study-card illustrations).
- Decorative assets are `aria-hidden` (and `focusable="false"` for SVG).
- One coherent cultural motif is better than a collage of Japanese clichés.
- A Study Book cover already provides identity; do not add redundant decoration to book cards.

### B11. TopBar & Primary Navigation
- Restrained. Home reference: the Tango cat wordmark only on mobile; from `sm` up the same bar carries the compact primary navigation (Home / Test / Settings).
- **Mobile primary navigation is a root-only floating bottom bar** (Home / Test / Settings); see §16.0 for the canonical rules.
- No theme switch or theme status on Home or other study screens; **theme selection exists only in Settings** (§16.5).
- A hard divider is not mandatory. Where scrolling content meets or slides beneath a persistent surface, a soft page-colored feather may replace a hard cut.

### B12. Documentation Map
| Document | Responsibility |
|---|---|
| `docs/DESIGN_SYSTEM.md` (this file) | **Source of truth** for cross-screen visual and interaction rules, tokens, and palettes |
| `docs/SCREEN_SPEC.md` | Screen inventory, routes, breakpoints, global platform/responsive invariants, reusable component roles |
| `docs/screens/*.md` | Screen-specific composition, states, and wireframes (specializations only) |
| `docs/CONTENT_LIBRARY_SPEC.md` | Product/content-management semantics (books, lessons, study-only Home, deletion, ordering) |
| `docs/UI_UX.md` | Narrative UX flows and overview wireframes; defers to this file for visual rules |

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
- **No exaggerated neon gradients or glowing borders:** No rainbow halos, iridescent chromatic aberrations, or radioactive accent buttons. Gradients are never used as visible color fills; they appear only as alpha masks or page-colored feathers that soften a cut edge (see B2 / B11).
- **No floating gradient blobs or decorative geometric shapes:** Every element on screen must serve a clear study or navigation function. The only exception is the restrained, fixed ambience layer defined in §8.2.
- **No glassmorphism:** Surfaces, cards, and bars are opaque. Blurry frosted-glass panels over content are prohibited. A modal or bottom sheet may dim (and lightly blur) the page *behind* it, but the dialog panel itself stays opaque.
- **No nested cards inside cards inside cards:** Flat, intentional grouping with clean negative space.
- **No random emoji as primary UI icons:** Emojis are reserved exclusively for natural Japanese/Vietnamese study content. System navigation and status indicators use Tabler stroke iconography only (e.g. streak indicator `[IconFlame] 4`).
- **No excessive pill badges:** Do not turn every word or metadata label into a colored rounded badge.
- **No uniform 24px border-radius everywhere:** Shape language must be nuanced and scaled according to element size and hierarchy.
- **No giant empty whitespace:** Layouts must feel comfortable, information-dense where appropriate (word lists, preview tables), and focused during quizzes.
- **No bouncing, springing, or distracting animations:** UI motion must be restrained (70–220ms), purposeful, and easily disabled via `prefers-reduced-motion`. The only slow motion allowed is the ambient background layer (§8.2).

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
- Primary action buttons (CTA, Start Quiz, Next Question) — as **raised** primary CTAs with a solid depth lip (see B5, §3.1)
- Multiple-choice answer buttons
- Theme preview cards (Settings only)
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
  - The press starts on pointer down (primary mouse button, touch, or pen) or `Space`. A release on the control (pointer up / `Space` up) completes it. Pointer cancel, pointer leave, pointer moving outside the control bounds, blur, and any pointer/key release outside the control cancel it; a cancelled press never triggers the action.
  - Pointer capture is not used, so native click cancellation on drag-out is unchanged.
  - While pressed, the control swaps its resting shadow for `CLAY_PRESSED_CLASSES` (`translate-y-px shadow-clay-pressed`) and exposes `data-pressed="true"`.
- **Raised primary CTA (e.g. `Bắt đầu kiểm tra`, `Kiểm tra giáo trình`):**
  - At rest it is clearly raised: a solid depth lip `0 5px 0 0 var(--cta-depth)` under the button plus `--shadow-clay-button` (`.cta-raised`).
  - Pressed (`data-pressed="true"`): it sinks onto the lip (`translateY(4px)`, lip reduced to 1px, `--shadow-clay-pressed`), with a 70ms transition. Hover on fine pointers lifts it 1px with a 6px lip.
  - Minimum visible press: the control uses `usePressFeedback({ minPressMs: MIN_PRESS_FEEDBACK_MS })` (100ms). A quick tap stays pressed until 100ms after pointer down, and the action runs through `runAfterPress`, so navigation happens at that same moment. A press that already lasted 100ms navigates immediately on release. Keyboard `Enter` (no press) acts immediately. Drag-out, pointer cancel, blur, and releases outside the control still cancel the press and never navigate.
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
- **Viewport Bounds:** Strict `100vw` layout with zero horizontal scrolling (`overflow-x: hidden`). Validate every screen at ~360px and ~390px.
- **Safe Area Insets:** All bottom-docked action bars respect device safe areas (`env(safe-area-inset-bottom)`).

### 4.2 Desktop Ergonomics
- **Constrained Study Canvas:** On wide desktop screens, the active quiz interface is centered with a constrained max-width (`max-w-xl` / ~600px). This eliminates broad eye-scanning fatigue and preserves the focused rhythm of mobile drills.
- **Balanced Browsing Layouts:** Browsing screens (Home, lesson lists, import interfaces) use extra width intentionally with 2-column or 3-column grids where it is meaningful (`max-w-4xl` to `max-w-6xl`); never stretch mobile cards edge to edge.
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
- **Meo's World catified icon language (only under `data-theme="meo"`, §9.4):** the same Tabler glyphs, so every icon keeps its function (a house is still Home, an arrow is still Back, a plus is still Add, a trash can is still Delete), drawn chunkier (stroke ≈2.4, nav icons ≈2.8–3.1) with round caps and joins in warm tones. Shared icon pucks (`.tango-icon-puck`: bottom-nav pucks, round icon buttons, list/row icon pucks, carousel arrows) grow small cat ears that inherit the puck's own surface; the active bottom-nav puck carries a paw; the category study-card illustrations wear cat ears and a paw while the Japanese glyph itself is never altered. It is implemented once in shared primitives and CSS, never as per-screen decorations. Light, Dark, and Sakura keep the standard icon language.

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
4. **No Awkward Japanese Wrapping:** Short Japanese labels (e.g. `語彙`, `漢字`) never wrap into vertical columns on narrow screens; use `whitespace-nowrap` and reduce size/tracking or change the layout instead.
5. **Mixed-Script Study Titles:** User-provided study-content titles (e.g. Study Book titles such as `中級へ行こう 日本語の文型と表現55`) use `.font-study-title` (`"Be Vietnam Pro", var(--font-japanese)`): Latin and Vietnamese glyphs come from the UI font, Kana/Kanji from the Japanese stack. This prevents the browser from falling back to an arbitrary system CJK font that could render Chinese glyph forms under the Vietnamese document language.

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

Tango features three distinct, meticulously tuned **standard** appearance themes, plus one special easter-egg theme (4, below):
1. **Light (Sáng) — Cool Pearl / Japanese Stationery:** A cool neutral pearl (blue-gray) canvas with porcelain-white cards and pearl-gray raised surfaces. Lavender Vocabulary, peach Kanji, and a strong indigo action color each keep their own hue. Bright and comfortable for long daytime sessions.
2. **Dark (Tối) — Midnight Ink:** A deep, low-saturation charcoal-navy canvas with lifted neutral navy cards. Violet-indigo Vocabulary, amber-brown Kanji, and a vivid indigo action color stand apart from the neutral surfaces. Never generic black, never an "everything blue" screen.
3. **Sakura (Sakura) — Warm Blossom Paper:** A warm blush Japanese-paper canvas with warm porcelain cards, blossom-tinted raised surfaces, and a rose-plum accent. It reads as "Sakura" without any flower decoration.
4. **Mèo mập 😺 / Meo's World (`meo`) — special theme:** Tango the cat takes over the app: a honey-orange cat-world canvas with a full cat background, milk-white/cream content islands, warm tabby-brown text, and a rich orange CTA on a dark brown depth lip (§9.4). It is revealed from the Settings theme carousel and is never one of the three initially visible cards.

### 8.1 Calm Does Not Mean Colorless
Tango stays mature and restrained, but it never falls back to near-white or near-black palettes that make every theme feel generic.

- **Recognizable at first glance:** Each theme must have its own atmosphere even if category cards and CTA buttons are ignored.
- **Identity lives in the material, not only the accents:** Theme identity must be visible from the page canvas, surfaces, borders, and elevation. Cards must separate from the canvas by color before any shadow is considered.
- **Separate the three color roles:** Canvas creates atmosphere; category surfaces create identity; CTA creates action emphasis. These three roles must not collapse into the same hue family. In practice: keep the canvas and neutral card surfaces low-saturation, give each category surface its own clearly different hue, and reserve the most saturated color on screen for the CTA. Sakura is the reference: blush canvas, lavender/peach categories, plum-rose action.
- **Personality comes only from:** palette, material contrast, typography, the existing study illustrations, and hierarchy.
- **Never:** gradient color fills, decorative blobs, neon, glow, glassmorphism, or wallpaper illustrations (alpha-mask feathers on cut edges are allowed, §8.2). Meo's World (§9.4) is the single deliberate exception for its cat environment; it still keeps content surfaces opaque and readable. Sakura petals and Japanese motifs (shoji, seigaiha, moon, lantern, mist, branch) are allowed **only** inside the restrained ambience layer of §8.2.
- **Restraint:** Shadows stay soft and are tinted to each theme's material; never make them heavier to fake personality.
- **Settings previews:** The palettes in §9 are exactly what the Settings theme preview cards display (§16.5).

### 8.2 Restrained Japanese Ambience (Explicit Exception)
Each theme shows a quiet but recognizably Japanese scene behind all content. This is the **only** exception to the "no decorative shapes / no petals / no Japanese patterns" rules in §2 and §8.1, and it applies only to this fixed background layer (`ThemeAmbience`).

**Where ambience appears:** Home at full strength; the study browsing screens (Book Study View, Category Inside Book, Learn by Type) and the test configuration screens use a quieter variant (`.tango-ambience-subtle`, half opacity) because their headings sit directly on the canvas. It is intentionally **absent** from focused or administrative screens: Lesson Detail, the dense Lesson Items list, the quiz runner and results, Settings, Content Management, the importer, and dialogs. Quiz screens keep attention on the prompt and answers; management screens prioritize clarity and safety. Use a few intentional motifs per theme, never a collage of clichés.

- **Light — Japanese daytime:** daylight through a washi shoji window (kumiko lattice), a quarter fan of seigaiha waves in cool pearl-indigo, and one soft mist band.
- **Dark — Japanese night:** a dim moon, a warmly lit shoji window, one paper lantern, four warm firefly points, and a few 3px stars. Warm and quiet, never neon or cyberpunk.
- **Sakura — warm blossom paper:** one blossom branch, soft kasumi cloud bands, and a few slowly falling petals in rose/plum.

Rules:
- **Behind everything:** a `position: fixed`, `pointer-events: none`, `aria-hidden` layer rendered before the TopBar and main content. Cards and controls are opaque, so the scene only shows in the gaps, margins, and empty space. Book cards always remain the primary content.
- **Low contrast:** colors come from the per-theme `--ambience-line`, `--ambience-glow`, and `--ambience-accent` tokens (§9) plus `--bg-page` (to occlude seigaiha rings), at low opacity. The scene must never reduce text readability or compete with book covers.
- **Lightweight:** inline CSS/SVG shapes and one SVG `<pattern>` only; no raster images, no gradients, no loud blobs, no neon, glow, or cyberpunk look.
- **Deterministic:** every element has a fixed position in CSS; nothing is randomized per render.
- **Motion:** only a few very slow elements per theme (Light: 1 mist band drifting 28px over 56s; Dark: 4 fireflies floating 10–14px and fading over 16–24s; Sakura: 5 petals falling over 64–88s). Motion is translate or fade only; petals keep one fixed tilt and are never flipped, spun, or turned upside-down.
- **Reduced motion:** under `prefers-reduced-motion: reduce` every ambience animation is removed (`animation: none`) and the scene is fully static.
- **Theme scoping:** all four scenes (Light, Dark, Sakura, Meo's World) are in the DOM; CSS shows only the one matching the active `data-theme`.
- **Meo's World exception:** its cat environment follows §9.4 instead of the restraint above (large cats, stronger presence). On the screens listed above as ambience-free it still appears as a quiet, static edge layer (`MeoEdgeAmbience`), and on the Active Quiz only at laptop/desktop widths in the outer margins.
- **Feathered cut edges:** any motif that is cut by the viewport edge fades out toward that edge with a `mask-image` gradient (linear toward the cut side, or radial from the motif's visible corner) instead of ending in a hard line. Masks only change alpha; content and cards are never blurred.

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
  --success-text: ...;        /* readable text on --success-surface */
  --error-text: ...;          /* readable text on --error-surface (destructive buttons, errors) */
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

  /* Primary Study CTA (solid clay action, e.g. "Bắt đầu kiểm tra") */
  --cta-surface: ...;
  --cta-border: ...;
  --cta-text: ...;
  --cta-text-secondary: ...;
  --cta-puck-surface: ...;
  --cta-puck-border: ...;
  --cta-depth: ...;          /* solid depth lip under raised primary CTAs */

  /* Restrained Japanese ambience (§8.2), always at very low opacity */
  --ambience-line: ...;
  --ambience-glow: ...;
  --ambience-accent: ...;

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
A cool neutral pearl (blue-gray) canvas that separates porcelain-white cards before shadows are considered, with pearl-gray raised surfaces and navy-ink typography. Vocabulary is a clearly lavender-violet surface, Kanji a warm apricot-peach surface, and the primary CTA a strong indigo action. Canvas, Vocabulary, and CTA never share the same blue-purple family.

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
| `--cta-depth` | `#332CA6` | Depth lip under the raised indigo CTA |
| `--cta-text` | `#FFFFFF` | CTA title |
| `--cta-text-secondary` | `#E0E7FF` | CTA secondary text |
| `--cta-puck-surface` | `rgba(255, 255, 255, 0.16)` | Matte puck on CTA |
| `--cta-puck-border` | `rgba(255, 255, 255, 0.28)` | CTA puck rim highlight |
| `--ambience-line` | `#1A2033` | Ambience kumiko lattice lines, used at ≤7% opacity |
| `--ambience-glow` | `#FFFFFF` | Ambience washi shoji paper, used at ≤50% opacity on the pearl canvas |
| `--ambience-accent` | `#8FA3C8` | Ambience seigaiha fan (≤42%) and mist band (≤20%) |
| `--shadow-clay-card` | `0 4px 14px -1px rgba(30, 38, 64, 0.10), 0 2px 6px -1px rgba(30, 38, 64, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.95)` | Neutral cool clay lift |
| `--shadow-clay-card-hover` | `0 8px 20px -2px rgba(30, 38, 64, 0.13), 0 3px 8px -1px rgba(30, 38, 64, 0.07), inset 0 1px 0 rgba(255, 255, 255, 1)` | Tactile hover lift |
| `--shadow-clay-button` | `0 4px 12px rgba(74, 67, 214, 0.26), 0 1px 3px rgba(30, 38, 64, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.40)` | Indigo CTA depth |
| `--shadow-clay-pressed` | `0 1px 2px rgba(30, 38, 64, 0.10), inset 0 2px 4px rgba(30, 38, 64, 0.08)` | Tactile pressed state |

### 9.2 Dark Theme (Tối) — Midnight Ink
A deep, low-saturation charcoal-navy canvas with lifted neutral navy cards and soft off-white text. Vocabulary is a violet-indigo clay, Kanji a warm amber-brown clay, and the primary CTA a vivid indigo action, so layers differ by identity and not only by brightness. Never neutral black and never monochrome navy.

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
| `--cta-depth` | `#3A34B4` | Depth lip under the raised indigo CTA |
| `--cta-text` | `#FFFFFF` | CTA title |
| `--cta-text-secondary` | `#E6E8FF` | CTA secondary text |
| `--cta-puck-surface` | `rgba(255, 255, 255, 0.14)` | Matte puck on CTA |
| `--cta-puck-border` | `rgba(255, 255, 255, 0.24)` | CTA puck rim highlight |
| `--ambience-line` | `#C9D2E6` | Ambience moonlit lines (lantern cap/cord), used at ≤28% opacity |
| `--ambience-glow` | `#F3E7C4` | Ambience moonlight and stars, used at ≤10% (moon) / ≤35% (3px stars) |
| `--ambience-accent` | `#F6AE3D` | Ambience lantern and lit shoji window (≤36%) and 5px fireflies (≤55%) |
| `--shadow-clay-card` | `0 4px 16px rgba(0, 2, 10, 0.45), 0 1px 3px rgba(0, 2, 10, 0.30), inset 0 1px 0 rgba(255, 255, 255, 0.06)` | Neutral night elevation |
| `--shadow-clay-card-hover` | `0 8px 24px rgba(0, 2, 10, 0.55), 0 2px 6px rgba(0, 2, 10, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.09)` | Night hover lift |
| `--shadow-clay-button` | `0 4px 14px rgba(0, 2, 10, 0.50), 0 1px 3px rgba(90, 82, 236, 0.30), inset 0 1px 0 rgba(255, 255, 255, 0.16)` | Vivid indigo CTA depth |
| `--shadow-clay-pressed` | `0 1px 2px rgba(0, 2, 10, 0.55), inset 0 2px 4px rgba(0, 2, 10, 0.40)` | Night pressed state |

### 9.3 Sakura Theme (Sakura) — Warm Blossom Paper
A warm blush Japanese-paper canvas with warm porcelain cards, blossom-tinted raised surfaces, deep plum-ink text, and a rose-plum primary. Vocabulary stays a compatible wisteria lavender; Kanji stays warm peach/plum. It is the reference for role separation: blush atmosphere, lavender/peach identity, plum-rose action. **No petals or patterns on surfaces (they live only in the §8.2 ambience layer), no neon, no candy pink.**

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
| `--cta-depth` | `#7D2743` | Depth lip under the raised plum-rose CTA |
| `--cta-text` | `#FFFFFF` | CTA title |
| `--cta-text-secondary` | `#FDE7EE` | CTA secondary text |
| `--cta-puck-surface` | `rgba(255, 255, 255, 0.16)` | Matte puck on CTA |
| `--cta-puck-border` | `rgba(255, 255, 255, 0.28)` | CTA puck rim highlight |
| `--ambience-line` | `#7C5861` | Ambience plum branch, used at ≤16% opacity |
| `--ambience-glow` | `#FFFAF8` | Ambience paper glow |
| `--ambience-accent` | `#E595AC` | Ambience blossoms (≤40%), kasumi clouds (≤20%), and petals (≤50%) |
| `--shadow-clay-card` | `0 4px 14px rgba(150, 80, 95, 0.13), 0 1px 4px rgba(150, 80, 95, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.95)` | Warm blossom lift |
| `--shadow-clay-card-hover` | `0 8px 22px rgba(150, 80, 95, 0.18), 0 2px 6px rgba(150, 80, 95, 0.09), inset 0 1px 0 rgba(255, 255, 255, 1)` | Warm blossom hover lift |
| `--shadow-clay-button` | `0 4px 12px rgba(168, 56, 92, 0.26), 0 1px 3px rgba(150, 80, 95, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.40)` | Plum-rose CTA depth |
| `--shadow-clay-pressed` | `0 1px 2px rgba(150, 80, 95, 0.18), inset 0 2px 4px rgba(150, 80, 95, 0.12)` | Warm blossom pressed state |

### 9.4 Mèo mập 😺 / Meo's World — Special Easter-Egg Theme
Internal id `meo` (`data-theme="meo"`). Not a standard theme: Settings reveals it with the theme-carousel arrow (§16.5). **Brand vs. theme:** the cat wordmark is the brand of every theme (B1); Meo's World is the theme where that brand personality expands into the whole environment. It is not "Sakura in orange": it is a cat universe derived from the wordmark.

**Visual contract**
- **Palette:** warm orange fur, cream, milk-white, warm brown outline, honey/peach accents, darker tabby stripes. Not every surface is orange.
- **Role separation still holds:** canvas = honey cat-world atmosphere; content surfaces = opaque milk-white/cream islands; categories = recognizable identity (Vocabulary stays cool lilac, Kanji becomes honey tabby); CTA = the strongest, rich orange with a dark brown physical lip.
- **Full cat background:** layered, different-scale motifs derived from the mascot (chunky outlines, tabby stripes, cream muzzle and paws, blush cheeks): a chubby cat loaf, a peeking cat with paws over an edge, the striped curled tail with its cream tip, a paw-print trail, a fish, a yarn ball, and large soft fur/cream shapes. Never a repeated tile and never the wordmark as wallpaper. Composed per breakpoint: on phones the cats peek from the margins around the vertical scroll; from `lg` the wider canvas holds larger cats in the outer sides and corners while content stays centered.
- **Readable-island rule:** the cats show at page edges and in open canvas only. Cards, study prompts, quiz answers, Settings controls, and management content stay opaque islands; nothing reduces text contrast. Focused flows (Settings, management, import, results) keep only the quiet static edge cats; the Active Quiz shows none on phones and only static margin cats on laptop/desktop; prompt, answers, progress, and feedback always dominate.
- **Components:** the existing hierarchy (soft clay content cards, raised primary CTA, restrained secondary controls) becomes rounder (`rounded-xl` → 16px, `rounded-2xl` → 22px), warmer, and slightly chunkier; the raised CTA lip is 6px and presses 5px. Pressing stays physical compression.
- **Icons:** the catified icon language in §5.
- **Bottom navigation:** same three destinations, press model, and root transition (§16.0), with a warm cream bar outlined in brown on a brown depth lip, two cat ears on its top edge, cat-eared icon pucks, and a paw on the active puck. The full tab cell still never flashes on press.
- **Motion:** only the tail sways (9s) and the fish floats (14s), both very slowly, decorative, `pointer-events: none`, never on the Active Quiz or in the quiet edge layer. `prefers-reduced-motion: reduce` makes every cat static.
- **Lightweight:** inline SVG/CSS only (no raster backgrounds, no blur/filter stacks, no canvas/WebGL) for lower-end Android.

| Token | Value | Visual Role |
|---|---|---|
| `--bg-page` | `#F8D9AE` | Honey-orange cat-world canvas |
| `--bg-surface` | `#FFF9F0` | Milk-white content islands |
| `--bg-surface-elevated` | `#F7E4C8` | Cream raised/recessed panels and progress tracks |
| `--border-subtle` / `--border-strong` | `#EBCB9E` / `#CF9E68` | Honey hairline / caramel boundary |
| `--text-primary` / `--text-secondary` / `--text-muted` | `#3A1C0C` / `#653A20` / `#7A4A2A` | Tabby-brown text (muted is AA on canvas and surfaces) |
| `--primary` / `--primary-hover` | `#B4480B` / `#963B08` | Burnt-orange accent (AA on surfaces) |
| `--primary-surface` / `--primary-border-subtle` | `#FFE3C2` / `#F2B97C` | Peach selection wash / boundary |
| `--category-vocabulary-*` | `#E7E1F6` · `#C9BFEA` · `#5445C2` · `#2B2456` | Cool lilac Vocabulary identity |
| `--category-kanji-*` | `#FFD9A6` · `#EDB066` · `#A3450A` · `#552407` | Honey tabby Kanji identity |
| `--cta-surface` / `--cta-border` / `--cta-depth` | `#C2560E` / `#A5470B` / `#6E2E0B` | Rich orange CTA (≈4.5:1 white text) on a dark brown lip |
| `--ambience-line` / `--ambience-glow` / `--ambience-accent` | `#5E270E` / `#FFF6E6` / `#EE8A3A` | Cat-world lines, cream glow, orange accent |
| `--meo-fur` / `--meo-stripe` / `--meo-cream` / `--meo-outline` / `--meo-blush` | `#F6BA6A` / `#EE7F2F` / `#FDEED6` / `#5E270E` / `#F2A39A` | Mascot palette sampled from the wordmark |
| `--shadow-clay-*` | warm tabby-brown tints (see `src/index.css`) | Warm lift and pressed states |

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
| **Raised CTA (rest / pressed)** | Clearly raised on a solid depth lip; pressed = sinks onto the lip | `.cta-raised`: `0 5px 0 0 var(--cta-depth)` + `--shadow-clay-button`; pressed `translateY(4px)`, 1px lip, 70ms, visible ≥ 100ms before navigation |
| **Focus-Visible** | High-contrast focus ring (2px solid primary, 2px offset) | `outline: 2px solid var(--primary); outline-offset: 2px` |
| **Disabled** | Opacity 50%, flat shadow, cursor not-allowed | `opacity: 0.5; filter: grayscale(20%)` |

### Motion Timing Standards
- Press feedback on raised CTAs: **70ms** `ease-out`.
- Short micro-transitions: **150ms–200ms** with `ease-out`.
- Modal / Bottom Sheet transitions: **250ms–300ms** with `cubic-bezier(0.16, 1, 0.3, 1)`.
- Ambient background motion (§8.2) is the only slow motion (tens of seconds, translate/fade only).
- Always respect `@media (prefers-reduced-motion: reduce)`: transitions become instant, sheets and dialogs appear without sliding, and the ambience layer is fully static. State changes (pressed depth, selection) remain visible.

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

### 16.0 Primary Navigation (Home / Test / Settings)
Tango has exactly three root destinations: **Trang chủ / Home** (`/`), **Kiểm tra / Test** (`/quiz/mixed-config`, the Global Mixed Test builder), and **Cài đặt / Settings** (`/settings`). They are existing canonical routes; primary navigation never adds routes.

- **Mobile (< 640px): floating clay bottom bar** (`MobileBottomNav`), mounted once at the app level and shown **only on the three root destinations**.
  - Inset 12px from the screen edges, lifted 10px above `env(safe-area-inset-bottom)`, max width 480px, 72px tall, `bg-surface`, `--border-subtle`, `--shadow-clay-card`, 26px radius. Three equal-width destinations, each a ≥ 48px touch target.
  - Icons are bolder than regular line icons (Tabler stroke 2.4 inactive, 2.7 active): `IconHome`, `IconCards`, `IconSettings`.
  - Active destination: the icon sits on a small raised `--primary-surface` puck, the label turns `--primary` and bold, and the tab carries `aria-current="page"` (never color alone). Inactive: `--text-secondary` icon and semibold label. No filled navigation slab, no underline.
  - Press model: `usePressFeedback` (explicit `data-pressed`, drag-out cancels, never CSS `:active`); reduced motion keeps the state change without animating.
  - **Pressed state uses stable icon-puck geometry.** Only the small icon puck reacts: it moves down 2px and swaps to the shallower `--shadow-clay-pressed` (an inactive tab's puck shows as a recessed `--bg-surface-elevated` puck of the same size). The full tab cell never gains a pressed background, and the platform tap highlight is suppressed, so rest → pressed → active keeps one shape instead of a full-cell slab collapsing into a puck. Labels do not react to the press.
  - Tapping the current destination does nothing (no navigation, no history entry, no transition).
  - Root screens reserve the bar's height (`--tango-bottom-nav-space`) so content and mobile sticky action bars (e.g. the Test `Bắt đầu kiểm tra` bar) always sit above it.
  - **Hidden on every deeper or focused flow:** Book Study View, Category, Learn by Type, Lesson Detail/Items, Category/Book test setup, the **Active Quiz** (never shows global navigation), Review, Results, Content Management, Add/Manage/Import, and dialogs (dialogs always render above it).
- **Tablet / Desktop (≥ 640px): no bottom bar.** The Home top bar carries a compact header navigation (the Tango cat wordmark left; Home · Test · Settings right as quiet pill links with icon + label, the current one on a `--primary-surface` pill with `aria-current="page"`). The Test root keeps its back arrow to Home and Settings keeps its centered panel with a close button.
- **Root screens on mobile have no back arrow** whose only purpose is returning Home (Test and Settings are peers of Home). Deeper screens keep their normal back hierarchy (`goUp` / `goBack`, browser Back, dialog history, and the quiz Back guard are unchanged).
- Home no longer owns a Test CTA and the mobile Home top bar no longer owns a Settings button.
- **Root entrance transition.** Switching between two different root destinations (Home ↔ Test ↔ Settings, by tab, header link, or browser Back/Forward) lifts the new screen's content into place: `translateY(40px)` → `0`, opacity `0.88` → `1`, 240ms, `cubic-bezier(0.22, 1, 0.36, 1)`. Only the screen's own sections move (top bar, content, sticky action bar); the bottom nav, the fixed ambience layer, and the desktop backdrop stay stationary. The transition never applies to first load, to tapping the current destination, or to entering/leaving any deeper route, quiz flow, management screen, or dialog. Navigation is never delayed for it. Under `prefers-reduced-motion: reduce` it is removed entirely (instant switch). Implemented once at the app level (`.tango-root-enter`), so future root destinations inherit it without screen-specific CSS.

### 16.1 Home Screen (Safe Study Hub)
> Home is the reference implementation of the baseline, not a layout template for other screens (see [Canonical Cross-Screen UI Baseline](#canonical-cross-screen-ui-baseline)).

Home follows Tango's content hierarchy: **Study Book → Category → Lesson → StudyItem**. Study Books are the primary content; category shortcuts are secondary. Test and Settings are primary navigation destinations (§16.0), not Home content.

- **Top Bar:** Opaque theme canvas (`bg-page`) with **no divider line**, so it belongs to each theme instead of reading as a separate panel. Content scrolling under it fades out through a 14px `--bg-page` feather (`.tango-topbar::after`) instead of a hard cut; zero translucent frosted glass or blur. On mobile it contains only the Tango cat wordmark (B1; Home / Test / Settings live in the floating bottom bar); from `sm` up it adds the compact header navigation (§16.0). No theme status or theme control: theme selection lives only in Settings (§16.5). Content Management is reached through Settings.
- **No visible greeting, no visible section labels:** Home renders no greeting line and no visible "Giáo trình" / "Học theo loại" headings. Semantic structure is kept with visually hidden headings (`sr-only` `h1` for the page and `h2` per section).
- **Progressive disclosure:** Home shows identity + progress + primary actions, not inventory statistics. Study Book = cover + title + Study Coverage. Vocabulary / Kanji = Japanese glyph + localized category name. Lesson/item counts are deferred to Book Study View, Learn by Type, and other detail screens. Avoid redundant icon + glyph + title combinations. Theme controls remain Settings-only.
- **Composition order:** Study Books → Vocabulary / Kanji shortcuts. There is no Test tile on Home.
- **Study Books (primary, visually dominant):**
  - Home previews only the **first 2 books** as large neutral clay cards (`bg-surface`, `shadow-clay-card`): a large 3:4 cover (`w-24` mobile, `w-28` tablet, `w-32` desktop), the title (`text-lg`/`sm:text-xl`), and one Study Coverage bar with its percentage. No lesson/item counts on Home.
  - When more than 2 books exist, a compact dashed-outline bridge `Xem tất cả ⌄` / `View all ⌄` is centered under the cards (≈62% width on mobile, naturally sized on desktop, 48px tall, `rounded-2xl`, `border-dashed border-border-strong`, `text-text-secondary`, `aria-expanded`, `aria-controls`). It reveals the remaining books in place and then reads `Thu gọn` / `Show less`. With 2 or fewer books it is not rendered.
  - **No reordering on Home.** Drag-reordering and manual ordering belong to the future full Books list / management view, never to Home.
  - Mobile: stacked horizontal cards. Tablet/desktop: a 2-column primary book grid inside `max-w-4xl`.
  - Titles use `.font-study-title` (§6.3), wrap up to 3 lines (`line-clamp-3`), and expose the full title on hover via the native `title` attribute.
  - Fallback cover: theme-aware primary-tinted placeholder with a spine band and `IconBook` (no emojis).
  - Tapping opens the **Book Study View**. (Never triggers edit/delete).
- **Vocabulary / Kanji shortcuts (secondary):** A 2-column row of equal-height, symmetrical semantic clay tiles (`min-h-[112px]`, `sm:min-h-[128px]`) below the books, smaller than the book cards. Fixed corners: the Japanese category name (`語彙` / `漢字`, `font-japanese`, `lang="ja"`, `aria-hidden`, `--category-*-icon`) pinned top-left, the study-card illustration (`VocabularyIllustration` / `KanjiIllustration`, `currentColor`) pinned top-right, and the localized name (`Từ vựng` / `Hán tự`) pinned bottom-left. Glyph and label use `whitespace-nowrap`; on narrow phones (< 380px) the glyph and illustration shrink instead of wrapping, so the 2-column layout stays clean at 360px. Surfaces keep `--category-vocabulary-*` and `--category-kanji-*`. No counts; the button's `aria-label` carries the localized name.
- **Ambience:** The restrained per-theme Japanese ambience layer (§8.2) sits behind all Home content.
- **Interaction:** All interactive cards and buttons follow the canonical clay recipe (§3.1): `.clay-interactive` for pointer-gated hover lift, `usePressFeedback` for explicit pressed depth, and the primary focus ring with 2px page offset. Arrow-key order: visible books, Vocabulary, Kanji.
- **Zero-Book Empty State:** The same primary book area renders a compact recessed clay shelf (`bg-surface-elevated`, `shadow-clay-pressed`): icon puck, *"Chưa có giáo trình nào."*, and the Settings → Content Management hint. No extra Settings button (Settings is a primary destination). Never a large floating card. Never places an "+ Add Book" button directly on Home.
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
- On mobile a **root destination** (§16.0): full-screen, no back arrow, bottom navigation visible with Settings active. Centered modal card (`max-w-lg`) with a close button on tablet and desktop (see [`docs/SCREEN_SPEC.md`](./SCREEN_SPEC.md)).
- **Language Section:** Segmented clay toggle: `[ Tiếng Việt ]` | `[ English ]`.
- **Theme Section (Chủ đề màu sắc):**
  - Three visual preview cards are visible, never a plain text toggle: `Sáng / Light`, `Tối / Dark`, `Sakura` (the standard themes).
  - **Easter-egg reveal:** a small clay arrow button beside the right-middle edge of the group (`Xem thêm chủ đề` / `More themes`; its name never spoils the surprise) slides the track **one card** to the left (≈280ms, `cubic-bezier(0.22, 1, 0.36, 1)`): Light slides out and the fourth theme, `Mèo mập 😺` / `Meo's World`, enters from the right. A left arrow (`Quay lại các chủ đề trước` / `Previous themes`) then replaces it beside the left-middle edge and reverses the shift. It is an overflow-clipped track (cards keep their size and spacing), not a page of three and never a teleport; off-screen cards fade out, are `aria-hidden`, and are not focusable. Arrows are real 48px buttons with a 36px visual puck, keyboard operable with focus-visible rings; reduced motion makes the shift instant.
  - If the persisted theme is `meo`, Settings opens on the second position so the selected card is visible. Choosing Dark or Sakura there does not force the carousel back; arrow-key selection of a hidden theme brings it into view.
  - The previews display the §9 palettes (Cool Pearl, Midnight Ink, Warm Blossom Paper, and the §9.4 Meo's World cat palette, whose preview wears cat ears and a tiny Tango face so it clearly reads as a different world).
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
  - Destructive action button: Semantic error tokens (`--error-surface` fill, `--error-border` edge, `--error-text` label; `--error-text` keeps AA contrast in every theme).
  - Cancel button: Neutral surface, visually distinct, safe spacing from delete button, holds initial focus.
  - Never default-focus the destructive action; `Enter` does not execute deletion.
  - See [`docs/CONTENT_LIBRARY_SPEC.md`](./CONTENT_LIBRARY_SPEC.md) for UX dialog specifications.

---

## 17. Accessibility & Inclusivity Standards

1. **Contrast Ratio Compliance:**
   - All primary text against its surface meets **WCAG AA (minimum 4.5:1)**; large Japanese prompt text meets **WCAG AAA (minimum 7:1)**.
   - Text inside the 4 positional answer buttons is specifically chosen to exceed 5.5:1 contrast against its respective hue background in all four themes.
2. **Never Color Alone:**
   - Answer selection and correctness never rely solely on color shifts. Every state change includes structural rings, icon indicators (`IconCheck` / `IconX`), and text descriptions.
3. **Screen Reader Semantic Hierarchy:**
   - Screen readers announce the prompt as a level-1 heading.
   - Answer buttons are semantic `<button>` elements with accessible descriptions (e.g. `aria-label="Lựa chọn: 旅行"`).
4. **Motion Sensitivity:**
   - Respects `prefers-reduced-motion: reduce`: transitions (including clay translations and sliding sheets) become instant and the ambience layer is fully static, while state changes such as pressed depth remain visible.

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
  --success-text: #047857;
  --error-text: #B91C1C;
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
  --cta-depth: #332CA6;
  --cta-text: #FFFFFF;
  --cta-text-secondary: #E0E7FF;
  --cta-puck-surface: rgba(255, 255, 255, 0.16);
  --cta-puck-border: rgba(255, 255, 255, 0.28);

  /* Ambient background (Japanese daytime: kumiko ink lines, washi shoji paper, seigaiha/mist accent); low opacity */
  --ambience-line: #1A2033;
  --ambience-glow: #FFFFFF;
  --ambience-accent: #8FA3C8;

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
  --success-text: #A7F3D0;
  --error-text: #FECACA;
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
  --cta-depth: #3A34B4;
  --cta-text: #FFFFFF;
  --cta-text-secondary: #E6E8FF;
  --cta-puck-surface: rgba(255, 255, 255, 0.14);
  --cta-puck-border: rgba(255, 255, 255, 0.24);

  /* Ambient background (Japanese night: moonlit lines, moonlight, lantern/window/firefly amber); low opacity */
  --ambience-line: #C9D2E6;
  --ambience-glow: #F3E7C4;
  --ambience-accent: #F6AE3D;

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
  --success-text: #047857;
  --error-text: #B91C1C;
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
  --cta-depth: #7D2743;
  --cta-text: #FFFFFF;
  --cta-text-secondary: #FDE7EE;
  --cta-puck-surface: rgba(255, 255, 255, 0.16);
  --cta-puck-border: rgba(255, 255, 255, 0.28);

  /* Ambient background (Blossom paper: plum branch, paper glow, blossom/kasumi/petal pink); low opacity */
  --ambience-line: #7C5861;
  --ambience-glow: #FFFAF8;
  --ambience-accent: #E595AC;

  /* Clay Shadows (warm blossom lift) */
  --shadow-clay-card: 0 4px 14px rgba(150, 80, 95, 0.13), 0 1px 4px rgba(150, 80, 95, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.95);
  --shadow-clay-card-hover: 0 8px 22px rgba(150, 80, 95, 0.18), 0 2px 6px rgba(150, 80, 95, 0.09), inset 0 1px 0 rgba(255, 255, 255, 1);
  --shadow-clay-button: 0 4px 12px rgba(168, 56, 92, 0.26), 0 1px 3px rgba(150, 80, 95, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.40);
  --shadow-clay-pressed: 0 1px 2px rgba(150, 80, 95, 0.18), inset 0 2px 4px rgba(150, 80, 95, 0.12);
}
```

---

## 19. Final Design Checklist for Future UI Sessions

When implementing any screen or component in Tango, verify it against the [Canonical Cross-Screen UI Baseline](#canonical-cross-screen-ui-baseline), including:
- [ ] Is it styled using semantic tokens rather than raw hex codes?
- [ ] Is Japanese text rendered in `Noto Sans JP` with generous font size and line height?
- [ ] Is Vietnamese/English text rendered in `Be Vietnam Pro` with diacritic clearance?
- [ ] Are all UI icons sourced exclusively from `Tabler Icons`?
- [ ] Are multiple-choice answer buttons completely free of `A/B/C/D`, `1/2/3/4`, or keyboard hint tags?
- [ ] Does the element look soft, tactile, and restrained—avoiding bloated cartoon 3D or generic, flat, template-like styling?
- [ ] Are mobile touch targets at least 48px high (and quiz answer buttons at least 56px)?
- [ ] Does the layout work seamlessly across Light, Dark, and Sakura themes (and Meo's World, §9.4)?
- [ ] Is motion restrained (70–220ms for UI) and compliant with `prefers-reduced-motion`?
- [ ] Do press states come from `usePressFeedback` (never `:active`), with hover gated to fine pointers?
- [ ] Is the clay level right (content card / secondary control / raised primary CTA / flat list)?
- [ ] Do canvas, category surfaces, and the CTA keep separate hue roles?
- [ ] Was the layout checked at ~360px, ~390px, and desktop with no horizontal scroll and no awkward Japanese wrapping?
