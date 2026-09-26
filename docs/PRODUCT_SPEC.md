# Tango — Product Specification (MVP)

This specification defines the functional requirements and user experience for the Minimum Viable Product (MVP) of Tango.

---

## 1. Vocabulary Sets & Data Semantics

A vocabulary set represents a cohesive collection of words (e.g., a textbook chapter or thematic list).

### Vocabulary Item Anatomy

Each word contains core and optional linguistic dimensions:

| Field | Requirement | Example 1 (Kanji Compound) | Example 2 (Katakana Loanword) |
|---|---|---|---|
| **Japanese** | Required | 観光客 | ハンバーガー |
| **Kana** | Required | かんこうきゃく | はんばーがー |
| **Vietnamese** | Required (1+ meanings) | khách tham quan, khách du lịch | bánh mì hamburger |
| **Hán Việt** | Optional | QUAN QUANG KHÁCH | *(omitted)* |
| **Kanji Breakdown** | Optional | 観 → QUAN<br>光 → QUANG<br>客 → KHÁCH | *(omitted)* |

### Clean Presentation Rule
- When Hán Việt or Kanji breakdown data is absent (e.g., for Katakana words, pure Hiragana phrases, or words without clear Sino-Vietnamese cognates), the UI **must completely hide** that section.
- **Never display placeholder labels** like *"Hán Việt: None"*, *"Hán Việt: N/A"*, or empty badge containers.

---

## 2. Quiz Question Types (MVP)

The MVP quiz engine supports four core question types, designed with a modular interface so additional directions can be added seamlessly:

### Type 1: Kana → Japanese / Kanji
- **Prompt:** `かんこうきゃく`
- **Goal:** Identify the correct written Japanese/Kanji form.
- **Options (4 choices):**
  1. 観光客 *(Correct)*
  2. 体重
  3. 理由
  4. 作品

### Type 2: Japanese → Vietnamese
- **Prompt:** `観光客（かんこうきゃく）` *(with Kana reading)*
- **Goal:** Select the matching Vietnamese meaning.
- **Options (4 choices):**
  1. khách tham quan, khách du lịch *(Correct)*
  2. cân nặng cơ thể
  3. lý do, nguyên cớ
  4. tác phẩm nghệ thuật

### Type 3: Vietnamese → Japanese
- **Prompt:** `khách tham quan, khách du lịch`
- **Goal:** Select the corresponding Japanese word.
- **Options (4 choices):**
  1. 観光客 *(Correct)*
  2. 体重
  3. 理由
  4. 作品

### Type 4: Vietnamese → Written Answer (Text Input)
- **Prompt:** `khách tham quan, khách du lịch`
- **Input Mode:** An inline input field with autofocus.
- **Accepted Inputs:** Depending on the exercise configuration:
  - Exact Kanji: `観光客`
  - Or phonetic Kana: `かんこうきゃく`
- **Matching Rules:** Trims leading/trailing whitespace; tolerant of standard Japanese punctuation if applicable.

### Extensible Question Engine Architecture
Question generators must implement a standard interface:
```typescript
interface QuizQuestion {
  id: string;
  type: 'kana_to_kanji' | 'kanji_to_vi' | 'vi_to_kanji' | 'vi_to_text';
  prompt: string;
  subPrompt?: string; // e.g., reading aid or instruction
  correctAnswer: string;
  options?: string[]; // for multiple-choice types
  targetItem: VocabularyItem; // reference to complete vocabulary entity
}
```
This guarantees future question types (e.g., Audio → Japanese, Hán Việt → Kanji) can be introduced without modifying the core quiz runner.

---

## 3. Study Modes

Tango provides two complementary modes tailored for different learning states:

### 3.1 Practice Mode (Learning & Exploration)
- **Objective:** Deep learning, low pressure.
- **Behavior:**
  - Mistakes are not heavily penalized (no "game over").
  - Immediate feedback following each answer.
  - Comprehensive explanation displayed upon incorrect answers.
  - Words answered incorrectly are automatically re-queued later in the session until answered correctly.
  - Session can be restarted or exited at any time without progress loss penalties.

