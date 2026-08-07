(() => {
	const root = document.documentElement;
	const themeToggle = document.getElementById("theme-toggle");
	const searchInput = document.getElementById("searchInput");
	const sections = Array.from(document.querySelectorAll("#resources details"));

	const updateThemeLabel = () => {
		const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
		themeToggle.setAttribute("aria-label", `Switch to ${nextTheme} mode`);
	};

	themeToggle.addEventListener("click", () => {
		root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
		updateThemeLabel();
	});

	searchInput.addEventListener("input", (event) => {
		const query = event.target.value.trim().toLocaleLowerCase();

		sections.forEach((section) => {
			const matches = !query || section.textContent.toLocaleLowerCase().includes(query);
			section.hidden = !matches;
			if (query && matches) {
				section.open = true;
			}
		});
	});

	document.querySelectorAll(".nav-strip a").forEach((link) => {
		link.addEventListener("click", () => {
			const section = document.querySelector(link.getAttribute("href"));
			if (section) {
				section.open = true;
			}
		});
	});

	updateThemeLabel();
	window.setTimeout(() => document.body.classList.remove("is-preload"), 100);
})();
