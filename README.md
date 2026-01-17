# Legal Document Editor with Print‑Accurate Pagination

This repository contains a **Tiptap‑based rich text editor** built as part of an internship take‑home assignment. The goal of the project is to demonstrate **real‑time, print‑accurate pagination** for legal documents, similar to how Google Docs or Microsoft Word display page boundaries while typing.

The editor is designed for **legal and immigration workflows**, where understanding exactly what appears on Page 1, Page 2, and so on is critical for submission‑ready documents.

---

## Key Features

* **Real‑time pagination** with visible page boundaries
* **Fixed A4 page size** with standard 1‑inch margins
* **Single Tiptap editor instance** (no document fragmentation)
* **Schema‑based pagination** (no CSS‑only clipping hacks)
* **Dynamic reflow** when editing anywhere in the document
* **Support for standard formatting**:

  * Headings (H1, H2)
  * Paragraphs
  * Bold / Italic
  * Bullet and ordered lists
  * Tables
* **Page footers with page numbers**
* **Print‑accurate layout** using `@media print`

---

## Pagination Approach

### Context

This project was built as part of a take‑home internship assignment. A significant part of the work involved iterating on pagination logic, debugging schema constraints, and ensuring that formatting commands (such as headings and lists) continued to work correctly alongside pagination.

Pagination in rich text editors is a non‑trivial problem because content height depends on **rendered DOM measurements**, not static text length.

This editor uses a **schema‑driven, read‑only pagination model**:

1. **Tiptap fully owns document mutations** (text, formatting, structure).
2. After each editor update, rendered block‑level nodes (paragraphs, headings, lists, tables) are **measured in the DOM**.
3. Blocks are **grouped into fixed‑height A4 pages** based on their rendered height.
4. Each page renders **only the blocks assigned to it**.
5. Pagination never writes back into editor state — it is derived from it.

This ensures:

* Formatting commands (H1, lists, etc.) work correctly
* No transaction overrides
* Stable editing behavior
* Accurate page boundaries

> **Key principle:** Pagination responds to editor state; it never drives editor state.

---

## Print Parity

The editor is designed so that **what you see on screen matches printed output**.

* Fixed A4 dimensions are used on screen
* Standard 1‑inch margins are applied
* Page breaks are preserved under `@media print`
* Backgrounds and shadows are removed in print mode
* Page numbers remain visible

This ensures the layout is suitable for legal submissions where formatting consistency matters.

---

## Trade‑offs & Known Limitations

Some behaviors are intentionally scoped to keep the editor predictable and production‑safe:

* **Long paragraphs may span pages** (paragraph splitting is not performed)
* **Tables are treated as atomic blocks** (tables move to the next page if they do not fit)
* No widow/orphan control for typography
* No PDF/DOCX export (layout parity is demonstrated instead)

These trade‑offs were chosen to prioritize correctness, stability, and maintainability.

---

## Edge Cases Verified

The following scenarios have been tested:

* Editing content in the middle of the document
* Deleting content near page boundaries
* Pasting large blocks of text
* Mixed formatting with varying line heights
* Headings near page breaks
* Lists spanning multiple pages
* Tables near page boundaries
* Screen vs print layout consistency

---

## Tech Stack

* **Frontend:** Next.js / React
* **Styling:** Tailwind CSS
* **Editor:** Tiptap (ProseMirror‑based)
* **Deployment:** Vercel (or similar)

---

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000` to view the project.

---

## What I Would Improve With More Time

* Smarter paragraph splitting across pages
* Widow/orphan control for headings
* More advanced table pagination
* Optional header/footer customization
* PDF/DOCX export using the same layout constraints

---

## Notes for Reviewers

This project focuses on solving a **specific, scoped problem end‑to‑end**: real‑time pagination in a rich text editor.

The emphasis is on:

* Correctness over clever hacks
* Clear separation of concerns
* Predictable editing behavior
* Print‑accurate output

All architectural decisions are documented and intentionally scoped.

---

Thank you for reviewing this submission.
