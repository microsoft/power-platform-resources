# Power Platform Resources repository instructions

## Development commands

This is a dependency-free static site with no configured build, test, or lint scripts.

- Preview locally from the repository root: `python -m http.server 8000`
- Open `http://localhost:8000/`.
- Check JavaScript syntax after editing behavior: `node --check assets\js\main.js`
- Check patch whitespace before finishing: `git diff --check`

There is no automated test suite or single-test command. Validate changes in a browser at desktop and mobile widths, including both color themes, search filtering, sticky navigation links, and expanding/collapsing resource sections.

## Architecture

- `index.html` is the entire application shell and content source. It contains the hero, search input, sticky category navigation, all resource links, expandable `<details>` sections, and footer.
- `assets/css/main.css` is the stylesheet loaded by the page. It defines the light/dark theme tokens, Power Platform purple-to-blue presentation, responsive layout, navigation, cards, and footer.
- `assets/js/main.js` is a small vanilla JavaScript enhancement layer. It toggles `data-theme`, filters `#resources details` by their text content, opens matching sections, opens a section before navigating to its anchor, and removes the preload class.
- Theme initialization is intentionally inline near the top of `index.html` so the correct theme is applied before CSS renders. It honors the `clawpilotTheme` query parameter, then falls back to the operating-system preference.
- Sticky navigation links and resource cards are coupled by fragment identifiers: every `.nav-strip a[href="#..."]` must point to the matching `<details id="...">`.
- `assets/sass/` and the bundled jQuery/template scripts are retained from the original Pixelarity theme, but no Sass compiler, package manifest, or runtime references are configured for them. The deployed page currently loads only `assets/css/main.css` and `assets/js/main.js`.

## Repository conventions

- Keep the site dependency-free unless a task explicitly requires introducing a toolchain.
- Treat resource wording and URLs as content. Do not rewrite, reorganize, add, or remove them when a request is limited to presentation.
- Add new resource categories as semantic `<details>` elements under `#resources`, with a `<summary>` followed by existing list/heading patterns.
- When adding a category to the sticky navigation, add a unique ID to its `<details>` element and use that exact ID in the navigation link.
- Use the existing `--cp-*` custom properties for colors. Define theme-specific values in both `:root` and `html[data-theme="dark"]`; avoid component-level hardcoded colors.
- Preserve accessibility behavior: controls need labels, decorative SVGs use `aria-hidden="true"`, keyboard focus remains visible, and external links opened in a new tab use `rel="noopener"`.
- Keep JavaScript framework-free and scoped to existing stable selectors such as `#searchInput`, `#theme-toggle`, `.nav-strip`, and `#resources details`.
- Do not edit minified vendor files or webfont assets for site behavior changes.
- Preserve the Microsoft contribution, trademark, security-reporting, and code-of-conduct language in the repository root documents.

## Track Changes

Always update CHANGELOG.md with additions/removals from the sites. Follow the Keep a Changelog convention at https://keepachangelog.com/en/1.0.0/. When updating CHANGELOG.md, make sure there is a newline between the header and the paragraph text.