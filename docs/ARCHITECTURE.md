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
| **State Management** | **React Hooks + Context** (with lightweight store pattern) | • `useAppState` holds the aggregated `UserStudyState` and persists each partition through `commitStudyData`; `QuizSessionContext` holds the single active quiz session; `useNavigation` owns routing.<br>• No Redux/MobX boilerplate. |
| **Offline & PWA** | **Hand-written service worker** (`public/sw.js`) + Web App Manifest | • No extra dependency: a small service worker caches the app shell, built assets, and fonts at runtime.<br>• Registered only in production builds.<br>• Web App Manifest (`public/manifest.webmanifest`) for home screen installation. |
| **Testing** | **Vitest** (server rendering via `react-dom/server`) | • Lightning-fast test runner sharing Vite's configuration.<br>• Verifies pool building, question generation, session runtime, cascades, importer parsing, and renders every canonical route. Interactive browser behavior is verified manually in a real browser. |

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

> **Pool Deduplication Key & Lexical Groups:** Uses `normalized(japanese) + '::' + normalized(kana || '')` rather than `item.id`, grouping matching items into a single deduplicated lexical group. No synthetic merged items are created at runtime. When generating a question, the first compatible real StudyItem in deterministic selected-lesson/item order serves as `targetItem`, preserving real item IDs for history and progress tracking. Multiple-choice distractors are drawn strictly from other deduplicated lexical groups within the currently selected lesson pool.

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
│                          │ soundEnabled (default: false),       │
│                          │ answerLayout (default: grid) in LS   │
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
- **Caching Strategy (`public/sw.js`):**
  - **App shell:** `/`, the manifest, and the icon are cached on install.
  - **Navigations:** Network first; offline, the cached app shell is served for every route (client-side routing takes over).
  - **Static Assets & Fonts:** Same-origin assets and Google Fonts are served from cache and refreshed in the background (stale-while-revalidate).
  - **First visit:** resources loaded before the worker took control (built JS/CSS, fonts, the manifest, and bundled images such as the `.webp` brand wordmark; see `src/lib/offlineAssets.ts`) are posted to the worker and cached right away.
  - **Seed lessons** are bundled into the JavaScript and copied to `tango_v1_lessons` once; cache updates never overwrite `tango_v1_lessons` or resurrect deleted lessons.
  - After the first online visit the app is fully functional offline. Study data lives in `localStorage` / IndexedDB and is never handled by the service worker.

---

## 6. Text Processing & Unicode Normalization

Written-answer quiz mode (`vi_to_text`) and text matching utilize normalization utilities in `src/lib/textNormalization.ts`:

1. **Japanese & Kana Normalization (Written Answers & Deduplication Keys):**
   - Trims leading/trailing whitespace and full-width Japanese spaces (`\u3000`).
   - Collapses internal whitespace sequences.
   - Normalizes half-width Katakana to full-width.
   - Normalizes Unicode to `NFC`.
   - In `vi_to_text` evaluation, learner input is normalized and compared against the target item's normalized `japanese` expression or normalized `kana` reading (when Kana exists).
2. **Vietnamese Text Normalization (Definitions & Prompts):**
   - Normalizes Unicode using `String.prototype.normalize('NFC')` to ensure composed and decomposed diacritics match consistently across iOS, Android, and desktop browsers.
   - Trims leading/trailing whitespace and collapses internal spaces for clean prompt display and definition indexing.

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

*Current state: the seed registry (`getSeedLessons()`) is intentionally empty until approved curriculum datasets are added, so a fresh install starts with no content and learners add books and lessons through Content Management and the importer. No demo or sample data ships with the app. When seed files are added they must follow the layout above.*

*Both `vocabulary/` and `kanji/` directories strictly conform to the identical `Lesson` and `StudyItem` schemas. These bundled files serve strictly as initial seed data on first initialization; runtime queries, edits, and deletions take place exclusively within `tango_v1_lessons`.*

### 7.2 Source Code Organization

