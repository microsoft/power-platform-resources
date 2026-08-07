(() => {
	const root = document.documentElement;
	const themeToggle = document.getElementById("theme-toggle");
	const searchInput = document.getElementById("searchInput");
	const sections = Array.from(document.querySelectorAll("#resources details"));

	if (themeToggle) {
		const updateThemeLabel = () => {
			const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
			themeToggle.setAttribute("aria-label", `Switch to ${nextTheme} mode`);
		};

		themeToggle.addEventListener("click", () => {
			const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
			root.dataset.theme = nextTheme;
			try {
				window.localStorage.setItem("clawpilotTheme", nextTheme);
			} catch (error) {
				/* private mode / storage disabled — theme still applies for this session */
			}
			updateThemeLabel();
		});

		updateThemeLabel();
	}

	if (searchInput) {
		// Remember which sections the visitor had open before searching so we can
		// restore that exact state when the query is cleared.
		let preSearchState = null;

		searchInput.addEventListener("input", (event) => {
			const query = event.target.value.trim().toLocaleLowerCase();

			if (query && preSearchState === null) {
				preSearchState = new Map(sections.map((section) => [section, section.open]));
			}

			sections.forEach((section) => {
				const matches = !query || section.textContent.toLocaleLowerCase().includes(query);
				section.hidden = !matches;
				if (query && matches) {
					section.open = true;
				}
			});

			if (!query && preSearchState) {
				sections.forEach((section) => {
					if (preSearchState.has(section)) {
						section.open = preSearchState.get(section);
					}
				});
				preSearchState = null;
			}
		});
	}

	document.querySelectorAll(".nav-strip a").forEach((link) => {
		link.addEventListener("click", () => {
			const section = document.querySelector(link.getAttribute("href"));
			if (section) {
				// A prior search may have hidden this section; unhide it and clear the
				// query so the in-page anchor jump actually lands on it.
				if (section.hidden && searchInput) {
					searchInput.value = "";
					searchInput.dispatchEvent(new Event("input", { bubbles: true }));
				}
				section.open = true;
			}
		});
	});

	window.setTimeout(() => document.body.classList.remove("is-preload"), 100);
})();
