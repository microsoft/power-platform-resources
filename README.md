# Power Platform Self-Service Portal

A guided front door for Power Platform customers and delivery teams, including makers, admins, developers, and solution architects. The portal helps people choose a next action across Design, Build, Review, Learn, troubleshooting, and scale before handing them to authoritative Microsoft, Power CAT, or Power Series destinations.

The site is maintained by [Robert Standefer](https://linkedin.com/in/rstandefer) and is available at:

**https://animated-barnacle-pz75q9k.pages.github.io/**

## What the site provides

- An About page that explains the portal and its Design, Build, Review, Learn, and Resources structure.
- Guided, outcome-first journeys for learning, building, troubleshooting, reviewing, and scaling Power Platform solutions.
- One recommended next action after a user chooses a goal and scenario.
- Progressive disclosure for prerequisites, expected outcomes, destinations, and related resources.
- Search across portal guides, resource categories, skills, migration tracks, and learning destinations.
- Curated links for Power Apps, Power Automate, Power Pages, Copilot Studio, Dataverse, Power BI, and related technologies.
- Guidance for adoption, architecture, administration, governance, development, and application lifecycle management.
- Light and dark color themes.
- Responsive and keyboard-accessible navigation, dialogs, guided choices, and resource sections.
- A user-controlled About carousel with persistent Pause/Play, enlarged navigation targets, visible focus, and reduced-motion support.

## Portal structure

| Area | Purpose |
|------|---------|
| [About](ssp-landing.html) | Introduces the audience, portal model, featured guidance, and Design, Build, Review, and Learn pillars. |
| [Design](ssp-design.html) | Supports architecture, data, experience, governance, security, ALM, and Well-Architected decisions. |
| [Build](ssp-build.html) | Connects users to outcome-oriented implementation guidance, coached journeys, skills, and labs. |
| [Review](ssp-review.html) | Routes users to Well-Architected and specialist review guidance with clear inputs and outcomes. |
| [Learn](https://microsoft.github.io/apps-agents-workshop/labs/) | Opens the maintained Power Series hands-on lab catalog. |
| [Resources](ssp-search.html) | Provides guided goal/scenario recommendations, site-wide search, advanced catalog search, and the complete curated resource library. |

The portal is a routing and decision-support experience. It does not execute skills, submit solutions for review, replace product support, or make final architecture, security, licensing, or production-readiness decisions.

## Run locally

The site does not require package installation or a build step.

From the repository root, start a local web server:

```powershell
python -m http.server 8000
```

Then open [http://localhost:8000/](http://localhost:8000/).

The root entry redirects to [About](ssp-landing.html). [Resources](ssp-search.html) combines guided recommendations, search, and the complete [resource catalog](ssp-search.html#resources). Use the local server because search loads committed portal pages and catalog snapshots over HTTP.

Opening `index.html` directly may work for basic viewing, but using a local server more closely matches the deployed experience.

## Scenario search

Resources begins with five goal-based paths: learn, build, fix, review, and scale. After selecting a goal, the user chooses a plain-language scenario and receives one prioritized next action. Prerequisites, how the recommendation helps, expected outcomes, destination details, and related resources remain collapsed until requested. Goal and scenario selections are stored in the URL as `goal` and `path`, so the recommendation can be bookmarked and restored; no selection is sent to a service. These routes are defined in `assets/js/ssp-search-engine.js` and work without fetching the search index. Search remains below the guide, with three initial results and an optional advanced section for technical filters and the Skills Advisor catalog.

Open [Resources](ssp-search.html) through the local server. Search indexes its own resource catalog, the five other SSP HTML pages (including the coached Build journeys), and local Skills Advisor, Power CAT marketplace, and Power Series lab snapshots. Power CAT skills and migration tracks include their marketplace categories, products, install commands, and authoritative detail destinations. Individual lab results link to the rendered workshop pages and retain their source descriptions for external-link previews. Searches do not crawl external websites or send queries to GitHub. Direct `file:` previews cannot reliably fetch these files; use HTTP. The catalog retains its category sidebar and numbered content panels beneath search.

### Power Series Labs

The snapshot in [assets/data/workshop-labs.json](assets/data/workshop-labs.json) imports published lab titles, descriptions, audiences, levels, and durations from [microsoft/apps-agents-workshop](https://github.com/microsoft/apps-agents-workshop). Source documentation is licensed under [CC BY 4.0](https://github.com/microsoft/apps-agents-workshop/blob/main/LICENSE-DOCS); metadata is normalized for search and attributed to Power Series. The snapshot records the source commit and import date. Only Markdown entries marked `lab: true` are included; supporting assets and unpublished material are not standalone search results.

Refresh with `node scripts/sync-workshop-labs.js`; verify parity with `node scripts/sync-workshop-labs.js --check`. The importer follows the upstream catalog's file discovery rules and supported front-matter format, rejects missing or unsupported metadata before replacing the snapshot, and generates links under `https://microsoft.github.io/apps-agents-workshop/labs/lab.html`. Commit the regenerated snapshot after validation. It is not refreshed automatically in visitors' browsers.

The Learn navigation link opens the workshop catalog directly in a new tab. Individual lab search results retain the summary preview before leaving this site.

The index is rebuilt from current page content on each search-page load. Duplicate resource URLs are combined. Skill-card anchors are derived from their headings by the shared search entry script. Keep skill headings unique within each pillar.

### Power CAT Skills Marketplace and Migration Factory

SSP is the guided front door for Power CAT skills: it organizes relevant skills alongside labs and resources under Design, Build, Review, and Learn, gives concise input/outcome guidance, and then opens the authoritative [Power CAT Skills Marketplace and Migration Factory](https://microsoft.github.io/power-cat-skills/power-platform-migration-factory/) for full details and installation. The complete synchronized snapshot in [assets/data/powercat-marketplace.json](assets/data/powercat-marketplace.json) contains every published marketplace skill and migration track without copying the marketplace's long-form documentation into SSP.

Refresh with `node scripts/sync-powercat-marketplace.js`; verify parity with `node scripts/sync-powercat-marketplace.js --check`. The importer validates categories, plugins, skills, migration tracks, source URLs, and detail identities before replacing the snapshot. Visitors never fetch the external marketplace directly. The weekly/manual refresh workflow updates the snapshot and opens a reviewable pull request when upstream content changes.

## About page generated content

The About page statistics and featured cards are committed as static HTML so they render without runtime requests. `scripts/update-about.js` derives the exact curated-link and category counts from the resource panels in `ssp-search.html`, reads the lab, Skills Advisor, Power CAT skill, and migration-track totals from the committed snapshots, and validates the resource category counters and summaries.

Featured selections are editorial, not analytics-derived popularity. Configure exactly three entries in `assets/data/about-featured.json`; each entry must include a curation reason and resolve to the current catalog, a local guide, or a published lab. The generated section shows its owner and review date. Refresh after changing resources, snapshots, guides, or featured selections:

```powershell
node scripts\update-about.js
node scripts\update-about.js --check
```

The update command rewrites only the marked generated blocks in `ssp-landing.html` and the derived resource counts in `ssp-search.html`. Commit those generated changes with their source changes. Pull requests validate the committed output. The scheduled refresh workflow checks the upstream Skills Advisor, Power CAT marketplace, Power Series, News, and Events sources weekly, regenerates the About content when needed, runs the regression suite, and opens or updates a reviewable pull request rather than publishing directly.

## Latest news and events

The News and Events resource panels include three generated entries from each official Microsoft Power Platform RSS feed. `scripts/sync-latest-content.js` reads the general Power Platform Blog feed and its event-specific feed, validates Microsoft HTTPS destinations, excludes Copilot Studio-only news, and commits the result to `assets/data/latest-content.json`. Visitors never make live feed requests.

Refresh the snapshot with `node scripts/sync-latest-content.js`, then run `node scripts/update-about.js` to update the generated News and Events blocks and all derived resource counts. Verify source parity without modifying files with `node scripts/sync-latest-content.js --check`. The weekly refresh workflow performs these steps and opens or updates a pull request for review.

Ranking uses whole words, curated synonyms, and term rarity. Common scenarios have curated action sequences; recommendations always link to an available indexed source. This is local retrieval and authored guidance, not an AI-generated answer or an assessment of the user's actual solution. Product and content-type filters narrow the result list and hide the unfiltered action sequence.

Scenario text is held in memory on Start here and is not included in URLs, network requests, or analytics. Do not enter sensitive information. About no longer contains a scenario form.

Run search regression tests with `node --test tests/ssp-search.test.js`. Browser checks should cover resource browsing and category deep links, result filters, pagination, skill anchors, unavailable content, unknown queries, and desktop/mobile layouts in both themes.

## Interactive Design Guide

[Design guide](ssp-design.html#design-advisor) asks seven questions for makers, architects, or mixed delivery teams to suggest a path through design guides and resources, not to prescribe a final solution or app type. Question six accepts up to three ranked constraints (or a standalone unsure answer); all selected constraints inform recommendations, with matching guides ordered by priority after the initial design guide. The other questions are single-choice, and the final question branches for new solutions, modernization, governance, or design review. Back, Edit answers, and Start over keep the flow reversible; changing the goal discards its previous branch answer. Ranked priorities are retained in the downloadable brief.

Rules in [assets/js/ssp-design-advisor.js](assets/js/ssp-design-advisor.js) produce a design starting point with reasons, assumptions, guide links, Microsoft Learn references, and a Markdown brief. Published skill links and scope notes are reused from the existing Design guide content; they open instructions, not an executing skill. Recommendations are authored heuristics, not an architecture assessment or licensing determination. Review rule changes against current Microsoft guidance before publishing.

Answers remain in page memory, with no service calls, URL serialization, telemetry events, or browser storage. Reloading clears them. Download Markdown creates a local text file containing the selected answers and recommendations. Save as PDF opens the browser print dialog with a brief-only layout; choose the browser's PDF destination to create the file. JavaScript is required for the interactive guide; the surrounding guide catalog remains available without it.

Run `node --test tests/ssp-search.test.js` for interactive guide and search regressions. Browser checks should cover all four goals, unsure answers, Back/Edit/Start over, branch changes, download, keyboard navigation, and both themes at desktop/mobile widths. The existing `design-advisor` fragment and internal identifiers remain unchanged to preserve links and integrations.

## Coached Build journeys

[Build](ssp-build.html#journeys) starts with four outcome-oriented journeys: create an app, automate a process, extend an experience, and ship safely. Each journey uses four visible coaching stages and introduces technology choices only after the intended outcome is clear. App choices cover Canvas, model-driven, code apps, and generative pages; automation choices cover cloud and desktop flows. Supporting resources remain visible beside each journey.

The final skill action opens a contextual right-side panel before navigation. Named non-Power-CAT skills use their canonical source when a stable Skills Advisor detail route is unavailable, while Power CAT skills continue to their matching marketplace detail and install page. The panel becomes full-width on small screens, closes with Escape or its close controls, and returns focus to the originating link. Microsoft Learn links open directly in a new tab without the intermediate panel.

Design journey links preserve the current topic and step while the user moves between internal Design pages. This restoration is best effort and is not expected to survive an external authentication boundary.

## Review tool destinations

Review provides portal context before launching the canonical hosted OverPage and OverFlow tools. OverCode remains an informational availability state because no canonical hosted viewer has been verified; the portal does not invent or duplicate a tool destination. The existing `design-advisor` fragment and internal identifiers remain unchanged to preserve links and integrations.

## Repository structure

### Skills Advisor catalog

[Browse all advisor skills](ssp-search.html#skills) includes the imported catalog from [Power Platform Skills Advisor](https://aka.ms/powerplatformskillsadvisor) plus the dedicated Power CAT marketplace snapshot. Skills, migration tracks, MCP capabilities, and reference entries have separate content types; the existing pillar cards remain SSP guides. Every skill first opens a concise SSP detail panel. Power CAT entries open their marketplace detail page, while non-Power CAT entries continue to Skills Advisor. Source and availability metadata, including Private Preview, remain visible in the panel. Inclusion does not guarantee access to a source repository or preview program.

The local snapshot in [assets/data/skills-advisor.json](assets/data/skills-advisor.json) contains all published entries and upstream IDs, including entries that share names or URLs. Search uses this snapshot without fetching external data or sending scenario text to the Advisor. The import date and upstream verification date are shown in search. The snapshot is not automatically refreshed at runtime.

Refresh before publishing with `node scripts/sync-skills-advisor.js`. Verify exact entry parity without modifying files with `node scripts/sync-skills-advisor.js --check`. The command parses the Advisor's published JSON without executing its JavaScript and rejects empty, invalid, or changed-format catalogs before replacing the snapshot. Commit the regenerated snapshot along with any required tests or documentation updates. Catalog data is attributed to Microsoft; source license metadata is retained for each entry.


| Path | Purpose |
|------|---------|
| `index.html` | Compatibility entry point that redirects to About or preserves legacy resource fragments |
| `ssp-landing.html` | About page, portal orientation, carousel, pillars, statistics, and featured guidance |
| `ssp-design.html`, `ssp-design-guide.html` | Design catalog, advisor, and coached design topics |
| `ssp-build.html`, `ssp-build-guide.html` | Build catalog and coached implementation journeys |
| `ssp-review.html` | Review catalog and canonical review-tool handoffs |
| `ssp-search.html` | Guided Resources journey, site-wide search, and complete resource catalog |
| `assets/css/ssp-design.css`, `assets/css/ssp-search.css` | Shared portal presentation and Resources-specific layouts |
| `assets/js/ssp-search-entry.js` | Shared navigation, external-resource panel, skill details, and direct Microsoft Learn routing |
| `assets/js/ssp-search-engine.js` | Search ranking, guidance rules, and goal/scenario journey definitions |
| `assets/js/ssp-search.js` | Resources journey rendering, URL state, search index loading, and catalog interaction |
| `assets/data/about-featured.json` | Curated About-page selections, owner, reasons, and review date |
| `scripts/update-about.js` | Static About statistics, featured-card, and resource-count generator |
| `DESIGN.md` | Visual design system and interaction principles |
| `CHANGELOG.md` | Notable content and site changes |
| `TODOS.md` | Deferred maintenance and design work |

The deployed portal uses the `ssp-*` pages and their page-specific assets. Legacy template, Sass, jQuery, webfont, `assets/css/main.css`, and `assets/js/main.js` files remain in the repository but are not part of the current portal runtime.

## Publishing

GitHub Pages publishes the repository root from `main`. Pushing to `main` starts a Pages build for the URL above. The `Validate site` workflow also runs generated-content checks, the regression suite, and patch-whitespace validation on pull requests and pushes to `main`. The weekly `Refresh site content` workflow updates committed catalog snapshots and generated About content through a reviewable pull request; it does not publish unreviewed upstream changes directly.

## Make changes

Resource wording and URLs are treated as maintained content. Keep changes focused and preserve existing links unless the purpose of the contribution is to add, update, or remove a resource.

When adding a resource category:

1. Add a semantic `<details>` element under `#resources`.
2. Give it a unique `id`.
3. Add a matching navigation link whose fragment points to that exact `id`.
4. Follow the existing heading and list patterns.
5. Record the change in `CHANGELOG.md`.

For presentation changes, use the existing `--cp-*` CSS custom properties and define theme-specific values for both light and dark modes. Read `DESIGN.md` before changing typography, color, spacing, layout, or motion.

## Validate changes

The site has no build step or package dependencies. Use the following checks:

```powershell
node --check assets\js\main.js
node --check assets\js\ssp-search-entry.js
node --check assets\js\ssp-search.js
node scripts\update-about.js --check
node --test tests\ssp-search.test.js
git diff --check
```

Preview the site at desktop and mobile widths. Verify:

- Both color themes.
- Search filtering.
- Sticky category navigation.
- Expanding and collapsing resource sections.
- Keyboard focus and navigation.
- External links and fragment targets.

## Suggest a resource or correction

Open a pull request with the proposed update. Explain why the resource belongs in the collection and place it in the most relevant existing category where possible.

For general support guidance, see [SUPPORT.md](SUPPORT.md). To report a security issue, follow [SECURITY.md](SECURITY.md) rather than opening a public issue.

## Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g. status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft
trademarks or logos is subject to and must follow
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.
