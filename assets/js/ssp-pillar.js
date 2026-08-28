(() => {
  const themeButton = document.getElementById("themeBtn");
  const menuButton = document.querySelector(".menu-toggle");
  const siteNav = document.getElementById("siteNav");
  const skillSearch = document.getElementById("skillSearch");
  const filterButtons = Array.from(document.querySelectorAll(".filter"));
  const skillCards = Array.from(document.querySelectorAll(".skill-card"));
  const resultCount = document.getElementById("resultCount");
  const clearFilters = document.getElementById("clearFilters");
  const reviewLaunch = document.getElementById("reviewLaunch");
  const skillLabel = document.body.dataset.skillLabel || "skill";
  let activeCategory = "all";

  function syncThemeButton() {
    const dark = document.documentElement.getAttribute("data-theme") === "dark";
    themeButton.textContent = dark ? "\u2600" : "\u263E";
    themeButton.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    themeButton.title = themeButton.getAttribute("aria-label");
  }

  function toggleTheme() {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("sspTheme", next); } catch (error) {}
    syncThemeButton();
  }

  function setMenu(open) {
    siteNav.classList.toggle("is-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
    menuButton.textContent = open ? "\u00D7" : "\u2630";
  }

  function applyFilters() {
    const query = skillSearch.value.trim().toLowerCase();
    let visibleCount = 0;
    skillCards.forEach(card => {
      const matchesQuery = !query || card.textContent.toLowerCase().includes(query);
      const matchesCategory = activeCategory === "all" || card.dataset.category === activeCategory;
      const visible = matchesQuery && matchesCategory;
      card.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    let empty = document.querySelector(".empty");
    if (!visibleCount && !empty) {
      empty = document.createElement("div");
      empty.className = "empty";
      const heading = document.createElement("h3");
      heading.textContent = `No matching ${skillLabel} skills`;
      const message = document.createElement("p");
      message.textContent = "Try another term or clear the active filters.";
      empty.append(heading, message);
      document.getElementById("skillGrid").appendChild(empty);
    } else if (visibleCount && empty) {
      empty.remove();
    }

    resultCount.textContent = `${visibleCount} ${skillLabel} skill${visibleCount === 1 ? "" : "s"}`;
    clearFilters.hidden = !query && activeCategory === "all";
  }

  function resetFilters() {
    skillSearch.value = "";
    activeCategory = "all";
    filterButtons.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.category === "all")));
    applyFilters();
  }

  themeButton.addEventListener("click", toggleTheme);
  menuButton.addEventListener("click", () => setMenu(menuButton.getAttribute("aria-expanded") !== "true"));
  document.addEventListener("keydown", event => { if (event.key === "Escape") setMenu(false); });
  skillSearch.addEventListener("input", applyFilters);
  filterButtons.forEach(button => button.addEventListener("click", () => {
    activeCategory = button.dataset.category;
    filterButtons.forEach(item => item.setAttribute("aria-pressed", String(item === button)));
    applyFilters();
  }));
  clearFilters.addEventListener("click", resetFilters);
  if (reviewLaunch) {
    const submissionUrl = document.querySelector('meta[name="review-submission-url"]')?.content.trim();
    reviewLaunch.disabled = !submissionUrl;
    if (submissionUrl) reviewLaunch.addEventListener("click", () => window.open(submissionUrl, "ssp-deep-review", "noopener"));
  }
  syncThemeButton();
})();