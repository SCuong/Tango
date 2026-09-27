# Tango UI Specification — Settings & Content Management Screens (SCREEN 16 – 20)

> **Master Specification Reference:** [`docs/SCREEN_SPEC.md`](../SCREEN_SPEC.md) is the authoritative master index, route map, and responsive foundation for Tango.
> This domain file is authoritative for the detailed screen layouts, wireframes, and interaction flows of **Settings & Content Management Screens (SCREEN 16 through SCREEN 20)**.
>
> **Design Tokens & Components:** Styled exclusively using the Soft Claymorphism design system in [`docs/DESIGN_SYSTEM.md`](../DESIGN_SYSTEM.md). Every screen here follows its [Canonical Cross-Screen UI Baseline](../DESIGN_SYSTEM.md#canonical-cross-screen-ui-baseline); dense settings and management lists use the flat level of its clay hierarchy.
> **Domain Architecture:** Governed by [`docs/CONTENT_LIBRARY_SPEC.md`](../CONTENT_LIBRARY_SPEC.md).

---

## Screen Inventory

- [SCREEN 16: Settings (Cài đặt)](#screen-16-settings-cài-đặt)
- [SCREEN 17: Content Management (Quản lý nội dung)](#screen-17-content-management-quản-lý-nội-dung)
- [SCREEN 18: Add Study Book (Thêm giáo trình)](#screen-18-add-study-book-thêm-giáo-trình)
- [SCREEN 19: Manage Study Book (Quản lý giáo trình)](#screen-19-manage-study-book-quản-lý-giáo-trình)
- [SCREEN 20: Manage Lesson (Quản lý bài học)](#screen-20-manage-lesson-quản-lý-bài-học)

---

### SCREEN 16: Settings (Cài đặt)

#### Purpose:
App preferences management and intentional gateway to administrative content operations.

#### Routes & Navigation:
- **Route:** `/settings`
- **Entry:** the **Cài đặt / Settings** primary destination (mobile bottom bar, Home header from `sm` up, or `Alt+S` on Home); see [`DESIGN_SYSTEM.md` §16.0](../DESIGN_SYSTEM.md#160-primary-navigation-home--test--settings).
- **Exit:**
  - Mobile: Settings is a root destination; leave through the Home / Test tabs of the bottom navigation (no back arrow).
  - Tablet/Desktop: `[IconX]` Close or `Escape` $\rightarrow$ Closes modal.

#### Canonical Responsive Presentation:
- **Mobile (< 640px):** **Full-screen root screen** (`/settings`): title only (no back arrow) and the floating primary navigation with Settings active. Opening Content Management hides the bottom navigation; its back arrow returns to Settings.
- **Tablet / Desktop (>= 640px):** **Centered modal dialog** (`max-w-lg`) with backdrop blur and `[IconX]` top-right close button.

#### Content Sections:
1. **Giao diện & Tùy chọn (Appearance & Preferences):**
   - **Language:** Segmented control `[ Tiếng Việt ]` | `[ English ]`
   - **Theme (Chủ đề màu sắc):**
     - Three visual preview cards are visible, never a plain text toggle: `Sáng / Light`, `Tối / Dark`, `Sakura` (the standard themes).
     - **Easter-egg reveal:** a small clay arrow button in a reserved gutter beside the vertical middle of the card row (never over a card) (`Xem thêm chủ đề` / `More themes`; its name never spoils the surprise) slides the track **one card** to the left (≈280ms, `cubic-bezier(0.22, 1, 0.36, 1)`): Light slides out and the fourth theme, `Mèo mập 😺` / `Meo's World`, enters from the right. A left arrow (`Quay lại các chủ đề trước` / `Previous themes`) then replaces it beside the left-middle edge and reverses the shift. The picker reserves one 44px arrow gutter and slides the card row across it with the shift, so the first position reads `[ Light ] [ Dark ] [ Sakura ] >` and the second `< [ Dark ] [ Sakura ] [ Meo's World ]`. It is an overflow-clipped track (cards keep their size and spacing), not a page of three and never a teleport; off-screen cards fade out, are `aria-hidden`, and are not focusable. Arrows are real 48px buttons with a 36px visual puck, keyboard operable with focus-visible rings; reduced motion makes the shift instant.
     - If the persisted theme is `meo`, Settings opens on the second position so the selected card is visible. Choosing Dark or Sakura there does not force the carousel back; arrow-key selection of a hidden theme brings it into view.
     - Each card renders a miniature of the **current** Tango shell in its own theme's tokens: a tiny top bar with the cat wordmark, the Vocabulary (`語`) / Kanji (`漢`) category cards, and a 3-item Home / Test / Settings navigation with Home active, plus the localized theme name. Simple shapes only (no stale Home CTA bar, no text paragraphs); the canvas motif hints at the ambience, and Meo's World adds only the mini navigation's brown outline and cat ears.
     - Selected state: primary border plus a 2px primary ring (a shape cue, never a color change alone), no check badge; the option is a real radio choice (`role="radiogroup"` / `role="radio"`, `aria-checked`).
     - Selecting a card applies the theme immediately and persists it to `tango_v1_preferences.theme`.
     - Theme selection exists **only** in Settings. Home and other study screens show no theme status or theme control; do not add a theme toggle to any TopBar.
     - The previews use the canonical palettes and ambience identities (Light — Cool Pearl, Dark — Midnight Ink, Sakura — Warm Blossom Paper, Meo's World — the special cat theme of §9.4) defined in [`docs/DESIGN_SYSTEM.md` §9 / §16.5](../DESIGN_SYSTEM.md#9-theme-palette-specifications).
   - **Sound Effects:** Segmented control `[ Off / Tắt ]` | `[ On / Bật ]` (Default: **Off**)
2. **Nội dung học (Study Content):**
   - Clickable row: `Quản lý giáo trình và bài học` $\rightarrow$ navigates to [SCREEN 17: Content Management](#screen-17-content-management-quản-lý-nội-dung).

#### Wireframe (Mobile Route & Desktop Modal):
```text
SETTINGS PANEL
┌───────────────────────────────────────────────┐
│ CÀI ĐẶT                              [IconX]  │
├───────────────────────────────────────────────┤
│ GIAO DIỆN & TÙY CHỌN                          │
│                                               │
│ Ngôn ngữ giao diện                            │
│ [ (•) Tiếng Việt ]     [ ( ) English ]        │
│                                               │
│ Chủ đề màu sắc                                │
│ ┌───────────┐  ┌───────────┐  ┌───────────┐  │
│ │ ▢▢ ▬      │  │ ▢▢ ▬      │  │ ▢▢ ▬      │  │  <- each card previews its
│ │ page/card │  │ page/card │  │ page/card │  │     own page, surface and
│ │ accent    │  │ accent    │  │ accent    │  │     accent colors
│ │ Sáng   [✓]│  │ Tối       │  │ Sakura    │  │
│ └───────────┘  └───────────┘  └───────────┘  │
│                                               │
│ Âm thanh hiệu ứng                             │
│ [ (•) Tắt (Off) ]      [ ( ) Bật (On) ]       │
│                                               │
│ NỘI DUNG HỌC                                  │
│ ┌───────────────────────────────────────────┐ │
│ │ Quản lý giáo trình và bài học   [IconChevronRight] │
│ └───────────────────────────────────────────┘ │
└───────────────────────────────────────────────┘
```

---

### SCREEN 17: Content Management (Quản lý nội dung)

#### Purpose:
The single protected administrative hub for adding, editing, and managing textbooks and lessons. Keeps administrative controls completely segregated from study screens.

#### Routes & Navigation:
- **Route:** `/settings/content-management`
- **Entry:** Settings row "Quản lý giáo trình và bài học".
- **Exit:** `[IconArrowLeft]` Back $\rightarrow$ [SCREEN 16: Settings](#screen-16-settings-cài-đặt).
- **Actions:**
  - `Thêm giáo trình (+)` $\rightarrow$ [SCREEN 18: Add Study Book](#screen-18-add-study-book-thêm-giáo-trình).
  - `[ Quản lý ]` beside a book $\rightarrow$ [SCREEN 19: Manage Study Book](#screen-19-manage-study-book-quản-lý-giáo-trình).
  - `[IconFileImport] Thêm bài học mới` $\rightarrow$ [SCREEN 21: Import Input](./IMPORT_SCREENS.md#screen-21-add--import-lesson-input-stage-bước-1).
  - `[ Quản lý ]` beside an unassigned lesson $\rightarrow$ [SCREEN 20: Manage Lesson](#screen-20-manage-lesson-quản-lý-bài-học).

#### Management Paths & Unassigned Lessons Rules:
1. **Lessons Assigned to a Study Book:** Managed strictly through: Content Management $\rightarrow$ Manage Study Book (SCREEN 19) $\rightarrow$ Manage Lesson (SCREEN 20). No giant global lesson list is displayed.
2. **Dedicated Unassigned Section (Không thuộc giáo trình):**
   - When one or more lessons exist without a parent book (`Lesson.bookId === undefined`), SCREEN 17 displays a dedicated section:
     ```text
     KHÔNG THUỘC GIÁO TRÌNH
     Bài học A     [ Quản lý ]
     Bài học B     [ Quản lý ]
     ```
   - **Conditional Display:** Shown **strictly when at least one unassigned lesson exists**. If all lessons belong to textbooks, this section is completely hidden.
   - Each unassigned lesson row displays its title, category badge, item count, and a `[ Quản lý ]` action button opening [SCREEN 20: Manage Lesson](#screen-20-manage-lesson-quản-lý-bài-học).
3. **Canonical Reassignment (No Duplicate Move-Lesson Flow):**
   - Lesson reassignment (assigning to a book or switching books) is performed **strictly inside SCREEN 20** through the parent Study Book selector.
   - There is NO duplicate "Move lesson" or "Chuyển giáo trình" quick action in Content Management.
4. **Home Remains Study-Only:** Administrative management of both assigned and unassigned lessons remains strictly within Settings $\rightarrow$ Content Management.

#### Responsive Layout:
- **Mobile (< 640px):** Full-screen stacked list. Study Books roster listed first, followed by Unassigned Lessons (if any exist), followed by lesson creation CTA.
- **Tablet / Desktop (>= 640px):** **Structured 2-column management dashboard** (`max-w-4xl`):
  - Left Column (60%): Study Books list with `[ Quản lý ]` actions and `Thêm giáo trình (+)` action.
  - Right Column (40%): Lessons & Import quick tools (`[IconFileImport] Thêm bài học mới`), plus the Unassigned Lessons roster (if any exist) with `[ Quản lý ]` buttons.

#### Wireframes:
```text
MOBILE (< 640px)
┌───────────────────────────────────────────────┐
│ [IconArrowLeft]  Quản lý nội dung             │
├───────────────────────────────────────────────┤
│ GIÁO TRÌNH (STUDY BOOKS)                      │
│ ┌───────────────────────────────────────────┐ │
│ │ [Thumb] 中級へ行こう          [ Quản lý ] │ │
│ │         8 bài · 164 mục                   │ │
│ ├───────────────────────────────────────────┤ │
│ │ [Thumb] Mimikara              [ Quản lý ] │ │
│ │         5 bài · 110 mục                   │ │
│ └───────────────────────────────────────────┘ │
│                                               │
│ [ Thêm giáo trình (+) ]                       │
│                                               │
│ KHÔNG THUỘC GIÁO TRÌNH (khi có bài lẻ)        │
│ ┌───────────────────────────────────────────┐ │
│ │ 20 từ Kanji N3 (20 mục)       [ Quản lý ] │ │
│ ├───────────────────────────────────────────┤ │
│ │ Chữ Hán cơ bản (15 mục)       [ Quản lý ] │ │
│ └───────────────────────────────────────────┘ │
│                                               │
│ THAO TÁC BÀI HỌC (LESSONS)                    │
│ ┌───────────────────────────────────────────┐ │
│ │ [IconFileImport]                          │ │
│ │ Thêm bài học mới                          │ │
│ └───────────────────────────────────────────┘ │
└───────────────────────────────────────────────┘

DESKTOP (> 1024px - max-w-4xl Centered)
┌────────────────────────────────────────────────────────────────────────┐
│ [IconArrowLeft] Quay lại Cài đặt             QUẢN LÝ NỘI DUNG          │
├────────────────────────────────────────────────────────────────────────┤
│ GIÁO TRÌNH (STUDY BOOKS)               BÀI HỌC & NHẬP LIỆU             │
│ ┌────────────────────────────────────┐ ┌─────────────────────────────┐ │
│ │ [Thumb] 中級へ行こう    [ Quản lý ]│ │ [IconFileImport]            │ │
│ │         8 bài · 164 mục            │ │ Thêm bài học mới            │ │
│ ├────────────────────────────────────┤ └─────────────────────────────┘ │
│ │ [Thumb] Mimikara        [ Quản lý ]│                                 │
│ │         5 bài · 110 mục            │                                 │
│ └────────────────────────────────────┘                                 │
│                                        KHÔNG THUỘC GIÁO TRÌNH          │
│ [ Thêm giáo trình (+) ]                ┌─────────────────────────────┐ │
│                                        │ • 20 từ N3      [ Quản lý ] │ │
│                                        │ • Chữ Hán N4    [ Quản lý ] │ │
│                                        └─────────────────────────────┘ │
│                                        (Chỉ hiện khi có bài chưa gán)  │
└────────────────────────────────────────────────────────────────────────┘
```

---

### SCREEN 18: Add Study Book (Thêm giáo trình)

#### Purpose:
Creates a new `StudyBook` record in local storage.

#### Presentation:
- **Mobile (< 640px):** Full-screen form route with top `[IconArrowLeft]` cancel and bottom sticky `[ Tạo giáo trình ]`.
- **Tablet / Desktop (>= 640px):** Centered `Modal` dialog (`max-w-md`).

#### Form Fields & Validation:
1. `Tên giáo trình *`: Required text input. Real-time validation (cannot be empty). Duplicate titles are explicitly allowed.
2. `Ảnh bìa (không bắt buộc)`: Native file picker. Supported formats: `.jpg`, `.jpeg`, `.png`, `.webp`. Live preview box with 3:4 aspect ratio.
3. Actions: `[ Hủy ]` and `[ Tạo giáo trình ]` (disabled when title is empty).

---

### SCREEN 19: Manage Study Book (Quản lý giáo trình)

#### Purpose:
Inspects and modifies a single Study Book: title rename, cover replace/remove, lesson roster, and book Danger Zone.

#### Routes & Navigation:
- **Route:** `/settings/content-management/book/:bookId`
- **Entry:** [SCREEN 17: Content Management](#screen-17-content-management-quản-lý-nội-dung) `[ Quản lý ]` beside a book.
- **Exit:** `[IconArrowLeft]` Back $\rightarrow$ SCREEN 17.

#### Lesson Row Safety Rule:
> **No Direct Delete Beside Lesson Rows:** Lesson rows inside the book manager show **only `[ Quản lý ]`**. They **never** include an adjacent inline delete icon. Accidental mis-clicks are prevented by isolating lesson deletion inside [SCREEN 20: Manage Lesson](#screen-20-manage-lesson-quản-lý-bài-học).

#### Responsive Layout:
- **Mobile (< 640px):** Single-column stacked canvas: Book metadata form at the top, lesson roster in the middle, Add Lesson CTA, and Danger Zone at the bottom.
- **Tablet / Desktop (>= 640px):** Centered `max-w-4xl` canvas. 2-column layout:
  - Left Column (40%): Book details card (Title input, 3:4 Cover preview, Change/Remove cover actions, Danger Zone).
  - Right Column (60%): Lesson roster with `[ Quản lý ]` buttons and `+ Thêm bài vào giáo trình này` CTA.

#### Wireframes:
```text
MOBILE (< 640px)
┌───────────────────────────────────────────────┐
│ [IconArrowLeft]  Quản lý: 中級へ行こう        │
├───────────────────────────────────────────────┤
│ Tên giáo trình                                │
│ [ 中級へ行こう                              ] │
│                                               │
│ Ảnh bìa:                                      │
│ [Preview 3:4]  [ Thay ảnh ]  [ Xóa ảnh bìa ]  │
│                                               │
│ DANH SÁCH BÀI HỌC (8 bài)                     │
│ • Bài 1: Từ vựng (20 mục)         [ Quản lý ] │
│ • Bài 2: Từ vựng (22 mục)         [ Quản lý ] │
│ • Bài 1: Hán tự (16 mục)          [ Quản lý ] │
│                                               │
│ [ [IconPlus] Thêm bài vào giáo trình này ]    │
│                                               │
│ ───────────────────────────────────────────── │
│ VÙNG NGUY HIỂM (DANGER ZONE)                  │
│ Xóa vĩnh viễn giáo trình và toàn bộ bài học.  │
│ [ [IconTrash] Xóa giáo trình này ]            │
└───────────────────────────────────────────────┘

DESKTOP (> 1024px - max-w-4xl Centered)
┌────────────────────────────────────────────────────────────────────────┐
│ [IconArrowLeft] Quay lại Quản lý nội dung        QUẢN LÝ GIÁO TRÌNH    │
├────────────────────────────────────────────────────────────────────────┤
│ THÔNG TIN GIÁO TRÌNH                   DANH SÁCH BÀI HỌC (8 BÀI)       │
│ ┌────────────────────────────────────┐ ┌─────────────────────────────┐ │
│ │ Tên giáo trình *                   │ │ • Bài 1: Từ vựng (20 mục)   │ │
│ │ [ 中級へ行こう                   ] │ │                 [ Quản lý ] │ │
│ │                                    │ ├─────────────────────────────┤ │
│ │ Ảnh bìa:                           │ │ • Bài 2: Từ vựng (22 mục)   │ │
│ │ ┌──────────┐ [ [IconPhoto] Thay ]  │ │                 [ Quản lý ] │ │
│ │ │ Cover    │                       │ ├─────────────────────────────┤ │
│ │ │ Preview  │ [ [IconTrash] Xóa ảnh]│ │ • Bài 1: Hán tự (16 mục)    │ │
│ │ └──────────┘                       │ │                 [ Quản lý ] │ │
│ │                                    │ └─────────────────────────────┘ │
│ │ [ Lưu thay đổi tên sách ]          │                                 │
│ ├────────────────────────────────────┤ [ [IconPlus]                    │
│ │ VÙNG NGUY HIỂM                     │   Thêm bài vào giáo trình này ] │
│ │ [ [IconTrash] Xóa giáo trình này ] │                                 │
│ └────────────────────────────────────┘                                 │
└────────────────────────────────────────────────────────────────────────┘
```

---

### SCREEN 20: Manage Lesson (Quản lý bài học)

#### Purpose:
Dedicated administrative screen for a single lesson. Handles renaming, category switching, parent book reassignment, and lesson deletion.

#### Routes & Navigation:
- **Route:** `/settings/content-management/lesson/:lessonId`
- **Entry:** Tapping `[ Quản lý ]` beside a lesson row in SCREEN 19 or SCREEN 17.
- **Exit:**
  - `[IconArrowLeft]` Back $\rightarrow$ Previous screen.
  - `[ [IconTrash] Xóa bài học này ]` $\rightarrow$ [SCREEN 26: Delete Lesson Confirmation](./DIALOG_SCREENS.md#screen-26-delete-lesson-confirmation).

#### Capabilities & Safety:
1. **Rename Title & Subtitle:** Direct input fields for `title` and optional `subtitle`.
2. **Category Switcher:** Toggle `category: 'vocabulary' | 'kanji'`.
3. **Parent Book Selector:** Dropdown menu listing all user books plus `Không thuộc giáo trình` (Unassigned).
4. **Safety Guarantee:** Reassigning parent book or category modifies organizational metadata only; it **never** changes `Lesson.id`, item IDs, or resets quiz progress.
5. **Save Requirement:** Explicit click on `[ Lưu thay đổi ]` is required (no accidental auto-commits on focus changes).

#### Wireframes:
```text
MOBILE (< 640px)
┌───────────────────────────────────────────────┐
│ [IconArrowLeft]  Quản lý bài học              │
├───────────────────────────────────────────────┤
│ Tên bài học *                                 │
│ [ Bài 1: Con người & Gia đình               ] │
│                                               │
│ Phụ đề chủ đề (không bắt buộc)                │
│ [ Gia đình và các mối quan hệ               ] │
│                                               │
│ Loại bài học                                  │
│ [ [IconBook] Từ vựng ]   [ (•) [IconWriting] Hán tự ] │
│                                               │
│ Giáo trình trực thuộc                         │
│ [ 中級へ行こう                            ▼ ] │
│                                               │
│ Số lượng mục học: 16 mục                      │
│                                               │
│ [ [IconDeviceFloppy] Lưu thay đổi ]           │
│                                               │
│ ───────────────────────────────────────────── │
│ VÙNG NGUY HIỂM (DANGER ZONE)                  │
│ Xóa vĩnh viễn bài học này khỏi giáo trình.    │
│ [ [IconTrash] Xóa bài học này ]               │
└───────────────────────────────────────────────┘

DESKTOP (> 1024px - max-w-2xl Centered)
┌────────────────────────────────────────────────────────┐
│ [IconArrowLeft] Quay lại danh sách bài học             │
├────────────────────────────────────────────────────────┤
│ QUẢN LÝ BÀI HỌC — Bài 1: Con người & Gia đình          │
│                                                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Tên bài học *                                      │ │
│ │ [ Bài 1: Con người & Gia đình                    ] │ │
│ │                                                    │ │
│ │ Phụ đề chủ đề (không bắt buộc)                     │ │
│ │ [ Gia đình và các mối quan hệ                    ] │ │
│ │                                                    │ │
│ │ Loại bài học                                       │ │
│ │ [ [IconBook] Từ vựng ]  [ (•) [IconWriting] Hán tự]│ │
│ │                                                    │ │
│ │ Giáo trình trực thuộc                              │ │
│ │ [ 中級へ行こう                                 ▼ ] │ │
│ │                                                    │ │
│ │ Số lượng mục học: 16 mục                           │ │
│ │                                                    │ │
│ │ [ [IconDeviceFloppy] LƯU THAY ĐỔI (ENTER) ]        │ │
│ ├────────────────────────────────────────────────────┤ │
│ │ VÙNG NGUY HIỂM                                     │ │
│ │ Xóa vĩnh viễn bài học này và toàn bộ 16 mục học.   │ │
│ │ [ [IconTrash] Xóa bài học này ]                    │ │
│ └────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```
