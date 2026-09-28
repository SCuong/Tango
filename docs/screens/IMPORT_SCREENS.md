# Tango UI Specification — Lesson Import Screens (SCREEN 21 – 24)

> **Master Specification Reference:** [`docs/SCREEN_SPEC.md`](../SCREEN_SPEC.md) is the authoritative master index, route map, and responsive foundation for Tango.
> This domain file is authoritative for the detailed screen layouts, wireframes, and interaction flows of **Lesson Import Screens (SCREEN 21 through SCREEN 24)**.
>
> **Design Tokens & Components:** Styled exclusively using the Soft Claymorphism design system in [`docs/DESIGN_SYSTEM.md`](../DESIGN_SYSTEM.md).
> **Import Engine & Parsing Specification:** Governed by [`docs/IMPORT_SPEC.md`](../IMPORT_SPEC.md).

---

## Screen Inventory

- [SCREEN 21: Add / Import Lesson: Input Stage (Bước 1)](#screen-21-add--import-lesson-input-stage-bước-1)
- [SCREEN 22: Import Column Mapping / Parsing (Bước 2)](#screen-22-import-column-mapping--parsing-bước-2)
- [SCREEN 23: Import Preview & Validation (Bước 3)](#screen-23-import-preview--validation-bước-3)
- [SCREEN 24: Import Result / Completion (Bước 4)](#screen-24-import-result--completion-bước-4)

---

### Supported File Formats & Delimiters Invariant

In strict alignment with [`docs/IMPORT_SPEC.md`](../IMPORT_SPEC.md):
- **Supported File Formats:** `.txt`, `.csv`, `.md`, `.xlsx` (client-side in-memory parsing via standard HTML5 File API).
- **Supported Delimiters:**
  - `Tự động (khuyên dùng)` (intelligent auto-detection evaluating first 10 rows)
  - `Tab (\t)` (standard clipboard format from spreadsheets)
  - `Chấm phẩy (;)`
  - `Dấu gạch đứng (|)`
  - `Dấu phẩy (,)` (full RFC 4180 parsing with quotes)
  - `Ký hiệu khác...` (custom delimiter)

---

### SCREEN 21: Add / Import Lesson: Input Stage (Bước 1)

#### Purpose:
First stage of the authoritative lesson importer. Enables pasting text or selecting a local file, assigning parent book and category, and specifying lesson metadata.

#### Routes & Navigation:
- **Route:** `/settings/content-management/import`
- **Entry:** [SCREEN 17: Content Management](./SETTINGS_CONTENT_SCREENS.md#screen-17-content-management-quản-lý-nội-dung) `[IconFileImport] Thêm bài học mới`.
- **Exit:**
  - `[IconArrowLeft]` Back $\rightarrow$ SCREEN 17.
  - `[ Tiếp tục: Kiểm tra dữ liệu ]` $\rightarrow$ [SCREEN 22: Column Mapping](#screen-22-import-column-mapping--parsing-bước-2) (if headers need confirmation) or [SCREEN 23: Preview](#screen-23-import-preview--validation-bước-3) (if high confidence).

#### Form Fields:
1. `Giáo trình trực thuộc`: Dropdown selector (preselects book if navigated from SCREEN 19).
2. `Loại bài học`: Segmented toggle `[ [IconBook] Từ vựng ]` | `[ [IconWriting] Hán tự ]`.
3. `Tên bài học *`: Text input (e.g. `Bài 3: Đời sống & Môi trường`).
4. `Phương thức nhập`: Segmented toggle `[ Dán văn bản ]` | `[ Tải tệp lên ]`.
5. `Vùng nhập liệu`:
   - Paste mode: Responsive `<textarea>` with placeholder showing example rows.
   - File mode: File picker dropzone supporting `.txt`, `.csv`, `.md`, `.xlsx`.
6. `Phân cách cột`: Dropdown delimiter selector.

#### Responsive Layout:
- **Mobile (< 640px):** Single-column stacked form. Bottom sticky action bar with `[ Tiếp tục: Kiểm tra dữ liệu ]`.
- **Tablet / Desktop (>= 640px):** Centered `max-w-3xl` canvas. 2-section layout with metadata controls in a 2-column grid and text input area occupying full width below.

#### Wireframes:
```text
MOBILE (< 640px)
┌───────────────────────────────────────────────┐
│ [IconArrowLeft]  Thêm / Nhập bài học          │
├───────────────────────────────────────────────┤
│ Giáo trình trực thuộc                         │
│ [ 中級へ行こう                            ▼ ] │
│                                               │
│ Loại bài học                                  │
│ [ (•) [IconBook] Từ vựng ]   [ [IconWriting] ]│
│                                               │
│ Tên bài học *                                 │
│ [ Bài 3: Đời sống & Công việc               ] │
│                                               │
│ Phương thức nhập                              │
│ [ (•) Dán văn bản ]   [ ( ) Tải tệp lên ]     │
│                                               │
│ Dán nội dung tại đây:                         │
│ ┌───────────────────────────────────────────┐ │
│ │ 旅行	りょこう	LỮ HÀNH	du lịch               │ │
│ │ 家族	かぞく	GIA TỘC	gia đình              │ │
│ │                                           │ │
│ └───────────────────────────────────────────┘ │
│                                               │
│ Phân cách cột: [ Tự động (khuyên dùng)  ▼ ]   │
│                                               │
│ [StickyBottomBar: Tiếp tục: Kiểm tra dữ liệu] │
└───────────────────────────────────────────────┘

DESKTOP (> 1024px - max-w-3xl Centered)
┌────────────────────────────────────────────────────────────────────────┐
│ [IconArrowLeft] Quay lại Quản lý nội dung        THÊM / NHẬP BÀI HỌC   │
├────────────────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────┐ ┌──────────────────────────────┐ │
│ │ Giáo trình trực thuộc             │ │ Loại bài học                 │ │
│ │ [ 中級へ行こう                ▼ ] │ │ [ (•) Từ vựng ] [ ( ) Hán tự]│ │
│ └───────────────────────────────────┘ └──────────────────────────────┘ │
│                                                                        │
│ Tên bài học *                                                          │
│ [ Bài 3: Đời sống & Công việc                                        ] │
│                                                                        │
│ Phương thức nhập: [ (•) Dán văn bản ]  [ ( ) Tải tệp (.csv, .xlsx...) ]│
│                                                                        │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ 旅行	りょこう	LỮ HÀNH	du lịch, chuyến đi                         │ │
│ │ 家族	かぞく	GIA TỘC	gia đình                                   │ │
│ │ 会社	かいしゃ	HỘI XÃ	công ty                                    │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ Phân cách: [ Tự động (khuyên dùng) ▼ ]                                 │
│                                                                        │
│ [ [IconArrowRight] TIẾP TỤC: KIỂM TRA DỮ LIỆU (ENTER) ]                │
└────────────────────────────────────────────────────────────────────────┘
```

---

### SCREEN 22: Import Column Mapping / Parsing (Bước 2)

#### Purpose:
Shown when auto-detection requires user confirmation or adjustment of column headers before previewing.

#### Mapping Target Fields:
- `japanese` (Bắt buộc — Chữ Hán/Từ vựng)
- `kana` (Tùy chọn — Cách đọc Hiragana/Katakana)
- `hanViet` (Tùy chọn — Âm Hán Việt)
- `vietnamese` (Tùy chọn — Nghĩa tiếng Việt)

#### Mobile Safeguard:
- On mobile (< 640px), mapping uses **clean stacked dropdown cards** for each field rather than a squished desktop table.

#### Actions:
- `[ Quay lại ]` $\rightarrow$ SCREEN 21.
- `[ Xem trước kết quả ]` $\rightarrow$ [SCREEN 23: Import Preview](#screen-23-import-preview--validation-bước-3).

---

### SCREEN 23: Import Preview & Validation (Bước 3)

#### Purpose:
Pre-import verification summary displaying parsed items, deduplication results, and non-blocking warnings.

#### Elements:
- Header summary: Target Book, Category, Title, Total parsed rows.
- Badges: Valid count, Duplicate count (auto-merged), Warning count (`⚠`).
- Preview content:
  - Mobile: Stacked preview cards showing first 5 rows with badge pills.
  - Desktop: Scrollable table (`max-h-96`) showing all parsed rows.
- Actions: `[ Quay lại chỉnh sửa ]` and `[ Xác nhận nhập bài ]`.

---

### SCREEN 24: Import Result / Completion (Bước 4)

#### Purpose:
Clean success state confirming persistent storage to `tango_v1_lessons`.

#### Elements:
- Icon: Emerald `IconCircleCheckFilled`.
- Headline: *"Nhập bài học thành công!"*.
- Summary: e.g. *"Đã lưu 39 mục học vào Bài 3: Đời sống (Hán tự) trong giáo trình 中級へ行こう."*.
- Actions:
  - `[ Bắt đầu học bài này ngay ]` (Primary CTA $\rightarrow$ [SCREEN 05: Lesson Detail](./STUDY_SCREENS.md#screen-05-lesson-detail)).
  - `[ Về Quản lý nội dung ]` (Secondary CTA $\rightarrow$ [SCREEN 17: Content Management](./SETTINGS_CONTENT_SCREENS.md#screen-17-content-management-quản-lý-nội-dung)).
