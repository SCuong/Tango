# Tango — Technical Architecture

This document details the architectural design, frontend stack selection, multi-lesson study engine, client-side persistence, PWA roadmap, and source organization for Tango.

---

## 1. Architectural Principles

1. **Shared Foundation, Dual Categorization:** Vocabulary and Kanji are two navigation categories backed by the **identical data schema** (`StudyItem`, `Lesson`) and processed by the **exact same quiz engine**. No duplicated quiz runners or category-specific models exist.
2. **Flexible Multi-Lesson Aggregation:** The quiz engine is decoupled from individual lessons. It consumes an array of `lessonIds: string[]`, aggregates their items into a unified study pool, deduplicates them by normalized Japanese + Kana, and feeds questions into a single quiz runner.
3. **Client-Side First (Local-First):** 100% of the application runs directly in the user's browser with zero API latency and complete offline capability.
4. **Zero Unnecessary Dependencies:** Keep the third-party dependency footprint minimal to guarantee instant cold-start times and long-term maintainability.
5. **No Premature Backend:** No servers, databases, or microservices are required for MVP. Bundled lesson data is stored in static JSON files.
6. **Resilient Unicode Support:** Built-in normalization and text comparison to handle complex Japanese script (Kanji, Kana, full-width characters) and Vietnamese diacritical accents cleanly.

---

## 2. Proposed Technology Stack

| Layer | Choice | Rationale & Trade-offs |
|---|---|---|
| **Core Framework** | **React 18 / 19 + TypeScript** with **Vite** | • Instant build and dev feedback loop via Vite.<br>• Zero SSR complexity; pure Static Single-Page Application (SPA).<br>• Predictable component-based model ideal for multi-step interactive quiz states.<br>• Full type safety for `StudyItem`, `Lesson`, and `QuizConfig`. |
| **Styling** | **Tailwind CSS** | • Zero-runtime CSS with micro bundle size.<br>• Rapid implementation of mobile-first ergonomic spacing, touch targets (min 48px-52px), and typography.<br>• Consistent slate and indigo color tokens. |
| **Icons** | **Lucide React** | • Modern, lightweight, stroke-based iconography.<br>• Tree-shakeable so only imported icons are bundled. |
| **State Management** | **React Hooks + Context** (with lightweight store pattern) | • Manages: (1) Active Category & Selected Lessons, (2) Active Quiz Session, (3) Local Progress.<br>• Decoupled custom hooks (`useQuiz`, `useProgress`) provide clean separation without Redux/MobX boilerplate. |
| **Offline & PWA** | **vite-plugin-pwa** | • Zero-config Service Worker registration with Workbox.<br>• Pre-caches all static assets and lesson bundles for 100% offline study.<br>• Web App Manifest for Android/iOS home screen installation. |
| **Testing** | **Vitest + Testing Library** | • Lightning-fast test runner sharing Vite's configuration.<br>• Verifies multi-lesson pool building, question generation, and text-matching algorithms. |

---

## 3. Multi-Lesson Study Pool Architecture

The quiz pipeline is designed to be completely decoupled from lesson categorization:

```
[ User Selection ]
  • Vocabulary Bài 1
  • Vocabulary Bài 2
  • Kanji Bài 1
          ↓
[ lessonIds: string[] ]
          ↓
[ Pool Aggregator ] ─── Reads lessons from data registry
          ↓
[ Deduplication ] ───── Deduplicates by normalized Japanese + Kana
          ↓
[ Question Generator ] ─ Generates Type 1-4 questions, shuffles options
          ↓
[ Question Slicer ] ─── Limits to 10, 20, 40, or 'all'
          ↓
[ Shared Quiz Runner ] ─ Unified UI handling Practice, Test, and Review
```

> **Pool Deduplication Key:** Uses `normalized(japanese) + '::' + normalized(kana || '')` rather than `item.id`, ensuring items shared between Vocabulary and Kanji lessons are not tested redundantly.

---

## 4. Client-Side Persistence Strategy

All user progress, weak-word markers, and session histories are stored in browser `localStorage` keyed by `StudyItem.id`.

```
┌────────────────────────────────────────────────────────┐
│                   Tango Storage Layer                  │
├──────────────────────────┬─────────────────────────────┤
│ Storage Key              │ Purpose                     │
├──────────────────────────┼─────────────────────────────┤
│ tango_v1_progress        │ StudyItem error/pass counts,│
│                          │ weak status keyed by itemId │
│ tango_v1_history         │ Recent quiz session records │
│ tango_v1_preferences     │ Quiz defaults (10/20/all)   │
│ tango_v1_custom_lessons  │ Custom user-imported lessons│
└──────────────────────────┴─────────────────────────────┘
```

Because `StudyItem.id` is globally unique across both Vocabulary and Kanji lessons, the progress store operates uniformly regardless of which lesson or category an item originated from.

---

## 5. PWA (Progressive Web App) Implementation

Tango is designed to be installed on mobile phones and tablets:

- **Manifest Configuration:**
  - `name`: "Tango — Japanese for Vietnamese"
  - `short_name`: "Tango"
  - `display`: `standalone` (removes browser URL chrome)
  - `orientation`: `portrait-primary`
  - `theme_color`: `#4f46e5`
  - `background_color`: `#f8fafc`