### 3.2 Quick Test (Active Testing & Assessment)
- **Objective:** Quick assessment, retention benchmark.
- **Session Length Options:**
  - 10 Questions (Quick 2-minute sprint)
  - 20 Questions (Standard session)
  - All Words in Set (Comprehensive test)
- **Session HUD (Heads-Up Display):**
  - Question Progress Indicator (`Question 4 of 20`)
  - Running Score (`Score: 300`)
  - Current Streak Counter (`🔥 4 in a row`)
  - Optional Lives/Hearts indicator (e.g., 3 lives maximum; optional toggle in settings)
  - Elapsed Time Counter
- **Pacing:** Fast, rhythmic transitions to maintain study flow without disruptive animations.

---

## 4. Feedback & Explanation Mechanics

### 4.1 Correct Answer Feedback
Keep correct feedback ultra-lean to maintain learning momentum:
- Brief positive visual indicator (gentle green highlight).
- Displays word, reading, and primary meaning.
- Auto-advances after a short delay (e.g., 750ms) or on pressing Enter/Space/Tap.

### 4.2 Incorrect Answer Explanation
When an incorrect answer is submitted, the system pauses to provide actionable educational context:
- Distinct, gentle red indicator highlighting the error and revealing the correct answer.
- **Explanation Card Content:**
  - Primary Japanese Word (`観光客`)
  - Kana Reading (`かんこうきゃく`)
  - Vietnamese Meaning (`khách tham quan, khách du lịch`)
  - Hán Việt Reading (`QUAN QUANG KHÁCH`, if available)
  - Kanji Breakdown (if available):
    - `観` → QUAN (quan sát, xem xét)
    - `光` → QUANG (ánh sáng, cảnh quang)
    - `客` → KHÁCH (hành khách, khách thập phương)
- User explicitly taps or presses `Enter` / `Continue` when ready.

---

## 5. End of Quiz & Mistake Review

Upon completing a quiz session, the user receives an actionable summary screen:

### Summary Metrics
- **Overall Score** (points earned based on accuracy and speed)
- **Accuracy Rate** (e.g., `85%`)
- **Best Streak** (e.g., `7 in a row`)
- **Total Elapsed Time** (e.g., `1m 45s`)
- **Missed Vocabulary List:** Expandable cards showing each word failed during the session.

### Primary Actions
1. **Review Missed Words (High Priority):** Launches an immediate, targeted practice session containing *only* the vocabulary missed during the quiz.
2. **Retry Quiz:** Restarts the quiz with fresh question randomization.
3. **Return to Vocabulary Set:** Returns to the set overview page.

---

## 6. Vocabulary Set Management (Plan & Architecture)

### Bundled Sets
The application ships with built-in, curated vocabulary sets (e.g., sample lessons from intermediate Japanese textbooks such as *中級へ行こう* or JLPT levels).

### Custom Vocabulary Sets Architecture
The architecture is structured to support user-created vocabulary sets:
- **Bulk Import Format:** Delimited text rows pasted into an import area:
  ```text
  観光客 | かんこうきゃく | khách tham quan, khách du lịch | QUAN QUANG KHÁCH
  ハンバーガー | はんばーがー | bánh mì hamburger |
  ```
- Parser automatically splits entries, trims whitespace, extracts multiple meanings, and infers Kanji breakdown where possible.
- *Status for MVP:* Core data model and parser logic designed first; interactive import UI scheduled as the direct follow-up feature.

---

## 7. Scope Guard (Strictly Excluded from MVP)

To ensure rapid delivery, zero bloat, and rock-solid stability, the following features are **explicitly out of scope** for MVP:
- AI chatbots, AI-generated content, or external LLM APIs
- User account creation, authentication, or cloud sync
- Backend database or server-side microservices
- Speech recognition / voice pronunciation grading
- Canvas handwriting / stroke order recognition
- Social sharing, multiplayer battles, or public leaderboards
- Full Japanese-Vietnamese comprehensive dictionary search
- Monetization, payment gateways, or subscription checks
