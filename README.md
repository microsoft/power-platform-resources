# Microsoft Power Platform Resources

A curated collection of learning, adoption, architecture, governance, development, AI, and community resources for Microsoft Power Platform.

The site is maintained by [Robert Standefer](https://linkedin.com/in/rstandefer) and is available at:

**https://microsoft.github.io/power-platform-resources/**

## What the site provides

- Search across resource categories.
- Journey-based navigation for new and experienced Power Platform users.
- Curated links for Power Apps, Power Automate, Power Pages, Copilot Studio, Dataverse, Power BI, and related technologies.
- Guidance for adoption, architecture, administration, governance, development, and application lifecycle management.
- Light and dark color themes.
- Responsive, keyboard-accessible expandable resource sections.

## Run locally

The site is dependency-free and does not require a build step.

From the repository root, start a local web server:

```powershell
python -m http.server 8000
```

Then open [http://localhost:8000/](http://localhost:8000/).

Opening `index.html` directly may work for basic viewing, but using a local server more closely matches the deployed experience.

## Repository structure

| Path | Purpose |
|------|---------|
| `index.html` | Application shell and complete resource content |
| `assets/css/main.css` | Responsive layout, design tokens, and light/dark themes |
| `assets/js/main.js` | Theme switching, search filtering, and category navigation |
| `DESIGN.md` | Visual design system and interaction principles |
| `CHANGELOG.md` | Notable content and site changes |
| `TODOS.md` | Deferred maintenance and design work |

The deployed page uses only `assets/css/main.css` and `assets/js/main.js`. Legacy template assets remain in the repository but are not part of the current runtime.

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