```
src/
├── components/                    # Reusable UI primitives (domain-agnostic)
│   ├── Button.tsx                 # Primary (raised CTA) / secondary / danger / quiet buttons, IconButton
│   ├── Screen.tsx                 # Screen shell, sticky ScreenHeader, StickyBottomBar, SectionLabel
│   ├── ModalRoute.tsx             # Full-screen route on mobile, centered panel from sm (Settings, Add Book)
│   ├── Dialog.tsx                 # Opaque modal / bottom sheet; Escape, focus trap, Back closes it
│   ├── ConfirmDialog.tsx          # Destructive confirmation (Cancel holds focus)
│   ├── FormControls.tsx           # SegmentedControl, CheckboxRow, TextField, SelectField
│   ├── NotFoundScreen.tsx, EmptyState.tsx, ProgressBar.tsx, TopBar.tsx, ThemeAmbience.tsx
│   └── illustrations/             # Study-card illustrations (Vocabulary / Kanji)
├── data/                          # Bundled seed registry (one-time copy into tango_v1_lessons)
├── features/
│   ├── books/                     # SCREEN 01 Home, BookCard, BookCover
│   ├── study/                     # SCREEN 02–06 (Book Study View, Category, Learn by Type, Lesson Detail, Items)
│   ├── quiz/                      # SCREEN 07–15: QuizConfigScreen (category/book/mixed), QuizRunnerScreen,
│   │                              #   QuizResultsScreen, QuizSessionContext (the single shared runner)
│   ├── settings/                  # SCREEN 16 Settings
│   └── content-management/        # SCREEN 17–27: Content Management, Add/Manage Book, Manage Lesson,
│                                  #   ImportScreen (steps 21–24), destructive dialogs
├── hooks/                         # useAppState, useNavigation, useI18n, usePressFeedback, useCounts
├── lib/                           # Pure logic (no React)
│   ├── storage.ts                 # localStorage partitions & IndexedDB cover Blob store
│   ├── appState.ts                # Bootstrap and preference synchronization
│   ├── routes.ts                  # Canonical route model & parser
│   ├── i18n.ts                    # VI / EN dictionaries
│   ├── quizEngine.ts              # Locked pool aggregator & question generator (optional review focus)
│   ├── quizSession.ts             # Session runner: feedback, streaks, practice re-queue, results, progress
│   ├── studyMetrics.ts            # Study Coverage / Answer Accuracy / weak counts
│   ├── studySelectors.ts          # Library-order grouping (books, categories, Unassigned)
│   ├── contentActions.ts          # Book/lesson mutations and ordered hard-delete cascades
│   ├── coverImage.ts              # Cover validation, downscaling, replace with Blob cleanup
│   ├── importer.ts                # Delimiters, RFC 4180, Markdown, headers, dedupe/merge, templates
│   ├── xlsx.ts                    # Native .xlsx reader (DecompressionStream) and template writer
│   ├── sound.ts                   # Optional Web Audio feedback (off by default)
│   ├── ids.ts                     # Opaque collision-safe IDs
│   └── textNormalization.ts       # Japanese / Vietnamese normalization
├── types/                         # StudyBook, Lesson, StudyItem, quiz and progress models
├── App.tsx                        # Route → screen coordinator
├── index.css                      # Tokens, clay recipe, ambience
└── main.tsx                       # Bootstrap + providers
```

### Directory Responsibilities
- `src/features/books/` and `src/features/study/`: study-only screens. They contain no add, edit, import, or delete controls.
- `src/features/quiz/`: the **single, reusable quiz system** powering Practice, Quick Test, Category/Book/Mixed tests, and Review Missed Words. Every entry point builds a `QuizSessionConfig` (`lessonIds`, mode, count, types, optional review focus, and the runtime-only `returnTarget` that Quiz Results returns to) and questions always come from `lib/quizEngine.ts`.
- `src/features/content-management/`: the protected management hub reached through Settings: books, covers, lesson metadata and reassignment, the importer, and Danger Zone dialogs.
- `src/lib/contentActions.ts`: ordered, idempotent hard-delete cascades (§4.3) and metadata-only lesson updates.
- `src/lib/quizSession.ts`: pure runtime state for the shared runner; progress (`tango_v1_progress`) and history (`tango_v1_history`) are written once, when a session completes.
- `src/types/`: Centralized interfaces guaranteeing strict data symmetry across all books and categories.
