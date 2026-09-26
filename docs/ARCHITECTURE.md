# Tango — Technical Architecture

This document details the architectural design, frontend stack selection, client-side persistence, PWA roadmap, and source organization for the Tango application.

---

## 1. Architectural Principles

1. **Client-Side First (Local-First):** 100% of the application runs directly in the user's browser. There are no API round-trips for core study sessions, zero server latency, and full offline capability.
2. **Zero Unnecessary Dependencies:** Keep the third-party dependency footprint minimal to guarantee instant cold-start times and long-term maintainability.
3. **No Premature Backend:** No backend servers, databases, or microservices are needed for the MVP. Static assets and bundled vocabulary are served via standard static hosting (e.g. GitHub Pages, Vercel, Cloudflare Pages).
4. **Resilient Unicode Support:** Built-in normalization and text comparison to handle complex Japanese script (Kanji, Furigana, full-width kana) and Vietnamese diacritical accents cleanly.

---

## 2. Proposed Technology Stack

| Layer | Choice | Rationale & Trade-offs |
|---|---|---|
| **Core Framework** | **React 18 / 19 + TypeScript** with **Vite** | • Extremely fast build and development feedback loop via Vite (ESM).<br>• Zero SSR complexity; pure Static Single-Page Application (SPA).<br>• Predictable component-based model ideal for multi-step interactive quiz states.<br>• Excellent TypeScript type safety for data models. |
| **Styling** | **Tailwind CSS** | • Zero-runtime CSS with micro bundle size (purges unused styles).<br>• Rapid implementation of mobile-first ergonomic spacing, touch targets (min 48px), and typography.<br>• Native dark mode support if desired in future milestones. |
| **Icons** | **Lucide React** | • Modern, lightweight, stroke-based iconography.<br>• Tree-shakeable so only imported icons are bundled. |
| **State Management** | **React Hooks + Context** (with lightweight store pattern) | • The MVP's state consists of (1) Selected Vocabulary Set, (2) Active Quiz Session, (3) Local Progress.<br>• Redux, MobX, or complicated external state libraries add unnecessary boilerplate. Native React hooks and Context easily satisfy all requirements. |
| **Offline & PWA** | **vite-plugin-pwa** | • Zero-config Service Worker registration with Workbox.<br>• Pre-caches all static assets and vocabulary bundles for 100% offline study.<br>• Clean Web App Manifest for Android/iOS home screen installation. |
| **Testing** | **Vitest + Testing Library** | • Lightning-fast test runner sharing Vite's configuration.<br>• Used to verify quiz generation logic, scoring, and text-matching algorithms. |

---

## 3. Client-Side Persistence Strategy

### 3.1 Local Storage Layer
All user progress, weak-word markers, and session histories are stored in the browser's `localStorage` (or `IndexedDB` when dataset volume expands).

```
┌────────────────────────────────────────────────────────┐
│                   Tango Storage Layer                  │
├──────────────────────────┬─────────────────────────────┤
│ Storage Key              │ Purpose                     │
├──────────────────────────┼─────────────────────────────┤
│ tango_v1_progress        │ VocabularyItem error/pass   │
│                          │ counts, weak status         │
│ tango_v1_history         │ Recent quiz session records │
│ tango_v1_preferences     │ Quiz defaults (10/20/all)   │
└──────────────────────────┴─────────────────────────────┘
```

### 3.2 Schema Versioning & Migrations
To ensure future application updates never corrupt user study history, all persisted records feature a root `version: number`. An initialization guard checks the version and executes forward migrations if fields change.

---

## 4. PWA (Progressive Web App) Implementation

Tango is designed to be installed on mobile phones and tablets to provide an app-like experience without app store gatekeepers:

- **Manifest Configuration:**
  - `name`: "Tango — Japanese for Vietnamese"
  - `short_name`: "Tango"
  - `display`: `standalone` (removes browser URL bar on mobile)
  - `orientation`: `portrait-primary`
  - `theme_color`: `#4f46e5`
  - `background_color`: `#f8fafc`
