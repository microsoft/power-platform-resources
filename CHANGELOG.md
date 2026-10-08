# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/). Changes are published continuously (every change is pushed to `main`), so there is no "Unreleased" section. The project does not use version tags either, so entries are grouped by commit date rather than by [Semantic Versioning](https://semver.org/spec/v2.0.0.html) number.

## 2026-10-07

### Changed

- Routed public feedback actions to Microsoft Forms so visitors do not need a GitHub account.

## 2026-10-06

### Changed

- Clarified that the Self-Service Portal serves Power Platform customers, makers, admins, developers, and solution architects.
- Reduced the About carousel heading size.
- Routed the Well-Architected action directly to its assessment and named supporting skills to their canonical sources.
- Opened Microsoft Learn links directly instead of requiring confirmation in the external-resource panel.
- Replaced the low-resolution light-theme Power CAT logo with a high-resolution rendering.
- Restructured the Resources guided journey so users choose a scenario, receive one clearly prioritized next action, and reveal prerequisites, outcomes, destinations, and related resources only when needed.
- Removed the redundant Design hero actions for Design guides, architecture guidance, and the advisor skills catalog.
- Displayed Design highlight numbers and labels as compact inline pairs separated by dividers.
- Removed the decorative line before pillar labels and standardized the plain label treatment across Design, Build, and Review.
- Enlarged the About carousel dot targets and strengthened visible keyboard focus.
- Corrected featured-card and resource-group heading levels so the About and Resources pages follow a sequential semantic hierarchy.
- Removed the redundant advisor-skills hero action from Build and Review, aligned the two remaining Build actions to the same color treatment, omitted the zero-value PII highlight, and added the October 2026 publication month to every portal footer.
- Simplified the About carousel to manual dot navigation by removing the previous, next, and Pause/Play controls and automatic rotation.
- Updated site ownership references to Power CAT and documented the public portal address as `https://aka.ms/PowerCATSSP`.
- Simplified the README to a concise, nontechnical overview of the portal, its audiences, and its main areas.
- Removed the featured-guidance curation cadence wording from the About page while retaining its last-reviewed date.
- Added spacing between the Resources search filters and goal cards.
- Removed the remaining Skills Advisor catalog buttons and related direction from the Review page.

## 2026-10-05

### Changed

- Simplified supporting skill and migration cards by removing dash separators from titles and descriptions.
- Removed the catalog inventory summary beneath the advanced search controls.
- Compacted the advanced search controls by aligning filters and the skills catalog action on one desktop row.
- Standardized Review release-eval cards with visible, separately labeled sanitized inputs and expected outputs.
- Removed the decorative dash from the Review pillar label.
- Moved Review catalog guidance beneath its heading and removed the redundant within-area search and result count while retaining focus-area filtering.

## 2026-10-01

### Changed

- Added a global search icon beside the theme control across portal pages. It opens the dedicated site-wide search and results page with the search field focused for immediate typing, while keeping the About hero focused on portal orientation.
- Reduced unused About hero space by compacting the tallest carousel slide while preserving a stable carousel height.
- Replaced internal catalog-validation and ingestion language with actionable Design, Review, and search guidance, including clear local next steps for OverCode.

## 2026-09-28

### Changed

- Routed the guided Review choices for OverPage, OverFlow, and Well-Architected review directly to their specific Review cards instead of the broad Review catalog.
- Added site-wide validation that internal fragment links resolve to real static or generated targets and that specific guided actions do not fall back to broad catalog sections.
- Added consistent spacing between adjacent guide actions so separate links remain visually distinct.
- Preserved visible page-edge gutters in very narrow browser panes by removing the shared header's minimum-width overflow.
- Removed the redundant broad Power CAT marketplace action from Featured guidance while retaining contextual marketplace links for individual skills.
- Expanded user-facing “SSP” abbreviations to “Self-Service Portal” across page titles, navigation labels, controls, and descriptive guidance.

## 2026-09-26

### Changed

