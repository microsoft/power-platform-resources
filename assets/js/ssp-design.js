(() => {
  const themeButton = document.getElementById("themeBtn");
  const menuButton = document.querySelector(".menu-toggle");
  const siteNav = document.getElementById("siteNav");
  const skillSearch = document.getElementById("skillSearch");
  const filterButtons = Array.from(document.querySelectorAll(".filter"));
  const skillCards = Array.from(document.querySelectorAll(".skill-card"));
  const resultCount = document.getElementById("resultCount");
  let activeCategory = filterButtons[0].dataset.category;
  const categoryDescriptions = {
    architecture: "Solution blueprints, integration patterns, and Well-Architected design reviews.",
    data: "Dataverse tables, relationships, and ownership choices for a maintainable data model.",
    experience: "Choose the right app experience for your users, tasks, devices, and access needs.",
    governance: "Environment strategy, least-privilege access, and application lifecycle management."
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
      heading.textContent = "No matching Design guides";
      const message = document.createElement("p");
      message.textContent = "Try another term, clear the search, or choose another focus area.";
      empty.append(heading, message);
      document.getElementById("skillGrid").appendChild(empty);
    } else if (visibleCount && empty) {
      empty.remove();
    }

    resultCount.textContent = `${visibleCount} Design guide${visibleCount === 1 ? "" : "s"}`;
    const selectedFilter = filterButtons.find(button => button.dataset.category === activeCategory);
    const searchLabel = "Search within " + selectedFilter.children[1].textContent;
    skillSearch.placeholder = searchLabel + "...";
    skillSearch.closest("label").querySelector(".sr-only").textContent = searchLabel;
    filterButtons.forEach(button => button.setAttribute("aria-pressed", String(button === selectedFilter)));
    document.getElementById("guide-panel-heading").textContent = selectedFilter.children[1].textContent + " guides";
    document.getElementById("guide-panel-description").textContent = categoryDescriptions[activeCategory];
  }

  function openLinkedGuide() {
    const card = skillCards.find(item => "#" + item.id === location.hash);
    if (!card) return;
    activeCategory = card.dataset.category;
    skillSearch.value = "";
    applyFilters();
    card.scrollIntoView({ block: "start" });
  }

  function configureAdvisor() {
    const engine = window.SSPDesignAdvisor;
    if (!engine) return;
    const byId = id => document.getElementById(id);
    const form = byId("advisorForm");
    const resultPanel = byId("advisorResult");
    const options = byId("advisorOptions");
    const next = byId("advisorNext");
    const progress = byId("advisorProgress");
    let answers = {};
    let step = 0;
    let result = null;
    let skills = [];

    function element(tag, text, className) {
      const node = document.createElement(tag);
      if (text) node.textContent = text;
      if (className) node.className = className;
      return node;
    }
    function link(title, url) {
      const node = element("a", title);
      node.href = url;
      if (url.startsWith("https://")) {
        node.target = "_blank";
        node.rel = "noopener";
      }
      return node;
    }
    function stage(index) {
      document.querySelectorAll(".local-advisor .advisor-stages li").forEach((item, position) => {
        item.classList.toggle("active", position === index);
        if (position === index) item.setAttribute("aria-current", "step");
        else item.removeAttribute("aria-current");
      });
    }
    const choiceIcons = {
      role: { maker: "tools", architect: "drafting-compass", both: "users" },
      goal: { new: "plus-circle", modernize: "sync-alt", govern: "building", review: "clipboard-check" },
      users: { internal: "building", external: "globe", mixed: "users" },
      workload: { app: "desktop", automation: "cogs", agent: "robot", mixed: "layer-group" },
      data: { dataverse: "database", existing: "server", new: "plus-circle" },
      constraint: { sensitive: "shield-alt", integration: "plug", licensing: "file-invoice-dollar", scale: "chart-line" },
      experience: { mobile: "mobile-alt", records: "table", portal: "globe" },
      pain: { performance: "tachometer-alt", manual: "hand-paper", legacy: "tools" },
      scope: { team: "users", multiple: "sitemap", tenant: "building" },
      evidence: { design: "file-alt", prototype: "flask", live: "desktop" }
    };
    function choiceIcon(questionId, value) {
      const name = choiceIcons[questionId]?.[value] || (value === "unsure" ? "question-circle" : "list-ol");
      const icon = element("span", null, `advisor-choice-icon fas fa-${name}`);
      icon.setAttribute("aria-hidden", "true");
      return icon;
    }
    function renderQuestion(focus = true) {
      result = null;
      skills = [];
      byId("advisorResultBody").replaceChildren();
      resultPanel.hidden = true;
      form.hidden = false;
      const questions = engine.questionsFor(answers);
      const question = questions[step];
      progress.textContent = `Question ${step + 1} of 7`;
      byId("advisorQuestion").textContent = question.title;
      options.replaceChildren();
      options.classList.toggle("advisor-ranked", Boolean(question.ranked));
      if (question.ranked) {
        const renderRanks = () => {
          options.replaceChildren();
          const selected = answers.constraint || [];
          for (let index = 0; index < 3; index += 1) {
            const label = element("label", null, "advisor-rank");
            const caption = element("span", null, "advisor-rank-caption");
            caption.append(choiceIcon(question.id, selected[index]), document.createTextNode(`Priority ${index + 1}${index ? " (optional)" : ""}`));
            label.appendChild(caption);
            const select = document.createElement("select");
            select.id = `advisorPriority${index + 1}`;
            select.required = index === 0;
            select.disabled = index > 0 && (!selected[index - 1] || selected[0] === "unsure");
            const placeholder = element("option", index ? "None" : "Select first priority");
            placeholder.value = "";
            select.appendChild(placeholder);
            question.options.filter(option => index === 0 || option.value !== "unsure").forEach(option => {
              const choice = element("option", option.label);
              choice.value = option.value;
              select.appendChild(choice);
            });
            select.value = selected[index] || "";
            select.addEventListener("change", () => {
              const values = [...(answers.constraint || [])];
              const previous = values[index];
              const other = values.indexOf(select.value);
              if (select.value && other >= 0 && other !== index) values[other] = previous || "";
              values[index] = select.value;
              answers = engine.normalize({ ...answers, constraint: values });
              renderRanks();
              next.disabled = !answers.constraint;
              byId("advisorReset").disabled = false;
              const target = byId(select.id);
              (target.disabled ? byId("advisorPriority1") : target).focus({ preventScroll: true });
            });
            label.appendChild(select);
            options.appendChild(label);
          }
        };
        renderRanks();
      } else question.options.forEach(option => {
        const label = element("label", null, "advisor-option");
        const input = document.createElement("input");
        input.type = "radio";
        input.name = question.id;
        input.value = option.value;
        input.required = true;
        input.checked = answers[question.id] === option.value;
        input.addEventListener("click", () => {
          answers = engine.normalize({ ...answers, [question.id]: option.value });
          advance();
        });
        label.append(input, choiceIcon(question.id, option.value), element("span", option.label));
        options.appendChild(label);
      });
      next.hidden = !question.ranked;
      next.replaceChildren(document.createTextNode("Continue "), element("span", null, "fas fa-arrow-right"));
      next.lastChild.setAttribute("aria-hidden", "true");
      next.disabled = !answers[question.id];
      byId("advisorBack").disabled = step === 0;
      byId("advisorReset").disabled = !Object.keys(answers).length;
      stage(step < 2 ? 0 : 1);
      if (focus) {
        byId("advisorQuestion").scrollIntoView({ block: "center", behavior: "instant" });
        byId("advisorQuestion").focus({ preventScroll: true });
      }
    }
    function renderResult() {
      result = engine.recommend(answers);
      if (!result.complete) return;
      skills = result.recommendations.flatMap(item => {
        const card = skillCards.find(card => card.querySelector("h3").textContent === item.title);
        const source = card?.querySelector('.skill-actions a[href^="https://github.com/"]');
        if (!source) return [];
        const scope = card.querySelector(".guide-resources p").cloneNode(true);
        scope.querySelectorAll("br").forEach(breakNode => breakNode.replaceWith(document.createTextNode(": ")));
        return [{ title: source.textContent.trim(), url: source.href, scope: scope.textContent }];
      });
      form.hidden = true;
      resultPanel.hidden = false;
      progress.textContent = "Design starting point ready";
      stage(2);
      byId("advisorResultTitle").textContent = result.title;
      const body = byId("advisorResultBody");
      body.replaceChildren(element("p", result.caveat, "advisor-caveat"));
      body.append(element("h4", "Start here"), element("p", result.nextAction));
      const firstAction = element("div", null, "advisor-links");
      firstAction.appendChild(link(result.recommendations[0].title, result.recommendations[0].url));
      body.appendChild(firstAction);
      function listSection(title, values) {
        body.appendChild(element("h4", title));
        const list = element("ul");
        values.forEach(value => list.appendChild(element("li", value)));
        body.appendChild(list);
      }
      listSection("Options to evaluate", result.options);
      const priorities = element("p", result.priorities.map(item => `${item.rank}. ${item.label}`).join("; "), "advisor-priorities");
      body.append(element("h4", "Your priorities"), priorities);
      body.appendChild(element("h4", "Suggested guide sequence"));
      const sequence = element("ol", null, "advisor-sequence");
      result.recommendations.forEach(item => {
        const entry = element("li");
        const actions = element("div", null, "advisor-links");
        actions.append(link("Open guide", item.url), link("Microsoft Learn guidance", item.source));
        entry.append(element("strong", item.title), element("p", item.reason), actions);
        sequence.appendChild(entry);
      });
      body.appendChild(sequence);
      if (skills.length) {
        const supporting = element("details", null, "advisor-answer-summary");
        supporting.append(element("summary", `Supporting published skills (${skills.length})`), element("p", "Source instructions, not a running skill. Review prerequisites, product scope, and permissions before execution in a compatible host."));
        const list = element("ul", null, "advisor-skill-list");
        skills.forEach(skill => {
          const entry = element("li");
          const actions = element("div", null, "advisor-links");
          actions.appendChild(link(skill.title, skill.url));
          entry.append(element("p", skill.scope), actions);
          list.appendChild(entry);
        });
        supporting.appendChild(list);
        body.appendChild(supporting);
      }
      listSection("Assumptions to validate", result.assumptions);
      const actions = element("div", null, "advisor-links");
      actions.appendChild(link("Open design topic", result.topicUrl));
      if (result.reviewUrl) actions.appendChild(link("Review implementation evidence", result.reviewUrl));
      body.appendChild(actions);
      const summary = element("details", null, "advisor-answer-summary");
      summary.appendChild(element("summary", "Your answers"));
      const list = element("dl");
      result.answers.forEach(answer => list.append(element("dt", answer.question), element("dd", answer.answer)));
      summary.appendChild(list);
      body.appendChild(summary);
      byId("advisorResultTitle").focus({ preventScroll: true });
      resultPanel.scrollIntoView({ block: "start", behavior: "instant" });
    }
    function reset() {
      answers = {};
      step = 0;
      renderQuestion();
    }
    function advance() {
      if (!answers[engine.questionsFor(answers)[step].id]) return;
      if (step === 6) renderResult();
      else { step += 1; renderQuestion(); }
    }
    form.addEventListener("submit", event => {
      event.preventDefault();
      advance();
    });
    byId("advisorBack").addEventListener("click", () => { if (step > 0) step -= 1; renderQuestion(); });
    byId("advisorReset").addEventListener("click", reset);
    byId("advisorRestart").addEventListener("click", reset);
    byId("advisorEdit").addEventListener("click", () => { step = 6; renderQuestion(); });
    byId("advisorDownload").addEventListener("click", () => {
      if (!result?.complete) return;
      const markdown = engine.toMarkdown(result, location.href, skills);
      const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "ssp-design-brief.md";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      progress.textContent = "Design brief download requested";
    });
    byId("advisorPdf").addEventListener("click", () => {
      if (!result?.complete) return;
      const details = Array.from(resultPanel.querySelectorAll("details"));
      const openStates = details.map(item => item.open);
      const originalTitle = document.title;
      const restore = () => {
        document.body.classList.remove("print-design-brief");
        details.forEach((item, index) => { item.open = openStates[index]; });
        document.title = originalTitle;
      };
      details.forEach(item => { item.open = true; });
      document.body.classList.add("print-design-brief");
      document.title = "SSP Design Brief";
      progress.textContent = "Print dialog opened; choose Save as PDF";
      window.addEventListener("afterprint", restore, { once: true });
      window.print();
    });
    byId("advisorApp").hidden = false;
    renderQuestion(false);
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

  applyFilters();
  syncThemeButton();
  configureAdvisor();
})();