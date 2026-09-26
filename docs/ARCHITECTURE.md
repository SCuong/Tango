# Tango — Technical Architecture

This document details the architectural design, frontend stack selection, multi-lesson study engine, client-side persistence, PWA roadmap, and source organization for Tango.

---

## 1. Architectural Principles

1. **Shared Foundation, Dual Categorization:** Vocabulary and Kanji are two navigation categories backed by the **identical data schema** (`StudyItem`, `Lesson`) and processed by the **exact same quiz engine**. No duplicated quiz runners or category-specific models exist.
2. **Flexible Multi-Lesson Aggregation:** The quiz engine is decoupled from individual lessons. It consumes an array of `lessonIds: string[]`, aggregates their items into a unified study pool, deduplicates them by normalized Japanese + Kana, and feeds questions into a single quiz runner.
3. **Client-Side First (Local-First):** 100% of the application runs directly in the user's browser with zero API latency and complete offline capability.
4. **Zero Unnecessary Dependencies:** Keep the third-party dependency footprint minimal to guarantee instant cold-start times and long-term maintainability.
5. **No Premature Backend & Seeded Mutable Runtime:** No servers, databases, or microservices are required for MVP. Bundled lesson files under `src/data/` act strictly as **initial seed data**. On first application startup, seed lessons are copied into the canonical mutable local lesson store (`tango_v1_lessons`). The runtime application operates exclusively on this mutable store, ensuring that user edits, reassignments, and permanent hard deletions apply uniformly to all lessons without seed data resurfacing on relaunch.
6. **Resilient Unicode Support:** Built-in normalization and text comparison to handle complex Japanese script (Kanji, Kana, full-width characters) and Vietnamese diacritical accents cleanly.

---

## 2. Proposed Technology Stack

| Layer | Choice | Rationale & Trade-offs |
|---|---|---|
| **Core Framework** | **React 18 / 19 + TypeScript** with **Vite** | • Instant build and dev feedback loop via Vite.<br>• Zero SSR complexity; pure Static Single-Page Application (SPA).<br>• Predictable component-based model ideal for multi-step interactive quiz states.<br>• Full type safety for `StudyItem`, `Lesson`, and `QuizConfig`. |
| **Styling** | **Tailwind CSS** | • Zero-runtime CSS with micro bundle size.<br>• Rapid implementation of mobile-first ergonomic spacing, touch targets (min 48px-52px), and typography.<br>• Semantic design tokens supporting theme-independent styling across Light, Dark, and Sakura themes, reflecting Tango's Soft Claymorphism system (elevation, surface tokens, and accent tokens). |
| **Icons** | **Tabler Icons** (`@tabler/icons-react`) | • Consistent, comprehensive stroke-based iconography.<br>• Tree-shakeable, authoritative icon standard (see `docs/DESIGN_SYSTEM.md`). |
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

All user progress, weak-word markers, session histories, books, and mutable lessons are stored in client-side persistence.

```
┌─────────────────────────────────────────────────────────────────┐
│                       Tango Storage Layer                       │
├──────────────────────────┬──────────────────────────────────────┤
│ Storage Key / Database   │ Purpose & Storage Technology         │
├──────────────────────────┼──────────────────────────────────────┤
│ tango_v1_books           │ StudyBook metadata (id, title,       │
│                          │ coverImageId, timestamps) in LS      │
│ tango_v1_lessons         │ Canonical mutable                    │
│                          │ Record<string, Lesson> in LS         │
│ tango_v1_progress        │ StudyItem error/pass counts,         │
│                          │ weak status keyed by itemId in LS    │
│ tango_v1_history         │ QuizSessionResult records in LS      │
│ tango_v1_preferences     │ App settings: theme, lang,           │
│                          │ soundEnabled (default: false) in LS  │
│ tango_v1_library_init    │ Seed initialization marker in LS     │
│ tango_v1_covers_idb      │ Binary book cover Blobs              │
│                          │ in browser IndexedDB (object store)  │
└──────────────────────────┴──────────────────────────────────────┘
```

### 4.1 Canonical Mutable Lesson Store (`tango_v1_lessons`)
- **Single Source of Truth:** All runtime operations query and mutate `tango_v1_lessons`. There is no separate store for imported vs. seeded lessons.
- **One-Time Seed Copy:** On initial app launch, bundled lessons (`src/data/`) are copied into `tango_v1_lessons`, and `tango_v1_library_init` is marked. Subsequent app loads exclusively read from `tango_v1_lessons`.
- **No Resurrecting Deleted Lessons:** Because runtime queries ignore bundled JSON once initialized, deleting a seeded lesson or textbook permanently removes it; it will never reappear on subsequent launches or PWA cache updates.