- Kept the About carousel rotating automatically without a pause/resume control and replaced its text arrows with consistently centered SVG chevrons.
- Generated every About catalog statistic, including the Learn pillar and lower statistics row, from the resource, lab, and Skills Advisor snapshots; moved featured selections into a validated editorial configuration; and added pull-request and scheduled refresh automation.
- Added generated Latest News and Latest Event Announcements lists sourced from official Microsoft Power Platform RSS feeds and included them in the weekly reviewable refresh workflow.
- Added a print-optimized Save as PDF option alongside the existing Markdown export for completed Design briefs.
- Removed the About pillar width animation, added reduced-motion handling, rewrote every Before you start prompt as a complete instruction, and made each Design step present one primary action with supporting resources visible in a consistent secondary panel.
- Added four outcome-first Build journeys with sixteen coached stages covering apps, automation, extensions, and safe delivery, while keeping supporting resources visible and indexing the journeys in site search.
- Replaced centered external previews with an Azure-style right-side detail panel that supports desktop and mobile layouts, Escape, explicit close controls, and focus restoration.
- Routed non-Power CAT skills to Skills Advisor and Power CAT skills to their canonical sources after a concise SSP explanation.
- Preserved the originating Design topic and step during internal guide navigation using best-effort return context.
- Standardized Review tool guidance: OverPage and OverFlow launch their canonical hosted viewers after SSP context, while OverCode clearly reports that no verified hosted viewer is available.
- Simplified Resources navigation so one goal selection immediately shows rich, comparable paths with intended audiences, expected outcomes, direct actions, and related resources; kept all five goals visible for one-click switching and removed the required follow-up step.
- Reduced the About carousel interval from nine seconds to four seconds while preserving its hover, focus, hidden-tab, and reduced-motion pauses.
- Refreshed enterprise environment guidance to cover Managed Environments, environment groups, inherited group rules and exception handling, environment routing, personal developer environments, default-environment reduction, licensing checks, and controlled promotion.
- Integrated the complete Power CAT Skills Marketplace catalog and Migration Factory into SSP search, contextual Design/Build/Review guidance, and generated About coverage while keeping marketplace detail and install pages authoritative.
- Added weekly and manual synchronization for all published Power CAT skills and migration tracks, with validated local snapshots and reviewable refresh pull requests.
- Matched the Power Series Labs header height and moved the Power CAT logo to the far right across all SSP pages, including responsive mobile navigation offsets.
- Standardized supporting-skill, guide-resource, and release-checklist links on the shared left-aligned reading pattern after a cross-page desktop/mobile presentation audit.
- Moved the desktop primary navigation to the right-side header group across every SSP page to match the shared Power CAT site presentation pattern.
- Removed the About hero's “Curated by Power CAT · Open to everyone” label and aligned all SSP hero areas with the Skills and Labs light-purple and dark-navy presentation.
- Removed the implied Power CAT deep-review and submission service, including its dormant configuration and UI, and made the Build-to-Review handoff explicitly self-service.
- Improved Resources search with strict direct-match ranking, controlled related-term fallback, clear relevance labels instead of percentages, filter-only browsing, and bookmarkable restoration of queries, filters, result expansion, goals, detail panels, and scroll position.
- Moved Resources search ahead of compact goal choices on mobile, routed selected learning and Build paths directly to maintained Power Series labs, and added a recommended beginner route with prerequisites, duration, outcome, and plain-language catalog definitions.
- Reclassified the Cloud Flow Builder and Approval Workflow Accelerator cards as implementation guides with concrete coached-journey and lab handoffs instead of generic Skills Advisor links.
- Hid beginner onboarding and unnecessary clarification during focused searches, supplied the beginner lab preview with useful context, normalized imported Markdown for display, and aligned the Resources logo and About accessibility landmarks and controls.

## 2026-09-25

### Changed

- Simplified the new-solution design path to Plan, Model, and Validate, and made the final step continue to supporting skills instead of looping back to the beginning.

### Removed

- Removed the Application Insights configuration, browser SDK loader, page-view telemetry, and analytics notices from the site.

## 2026-09-21

### Changed

