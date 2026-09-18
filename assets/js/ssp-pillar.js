(() => {
  const themeButton = document.getElementById("themeBtn");
  const menuButton = document.querySelector(".menu-toggle");
  const siteNav = document.getElementById("siteNav");
  const skillSearch = document.getElementById("skillSearch");
  const filterButtons = Array.from(document.querySelectorAll(".filter"));
  const skillCards = Array.from(document.querySelectorAll(".skill-card"));
  const resultCount = document.getElementById("resultCount");
  const reviewLaunch = document.getElementById("reviewLaunch");
  const skillLabel = document.body.dataset.skillLabel || "skill";
  let activeCategory = filterButtons[0].dataset.category;

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
      const matchesQuery = !query || SSPSearch.rank([{ title: card.querySelector('h3').textContent, text: card.textContent }], query).length > 0;
      const matchesCategory = card.dataset.category === activeCategory;
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
      message.textContent = "Try another term, clear the search, or choose another focus area.";
      empty.append(heading, message);
      document.getElementById("skillGrid").appendChild(empty);
    } else if (visibleCount && empty) {
      empty.remove();
    }

    resultCount.textContent = `${visibleCount} ${skillLabel} skill${visibleCount === 1 ? "" : "s"}`;
    const selectedFilter = filterButtons.find(button => button.dataset.category === activeCategory);
    filterButtons.forEach(button => button.setAttribute("aria-pressed", String(button === selectedFilter)));
    document.getElementById("guide-panel-heading").textContent = selectedFilter.querySelector(".guide-label").textContent + " guides";
    document.getElementById("guide-panel-description").textContent = selectedFilter.dataset.description;
  }

  function openLinkedGuide() {
    const card = skillCards.find(item => "#" + item.id === location.hash);
    if (!card) return;
    activeCategory = card.dataset.category;
    skillSearch.value = "";
    applyFilters();
    card.scrollIntoView({ block: "start" });
  }

  themeButton.addEventListener("click", toggleTheme);
  menuButton.addEventListener("click", () => setMenu(menuButton.getAttribute("aria-expanded") !== "true"));
  document.addEventListener("keydown", event => { if (event.key === "Escape") setMenu(false); });
  skillSearch.addEventListener("input", applyFilters);
  filterButtons.forEach(button => button.addEventListener("click", () => {
    activeCategory = button.dataset.category;
    applyFilters();
  }));
  document.addEventListener("DOMContentLoaded", openLinkedGuide);
  window.addEventListener("hashchange", openLinkedGuide);
  if (reviewLaunch) {
    const submissionUrl = document.querySelector('meta[name="review-submission-url"]')?.content.trim();
    reviewLaunch.disabled = !submissionUrl;
    reviewLaunch.textContent = submissionUrl ? "Open submission portal" : "Submission portal pending";
    if (submissionUrl) reviewLaunch.addEventListener("click", () => window.open(submissionUrl, "ssp-deep-review", "noopener"));
  }
  syncThemeButton();
  applyFilters();
})();