### 4.2 Book Cover Binary Storage (IndexedDB)
- **Zero Base64 in `localStorage`:** Book covers are user-uploaded binary images (`.jpg`, `.jpeg`, `.png`, `.webp`). Storing them in `localStorage` as base64 strings quickly exhausts the browser's 5MB quota and degrades serialization performance.
- **IndexedDB Blob Store:** Cover images are stored directly as binary `Blob` objects in an IndexedDB database (`tango_v1_covers_idb`) referenced by `StudyBook.coverImageId`.

### 4.3 Ordered, Idempotent Hard-Delete Cascade
Browser storage operations span `localStorage` and `IndexedDB`. Because no single browser transaction can span both storage systems atomically, Tango defines an **ordered, idempotent hard-delete cascade** (see [`docs/CONTENT_LIBRARY_SPEC.md`](./CONTENT_LIBRARY_SPEC.md)). To guarantee retry safety if an interruption occurs, all required identifiers are resolved and retained in memory before mutating persistent stores:
- `deletedBookId`
- `coverImageId` (resolved from `StudyBook.coverImageId` before deletion)
- `affectedLessonIds`
- `affectedStudyItemIds`
- `affectedHistoryIds`

#### Conceptual Hard-Delete Sequence for Study Books:
1. **Resolve Full Scope & Identifiers in Memory:** Retrieve `deletedBookId`, `coverImageId`, all `affectedLessonIds` where `lesson.bookId === deletedBookId`, all `affectedStudyItemIds` belonging to those lessons, and all `affectedHistoryIds` (resolved from `session.lessonIds` matching `affectedLessonIds` or `session.missedItemIds` matching `affectedStudyItemIds`).
2. **Clear In-Memory & Active References:** Clear any active multi-lesson quiz selections, navigation breadcrumbs, or in-flight review filters referencing `affectedLessonIds`.
3. **Purge Affected ItemProgress:** In `tango_v1_progress`, delete all `ItemProgress` entries for `affectedStudyItemIds`.
4. **Delete Entire Affected QuizSessionResult History Records:** Delete any `QuizSessionResult` in `tango_v1_history` matching `affectedHistoryIds`. Partial histories are never retained.
5. **Delete Cover Blob from IndexedDB:** Asynchronously delete the binary cover blob from `tango_v1_covers_idb` using the already-resolved `coverImageId` (if present). Deleting the blob while book metadata is still intact guarantees that if an interruption occurs, retry logic can still locate the cover blob.
6. **Delete Affected Lesson Records:** Remove all `affectedLessonIds` from the `tango_v1_lessons` map.
7. **Delete StudyBook Metadata LAST:** Delete the `StudyBook` record from `tango_v1_books` as the final mutation step.
8. **Verify Integrity:** Confirm no dangling references or orphaned IDs remain.

> **Key Invariant:** `StudyBook` metadata is deleted **last** because it contains the canonical reference needed to locate and verify the cover Blob in IndexedDB.

#### Conceptual Hard-Delete Sequence for Individual Lessons:
1. **Resolve Scope & Identifiers in Memory:** Resolve `targetLessonId`, its nested `affectedStudyItemIds`, and `affectedHistoryIds` (matching `session.lessonIds` containing `targetLessonId` or `session.missedItemIds` referencing `affectedStudyItemIds`).
2. **Clear In-Memory & Active References:** Remove `targetLessonId` from active quiz selections or filters.
3. **Purge Affected ItemProgress:** Delete progress records for `affectedStudyItemIds` from `tango_v1_progress`.
4. **Delete Entire Affected QuizSessionResult Records:** Remove any session matching `affectedHistoryIds` from `tango_v1_history`.
5. **Delete Target Lesson Record LAST:** Remove `targetLessonId` from `tango_v1_lessons` as the final step.
6. **Verify Parent Study Book:** The parent `StudyBook` remains intact, with its lesson and item counters updated.

### 4.4 Audio Feedback Architecture (Optional, Off by Default)
- **Engine:** Pure client-side Web Audio API synthesizer or lightweight tiny audio buffers (< 20KB total).
- **Decoupled Playback:** Audio triggers asynchronously without blocking UI rendering, auto-advance timers, or state updates.
- **Strict Default:** Sound is strictly **OFF** (`soundEnabled: false`). Audio context is only initialized/activated upon explicit user action in Settings.

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
  - **Lesson Bundles (Initial Seed):** Pre-cached on install. Copied to `tango_v1_lessons` on initial library setup. Subsequent app updates or Workbox cache invalidations never overwrite `tango_v1_lessons` or resurrect intentionally deleted lessons.
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