- Added in-page lab details with audience, level, duration, and a direct Open lab action. Added a labeled top-right close button to all resource, skill, and lab dialogs.
- Added in-page details for imported skill search results, including product scope, availability, usage notes, and suggested prompts, with a direct action to the selected skill source instead of the general catalog.
- Added search keyword-match percentages, matched and related terms, and missing terms, alongside visible recommendation reasons. Percentages represent term coverage, not confidence or solution suitability; external previews retain the recommendation context.
- Indexed published Power Series workshop labs from microsoft/apps-agents-workshop with source descriptions and direct links to rendered lab pages; added a repeatable catalog refresh command.
- Added a new-tab indicator to the Learn menu link and made it open the Power Series catalog directly, while retaining previews for other external links.
- Restricted Application Insights to the private SSP Pages origin. Disabled analytics on the public Power Platform Resources origin pending CELA clearance, while retaining cookie-free page telemetry and URL-query redaction.
- Aligned tags and launch buttons consistently across all four About pillars and made expanded panels adapt to their content without overflowing.
- Renamed Start here to Resources and moved it to the final navigation position across the site, preserving its existing URL.
- Added a site-wide preview before opening external web links, with available listing summaries, destination URLs, Stay here and Continue actions, and accessible modal navigation. Internal links and downloads remain direct.
- Integrated the About page's resource-catalog action below its statistics as a centered button, removing the isolated link section.
- Set About as the default landing page, including the no-JavaScript fallback, while preserving legacy resource bookmark destinations.
- Made single-answer Design guide questions advance immediately on selection, with Back available on questions and recommendations to revise answers. Kept Continue for the multi-priority ranking step.
- Unified the Design topic-card lift and shadow across Start here goals, About featured cards, and Design topic-step cards, including keyboard focus and reduced-motion support.
- Added a new-tab arrow indicator to search-result links that open in a new tab, leaving same-tab links and the resource catalog unchanged.
- Aligned the Start here introduction with the shared page width and kept a single top-level search for guides, skills, and resources.
- Made Start here the default site entry while preserving legacy resource bookmarks and the About pillars link.
- Presented the five Start here goals as prominent numbered cards and combined search into the same section. Replaced the scenario textarea with a standard search field and removed scenario-oriented helper text.

## 2026-09-18

### Added

- Added a local Design Advisor for makers and architects with seven branching questions, reversible navigation, source-linked recommendations, scoped published skills, explicit assumptions, and a downloadable Markdown design brief. Answers stay in page memory and are not sent to services or analytics.
- Added four bookmarkable Design topic guides combining decision sequences, portal-authored Design outlines, Microsoft Learn articles, assessment tools, and links to the published skills catalog.
- Added five plain-language Start here goals with focused follow-up choices, an unsure path for every goal, Back and Start over controls, and a primary recommendation with up to two supporting links.

### Changed

