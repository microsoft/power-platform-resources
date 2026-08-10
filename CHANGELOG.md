# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/). Changes are published continuously (every change is pushed to `main`), so there is no "Unreleased" section. The project does not use version tags either, so entries are grouped by commit date rather than by [Semantic Versioning](https://semver.org/spec/v2.0.0.html) number.

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
