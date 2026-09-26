# Tango Project Rules & Repository Hygiene

This document defines the persistent rules, standards, and Git hygiene constraints for the **Tango** repository. Every contributor and coding session must strictly adhere to these guidelines.

---

## 1. Project Overview

- **Project Name:** Tango
- **Description:** A Japanese vocabulary and Kanji learning web application designed specifically for Vietnamese learners.
- **Platforms:** Web application designed and optimized for both mobile and desktop browsers.
- **Scope & Focus:** Keep the core learning experience streamlined and robust. Avoid premature optimization and feature creep.

---

## 2. Git & Push Rules

Maintain strict repository hygiene at all times. Distinguish clearly between files safe for version control and files that must remain strictly local.

### Generally Safe to Commit & Push
- Application source code (components, utilities, styles, routes, state management)
- Tango-specific UI assets (optimized SVGs, icons, curated audio/images)
- Automated tests and test fixtures (without sensitive data)
- Public documentation (README, architecture notes, usage guides)
- Standard public configuration files (`package.json`, `tsconfig.json`, build configs)
- Package manager lock files (`pnpm-lock.yaml`, `package-lock.json`, etc.)
- Safe template environment files (e.g., `.env.example`, `.env.template`)

### Never Push (Must Stay Strictly Local)
- `.agents/` directory (strictly local skills, prompts, and tools)
- Secrets, private keys, API credentials, access tokens, or certificates
- `.env` and `.env.*` files containing real secrets or production keys
- Local-only tooling, custom runner scripts, or personal configurations
- Caches, temporary directories, and runtime logs (`node_modules/`, `dist/`, `build/`, `.cache/`, `logs/`, `*.log`, `tmp/`)
- Machine-specific files (OS files like `.DS_Store`, `Thumbs.db`, editor workspaces like `.idea/`)
- Unnecessary large binary dumps or unoptimized raw media assets

---

## 3. AI & Agent Guidelines

- **Local-Only Tooling:** AI tools and local agent environments may be utilized locally to assist development.
- **No AI Footprint in Repo:** Do NOT add AI agent directories, AI configurations, agent system prompts, automated AI workflow configs, AI SDKs, AI marketing badges, or references to specific AI assistants (Gemini, Claude, Codex, Cursor, etc.) to the repository unless explicitly requested by the project owner.
- **Isolation of `.agents/`:** The `.agents/` folder must remain strictly local and ignored by Git. Never copy files from `.agents/` into tracked application directories.
- **Clean Project Identity:** The public repository must present as a clean, professionally maintained software application authored and structured following standard engineering practices.

---

## 4. Development & Workflow Rules

- **Check Rules First:** Review this file before proposing or implementing significant architectural changes.
- **Simplicity First:** Prefer straightforward, maintainable, and readable solutions over clever or convoluted abstractions.
- **Dependency Discipline:** Do not introduce third-party libraries or dependencies without clear necessity. Evaluate lightweight native alternatives first.
- **Scope Discipline:** Focus solely on the designated task. Do not refactor or redesign unrelated parts of the codebase without a clear, stated purpose.
- **Safety Checks:** Never delete, overwrite, or rewrite significant existing code without verification.
- **Pre-Commit Verification:** Always run `git status` and inspect staged changes before committing to ensure no unintended files or secrets are staged.
- **Pre-Push Verification:** Confirm that no private, ignored, or local-only files are tracked prior to pushing to remote.

---

## 5. UI / UX Standards

- **Design Guidance:** The local skill `.agents/skills/ui-ux-pro-max` may be referenced locally for UX patterns, typography, color palettes, and component design principles. The skill itself must never be committed.
- **Mobile-First Usability:** Mobile responsiveness is a first-class requirement. Touch targets (minimum 44x44px), thumb reachability, and mobile viewport ergonomics must be validated alongside desktop layouts.
- **Typographic & Cultural Clarity:** Japanese typography (Kanji, Furigana, Kana) and Vietnamese diacritics must render legibly across devices with appropriate font stacks and spacing.
- **Accessibility:** Maintain proper semantic HTML, accessible color contrast ratios, clear focus indicators, and screen-reader considerations.

---

## 6. Modern Web & PWA Standards

- **Asset Optimization:** Store static media in clean formats (SVG for icons/vectors, WebP/AVIF for photos). Keep bundle size lean.
- **Offline & Storage Integrity:** Local persistence (e.g., IndexedDB, `localStorage`) must feature resilient schema handling to prevent data corruption during app updates.
- **Fast Startup:** Prioritize rapid initial render and responsive interaction latency on lower-end mobile hardware and varying network speeds.
