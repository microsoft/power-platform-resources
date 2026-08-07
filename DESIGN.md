# Design System — Microsoft Power Platform Resources

## Product Context

- **What this is:** A curated, searchable directory that helps people find trustworthy guidance, learning, tools, and community resources across Microsoft Power Platform.
- **Who it's for:** Makers, developers, architects, administrators, adoption leaders, and people beginning their Power Platform journey.
- **Space/industry:** Microsoft business applications, low-code development, AI agents, technical learning, and enterprise adoption.
- **Project type:** Public editorial resource directory.

## Aesthetic Direction

- **Direction:** Editorial utilitarian.
- **Decoration level:** Intentional.
- **Mood:** Authoritative, current, and distinctly Microsoft without resembling a generic product dashboard. The site should feel like an expertly edited field guide: dense with useful material, calm to navigate, and visibly curated by people.
- **Reference sites:** [Microsoft Learn](https://learn.microsoft.com/), [Microsoft Developer](https://developer.microsoft.com/), [GitHub Resources](https://resources.github.com/), [web.dev Learn](https://web.dev/learn), [AWS Architecture Center](https://aws.amazon.com/architecture/), [Azure Architecture Center](https://learn.microsoft.com/azure/architecture/).

Use strong typography, compact indexed resource rows, subtle grid lines, and restrained product-color markers. Avoid ornamental gradients, universal card grids, decorative icon circles, and other treatments that add chrome without improving navigation.

## Typography

- **Display/Hero:** Instrument Sans, 650 weight, slightly condensed where supported — gives headings a strong editorial voice while remaining clear and contemporary.
- **Body:** Source Sans 3, 400–600 weights — optimized for reading long labels and descriptions at compact sizes.
- **UI/Labels:** Instrument Sans, 600–650 weight — keeps navigation and controls crisp.
- **Data/Tables:** Geist Mono, 400–600 weights — supports clear metadata, counts, dates, and tabular numerals.
- **Code:** Geist Mono.
- **Loading:** Load from Google Fonts with preconnect hints. Retain system sans-serif and monospace fallback stacks so content remains usable if fonts fail.
- **Scale:**
  - Display: `clamp(3.5rem, 8vw, 7rem)` / 0.92 line height
  - H1: `clamp(2.75rem, 6vw, 5rem)` / 0.96
  - H2: `clamp(2rem, 4vw, 3.5rem)` / 1
  - H3: `1.25rem` / 1.2
  - Large body: `1.1875rem` / 1.55
  - Body: `1rem` / 1.6
  - Small: `0.875rem` / 1.5
  - Metadata: `0.75rem` / 1.4, uppercase with `0.08em` tracking

## Color

- **Approach:** Restrained. Plum identifies the Power Platform practice, blue communicates action, and semantic colors remain functional.
- **Primary:** `#742774` Power Plum — active categories, primary controls, selected states, and small identity accents.
- **Secondary:** `#0067B8` Action Blue — links, focus indicators, and informational actions.
- **Neutrals:**
  - Ink: `#172033`
  - Muted text: `#596579`
  - Border: `#D8DEE8`
  - Soft surface: `#EEF1F5`
  - Canvas: `#F7F8FA`
  - Surface: `#FFFFFF`
- **Semantic:** Success `#16844A`, warning `#B65D00`, error `#C42B1C`, info `#0067B8`.
- **Dark mode:** Redesign surfaces rather than invert them. Use canvas `#111827`, surface `#182235`, soft surface `#202C42`, border `#344158`, text `#EDF2F8`, and muted text `#AEB8C7`. Use lighter accents such as plum `#D89BD8` and blue `#6BB8F0`; reduce large areas of saturated color.

All color combinations must meet WCAG AA contrast. Never rely on color alone to communicate category, state, or status.

## Spacing

- **Base unit:** 4px.
- **Density:** Comfortable, biased toward compact resource scanning.
- **Scale:** 2xs `2px`, xs `4px`, sm `8px`, md `16px`, lg `24px`, xl `32px`, 2xl `48px`, 3xl `64px`, 4xl `96px`.

Use tighter spacing inside resource rows and controls, medium spacing between related content, and large spacing only between major editorial sections.

## Layout

- **Approach:** Hybrid. Use a grid-disciplined application shell and editorial composition for category introductions and featured content.
- **Grid:** 4 columns below 640px, 8 columns from 640–1023px, and 12 columns at 1024px and above. Use 16px mobile gutters, 24px tablet gutters, and 32px desktop gutters.
- **Max content width:** `1180px`.
- **Primary pattern:** A persistent category index on wide screens paired with compact, numbered resource rows. Collapse the index into a horizontal or two-column navigation treatment on smaller screens.
- **Border radius:** Small `4px` for controls, medium `8px` for panels, large `12px` for rare featured surfaces, full `9999px` only for tags and status pills.

Do not place every resource in a card. Cards are reserved for content that benefits from a distinct visual boundary, comparison, or featured status.

## Motion

- **Approach:** Minimal-functional.
- **Easing:** Enter `cubic-bezier(0.16, 1, 0.3, 1)`, exit `ease-in`, move `ease-in-out`.
- **Duration:** Micro `80ms`, short `160ms`, medium `220ms`, long `400ms`.

Use motion only to clarify search filtering, disclosure expansion, navigation state, focus, and theme changes. Respect `prefers-reduced-motion` and remove nonessential transitions when requested.

## Creative Risk Strategy

- Replace the category-standard purple-to-blue marketing gradient with a flat ink or plum editorial masthead to increase authority and distinctiveness.
- Prefer indexed resource rows over universal cards to improve scanning speed and content density.
- Use Instrument Sans and Source Sans 3 instead of relying exclusively on Segoe UI, giving the site a recognizable editorial voice while retaining Microsoft color literacy.

These risks should remain reversible. The safe baseline—prominent search, clear grouping, familiar Microsoft accents, responsive navigation, visible focus, and light/dark themes—must not be compromised.

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-08-07 | Initial design system created | Created by `/design-consultation` after reviewing Microsoft and developer resource hubs. The editorial utilitarian direction distinguishes a curated link index from card-heavy product portals. |
| 2026-08-07 | Implemented the design system in `index.html` + `assets/css/main.css` | Applied tokens, typography, flat ink masthead, and numbered index rows. Kept the existing sticky top navigation (restyled as the index) rather than adding a persistent sidebar, to limit blast radius and preserve the responsive baseline. Resource content untouched. |