- Clarified generic Build and Review catalog actions as "Browse Skills Advisor" and marked deep review entry points as availability information while the submission portal is pending.
- Added an About carousel pause/resume control, paused rotation during hover and keyboard focus, and respected reduced-motion preferences.
- Reworded the Design process heading to "From uncertainty to a clear next step." to reflect the guide's scope.
- Moved the Design topic, interactive guide, and guide catalog descriptions below their headings instead of alongside them.
- Renamed the user-facing Design Advisor to Design guide and clarified that it suggests a path through guides and resources rather than prescribing a final solution. Preserved existing links and behavior.
- Restored single-column Design Advisor answer choices at every screen width and added decorative, choice-specific icons, including cues for selected ranked priorities, while preserving labels and native controls.
- Changed Design Advisor question six to accept up to three ranked priorities, reflected in recommendation order, assumptions, and the downloaded brief. Compacted the advisor with two-column desktop choices, tighter spacing, a narrower reading width, a prominent next action, and expandable supporting-skill details.
- Replaced the Design Advisor sidebar with a compact horizontal stage indicator above the question counter, preserving active-stage announcements and giving questions and results the full panel width.
- Moved Design topic choices above the Design Advisor, placing the advisor between the topics and the guide catalog while preserving navigation and content.
- Restored left-aligned hero buttons while retaining right-aligned standalone resource and launch actions elsewhere.
- Right-aligned standalone launch actions across the SSP pages, including Microsoft Learn references, ALM checklist links, guide resources, hero actions, and pillar launches; preserved left-aligned descriptive content and resource lists.
- Replaced Build's generic process section with "Prepare your solution for release," a four-stage ALM checklist covering planning, solution versioning, validation, and deployment, linked to the ALM Topology, Solution Packaging, and Pipeline Setup guides, Review, and Microsoft Learn ALM guidance.
- Right-aligned guide launch links in Design, Build, and Review, retaining wrapping for narrow screens.
- Expanded the Design guides' inputs and intended output by default and reduced row padding and gaps around tags, inputs, and supporting resources while retaining all content and collapse controls.
- Explicitly defaulted Design, Build, and Review to their first focus area and synchronized selection, panel heading, and tagline in the filter update. Versioned the pillar scripts so returning browsers load the updated category behavior; direct guide links still select their target area.
- Applied Design's sidebar and numbered guide-panel layout to Build and Review, removed All filters, and added category-specific headings and taglines. Search stays within the selected area, clearing search retains it, and direct guide links select the matching category. Existing resources and deep-review submission content are preserved.
- Added focus-specific taglines alongside the selected Architecture, Data, Experience, and Governance guide headings.
- Removed All guides from the Design catalog; defaulted to Architecture, kept search within the selected focus area, and made direct guide links open their matching category.
- Restyled the Design guide catalog to match Start here's resource layout, with a focus-area sidebar, counts, a shared panel of numbered guide rows, and direct resource links instead of large card buttons; retained search, filtering, content, and destinations.
- Relabeled the eight Design planning cards as guides, replaced generic skill-catalog redirects with scoped published skill instructions or direct Learn/assessment resources, and documented unverified skill gaps and prerequisites. Corrected Design guide filtering so hidden cards are removed from view.
- Added a prominent Back to Design button above every Design topic view, returning directly to the intent cards.
- Unified Design topic-page links, icons, selected steps, and navigation buttons under the theme-aware purple brand accent, removing topic-specific green and amber shifts.
- Redesigned Design topic pages with concise introductions, a visual three-step path, one focused step at a time, always-visible preparation, and distinct supporting-skill cards while retaining all resource links. Positioned the step count and Next control alongside the path heading above the changing content.
- Changed Design intent cards from skill filters to links to their topic guides, keeping the existing skill catalog available separately.
- Restyled the five Start here goals as compact outlined icon buttons with the original conversational labels, natural wrapping on desktop, and full-width stacking on mobile; preserved follow-up questions and recommendations.
- Replaced About's duplicate resource-category grid with a single "Explore Power Platform resources" link to the catalog on Start here.
- Separated Start here's guided choices, search, and resource catalog into full-width theme-aware bands, with a tinted search background and a stronger divider above the catalog.
- Made guided choices the first step on Start here, with search secondary, three initial search results, and technical filters and Skills Advisor details under an optional advanced section. Preserved the resource catalog below.
- Renamed Home to About and Search to Start here throughout SSP navigation.
- Moved all 13 resource categories and their links below search on Start here, retaining the original category sidebar, icons, counts, numbered resource panels, search filtering, and responsive layout, with updated internal links.

### Fixed

- Required meaningful task and product matches in search, normalized common product misspellings, plurals, and hyphens, and suppressed canvas-specific performance paths for other app types. Pillar searches retain their selected category.
- Changed resource search to show individual matching links with subsection context instead of entire categories; clearing restores the complete original resource catalog.
- Revealed and focused search recommendations or results after submission, including searches entered before indexing completes.
- Corrected About featured-card destinations and replaced the unverified migration offer with a published-skills catalog link.
- Made Design search labels reflect the selected focus area, and added Escape dismissal with focus return to About and Start here mobile menus.
- Restored all four About pillars on mobile, corrected Design and Build category totals, and routed legacy resource bookmarks to Start here.
- Made catalog entry links scroll to and focus loaded results, and made Design topic step links reveal the requested step.

### Removed

- Removed the pending Copilot Studio agent configuration from Design in favor of the local guided advisor.
- Removed the separate Clear search buttons from Design, Build, and Review; search remains editable within the selected focus area.
- Removed the scenario form from About and the separate Resources page and navigation item.

## 2026-09-15

### Added

