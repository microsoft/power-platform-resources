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
		const noResults = document.getElementById("noResults");
		const noResultsQuery = document.getElementById("noResultsQuery");
		const clearSearch = document.getElementById("clearSearch");

		// Remember which sections the visitor had open before searching so we can
		// restore that exact state when the query is cleared.
		let preSearchState = null;

		searchInput.addEventListener("input", (event) => {
			const query = event.target.value.trim().toLocaleLowerCase();

			if (query && preSearchState === null) {
				preSearchState = new Map(sections.map((section) => [section, section.open]));
			}

			let matchCount = 0;
			sections.forEach((section) => {
				const matches = !query || section.textContent.toLocaleLowerCase().includes(query);
				section.hidden = !matches;
				if (matches) {
					matchCount += 1;
				}
				if (query && matches) {
					section.open = true;
				}
			});

			if (noResults) {
				const showEmpty = Boolean(query) && matchCount === 0;
				noResults.hidden = !showEmpty;
				if (showEmpty && noResultsQuery) {
					noResultsQuery.textContent = event.target.value.trim();
				}
			}

			if (!query && preSearchState) {
				sections.forEach((section) => {
					if (preSearchState.has(section)) {
						section.open = preSearchState.get(section);
					}
				});
				preSearchState = null;
			}
		});

		if (clearSearch) {
			clearSearch.addEventListener("click", () => {
				searchInput.value = "";
				searchInput.dispatchEvent(new Event("input", { bubbles: true }));
				searchInput.focus();
			});
		}
	}

	const navStrip = document.querySelector(".nav-strip");
	if (navStrip) {
		const updateNavFades = () => {
			const scrollable = navStrip.scrollWidth - navStrip.clientWidth > 1;
			navStrip.classList.toggle("is-scrollable", scrollable);
			navStrip.classList.toggle("at-start", navStrip.scrollLeft <= 1);
			navStrip.classList.toggle(
				"at-end",
				navStrip.scrollLeft + navStrip.clientWidth >= navStrip.scrollWidth - 1
			);
		};
		updateNavFades();
		navStrip.addEventListener("scroll", updateNavFades, { passive: true });
		window.addEventListener("resize", updateNavFades);
	}

	document.querySelectorAll(".nav-strip a").forEach((link) => {		link.addEventListener("click", () => {
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
