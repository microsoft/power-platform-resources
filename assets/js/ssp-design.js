(() => {
  const themeButton = document.getElementById("themeBtn");
  const menuButton = document.querySelector(".menu-toggle");
  const siteNav = document.getElementById("siteNav");
  const skillSearch = document.getElementById("skillSearch");
  const filterButtons = Array.from(document.querySelectorAll(".filter"));
  const outcomeButtons = Array.from(document.querySelectorAll(".outcome"));
  const skillCards = Array.from(document.querySelectorAll(".skill-card"));
  const resultCount = document.getElementById("resultCount");
  const clearFilters = document.getElementById("clearFilters");
  const agentLaunch = document.getElementById("agentLaunch");
  const agentStatus = document.getElementById("agentStatus");
  const advisorTitle = document.getElementById("advisorTitle");
  const advisorSummary = document.getElementById("advisorSummary");
  const stageItems = Array.from(document.querySelectorAll(".advisor-stages li"));
  const agentUrl = document.querySelector('meta[name="copilot-studio-agent-url"]')?.content.trim();
  let activeCategory = "all";
  let activeOutcome = "";

  const recommendations = {
    new: {
      title: "Start with the Solution Architecture Blueprint",
      summary: "Frame the solution boundary first, then pair it with Data Model Designer and Security Role Mapper before build begins.",
      category: "architecture"
    },
    modernize: {
      title: "Start with the Experience Pattern Selector",
      summary: "Clarify the target experience, then use Integration Pattern Selector and ALM Topology Planner to define a lower-risk transition.",
      category: "experience"
    },
    govern: {
      title: "Start with the Environment Strategy Blueprint",
      summary: "Establish environment and policy boundaries, then add Security Role Mapper and ALM Topology Planner for delivery controls.",
      category: "governance"
    },
    review: {
      title: "Start with the Well-Architected Design Check",
      summary: "Review the proposed design, surface material risks, and route each finding to the focused skill that can resolve it.",
      category: "architecture"
    }
  };

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

  function updateAdvisor(outcome) {
    const recommendation = recommendations[outcome];
    if (!recommendation) {
      advisorTitle.textContent = "Describe the decision you need to make";
      advisorSummary.textContent = "The advisor will clarify your outcome, constraints, audience, data, and governance needs before recommending a skill sequence.";
      stageItems.forEach((item, index) => item.classList.toggle("active", index === 0));
      return;
    }
    advisorTitle.textContent = recommendation.title;
    advisorSummary.textContent = recommendation.summary;
    stageItems.forEach((item, index) => item.classList.toggle("active", index <= 2));
  }

  function applyFilters() {
    const query = skillSearch.value.trim().toLowerCase();
    let visibleCount = 0;
    skillCards.forEach(card => {
      const matchesQuery = !query || card.textContent.toLowerCase().includes(query);
      const matchesCategory = activeCategory === "all" || card.dataset.category === activeCategory;
      const matchesOutcome = !activeOutcome || card.dataset.outcomes.split(" ").includes(activeOutcome);
      const visible = matchesQuery && matchesCategory && matchesOutcome;
      card.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    let empty = document.querySelector(".empty");
    if (!visibleCount && !empty) {
      empty = document.createElement("div");
      empty.className = "empty";
      const heading = document.createElement("h3");
      heading.textContent = "No matching Design skills";
      const message = document.createElement("p");
      message.textContent = "Try another term or clear the active filters.";
      empty.append(heading, message);
      document.getElementById("skillGrid").appendChild(empty);
    } else if (visibleCount && empty) {
      empty.remove();
    }

    resultCount.textContent = `${visibleCount} Design skill${visibleCount === 1 ? "" : "s"}`;
    clearFilters.hidden = !query && activeCategory === "all" && !activeOutcome;
  }

  function resetFilters() {
    skillSearch.value = "";
    activeCategory = "all";
    activeOutcome = "";
    filterButtons.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.category === "all")));
    outcomeButtons.forEach(button => button.setAttribute("aria-pressed", "false"));
    updateAdvisor("");
    applyFilters();
  }

  function configureAgent() {
    if (!agentUrl) {
      agentLaunch.disabled = true;
      agentStatus.textContent = "Copilot Studio connection pending";
      return;
    }
    agentLaunch.disabled = false;
    agentLaunch.textContent = "Start advisory session";
    agentStatus.textContent = "Copilot Studio agent available";
    agentLaunch.addEventListener("click", () => window.open(agentUrl, "ssp-design-advisor", "noopener"));
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
  outcomeButtons.forEach(button => button.addEventListener("click", () => {
    const selected = button.getAttribute("aria-pressed") !== "true";
    activeOutcome = selected ? button.dataset.outcome : "";
    outcomeButtons.forEach(item => item.setAttribute("aria-pressed", String(selected && item === button)));
    updateAdvisor(activeOutcome);
    applyFilters();
    document.getElementById("skills").scrollIntoView({ behavior: "smooth", block: "start" });
  }));
  clearFilters.addEventListener("click", resetFilters);

  syncThemeButton();
  configureAgent();
})();