- Added PowerCAT OverPage to the Review pillar's Quality category for Power Pages solution inspection, with solution/export ZIP requirements and optional findings JSON and HAR overlays.
- Added PowerCAT OverFlow - Solution Master to the Review pillar's Quality category for side-by-side workflow inspection and optional findings overlays, including solution ZIP and findings JSON requirements.
- Imported the full Skills Advisor catalog: 94 skills, 26 MCP capabilities, and 22 reference entries, preserving source IDs, product labels, availability, and source links.
- Added an all-skills browse view in SSP search and entry points from Design, Build, and Review, plus catalog refresh and upstream parity-check commands.
- Added Search & Guidance with scenario-based starting points, ordered source-backed actions, individual results across all five SSP pages, product and content-type filters, and deduplicated resource links.
- Added a prominent scenario input on the landing page, Search navigation across SSP pages, and direct links to individual skill cards.
- Added dependency-free regression tests for search ranking, scenario guidance, and unknown or unavailable content.

### Changed

- Moved the Home self-service banner above the scenario search section, preserving both sections' content and behavior.
- Reduced whitespace across Home, Design, Build, Review, Search, and Resources by tightening hero, section, card, panel, and result spacing while preserving content and control sizes.
- Moved the Review skill catalog above Power CAT deep review, preserving section content and anchor links.
- Made SSP Home the default root entry page, preserving URL parameters and translating the legacy theme parameter during redirect.
- Distinguished locally authored SSP guides from published Advisor skills in search results and content-type filters.
- Updated all SSP skill and skills catalog links to https://aka.ms/powerplatformskillsadvisor.
- Compacted the Home banner by placing navigation beside its slide actions and reducing reserved height and bottom spacing, with responsive wrapping on mobile.
- Replaced example-specific search placeholders with a neutral prompt on the landing and Search & Guidance pages.
- Moved Search to the first navigation position across all SSP pages, before Home and the pillar links.
- Aligned Search & Guidance accents and primary buttons with the existing SSP purple brand palette in both color themes.
- Clarified that the Get Started resource total represents 44 curated links grouped into 13 visible topics.
- Replaced the landing-page assistant demo with a local site guide that routes queries to matching SSP pillars and resource categories without an AI service.
- Removed the landing-page banner play/pause control and made its featured messages rotate automatically for every visitor.

### Removed

- Removed the temporary floating site guide and its hand-maintained keyword catalog in favor of content-backed Search & Guidance.

## 2026-09-10

### Added

- Added the Microsoft Power Platform logo from the Power Series Labs site to the top-left header on all six pages, with shared responsive sizing and existing home links preserved.
- Added shared Azure Application Insights page-view telemetry to all six pages, restricted to the production GitHub Pages site, with analytics cookies and browser storage disabled and URL queries and fragments excluded.
- Added an analytics notice and Microsoft Privacy Statement link to every page footer, without a consent prompt.

### Changed

- Standardized SSP header-to-content spacing to 24px on desktop and 16px on mobile, including Home and Resources, top-aligned Home slides, and versioned the pillar stylesheet URL to refresh cached spacing styles.
- Reduced the whitespace below the header on the Design, Build, and Review pages by removing stacked hero top padding and using tighter responsive spacing.
- Updated the Learn navigation links across all five Self-Service Portal pages and both landing-page Power Series buttons to the new Power Series Labs URL: https://microsoft.github.io/apps-agents-workshop/labs/.

## 2026-08-27

### Added

- Added a dedicated SSP Design pillar page with outcome guidance, searchable and filterable skill tiles, and a four-stage design process.
- Added an integrated Design Advisor preview that recommends skill sequences and provides a configuration point for a Copilot Studio custom agent.
- Added a skill-led SSP Build pillar page covering apps, automation, agents, data, integration, packaging, and deployment.
- Added an SSP Review pillar page with focused review skills and a configurable deep-review submission path requiring organizational sign-in and sanitized, PII-free content.

### Changed

- Reworked the Self-Service Portal opening into four spacious featured messages, including a catalog metrics view, that rotate every nine seconds with manual playback controls.
- Added a catalog-level notice that external resource links open in a new tab.
- Standardized the SSP landing and resources headers with shared navigation, active-page states, and a compact mobile menu.
- Replaced the unused Sign in controls with GitHub issue links for structured visitor feedback.

### Fixed