- **Caching Strategy:**
  - **Static Assets (HTML/JS/CSS/Fonts):** Cache-first, background update (stale-while-revalidate).
  - **Vocabulary Bundles:** Precached on install.
  - Zero external network requests needed once installed.

---

## 5. Text Processing & Unicode Normalization

Japanese and Vietnamese text processing requires precise handling in the written-answer quiz mode (Type 4):

1. **Japanese Kana Normalization:**
   - Converts full-width alphanumeric to half-width.
   - Trims whitespace and full-width Japanese spaces (`\u3000`).
   - Normalizes Hiragana and Katakana where appropriate.
2. **Vietnamese Text Comparison:**
   - Normalizes unicode using `String.prototype.normalize('NFC')` to ensure composed and decomposed diacritics match consistently across macOS, Windows, iOS, and Android.
   - Trims surrounding spaces and case-insensitively compares answers against the `vietnamese` definition array.

---

## 6. Proposed Source Tree

The future source tree is structured around feature-based cohesion and minimal nesting:

```
src/
├── assets/                    # Static vectors, brand icons, logo SVG
├── components/                # Reusable UI primitives (agnostic to domain)
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Badge.tsx
│   ├── Modal.tsx
│   └── ProgressBar.tsx
├── data/                      # Bundled default vocabulary sets
│   ├── chukyu-lesson-1.json   # Sample lesson data (e.g. Fast Food)
│   └── index.ts               # Registry of available sets
├── features/                  # Domain-driven feature modules
│   ├── vocabulary/            # Set selector, word listing, detail view
│   │   ├── SetCard.tsx
│   │   ├── WordListItem.tsx
│   │   └── VocabularyDetail.tsx
│   ├── quiz/                  # Quiz execution engine & UI
│   │   ├── QuizRunner.tsx     # Active session controller
│   │   ├── QuestionPrompt.tsx # Large typography prompt card
│   │   ├── OptionList.tsx     # 4-choice button grid (mobile thumb-friendly)
│   │   ├── TextInputQuiz.tsx  # Type-in answer interface
│   │   ├── AnswerFeedback.tsx # Instant correct/incorrect explanation modal
│   │   └── QuizSummary.tsx    # Completion screen & metrics
│   └── review/                # Targeted review of failed words
│       ├── MissedWordsList.tsx
│       └── ReviewSession.tsx
├── hooks/                     # Custom React hooks
│   ├── useQuiz.ts             # Quiz lifecycle, timers, scoring logic
│   ├── useProgress.ts         # Persistent progress read/write
│   └── useKeyboard.ts         # 1/2/3/4 & Enter desktop shortcut listener
├── lib/                       # Pure utility functions (no React dependencies)
│   ├── storage.ts             # LocalStorage wrapper with version guard
│   ├── quizEngine.ts          # Question generator, choice shuffler
│   └── textNormalization.ts   # Japanese/Vietnamese unicode helpers
├── types/                     # Shared TypeScript interfaces
│   ├── vocabulary.ts          # VocabularyItem, VocabularySet, KanjiBreakdown
│   └── quiz.ts                # QuizQuestion, QuizSessionResult, QuestionType
├── App.tsx                    # Screen router / navigation state controller
├── index.css                  # Tailwind directives and custom font stacks
└── main.tsx                   # Application entry point & PWA registration
```

### Directory Responsibilities
- `src/components/`: Pure visual building blocks. Must not know about vocabulary or quiz business logic.
- `src/features/`: Encapsulates screens and UI logic specific to a domain capability (browsing vocabulary, taking a quiz, reviewing mistakes).
- `src/lib/`: Pure algorithmic functions with zero React dependencies, enabling 100% unit-test coverage via Vitest.
- `src/hooks/`: Connects UI components to storage and business logic in a decoupled manner.
