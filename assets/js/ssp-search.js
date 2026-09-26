(() => {
  const sources = [
    { file: 'ssp-search.html', name: 'Resources' },
    { file: 'ssp-design.html', name: 'Design' },
    { file: 'ssp-build.html', name: 'Build' },
    { file: 'ssp-build-guide.html', name: 'Build journeys' },
    { file: 'ssp-review.html', name: 'Review' },
    { file: 'ssp-landing.html', name: 'About' }
  ];
  const byId = id => document.getElementById(id);
  let entries = [];
  let query = '';
  let limit = 3;
  let ready = false;
  let catalogMode = location.hash === '#skills';
  let focusCatalog = false;
  let focusSearch = false;
  const clean = text => text.replace(/\s+/g, ' ').trim();
  const slug = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const element = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  function anchor(title, href) {
    const link = element('a', title);
    link.href = href;
    if (new URL(href, location.href).origin !== location.origin) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
    return link;
  }
  let selectedGoal = null;
  function renderJourney(focus = true) {
    byId('goalChoices').hidden = false;
    byId('journeyStep').hidden = !selectedGoal;
    byId('goalChoices').classList.toggle('has-selection', Boolean(selectedGoal));
    byId('goalChoices').querySelectorAll('[data-goal]').forEach(button => {
      const selected = button.dataset.goal === selectedGoal;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    if (!selectedGoal) {
      if (focus) byId('startHeading').focus();
      return;
    }
    const journey = SSPSearch.journeys.find(item => item.id === selectedGoal);
    byId('journeyContext').textContent = 'Paths for ' + journey.label.toLowerCase();
    byId('journeyHeading').textContent = journey.question;
    byId('journeyIntro').textContent = journey.intro;
    const paths = byId('answerChoices');
    paths.replaceChildren();
    journey.options.forEach(option => {
      const card = element('article', null, 'journey-path' + (option.id === 'unsure' ? ' journey-path-unsure' : ''));
      const label = element('p', option.label, 'journey-path-label');
      const title = element('h3', option.title);
      const explanation = element('p', option.why, 'journey-path-explanation');
      const details = element('dl', null, 'journey-path-details');
      for (const [term, value] of [['Best for', option.bestFor], ["You'll leave with", option.outcome]]) {
        details.append(element('dt', term), element('dd', value));
      }
      const footer = element('div', null, 'journey-path-footer');
      const action = anchor(option.action, option.url);
      action.className = 'btn';
      action.dataset.previewReason = option.why;
      footer.append(action);
      if (option.related.length) {
        const related = element('div', null, 'journey-path-related');
        related.append(element('strong', 'Related resources'));
        const list = element('ul');
        option.related.forEach(id => {
          const heading = byId(id)?.querySelector('h2');
          if (!heading) return;
          const item = element('li');
          item.append(anchor(clean(heading.textContent), '#' + id));
          list.append(item);
        });
        related.append(list);
        footer.append(related);
      }
      card.append(label, title, explanation, details, footer);
      paths.append(card);
    });
    if (focus) byId('journeyHeading').focus();
  }
  function resetJourney() {
    selectedGoal = null;
    renderJourney();
  }
  const goalPresentation = {
    learn: { label: 'Learn', description: 'Explore the platform, build skills, and get hands-on practice.' },
    build: { label: 'Build', description: 'Create an app, automate a task, or build a website or agent.' },
    fix: { label: 'Fix', description: 'Investigate errors, slow apps, and flows that fail.' },
    review: { label: 'Review', description: 'Check quality, performance, and security before release.' },
    scale: { label: 'Scale', description: 'Plan adoption, environments, and access for more people.' }
  };
  SSPSearch.journeys.forEach((journey, index) => {
    const presentation = goalPresentation[journey.id];
    const button = element('button', null, 'journey-choice');
    const number = element('span', String(index + 1).padStart(2, '0') + ' / ' + presentation.label, 'goal-number');
    number.setAttribute('aria-hidden', 'true');
    const title = element('span', journey.label, 'goal-title');
    title.id = 'goal-title-' + journey.id;
    const description = element('span', presentation.description, 'goal-description');
    description.id = 'goal-description-' + journey.id;
    button.setAttribute('aria-labelledby', title.id);
    button.setAttribute('aria-describedby', description.id);
    button.setAttribute('aria-pressed', 'false');
    button.append(number, title, description);
    button.type = 'button';
    button.dataset.goal = journey.id;
    button.addEventListener('click', () => {
      search('');
      selectedGoal = journey.id;
      renderJourney();
    });
    byId('goalChoices').append(button);
  });
  renderJourney(false);
  byId('chooseGoal').addEventListener('click', resetJourney);
  function extract(doc, source) {
    const items = [];
    doc.querySelectorAll('.panel-body li a[href]').forEach(link => {
      const url = new URL(link.getAttribute('href'), new URL(source.file, location.href));
      if (!['https:', 'http:'].includes(url.protocol)) return;
      const panel = link.closest('.panel');
      const row = clean(link.closest('li').textContent);
      const label = clean(link.textContent);
      const prefix = row.includes(' - ') ? row.split(' - ')[0] : '';
      const heading = [...panel.querySelectorAll('h5')].filter(item => item.compareDocumentPosition(link) & 4).at(-1);
      const section = clean(heading?.textContent || '');
      const rowTitle = prefix && !label.toLowerCase().includes(prefix.toLowerCase()) ? prefix + ': ' + label : label;
      const title = section && !rowTitle.toLowerCase().includes(section.toLowerCase()) ? section + ': ' + rowTitle : rowTitle;
      const context = link.closest('li').cloneNode(true);
      context.querySelectorAll('a').forEach(sibling => sibling.remove());
      const productPath = url.pathname.match(/^\/(?:[a-z]{2}-[a-z]{2}\/)?(power-apps|power-automate|power-pages|power-bi|microsoft-copilot-studio)(?:\/|$)/i)?.[1] || '';
      const product = productPath.replace(/-/g, ' ');
      const text = section + ' ' + clean(context.textContent.replace(/\|/g, ' ')) + ' ' + label + ' ' + product;
      items.push({ title, text, category: clean(panel.querySelector('h2').textContent), categoryId: panel.id, type: 'Resource', url: url.href, source: source.file + '#' + panel.id, sourceName: 'Resource catalog' });
    });
    doc.querySelectorAll('.skill-card').forEach(card => {
      const title = clean(card.querySelector('h3').textContent);
      const description = [...card.querySelectorAll('p')].map(paragraph => clean(paragraph.textContent)).join(' ');
      const tags = [...card.querySelectorAll('.tag, .skill-kind')].map(tag => clean(tag.textContent)).join(' ');
      items.push({ title, description, text: description + ' ' + tags, category: source.name + ' / ' + card.dataset.category, type: 'Guide', url: source.file + '#skill-' + slug(title), source: source.file + '#skills', sourceName: source.name + ' pillar' });
    });
    doc.querySelectorAll('.build-journey').forEach(journey => {
      const heading = journey.querySelector('h1, h2');
      if (!heading || !journey.id) return;
      const summary = clean(journey.querySelector('.journey-heading p')?.textContent || '');
      const stages = [...journey.querySelectorAll('.coached-step h3')].map(stage => clean(stage.textContent)).join(' ');
      items.push({ title: clean(heading.textContent), description: summary, text: summary + ' ' + stages, category: 'Build / Journey', categoryId: 'build-journeys', type: 'Guide', url: source.file + '#' + journey.id, source: source.file, sourceName: source.name });
    });
    const heading = doc.querySelector('h1');
    if (heading) items.push({ title: source.name + ': ' + clean(heading.textContent), text: clean(doc.querySelector('.lead, .sub, .pagehead p')?.textContent || ''), category: source.name, type: 'Page', url: source.file, source: source.file, sourceName: source.name });
    if (source.name === 'About') {
      const lab = doc.querySelector('a[href*="apps-agents-workshop/labs"]');
      if (lab) items.push({ title: 'Power Series hands-on labs', text: 'Power Platform apps agents workshop learning hands-on labs', category: 'Learn', type: 'Learning', url: lab.href, source: source.file + '#pillars', sourceName: 'Learn pillar' });
    }
    return items;
  }
  async function loadIndex() {
    ready = false;
    byId('indexStatus').textContent = 'Loading site content...';
    byId('retryIndex').hidden = true;
    const results = await Promise.all(sources.map(async source => {
      try {
        if (source.file === 'ssp-search.html') return { items: extract(document, source) };
        const response = await fetch(source.file, { cache: 'no-cache', signal: AbortSignal.timeout(10000) });
        if (!response.ok) throw new Error('Unavailable page');
        return { items: extract(new DOMParser().parseFromString(await response.text(), 'text/html'), source) };
      } catch { return { failed: source.name, items: [] }; }
    }));
    let catalog;
    try {
      const response = await fetch('assets/data/skills-advisor.json', { cache: 'no-cache', signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error('Unavailable skills catalog');
      catalog = await response.json();
      const types = { skill: 'Skill', 'mcp-capability': 'MCP capability', reference: 'Reference' };
      results.push({ items: catalog.skills.map(item => {
        const isPowerCat = item.marketplace === 'Power CAT Skills';
        const destination = isPowerCat ? item.source : 'https://aka.ms/powerplatformskillsadvisor';
        return {
          advisorId: item.id,
          skillDetails: {
            type: types[item.tier], products: item.products, purpose: item.purpose,
            status: item.status, publisher: item.publisher, marketplace: item.marketplace,
            license: item.license, verified: item.verified, note: item.action?.note || '',
            prompt: item.action?.prompt || '', canonicalSource: item.source,
            route: isPowerCat ? 'Power CAT canonical source' : 'Power Platform Skills Advisor'
          },
          title: item.displayName || item.name,
          description: item.description,
          text: [item.name, item.description, ...item.products, ...item.locations, item.purpose, item.action?.note || ''].join(' '),
          category: [item.purpose, ...item.products].join(' / '),
          type: types[item.tier],
          availability: item.status,
          products: item.products,
          url: destination,
          source: catalog.source,
          sourceName: 'Skills Advisor',
          verified: item.verified
        };
      }) });
    } catch { results.push({ failed: 'Skills Advisor catalog', items: [] }); }
    let workshop;
    try {
      const response = await fetch('assets/data/workshop-labs.json', { cache: 'no-cache', signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error('Unavailable workshop catalog');
      workshop = await response.json();
      results.push({ items: workshop.labs.map(lab => ({ ...lab, labDetails: {
        persona: lab.persona, level: lab.level, duration: lab.duration,
        license: workshop.license, imported: workshop.retrieved.slice(0, 10)
      } })) });
    } catch { results.push({ failed: 'Power Series labs', items: [] }); }
    const unique = new Map();
    results.flatMap(result => result.items).forEach(item => {
      const key = item.advisorId ? 'advisor:' + item.advisorId : new URL(item.url, location.href).href;
      if (unique.has(key)) {
        const previous = unique.get(key);
        previous.text += ' ' + item.text;
      } else unique.set(key, item);
    });
    entries = [...unique.values()];
    const failed = results.filter(result => result.failed).map(result => result.failed);
    ready = true;
    const siteFailures = results.slice(0, sources.length).filter(result => result.failed).length;
    const counts = catalog ? ['skill', 'mcp-capability', 'reference'].map(tier => catalog.skills.filter(item => item.tier === tier).length) : [];
    byId('indexStatus').textContent = entries.length ? `${entries.length} indexed entries from ${sources.length - siteFailures} site pages${catalog ? ` and Skills Advisor (${counts[0]} skills, ${counts[1]} MCP capabilities, ${counts[2]} references; source verified ${catalog.sourceGenerated}; imported ${catalog.retrieved.slice(0, 10)})` : ''}.${failed.length ? ' Unavailable: ' + failed.join(', ') + '.' : ''}` : 'Site content could not be loaded. Open this site over HTTP and try again, or browse Resources.';
    if (workshop) byId('indexStatus').textContent += ` Power Series: ${workshop.labs.length} labs.`;
    byId('retryIndex').hidden = !failed.length;
    byId('searchNotice').hidden = !failed.length;
    byId('searchNotice').textContent = entries.length ? 'Some search content is unavailable. You can still choose a goal or browse resources below.' : 'Search is unavailable. Choose a goal or browse resources below.';
    render();
  }
  function render() {
    if (!ready) return;
    const pool = catalogMode ? entries.filter(item => item.advisorId) : entries;
    let ranked = catalogMode && !query ? pool.map(item => ({ ...item, matched: [] })).sort((first, second) => first.title.localeCompare(second.title)) : SSPSearch.rank(pool, query);
    const type = byId('typeFilter').value;
    const product = byId('productFilter').value;
    const candidate = ranked.length && !catalogMode && !product && !type ? SSPSearch.guidance(entries.filter(item => !item.advisorId), query) : null;
    const guide = candidate && (candidate.id !== 'troubleshoot' || /\b(flow|flows|approval|automate)\b/i.test(query)) && (candidate.id !== 'performance' || /\b(app|apps|canvas)\b/i.test(query)) ? candidate : null;
    if (guide) {
      const recommended = guide.steps.map(step => ({ ...step.result, recommendationReason: `Suggested next step: ${step.why}` }));
      const urls = new Set(recommended.map(item => item.url));
      ranked = [...recommended, ...ranked.filter(item => !urls.has(item.url))];
    }
    const filtered = ranked.filter(item => (!type || item.type === type) && (!product || SSPSearch.tokens(product).every(word => SSPSearch.tokens(item.title + ' ' + item.text).includes(word))));
    byId('searchClarify').hidden = !query || catalogMode || Boolean(guide) || Boolean(type || product);
    byId('searchResults').hidden = !query && !catalogMode;
    byId('resultsHeading').textContent = catalogMode ? 'Skills Advisor catalog' : 'Results across the site';
    byId('resetSearch').textContent = catalogMode ? 'Search across SSP' : 'Clear search';
    byId('guidance').hidden = !guide || !query;
    byId('guidanceSteps').replaceChildren();
    if (guide) {
      byId('guidanceTitle').textContent = guide.title;
      byId('guidanceWhy').textContent = guide.why;
      guide.steps.slice(0, 1).forEach(step => {
        const item = element('li');
        const link = anchor(step.result.title, step.result.url);
        link.dataset.previewSummary = step.result.description || step.result.text || step.result.title;
        link.dataset.previewReason = step.why;
        item.append(element('h3', step.title), element('p', step.why), link);
        byId('guidanceSteps').append(item);
      });
    }
    byId('resultSummary').textContent = `${filtered.length} matching entr${filtered.length === 1 ? 'y' : 'ies'}${type || product ? ' with these filters' : ''}`;
    byId('resultList').replaceChildren();
    filtered.slice(0, limit).forEach(item => {
      const article = element('article', '', 'search-result');
      if (item.advisorId) article.dataset.advisorId = item.advisorId;
      const heading = element('h3');
      const description = item.description || item.text;
      const reason = SSPSearch.explain(item, query);
      const match = SSPSearch.matchDetails(item, query);
      const resourceLink = anchor(item.title, item.url);
      resourceLink.dataset.previewSummary = description;
      resourceLink.dataset.previewReason = reason;
      if (item.skillDetails) resourceLink.dataset.skillDetails = JSON.stringify(item.skillDetails);
      if (item.labDetails) resourceLink.dataset.labDetails = JSON.stringify(item.labDetails);
      heading.append(resourceLink);
      const excerpt = description.length > 270 ? description.slice(0, 267) + '...' : description;
      const source = anchor(item.advisorId ? 'View skill details' : item.labDetails ? 'View lab details' : 'View in ' + item.sourceName, item.advisorId || item.labDetails ? item.url : item.source);
      if (item.skillDetails || item.labDetails) {
        if (item.skillDetails) source.dataset.skillDetails = JSON.stringify(item.skillDetails);
        if (item.labDetails) source.dataset.labDetails = JSON.stringify(item.labDetails);
        source.dataset.previewTitle = item.title;
        source.dataset.previewSummary = description;
        source.dataset.previewReason = reason;
      }
      source.className = 'result-source';
      article.append(element('div', catalogMode ? item.type + ' / ' + item.category : item.sourceName, 'result-meta'), heading, element('p', excerpt));
      if (match.percent !== null) {
        const matches = element('div', '', 'result-keywords');
        const percentage = element('span', `${match.percent}% keyword match`, 'result-coverage');
        percentage.title = 'Coverage of normalized search terms: exact matches count fully; related terms count half. Not a suitability or confidence score.';
        percentage.setAttribute('aria-label', percentage.textContent + '. ' + percentage.title);
        percentage.tabIndex = 0;
        matches.append(percentage);
        match.keywords.forEach(word => matches.append(element('span', word, 'result-keyword')));
        match.related.forEach(item => matches.append(element('span', `${item.keyword} / ${item.match} (related)`, 'result-keyword')));
        article.append(matches);
        if (match.missing.length) article.append(element('p', 'Not matched: ' + match.missing.join(', '), 'result-match'));
      }
      if (reason) {
        const explanation = element('p', '', 'result-reason');
        explanation.append(element('strong', 'Why suggested: '), document.createTextNode(reason));
        article.append(explanation);
      }
      if (item.duration && item.persona) article.append(element('p', `${item.persona} / Level ${item.level} / ${item.duration}`, 'result-match'));
      if (item.availability) article.append(element('p', item.availability + (item.verified ? ' / Source verified ' + item.verified : ''), 'result-match'));
      article.append(source);
      byId('resultList').append(article);
    });
    byId('emptyResults').hidden = filtered.length > 0;
    byId('moreResults').hidden = filtered.length <= limit;
    if (focusCatalog && catalogMode) {
      focusCatalog = false;
      byId('resultsHeading').scrollIntoView({ block: 'start' });
      byId('resultsHeading').focus({ preventScroll: true });
    }
    if (focusSearch && query && !catalogMode) {
      focusSearch = false;
      const heading = byId('guidance').hidden ? byId('resultsHeading') : byId('guidanceTitle');
      heading.scrollIntoView({ block: 'start' });
      heading.focus({ preventScroll: true });
    }
  }
  function search(value, reveal = false) {
    catalogMode = false;
    focusCatalog = false;
    if (location.hash === '#skills') history.replaceState(null, '', location.pathname + location.search);
    query = value.trim();
    focusSearch = reveal && Boolean(query);
    byId('scenario').value = query;
    byId('typeFilter').value = '';
    byId('productFilter').value = '';
    limit = 3;
    render();
  }
  byId('scenarioForm').addEventListener('submit', event => {
    event.preventDefault();
    selectedGoal = null;
    renderJourney(false);
    search(byId('scenario').value, true);
  });
  ['typeFilter', 'productFilter'].forEach(id => byId(id).addEventListener('change', () => { limit = catalogMode ? 12 : 3; render(); }));
  byId('moreResults').addEventListener('click', () => { limit += catalogMode ? 12 : 3; render(); });
  byId('resetSearch').addEventListener('click', () => { search(''); byId('scenario').focus(); });
  byId('retryIndex').addEventListener('click', loadIndex);
  function browseCatalog() {
    byId('advancedSearch').open = true;
    selectedGoal = null;
    renderJourney(false);
    catalogMode = true;
    focusCatalog = true;
    focusSearch = false;
    query = '';
    byId('scenario').value = '';
    byId('typeFilter').value = 'Skill';
    byId('productFilter').value = '';
    limit = 12;
    render();
  }
  byId('browseSkills').addEventListener('click', () => { history.replaceState(null, '', '#skills'); browseCatalog(); });
  window.addEventListener('hashchange', () => { if (location.hash === '#skills') browseCatalog(); });
  if (catalogMode) browseCatalog();
  byId('themeBtn').addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('sspTheme', theme); } catch {}
  });
  const menuButton = document.querySelector('.menu-toggle');
  function setMenu(open) {
    byId('siteNav').classList.toggle('is-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
  }
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menuButton.focus();
    }
  });
  const resourceCategories = [...document.querySelectorAll('#resourceCategories > .panel')];
  const resourceLinks = [...document.querySelectorAll('#resources .cat-link')];
  let activeResource = 'get-started';
  function renderResources() {
    resourceCategories.forEach(category => {
      const selected = category.id === activeResource;
      category.hidden = !selected;
      category.classList.toggle('active', selected);
      const link = resourceLinks.find(item => item.dataset.target === category.id);
      link.classList.toggle('active', selected);
      link.setAttribute('aria-pressed', String(selected));
    });
    byId('resourceStatus').textContent = `${resourceCategories.length} resource categories`;
  }
  function selectResource(id) {
    activeResource = id;
    renderResources();
    byId(id).scrollIntoView({ block: 'start' });
  }
  function openResourceHash() {
    const category = resourceCategories.find(item => '#' + item.id === location.hash);
    if (category) selectResource(category.id);
  }
  resourceLinks.forEach(link => link.addEventListener('click', () => {
    history.replaceState(null, '', '#' + link.dataset.target);
    selectResource(link.dataset.target);
  }));
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const category = resourceCategories.find(item => '#' + item.id === link.getAttribute('href'));
    if (!category) return;
    event.preventDefault();
    history.pushState(null, '', '#' + category.id);
    selectResource(category.id);
    const heading = category.querySelector('h2');
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  });
  byId('resourceRail').hidden = false;
  renderResources();
  window.addEventListener('hashchange', openResourceHash);
  openResourceHash();
  const initialQuery = new URLSearchParams(location.search).get('q');
  if (initialQuery && !catalogMode) search(initialQuery, true);
  loadIndex();
})();