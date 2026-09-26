# Tango UI Specification — Destructive Dialog Screens (SCREEN 25 – 27)

> **Master Specification Reference:** [`docs/SCREEN_SPEC.md`](../SCREEN_SPEC.md) is the authoritative master index, route map, and responsive foundation for Tango.
> This domain file is authoritative for the detailed dialog layouts, wireframes, and interaction flows of **Destructive Dialog Screens (SCREEN 25 through SCREEN 27)**.
>
> **Design Tokens & Components:** Styled exclusively using the Soft Claymorphism design system in [`docs/DESIGN_SYSTEM.md`](../DESIGN_SYSTEM.md).
> **Hard-Delete Cascades:** Governed strictly by [`docs/CONTENT_LIBRARY_SPEC.md`](../CONTENT_LIBRARY_SPEC.md) and [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md).

---

## Screen Inventory

- [SCREEN 25: Delete Study Book Confirmation](#screen-25-delete-study-book-confirmation)
- [SCREEN 26: Delete Lesson Confirmation](#screen-26-delete-lesson-confirmation)
- [SCREEN 27: Remove Cover Confirmation](#screen-27-remove-cover-confirmation)

---

### Global Safety & Ergonomics Invariants

Destructive deletion in Tango is **strictly hard deletion** (no trash bin, no recycle bin, no soft restore). Consequently, destructive confirmation modals adhere to uncompromising safety invariants:
1. **Focus Protection:** The `[ Hủy bỏ ]` (Cancel) button **always holds initial focus**. Hitting `Enter` dismisses the dialog safely without executing deletion.
2. **Keyboard Dismissal:** The `Escape` key dismisses the dialog immediately.
3. **No Accidental Mis-Clicks:**
   - **Mobile (< 640px):** Full-width stacked buttons with **16px vertical gap**. `[ Hủy bỏ ]` is placed on top; `[ Xóa vĩnh viễn ]` is placed below in semantic error red styling (`--error`).
   - **Desktop / Tablet (>= 640px):** Centered `Modal` dialog (`max-w-md`). `[ Hủy bỏ ]` is placed on the left; `[ Xóa vĩnh viễn ]` is placed on the right with generous horizontal separation.

---

### SCREEN 25: Delete Study Book Confirmation

#### Purpose:
Destructive confirmation dialog before executing an irreversible cascading hard-delete of a Study Book and all of its contained lessons.

#### Entry:
[SCREEN 19: Manage Study Book](./SETTINGS_CONTENT_SCREENS.md#screen-19-manage-study-book-quản-lý-giáo-trình) Danger Zone `[ [IconTrash] Xóa giáo trình này ]`.

#### Copy & Warning:
- **Headline:** *"Xóa vĩnh viễn giáo trình?"*
- **Target Metadata:** Book title (e.g. `中級へ行こう`), total lesson count (e.g. `8 bài học`), and total item count (e.g. `164 mục học`).
- **Cascade Notice:** *"Toàn bộ bài học, mục từ, tiến độ học tập và ảnh bìa sẽ bị xóa hoàn toàn khỏi thiết bị. Hành động này không thể hoàn tác."*

#### Wireframes:
```text
MOBILE (< 640px - Centered / Bottom Sheet Modal)
┌───────────────────────────────────────────────┐
│ [IconAlertTriangle] Xóa vĩnh viễn giáo trình? │
├───────────────────────────────────────────────┤
│ Bạn có chắc chắn muốn xóa giáo trình:         │
│ "中級へ行こう" (8 bài học · 164 mục học)?      │
│                                               │
│ Toàn bộ bài học, tiến độ và ảnh bìa sẽ bị xóa │
│ hoàn toàn. Hành động này KHÔNG THỂ hoàn tác.  │
│                                               │
│ ┌───────────────────────────────────────────┐ │
│ │ [ Hủy bỏ — Giữ lại giáo trình ] (Focus)   │ │
│ └───────────────────────────────────────────┘ │
│                (16px spacing)                 │
│ ┌───────────────────────────────────────────┐ │
│ │ [ [IconTrash] Xóa vĩnh viễn giáo trình ]  │ │
│ └───────────────────────────────────────────┘ │
└───────────────────────────────────────────────┘

DESKTOP (> 1024px - max-w-md Centered Modal)
┌────────────────────────────────────────────────────────┐
│ [IconAlertTriangle] XÓA VĨNH VIỄN GIÁO TRÌNH?          │
├────────────────────────────────────────────────────────┤
│ Bạn có chắc chắn muốn xóa giáo trình:                  │
│ "中級へ行こう" (8 bài học · 164 mục học)?               │
│                                                        │
│ Toàn bộ bài học, tiến độ và ảnh bìa sẽ bị xóa          │
│ hoàn toàn. Hành động này KHÔNG THỂ hoàn tác.           │
│                                                        │
│ [ Hủy bỏ (Esc) ]         [ [IconTrash] Xóa vĩnh viễn ] │
└────────────────────────────────────────────────────────┘
```

---

### SCREEN 26: Delete Lesson Confirmation

#### Purpose:
Destructive confirmation dialog before permanently removing an individual lesson from local storage.

#### Entry:
[SCREEN 20: Manage Lesson](./SETTINGS_CONTENT_SCREENS.md#screen-20-manage-lesson-quản-lý-bài-học) Danger Zone `[ [IconTrash] Xóa bài học này ]`.

#### Copy & Scope Safeguard:
- **Headline:** *"Xóa vĩnh viễn bài học?"*
- **Target Metadata:** Lesson title (e.g. `Bài 1: Con người & Gia đình`), category (`Hán tự`), item count (`16 mục`), and parent book title (`中級へ行こう`).
- **Preservation Notice:** *"Giáo trình '中級へ行こう' và các bài học khác vẫn được giữ nguyên 100%."*
- **Actions:** Same button hierarchy, styling, and 16px gap rules as SCREEN 25.

---

### SCREEN 27: Remove Cover Confirmation

#### Purpose:
Confirmation dialog before removing a book cover image from IndexedDB.

#### Entry:
[SCREEN 19: Manage Study Book](./SETTINGS_CONTENT_SCREENS.md#screen-19-manage-study-book-quản-lý-giáo-trình) `[ [IconTrash] Xóa ảnh bìa ]`.

#### Copy & Scope Safeguard:
- **Headline:** *"Xóa ảnh bìa giáo trình?"*
- **Scope Clarification:** *"Giáo trình và toàn bộ bài học bên trong vẫn được giữ nguyên 100%. Chỉ ảnh bìa sẽ được gỡ bỏ khỏi thiết bị."*
- **Actions:**
  - `[ Hủy ]` (neutral outline, holds focus)
  - `[ [IconTrash] Xóa ảnh bìa ]` (semantic error red)
