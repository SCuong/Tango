# Tango — Project Overview

## 1. Project Name
**Tango** (単語) — A focused Japanese vocabulary and Kanji learning web application tailored specifically for Vietnamese learners.

---

## 2. Product Summary
Tango bridges the natural cognitive affinity between the Japanese language (specifically Kanji) and Sino-Vietnamese roots (Hán Việt). 

Learners can organize their study materials into multiple **Study Books (Giáo trình)** representing textbooks or curricula (e.g. *中級へ行こう*, *Mimikara*). Within each book, content is structured into two distinct categories:
- **[IconBook] Từ vựng (Vocabulary):** General vocabulary, word compounds, and phrases.
- **[IconWriting] Hán tự (Kanji):** Kanji vocabulary compounds and readings.

Both categories share the **exact same item schema** and the **exact same quiz engine**, allowing learners to study lessons individually, test within a textbook (`Kiểm tra giáo trình`), or combine any mix of lessons across books into a **Mixed Test (Kiểm tra tổng hợp)** (see [`docs/CONTENT_LIBRARY_SPEC.md`](./CONTENT_LIBRARY_SPEC.md)).

The application is built for:
- Mobile phones (primary use case during daily commute and short study breaks)
- Tablets
- Desktop and laptop web browsers

Tango is delivered as a modern, responsive web application with Progressive Web App (PWA) capabilities, enabling offline study and home-screen installation without app store overhead.

---

## 3. Core Learning Concept
Tango connects four linguistic anchors for every study item:

```
        Japanese Word / Kanji
                 ↕
            Kana Reading
                 ↕
         Vietnamese Meaning
                 ↕
Sino-Vietnamese Reading (Hán Việt, when applicable)
```

### Active Recall Over Passive Review
Traditional flashcards often encourage passive recognition (flipping cards without deep cognitive effort). Tango prioritizes **active recall** through short, interactive multi-choice and written quizzes that force the brain to actively retrieve readings, meanings, and kanji combinations.

---

## 4. Main Goal & The Core Study Loop
The core user journey is rapid, cyclical, and frictionless:

```
Browse Study Book or Category → Select Lesson(s)
                    ↓
           Start Practice Session
                    ↓
          Take Quiz (10 / 20 / 40 / Tất cả (N))
                    ↓
          Immediate Mistake Analysis
                    ↓
   Understand Meaning & Hán Việt (if present)
                    ↓
           Review Missed Words
                    ↓
           Long-term Retention
```

---

## 5. Target User
- **Primary Audience:** Vietnamese students, professionals, and self-learners studying Japanese (from N5/N4 foundations up to N3/N2/N1).
- **Core Need:** Remembering Kanji vocabulary is notoriously difficult when relying purely on rote memorization. Understanding Hán Việt unlocks an intuitive vocabulary boost for Vietnamese speakers because thousands of Japanese Kanji compounds share phonetic and semantic roots with Vietnamese Sino-Vietnamese words.

---

## 6. Product Principles

1. **Two Categories, One Engine:** Vocabulary and Kanji are separated in UX for clean curriculum navigation, but share the identical underlying data schema and quiz machinery.
2. **Flexible Multi-Lesson Study:** Learners can practice a single lesson or select any arbitrary combination of Vocabulary and Kanji lessons for a combined test.
3. **Instant Study Start:** No mandatory sign-up walls, onboarding mazes, or complex menus. A user can open the app and be practicing within 3 seconds.
4. **Bite-Sized Sessions:** Designed around 2 to 5-minute study intervals (10–20 questions) suitable for busy schedules.
5. **Mobile-First Ergonomics:** UI designed for one-handed thumb interaction on mobile devices, while cleanly expanding into a centered, keyboard-friendly layout on desktop.
6. **Typographic Clarity:** Japanese characters (Kanji, Furigana, Kana) and Vietnamese diacritical marks must render with impeccable sharpness, appropriate font weights, and clear visual hierarchy.
7. **Clean Contextual Explanations:** When a mistake occurs, Tango displays the Kana, Vietnamese definition, and Hán Việt (if present). When Hán Việt is absent (e.g. Katakana words), the section is cleanly hidden.
8. **Zero Clutter:** No intrusive popups, spammy notifications, excessive gamification gimmicks, or visual noise that distracts from learning.
9. **No Feature Creep:** Maintain an uncompromising focus on vocabulary acquisition. Keep the MVP lean, reliable, and fast.
10. **Safe Study-First UX:** The Home screen is dedicated purely to reading and studying. Destructive actions, content additions, and book management are safely placed under Settings → Content Management to eliminate accidental taps (see [`docs/CONTENT_LIBRARY_SPEC.md`](./CONTENT_LIBRARY_SPEC.md)).