- Prevented the mobile navigation feedback action from appearing alongside the desktop feedback button on SSP pillar pages.
- Restored the missing light and dark Power CAT logo assets used by the Self-Service Portal header and footer.
- Updated all navigation between the Self-Service Portal landing and resources pages to use their current filenames.
- Kept color theme selection and theme-toggle icons consistent when navigating between SSP pages.
- Compacted the SSP landing header and statistics layout at mobile widths to prevent horizontal overflow.

### Removed

- Removed the duplicate search option from the Self-Service Portal hero while retaining header search.

## 2026-08-11

### Added

- Added footer links to the project README and changelog.

## 2026-08-10

### Added

- Added complete Open Graph and Twitter Card metadata with a custom 1200 x 630 social preview image.

### Changed

- Promoted Explore Power Platform products from a Get Started subsection to the second resource category.

## 2026-08-07 (link cleanup)

### Removed

- Removed the "Power Platform partner stories" link (`powerplatformpartners.transform.microsoft.com/partner-stories`), which returned a persistent 502 Service Unavailable error.

## 2026-08-07 (scheduled update)

### Added

- Added an Events category covering the Power Platform Community Conference, Scottish Summit, the European Power Platform Conference, DynamicsMinds, the Power Platform Boost and Intelligence Age podcasts, and Power Platform Weekly.
- Added dedicated Power Pages and Microsoft Dataverse product blocks to Get Started, covering documentation, tutorials, templates, design studio, learning paths, data modeling, Dataverse for Teams, and capacity.
- Added 2026 release wave 1 plans broken out by product, the Power Automate released versions page, and the Power Platform and canvas app deprecation pages to News.
- Added Microsoft Build 2026 announcements and the Dataverse agent data platform blog post to News.
- Added Power Fx language and formula references, responsive layout, modern controls and theming, accessibility, and performance guidance to Building.
- Added a robotic process automation and process mining group to Building covering desktop flow actions, machine management, unattended flows, hosted RPA, hosted machine groups, and task mining.
- Added a pro-developer group to Building covering the Power Platform CLI, the VS Code extension, PCF, the Dataverse Web API, plug-ins, custom APIs, elastic tables, and the Power Pages Liquid, Web API, and pac pages tooling.
- Added flow authoring guidance to Building: triggers, expressions, the expression functions reference, approvals, business process flows, error handling, naming conventions, and limits and throttling.
- Added AI Builder, generative actions in cloud flows, generative pages, the Power Apps vibe experience documentation, and Dataverse MCP resources to AI.
- Added Link to Microsoft Fabric, Azure Synapse Link for Dataverse, the full connector reference, and long-term data retention to Building.
- Added Managed Environments, environment groups, tenant settings, inventory, usage, monitor, actions and advisor, tenant-level analytics, admin PowerShell, cross-tenant restrictions, customer-managed keys, Purview activity logging, Dataverse Git integration, Azure DevOps build tools, and pay-as-you-go licensing to Governance.
- Added Power Pages security guidance (authentication, table permissions, web roles, page permissions, site checker, accessibility) to Architecture.
- Added Microsoft Applied Skills credentials, Microsoft Learn workshop guidance, and expanded community YouTube channel and blog listings to Training.
- Added the Creator Kit GitHub repository, the VS Code extension, the Terraform provider, the Dataverse MCP samples, and PCF Gallery to Tools & samples.
- Added Reddit discussion boards, the Microsoft Tech Community hub, per-product ideas portals, and the Microsoft MVP Program to Community.

### Changed

- Renamed the AI & Copilot category to AI.
- Replaced the 2024 Charles Lamanna announcement with the 2026 "From apps to agents" post.
- Replaced retired `flow.microsoft.com`, `powerapps.microsoft.com/blog`, `powerapps.microsoft.com/guided-learning`, and `powerusers.microsoft.com` links with their current `make.powerautomate.com`, `microsoft.com/power-platform/blog`, Microsoft Learn, and `community.powerplatform.com` destinations.
- Replaced the Ignite 2025 Book of News with Microsoft Build 2026 coverage.
- Updated the monthly feature update link to the July/August 2026 post.
- Updated the plan designer, Power Apps performance, developer plan, common issues, Dataverse, DLP, tenant isolation, security overview, ALM solutions, and adoption links to their current documentation paths.
- Noted that the CoE Starter Kit is no longer actively maintained and pointed to the native Power Platform admin center inventory, usage, monitor, and actions experiences.
- Replaced the 2020 and 2021 books with the 2024 Power Apps Cookbook and the 2025 Solutions Architect's Handbook.

