# Tango

A Japanese vocabulary and kanji quiz app for Vietnamese learners. It runs in the browser, stores everything locally and can be installed as a PWA. Each study item links four fields: the Japanese word, its kana reading, the Sino-Vietnamese (Hán Việt) reading and the Vietnamese meaning.

The app ships with an empty library. You add your own books and lessons, usually by importing a word list from a textbook or teacher.

## Features

- **Books and lessons**: group lessons into study books (giáo trình), each with a Vocabulary and a Kanji category and an optional cover image. Lessons can also exist outside any book.
- **Import**: paste text or open a `.txt`, `.csv`, `.md` or `.xlsx` file. The importer detects the delimiter and header row, lets you map columns, flags missing fields, removes duplicates and shows a preview before saving. Downloadable templates are provided. The `.xlsx` reader is written in-house using the browser's `DecompressionStream`, so there is no spreadsheet dependency.
- **Quizzes**: four question types (kana → word, word → meaning, meaning → word, and typing the word from its meaning). Quiz one lesson, a whole book, or any mix of lessons across books, with 10, 20, 40 or all eligible questions. Wrong answers show the reading, meaning and Hán Việt.
- **Progress**: per-item results and quiz history are kept on the device.
- **Settings**: Vietnamese or English UI, four color themes, optional sound effects, answer layout and feedback style, and content management (rename books and change covers; edit a lesson's title, category and book; delete books and lessons).
- **Offline**: a web app manifest and a small hand-written service worker cache the app shell. The Be Vietnam Pro and Noto Sans JP fonts are loaded from Google Fonts on first visit and then cached.

## Tech stack

React 18, TypeScript, Vite, Tailwind CSS 3, Tabler Icons and Vitest. There is no router library, state library or backend. Data is stored in `localStorage` (books, lessons, progress, preferences) and IndexedDB (cover images).

## Getting started

Requires Node 20 or newer.

```sh
npm ci
npm run dev          # http://localhost:5173
npm test             # Vitest
npm run build        # type-check and build into dist/
npm run preview      # serve dist/
```

## Project layout

```
src/
  features/    screens: books (home), study, quiz, content-management, settings
  components/  shared UI (buttons, dialogs, navigation, theme ambience)
  lib/         importer, xlsx reader, quiz engine, storage, i18n, routes
  hooks/       app state and navigation contexts
  types/       data model
docs/          product, data model, import, design system and screen specifications
public/        icons, manifest and service worker
```

The specifications in `docs/` were written before and during development; [docs/DATA_MODEL.md](docs/DATA_MODEL.md) and [docs/IMPORT_SPEC.md](docs/IMPORT_SPEC.md) are the most useful for understanding the code.

## Import format

Four columns in this order, or any order with a header row:

| Từ vựng | Cách đọc | Âm Hán Việt | Nghĩa tiếng Việt |
| --- | --- | --- | --- |
| 旅行 | りょこう | Lữ Hành | Du lịch, chuyến đi |
| ファストフード | ふぁすとふーど | | Đồ ăn nhanh |

Hán Việt is optional. Multiple meanings can be separated with commas or semicolons.