### 7.1 Bundled Data Organization (Seed Data Only)

```
src/data/
├── vocabulary/                # Initial seed vocabulary lessons
│   ├── lesson-01.json         # e.g., Bài 1 - Đồ ăn nhanh
│   ├── lesson-02.json
│   └── ...
├── kanji/                     # Initial seed Kanji lessons (flat StudyItem lists)
│   ├── lesson-01.json         # e.g., Bài 1 - Hành động & Đi lại
│   ├── lesson-02.json
│   └── ...
└── index.ts                   # Seed registry exporting getSeedLessons()
```

*Both `vocabulary/` and `kanji/` directories strictly conform to the identical `Lesson` and `StudyItem` schemas. These bundled files serve strictly as initial seed data on first initialization; runtime queries, edits, and deletions take place exclusively within `tango_v1_lessons`.*

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
│   ├── books/                 # Study Book cards and Book Study views (see docs/CONTENT_LIBRARY_SPEC.md)
│   │   ├── BookCard.tsx       # Responsive book card with cover thumbnail
│   │   ├── BookStudyView.tsx  # Book overview: Vocab & Kanji categories, Test Book CTA
│   │   └── BookPlaceholder.tsx# Theme-aware fallback cover illustration
│   ├── lessons/               # Category views, lesson browsers, and detail
│   │   ├── CategoryBrowser.tsx# "Learn by Type" view grouped by Study Book
│   │   ├── LessonList.tsx     # List of lessons for selected category inside a book
│   │   ├── LessonDetail.tsx   # Item preview, Practice, Quick Test, Review
│   │   └── MixedTestModal.tsx # Multi-lesson selector with checkboxes
│   ├── content-management/    # Administrative content controls (accessed via Settings)
│   │   ├── ContentManager.tsx # Main management screen (Books list + Lessons list)
│   │   ├── BookEditor.tsx     # Add / Edit book modal & cover picker
│   │   ├── LessonManager.tsx  # Dedicated lesson inspector, title/category/book editing & Danger Zone
│   │   ├── DangerZone.tsx     # Explicit permanent delete dialogs (Hard Delete Only)
│   │   └── LessonImporter.tsx # Authoritative import interface (see docs/IMPORT_SPEC.md)
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
│   ├── storage.ts             # LocalStorage & IndexedDB cover store manager
│   ├── quizEngine.ts          # Multi-lesson pool aggregator, question generator
│   ├── importer.ts            # Delimiter detection, parsing, deduplication
│   └── textNormalization.ts   # Japanese and Vietnamese unicode matchers
├── types/                     # Shared TypeScript domain interfaces
│   ├── study.ts               # StudyBook, Lesson, StudyItem, StudyCategory
│   └── quiz.ts                # QuizConfig, QuizQuestion, QuizSessionResult, QuestionType
├── App.tsx                    # Screen router / navigation coordinator
├── index.css                  # Tailwind directives and font stack configurations
└── main.tsx                   # Application entry point & PWA registration
```

### Directory Responsibilities
- `src/features/books/`: Study Book cards on Home and the safe Book Study View.
- `src/features/lessons/`: Category views, Lesson Detail, and multi-lesson quiz configuration.
- `src/features/content-management/`: Protected management hub accessed via Settings. Contains `ContentManager` (overview), `BookEditor` (add/edit books and cover picker), `LessonManager` (dedicated lesson inspector responsible for editing lesson title, subtitle, switching category `vocabulary` ↔ `kanji`, reassigning parent Study Book or Unassigned, inspecting lesson items, and launching hard-delete confirmation), `LessonImporter` (authoritative import interface), and `DangerZone` (reusable hard-delete confirmation dialogs).
- `src/features/quiz/`: The **single, reusable quiz system** that powers Practice Mode, Quick Tests, Book Tests, Mixed Tests, and Review Sessions.
- `src/lib/quizEngine.ts`: Algorithmic engine that takes `lessonIds: string[]`, collects items, deduplicates, and generates questions.
- `src/lib/storage.ts`: Dual-tier client storage handling `localStorage` metadata and IndexedDB binary cover blobs with cascade cleanup.
- `src/types/`: Centralized interfaces guaranteeing strict data symmetry across all books and categories.