### Removed

- Removed the retired PL-100, PL-500, and PL-600 certifications and the legacy Power Platform certification browse link.
- Removed the retired Power Automate plugin for ChatGPT, the retired Power Apps and Power Automate guided learning pages, the dead Common Data Model short link, and superseded discoverability, Thrive, and HEAT blog posts.
- Removed dead or superseded video links, the retired `ms.flow.microsoft.com` blog, and the North Star architecture blog post.

## 2026-08-07

### Added

- Added What's new in Power Apps, the 2026 release wave 1 plan, the Release Planner, and the monthly Power Platform feature update blog to News.
- Added the new Power Apps vibe coding experience (vibe.powerapps.com) and the "Inside the new Power Apps" announcement.
- Added self-healing desktop flows and process mining resources to Building.
- Added the agent feed for model-driven apps to AI & Copilot.
- Added the PL-500 certification and community YouTube channels (Shane Young, Reza Dorrani) to Training.
- Added Well-Architected "What's new" to Architecture & guidance.
- Added Power Platform pipelines and ALM documentation, plus the CoE Starter Kit transition to the Power Platform admin center, to Governance.
- Added the Power Platform CLI to Tools & samples.

### Changed

- Replaced the Ignite 2024 news link with the Ignite 2025 Book of News.
- Normalized touched microsoft.com URLs to remove the `/en-us/` locale segment.

### Removed

- Removed all Copilot Studio links and sections, which are covered by a dedicated Copilot Studio resources site.
- Removed retired and superseded content: Ignite 2024 news, the 2025 wave 1 plans, the Channel 9 POWERful Devs series, the Build 2021 fusion resources, the 2021 Microsoft Mechanics episode, and a 2016 calendar walkthrough.

## 2026-08-07 (editorial design system)

### Added

- Added search across resource categories.
- Added sticky category navigation linked to each expandable resource section.
- Added light and dark color themes with an in-page theme toggle.
- Added repository-specific GitHub Copilot instructions.
- Consolidated the resource collection into 11 journey-based categories.
- Added the Instrument Sans, Source Sans 3, and Geist Mono type families (self-hosted WOFF2 under `assets/fonts/`, latin and latin-ext subsets) and a documented design system in `DESIGN.md`.
- Added persistence of the selected color theme to `localStorage`, so an explicit light/dark choice survives reloads (precedence: `clawpilotTheme` URL parameter, then saved choice, then operating-system preference).
- Added a distinct per-category icon to each resource section header (rocket, newspaper, trending-up, graduation-cap, wrench, sparkles, layers, shield-check, package, book-open, calendar, and users), replacing the single repeated arrow glyph. Icons are flat inline stroke SVGs using the accent color (no tinted background container).
- Added a search empty state: a no-match query now shows a "No resources match <query>." panel with a Clear search button, instead of leaving a blank page.
- Added left/right gradient edge-fades to the sticky category index so its horizontal overflow is discoverable on narrow screens where most categories scroll off-screen.
- Made the resource sections behave as an accordion: opening a category from its header collapses any other open section, so only one is expanded at a time.
- Added a "Last updated" date in the footer, rendered from a single `<time datetime>` value that the scheduled update prompt refreshes whenever site content changes.

### Changed

- Self-hosted the Instrument Sans, Source Sans 3, and Geist Mono fonts under `assets/fonts/` and dropped the Google Fonts CDN links and preconnects, keeping the site free of external runtime dependencies. Each `@font-face` uses `font-display: swap`.
- Replaced the plum/violet identity accent with a cool teal accent (`#0f7b8a` light, `#4bb8c4` dark) applied to section icons, category-title highlights, the masthead rule, and focus states. Functional links remain Microsoft blue. Moves the site away from the saturated-violet palette and gives it a cooler, more editorial identity distinct from generic templates.
- Flattened the category icons by removing the soft-tinted rounded "chip" background behind each one, keeping a larger bare teal glyph. Aligns with the design system's guidance to avoid decorative icon containers.
- Applied the "editorial utilitarian" design system: replaced the purple-to-blue gradient masthead with a flat ink masthead and accent rule, introduced a full design-token set (color, spacing, radius, motion), restyled the category navigation as an editorial index, and rendered resource links as numbered index rows. Resource wording and URLs are unchanged.
- Replaced the repository template README with project-specific setup, architecture, contribution, validation, support, and security guidance.
- Redesigned the site around a responsive card layout based on the Microsoft Agent Resources experience.
- Replaced the original template styling with a Power Platform purple-to-blue visual theme.
- Replaced the legacy jQuery-based page behavior with dependency-free vanilla JavaScript.
- Reorganized product, developer, integration, guidance, partner, and community resources under the new category model without removing existing links.