- **Caching Strategy:**
  - **Static Assets:** Cache-first, background update (stale-while-revalidate).
  - **Lesson Bundles:** Precached on install.
  - 100% functional offline.

---

## 6. Text Processing & Unicode Normalization

Written-answer quiz mode (`vi_to_text`) utilizes normalization utilities in `src/lib/textNormalization.ts`:

1. **Japanese Kana Normalization:**
   - Trims leading/trailing whitespace and full-width Japanese spaces (`\u3000`).
   - Normalizes half-width Katakana to full-width.
2. **Vietnamese Text Comparison:**
   - Normalizes Unicode using `String.prototype.normalize('NFC')` to ensure composed and decomposed diacritics match consistently across iOS, Android, and desktop browsers.
   - Case-insensitively compares answers against the `vietnamese` definition array.

---

## 7. Proposed Data & Source Tree

### 7.1 Bundled Data Organization

```
src/data/
├── vocabulary/                # Vocabulary lessons
│   ├── lesson-01.json         # e.g., Bài 1 - Đồ ăn nhanh
│   ├── lesson-02.json
│   └── ...
├── kanji/                     # Kanji lessons (flat StudyItem lists)
│   ├── lesson-01.json         # e.g., Bài 1 - Hành động & Đi lại
│   ├── lesson-02.json
│   └── ...
└── index.ts                   # Unified registry exporting getAllLessons(), getLessonById()
```

*Both `vocabulary/` and `kanji/` directories strictly conform to the identical `Lesson` and `StudyItem` schemas.*

### 7.2 Source Code Organization

```
src/
├── assets/                    # Static vectors, brand icons, logo SVG
├── components/                # Reusable UI primitives (domain-agnostic)
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Badge.tsx
│   ├── Modal.tsx
│   ├── Checkbox.tsx
│   └── ProgressBar.tsx
├── data/                      # Bundled lessons (vocabulary/ & kanji/)
├── features/                  # Domain-driven feature modules
│   ├── lessons/               # Category views, lesson browsers, and importer
│   │   ├── CategoryCards.tsx  # Dual entry: Vocabulary vs. Kanji cards
│   │   ├── LessonList.tsx     # List of lessons for selected category
│   │   ├── LessonDetail.tsx   # Word list inside a single lesson
│   │   ├── LessonImporter.tsx # Authoritative import interface (see docs/IMPORT_SPEC.md)
│   │   └── MixedTestModal.tsx # Multi-lesson selector with checkboxes
│   ├── quiz/                  # Shared quiz engine (used for all tests)
│   │   ├── QuizRunner.tsx     # Active session controller
│   │   ├── QuestionPrompt.tsx # Large typography prompt card
│   │   ├── OptionList.tsx     # 4-choice button grid (mobile thumb-friendly)
│   │   ├── TextInputQuiz.tsx  # Type-in answer interface
│   │   ├── AnswerFeedback.tsx # Clean explanation sheet (Hán Việt when present)
│   │   └── QuizSummary.tsx    # Completion screen & metrics
│   └── review/                # Targeted review of failed words
│       ├── MissedWordsList.tsx
│       └── ReviewSession.tsx
├── hooks/                     # Decoupled React hooks
│   ├── useQuiz.ts             # Multi-lesson quiz state, timers, scoring
│   ├── useProgress.ts         # Persistent progress read/write
│   └── useKeyboard.ts         # Desktop keyboard shortcut listener (1-4, Enter)
├── lib/                       # Pure utility functions (no React dependencies)
│   ├── storage.ts             # LocalStorage wrapper with schema version guard
│   ├── quizEngine.ts          # Multi-lesson pool aggregator, question generator
│   ├── importer.ts            # Delimiter detection, parsing, deduplication
│   └── textNormalization.ts   # Japanese and Vietnamese unicode matchers
├── types/                     # Shared TypeScript domain interfaces
│   ├── study.ts               # StudyItem, Lesson, StudyCategory
│   └── quiz.ts                # QuizConfig, QuizQuestion, QuizSessionResult, QuestionType
├── App.tsx                    # Screen router / navigation coordinator
├── index.css                  # Tailwind directives and font stack configurations
└── main.tsx                   # Application entry point & PWA registration
```

### Directory Responsibilities
- `src/features/lessons/`: Category home view (Từ vựng vs Hán tự), lesson listings, LessonImporter, and the Mixed Test multi-lesson configuration modal.
- `src/features/quiz/`: The **single, reusable quiz system** that powers Practice Mode, Quick Tests, Mixed Tests, and Review Sessions.
- `src/lib/quizEngine.ts`: Pure algorithmic logic that takes `lessonIds: string[]`, collects items, deduplicates by normalized Japanese + Kana, shuffles choices, and emits `QuizQuestion[]`.
- `src/lib/importer.ts`: Pure parsing, delimiter auto-detection, RFC 4180 CSV tokenizer, and duplicate/merge logic.
- `src/types/`: Centralized interfaces guaranteeing strict data symmetry across both study categories.
