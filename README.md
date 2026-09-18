# Microsoft Power Platform Resources

A curated collection of learning, adoption, architecture, governance, development, AI, and community resources for Microsoft Power Platform.

The site is maintained by [Robert Standefer](https://linkedin.com/in/rstandefer) and is available at:

**https://microsoft.github.io/power-platform-resources/**

## What the site provides

- Search across resource categories.
- Scenario-based Search & Guidance across SSP skills, resources, and learning destinations.
- Journey-based navigation for new and experienced Power Platform users.
- Curated links for Power Apps, Power Automate, Power Pages, Copilot Studio, Dataverse, Power BI, and related technologies.
- Guidance for adoption, architecture, administration, governance, development, and application lifecycle management.
- Light and dark color themes.
- Responsive, keyboard-accessible expandable resource sections.

## Run locally

The site does not require package installation or a build step. Production analytics loads the Microsoft Application Insights browser SDK from Microsoft's CDN.

From the repository root, start a local web server:

```powershell
python -m http.server 8000
```

Then open [http://localhost:8000/](http://localhost:8000/).

The root entry redirects to [About SSP](ssp-landing.html). [Start here](ssp-search.html) combines scenario search with the complete [resource catalog](ssp-search.html#resources) below it. The separate Resources page has been removed.

Opening `index.html` directly may work for basic viewing, but using a local server more closely matches the deployed experience.

## Scenario search

Open [Start here](ssp-search.html) through the local server. Search indexes its own resource catalog and fetches the four other SSP HTML pages from the same origin to index skills, page summaries, and the linked Power Series labs destination. It does not crawl external websites or index individual labs. Direct `file:` previews cannot reliably fetch these pages; use HTTP. The catalog retains the original Resources category sidebar and numbered content panels beneath search. JavaScript switches categories, filters matching panels, and opens category deep links; without JavaScript all panels remain readable.

The index is rebuilt from current page content on each search-page load. Duplicate resource URLs are combined. Skill-card anchors are derived from their headings by the shared search entry script. Keep skill headings unique within each pillar.

Ranking uses whole words, curated synonyms, and term rarity. Common scenarios have curated action sequences; recommendations always link to an available indexed source. This is local retrieval and authored guidance, not an AI-generated answer or an assessment of the user's actual solution. Product and content-type filters narrow the result list and hide the unfiltered action sequence.

Scenario text is held in memory on Start here and is not included in URLs, network requests, or analytics. Do not enter sensitive information. About no longer contains a scenario form.

Run search regression tests with `node --test tests/ssp-search.test.js`. Browser checks should cover resource browsing and category deep links, result filters, pagination, skill anchors, unavailable content, unknown queries, and desktop/mobile layouts in both themes.

## Repository structure

### Skills Advisor catalog

[Browse all advisor skills](ssp-search.html#skills) includes the complete imported catalog from [Power Platform Skills Advisor](https://aka.ms/powerplatformskillsadvisor). Skills, MCP capabilities, and reference entries have separate content types; the existing pillar cards remain SSP guides. Imported entries link to their published source and retain availability labels, including Private Preview. Inclusion does not guarantee access to a source repository or preview program.

The local snapshot in [assets/data/skills-advisor.json](assets/data/skills-advisor.json) contains all published entries and upstream IDs, including entries that share names or URLs. Search uses this snapshot without fetching external data or sending scenario text to the Advisor. The import date and upstream verification date are shown in search. The snapshot is not automatically refreshed at runtime.

Refresh before publishing with `node scripts/sync-skills-advisor.js`. Verify exact entry parity without modifying files with `node scripts/sync-skills-advisor.js --check`. The command parses the Advisor's published JSON without executing its JavaScript and rejects empty, invalid, or changed-format catalogs before replacing the snapshot. Commit the regenerated snapshot along with any required tests or documentation updates. Catalog data is attributed to Microsoft; source license metadata is retained for each entry.


| Path | Purpose |
|------|---------|
| `index.html` | Application shell and complete resource content |
| `assets/css/main.css` | Responsive layout, design tokens, and light/dark themes |
| `assets/js/main.js` | Theme switching, search filtering, and category navigation |
| `assets/js/telemetry.js` | Shared production-only Application Insights page-view tracking |
| `DESIGN.md` | Visual design system and interaction principles |
| `CHANGELOG.md` | Notable content and site changes |
| `TODOS.md` | Deferred maintenance and design work |

The main resource page uses `assets/css/main.css`, `assets/js/main.js`, and the shared telemetry script. The SSP pages also load the telemetry script alongside their existing page-specific assets. Legacy template assets remain in the repository but are not part of the current runtime.

## Site analytics

All site pages load `assets/js/telemetry.js`. Analytics runs only under `https://microsoft.github.io/power-platform-resources/`; localhost, direct file previews, and other hosts or paths do not load the SDK or send telemetry. Update the production check if the site moves to a custom domain.

The script uses the configured Application Insights connection string and records a page view on each full page load, plus page-load performance when available. It reports page titles, URLs without queries or fragments, referrer origins only, and standard SDK browser/device context. It does not collect search or form input, link clicks, exceptions, or AJAX/fetch dependencies. Analytics cookies and local/session storage are disabled; user and session counts therefore cannot reliably identify repeat visitors across page loads. Page views are not unique people.

Each footer includes an analytics notice and the Microsoft Privacy Statement. There is no consent prompt, per the site owner's requirements. SDK blocking or unavailability does not prevent use of the site.

Application Insights receives the visitor's IP address with the telemetry request and normally uses it for approximate geolocation before replacing the stored IP with `0.0.0.0`. This change does not alter that Azure setting or call a third-party IP lookup service. Full IP retention requires configuring `DisableIpMasking` on the Azure resource after reviewing privacy and retention requirements. IP addresses can be shared or change and are not a reliable identity. See [Application Insights IP address handling](https://learn.microsoft.com/azure/azure-monitor/app/ip-collection).

After deployment, open the production site and check **Application Insights > Logs** after ingestion completes:

```kusto
pageViews
| where timestamp > ago(24h)
| project timestamp, name, url, client_CountryOrRegion, client_City, client_Browser, client_IP
| order by timestamp desc
```

Use **Usage > Events** for page-view totals. The connection string is public browser configuration, not a management credential. Never add Azure access tokens or client secrets to the site. Ad blockers and network failures can cause visits to be undercounted.

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

There is no automated build or test suite. Use the following checks:

```powershell
node --check assets\js\main.js
node --check assets\js\telemetry.js
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