### Fixed

- Removed `user-scalable=no` from the viewport meta so people can pinch-zoom the page on touch devices (WCAG 2.1 SC 1.4.4).
- Raised the color contrast of the accent where it sits on a tinted background: navigation links now use the darker `--cp-accent-hover` on hover so the text meets WCAG AA.
- Fixed the keyboard focus outline on masthead links, which used the light-mode link blue against the dark masthead and fell below the 3:1 non-text contrast minimum; masthead links now focus with the masthead accent color.
- Made the resource search restore each section's prior expanded/collapsed state when the query is cleared, instead of leaving matched sections forced open.
- Made category navigation links work after a search has hidden the target section: the link now clears the search and reveals the section before jumping to it.
- Hardened the page script so a missing theme toggle or search input no longer prevents the remaining behavior from initializing.
- Corrected a "maintainted" typo in the footer credit line.
- Fixed misaligned subsection labels (e.g. Power Apps, Power Automate) in the "Explore Power Platform products" list: label headings that are direct children of a resource section now share the same left gutter as the numbered index rows, instead of hanging left of them.

## 2025-04-29

### Added

- Added the Power Platform Architecture Center, its announcement, and feedback resources.
- Added architecture guidance alongside Power Platform Well-Architected resources.

### Removed

- Removed an obsolete commented-out tools and feature-card section from the page source.

## 2025-03-04

### Added

- Added the Power Platform Solution Assessment to adoption guidance.
- Added the Power CAT Tools announcement blog.

### Changed

- Clarified the successful adoption guidance category title.
- Updated the Power CAT Tools entry to open external resources safely.

## 2025-03-03

### Added

- Added the Power CAT Tools app to the toolkits section.

## 2025-02-27

### Changed

- Simplified the footer contribution message to direct users to contact the maintainers.

## 2025-02-06

### Added

- Added Microsoft Learn entry points for Power Platform and Copilot Studio.
- Added direct product documentation and updated learning resources.
- Added secure external-link behavior to licensing and Terraform resources.

### Changed

- Refreshed introductory, training, adoption, developer, administration, governance, best-practice, connector, and product links.
- Migrated legacy `docs.microsoft.com` links to `learn.microsoft.com`.
- Updated regional and localized URLs to canonical Microsoft URLs.
- Clarified labels for news, licensing, Terraform management, and technical case studies.
- Reordered and streamlined several introductory resources.

### Removed

- Removed outdated introductory and Power Automate story links.

## 2025-02-05

### Added

- Added a tools category containing the CoE Kit, Automation Kit, Approvals Kit, Creator Kit, Copilot Studio Kit, and Power Platform repository index.
- Added Microsoft Copilot Studio Resources.
- Added the Patterns of Value webinar series to adoption guidance.

## 2025-02-04

### Added

- Added the Power Platform Terraform Provider to administration and governance resources.

## 2025-01-28

### Fixed

- Corrected the favicon path for repository-relative hosting.
- Increased responsive body font sizes for improved readability.

## 2025-01-27

### Added

- Created the Power Platform Resources static site with categorized learning, adoption, development, architecture, governance, community, product, training, and customer-story resources.
- Added the original Pixelarity-based HTML, CSS, Sass, JavaScript, images, webfonts, and supporting assets.
- Added Power Up as a free hands-on learning program.
- Added the repository README, license, security policy, support policy, code of conduct, and Visual Studio-oriented ignore rules.
- Added a site favicon.

### Changed

- Corrected the footer repository link to point to `microsoft/power-platform-resources`.

### Removed

- Removed the obsolete Udacity Power Platform course link.
