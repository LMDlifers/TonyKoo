# Inner Pages Design

**Date:** 2026-11-19
**Follows:** `2026-11-19-sell-homepage-design.md`. This brings the report, research, log and colophon pages into the same system.

## Goal

A hiring manager who clicks from a homepage card lands on a page that looks like the same site and reads easily: one header, one reading column, one type system, one surface.

## Survey (2026-11-19, 1440×900)

- **Reports (8 pages, `css/report.css`, 1,014 lines).**
  - Every section sits in its own bordered box, about 1,080px wide. Body lines run to about 150 characters.
  - Navigation is three floating pills ("← Projects", "Dark theme", "Writing"), unlike any other page.
  - Eight uppercase tracked labels, five pill radii, three different shadows.
  - Pages are long: the FAISS note is 6,769px.
- **Research (index plus 14 essays, `css/research.css`, 234 lines).**
  - Already close to the target: a text header ("Tony Koo / Research"), one narrow column, a side contents list.
  - Essay body is Georgia, a fourth typeface. Six uppercase tracked labels. Radii of 8, 10, 12, 14 and 20px.
- **Log and colophon** load `research.css` and share its header.
- **Chat pages** are an app, not reading pages.

## Decisions

1. **One header on every inner page.** The research header is the model: `Tony Koo / <Section>` on the left, three text links and the theme toggle on the right. Reports get it as `Tony Koo / Case study` with links Projects, Writing, Research. The floating pills go.
2. **One reading column.** Report prose is at most 68 characters wide. The per-section boxes go; sections are separated by their headings and space. Figures, tables and card grids may run to 960px.
3. **Type.** Lato for headings and body on every page; Inconsolata for data. Georgia is retired. Essay and report body is Lato 18px with 1.65 line height. No Pixelify Sans on inner pages.
4. **Labels.** No uppercase and no tracking. Small labels are Lato 700 14px in the accent colour, sentence case.
5. **One surface.** Callouts, figures, cards and tables use the homepage surface: 1px hairline, 16px radius, no shadow. Metadata chips become plain Inconsolata text separated by spacing, with no pill.
6. **Shared tokens.** `css/site-theme.css` defines `--card-radius: 16px`, `--card-border` and `--measure: 68ch`. `home.css`, `report.css` and `research.css` use them.
7. **Content is unchanged.** No sentence, number, receipt block or figure is added or removed. Report receipts ("Added to site", source commit) stay exactly as they are.
8. **Themes.** Day and night on every page, with the existing toggle behaviour.

## Out of scope

Chat pages. New report content or new figures. Shortening the reports.
