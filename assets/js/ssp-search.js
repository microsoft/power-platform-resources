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
  const initialParams = new URLSearchParams(location.search);
  let entries = [];
  let query = initialParams.get('q') || '';
  let limit = Math.max(3, Number.parseInt(initialParams.get('limit') || '3', 10) || 3);
  let ready = false;
  let catalogMode = initialParams.get('mode') === 'skills' || location.hash === '#skills';
  let focusCatalog = false;
  let focusSearch = false;
  let restoreScroll = Number.isFinite(history.state?.scrollY) ? history.state.scrollY : null;
  let activeDetail = initialParams.get('detail') || '';
  let pendingDetail = activeDetail;
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
  let selectedGoal = initialParams.get('goal');
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
      if (option.destination) details.append(element('dt', 'Next destination'), element('dd', option.destination));
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
    syncUrl();
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
      catalogMode = false;
      query = '';
      limit = 3;
      activeDetail = '';
      byId('scenario').value = '';
      selectedGoal = journey.id;
      syncUrl(true);
      renderJourney();
      render();
    });
    byId('goalChoices').append(button);
  });
  if (!SSPSearch.journeys.some(journey => journey.id === selectedGoal)) selectedGoal = null;
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
      results.push({ items: catalog.skills.filter(item => item.marketplace !== 'Power CAT Skills').map(item => {
        const destination = 'https://aka.ms/powerplatformskillsadvisor';
        return {
          advisorId: item.id,
          catalogEntry: true,
          skillDetails: {
            type: types[item.tier], products: item.products, purpose: item.purpose,
            status: item.status, publisher: item.publisher, marketplace: item.marketplace,
            license: item.license, verified: item.verified, note: item.action?.note || '',
            prompt: item.action?.prompt || '', canonicalSource: item.source,
            route: 'Power Platform Skills Advisor'
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
    let powerCat;
    try {
      const response = await fetch('assets/data/powercat-marketplace.json', { cache: 'no-cache', signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error('Unavailable Power CAT marketplace');
      powerCat = await response.json();
      const sourceName = 'Power CAT Skills Marketplace';
      const skillsByDetailId = new Map(powerCat.skills.map(skill => [skill.detailId, skill]));
      const detailsFor = (item, type, linkedSkill = item) => ({
        type,
        products: item.products || linkedSkill.products || [],
        purpose: item.description || linkedSkill.description,
        what: linkedSkill.what || item.description,
        when: linkedSkill.when || [],
        how: linkedSkill.how || [],
        install: linkedSkill.install || '',
        status: item.status || 'Available skill',
        publisher: 'Power CAT',
        marketplace: sourceName,
        plugin: linkedSkill.pluginLabel || linkedSkill.plugin || '',
        category: linkedSkill.category || 'Migration to Power Platform',
        canonicalSource: item.source || linkedSkill.source,
        docsSource: linkedSkill.docsSource || '',
        verified: powerCat.retrieved?.slice(0, 10) || '',
        route: sourceName
      });
      const skillEntries = powerCat.skills.map(skill => ({
        identity: 'powercat-skill:' + skill.detailId,
        catalogEntry: true,
        powerCatId: skill.detailId,
        skillDetails: detailsFor(skill, 'Skill'),
        title: skill.title,
        description: skill.description,
        text: [
          skill.id, skill.title, skill.description, skill.category, skill.categoryId,
          skill.plugin, skill.pluginLabel, ...(skill.tags || []), ...(skill.products || []),
          skill.what, ...(skill.when || []), ...(skill.how || []), skill.install
        ].join(' '),
        category: [skill.category, skill.pluginLabel].filter(Boolean).join(' / '),
        type: 'Skill',
        availability: 'Available in Power CAT Skills Marketplace',
        products: skill.products,
        url: skill.detailUrl,
        source: powerCat.marketplace,
        sourceName
      }));
      const trackEntries = powerCat.migrationTracks.map(track => {
        const linkedSkill = skillsByDetailId.get(track.detailId)
          || powerCat.skills.find(skill => skill.id === track.skillId)
          || track;
        return {
          identity: 'powercat-track:' + track.detailId,
          catalogEntry: true,
          powerCatTrackId: track.detailId,
          skillDetails: detailsFor(track, 'Migration track', linkedSkill),
          title: track.title,
          description: track.description,
          text: [
            'migration track migration path migration journey', track.id, track.title,
            track.description, track.status, track.cta, ...(track.products || []),
            linkedSkill.category, linkedSkill.plugin, linkedSkill.pluginLabel,
            ...(linkedSkill.tags || []), linkedSkill.what, ...(linkedSkill.when || []),
            ...(linkedSkill.how || []), linkedSkill.install
          ].join(' '),
          category: 'Migration to Power Platform',
          type: 'Migration track',
          availability: track.status,
          products: track.products,
          url: track.detailUrl,
          source: powerCat.marketplace,
          sourceName
        };
      });
      results.push({ items: [...skillEntries, ...trackEntries] });
    } catch { results.push({ failed: 'Power CAT Skills Marketplace', items: [] }); }
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
      const key = item.identity || (item.advisorId ? 'advisor:' + item.advisorId : new URL(item.url, location.href).href);
      if (unique.has(key)) {
        const previous = unique.get(key);
        previous.text += ' ' + item.text;
      } else unique.set(key, item);
    });
    entries = [...unique.values()];
    const failed = results.filter(result => result.failed).map(result => result.failed);
    ready = true;
    const siteFailures = results.slice(0, sources.length).filter(result => result.failed).length;
    const counts = catalog ? ['skill', 'mcp-capability', 'reference'].map(tier => catalog.skills.filter(item => item.marketplace !== 'Power CAT Skills' && item.tier === tier).length) : [];
    byId('indexStatus').textContent = entries.length ? `${entries.length} indexed entries from ${sources.length - siteFailures} site pages${catalog ? ` and Skills Advisor (${counts[0]} skills, ${counts[1]} MCP capabilities, ${counts[2]} references; source verified ${catalog.sourceGenerated}; imported ${catalog.retrieved.slice(0, 10)})` : ''}.${failed.length ? ' Unavailable: ' + failed.join(', ') + '.' : ''}` : 'Site content could not be loaded. Open this site over HTTP and try again, or browse Resources.';
    if (workshop) byId('indexStatus').textContent += ` Power Series: ${workshop.labs.length} labs.`;
    if (powerCat) byId('indexStatus').textContent += ` Power CAT Skills Marketplace: ${powerCat.skills.length} skills and ${powerCat.migrationTracks.length} migration tracks (imported ${powerCat.retrieved.slice(0, 10)}).`;
    byId('retryIndex').hidden = !failed.length;
    byId('searchNotice').hidden = !failed.length;
    byId('searchNotice').textContent = entries.length ? 'Some search content is unavailable. You can still choose a goal or browse resources below.' : 'Search is unavailable. Choose a goal or browse resources below.';
    render();
  }
  function render() {
    if (!ready) return;
    const pool = catalogMode ? entries.filter(item => item.catalogEntry) : entries;
    const type = byId('typeFilter').value;
    const product = byId('productFilter').value;
    const hasFilters = Boolean(type || product);
    const direct = query ? SSPSearch.rank(pool, query) : [];
    const relaxed = query && !direct.length ? SSPSearch.relaxedRank(pool, query) : { terms: [], results: [] };
    const relevance = direct.length ? 'direct' : relaxed.results.length ? 'related' : query ? 'none' : 'filtered';
    let ranked = query
      ? (direct.length ? direct : relaxed.results)
      : (catalogMode || hasFilters ? pool.map(item => ({ ...item, matched: [] })).sort((first, second) => first.title.localeCompare(second.title)) : []);
    const candidate = ranked.length && !catalogMode && !product && !type ? SSPSearch.guidance(entries.filter(item => !item.catalogEntry), query) : null;
    const guide = candidate && (candidate.id !== 'troubleshoot' || /\b(flow|flows|approval|automate)\b/i.test(query)) && (candidate.id !== 'performance' || /\b(app|apps|canvas)\b/i.test(query)) ? candidate : null;
    const filtered = ranked.filter(item => (!type || item.type === type) && (!product || SSPSearch.tokens(product).every(word => SSPSearch.tokens(item.title + ' ' + item.text).includes(word))));
    byId('searchClarify').hidden = !query || catalogMode || Boolean(guide) || Boolean(type || product);
    byId('searchResults').hidden = !query && !catalogMode && !hasFilters;
    byId('resultsHeading').textContent = catalogMode
      ? 'Skills and migration catalog'
      : relevance === 'related'
        ? `Results related to ${relaxed.terms.join(' and ')}`
        : query
          ? 'Direct matches across the site'
          : 'Resources matching these filters';
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
    const relationship = relevance === 'related' ? ' related' : relevance === 'direct' ? ' direct' : '';
    byId('resultSummary').textContent = `${filtered.length}${relationship} matching entr${filtered.length === 1 ? 'y' : 'ies'}${hasFilters ? ' with these filters' : ''}`;
    byId('resultList').replaceChildren();
    filtered.slice(0, limit).forEach(item => {
      const article = element('article', '', 'search-result');
      if (item.advisorId) article.dataset.advisorId = item.advisorId;
      if (item.powerCatId) article.dataset.powerCatId = item.powerCatId;
      if (item.powerCatTrackId) article.dataset.powerCatTrackId = item.powerCatTrackId;
      const heading = element('h3');
      const description = item.description || item.text;
      const reason = SSPSearch.explain(item, query);
      const resourceLink = anchor(item.title, item.url);
      resourceLink.dataset.previewSummary = description;
      resourceLink.dataset.previewReason = reason;
      if (item.skillDetails) resourceLink.dataset.skillDetails = JSON.stringify(item.skillDetails);
      if (item.labDetails) resourceLink.dataset.labDetails = JSON.stringify(item.labDetails);
      heading.append(resourceLink);
      const excerpt = description.length > 270 ? description.slice(0, 267) + '...' : description;
      const source = anchor(item.skillDetails ? (item.type === 'Migration track' ? 'View migration track details' : 'View skill details') : item.labDetails ? 'View lab details' : 'View in ' + item.sourceName, item.skillDetails || item.labDetails ? item.url : item.source);
      if (item.skillDetails || item.labDetails) {
        if (item.skillDetails) source.dataset.skillDetails = JSON.stringify(item.skillDetails);
        if (item.labDetails) source.dataset.labDetails = JSON.stringify(item.labDetails);
        source.dataset.previewTitle = item.title;
        source.dataset.previewSummary = description;
        source.dataset.previewReason = reason;
      }
      source.className = 'result-source';
      const meta = element('div', '', 'result-meta');
      const relevanceLabel = element('span', relevance === 'direct' ? 'Direct match' : relevance === 'related' ? 'Related result' : 'Filtered result', `result-relevance ${relevance}`);
      meta.append(relevanceLabel, document.createTextNode(catalogMode ? item.type + ' / ' + item.category : item.sourceName));
      article.append(meta, heading, element('p', excerpt));
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
      const heading = byId('searchResults').hidden ? byId('guidanceTitle') : byId('resultsHeading');
      heading.scrollIntoView({ block: 'start' });
      heading.focus({ preventScroll: true });
    }
    if (restoreScroll !== null) {
      const target = restoreScroll;
      restoreScroll = null;
      requestAnimationFrame(() => scrollTo({ top: target }));
    }
    if (pendingDetail) {
      const target = pendingDetail;
      pendingDetail = '';
      const link = [...byId('resultList').querySelectorAll('a[href]')].find(item => item.href === target);
      if (link) requestAnimationFrame(() => link.click());
    }
  }

  function syncUrl(push = false) {
    const url = new URL(location.href);
    const type = byId('typeFilter').value;
    const product = byId('productFilter').value;
    const set = (name, value) => value ? url.searchParams.set(name, value) : url.searchParams.delete(name);
    set('q', query);
    set('type', type);
    set('product', product);
    set('mode', catalogMode ? 'skills' : '');
    set('goal', selectedGoal || '');
    set('limit', limit > (catalogMode ? 12 : 3) ? String(limit) : '');
    set('detail', activeDetail);
    if (url.hash === '#skills') url.hash = '';
    const state = { ...history.state, scrollY: window.scrollY };
    history[push ? 'pushState' : 'replaceState'](state, '', url);
  }

  function search(value, reveal = false, push = false) {
    catalogMode = false;
    focusCatalog = false;
    query = value.trim();
    focusSearch = reveal && Boolean(query);
    byId('scenario').value = query;
    limit = 3;
    activeDetail = '';
    syncUrl(push);
    render();
  }
  byId('scenarioForm').addEventListener('submit', event => {
    event.preventDefault();
    selectedGoal = null;
    renderJourney(false);
    search(byId('scenario').value, true, true);
  });
  ['typeFilter', 'productFilter'].forEach(id => byId(id).addEventListener('change', () => {
    limit = catalogMode ? 12 : 3;
    syncUrl();
    render();
  }));
  byId('moreResults').addEventListener('click', () => {
    limit += catalogMode ? 12 : 3;
    syncUrl();
    render();
  });
  byId('resetSearch').addEventListener('click', () => {
    catalogMode = false;
    selectedGoal = null;
    query = '';
    limit = 3;
    activeDetail = '';
    byId('scenario').value = '';
    byId('typeFilter').value = '';
    byId('productFilter').value = '';
    renderJourney(false);
    syncUrl(true);
    render();
    byId('scenario').focus();
  });
  byId('retryIndex').addEventListener('click', loadIndex);
  function browseCatalog(push = false) {
    byId('advancedSearch').open = true;
    selectedGoal = null;
    renderJourney(false);
    catalogMode = true;
    focusCatalog = true;
    focusSearch = false;
    if (!byId('typeFilter').value) byId('typeFilter').value = 'Skill';
    limit = 12;
    syncUrl(push);
    render();
  }
  byId('browseSkills').addEventListener('click', () => browseCatalog(true));
  window.addEventListener('hashchange', () => { if (location.hash === '#skills') browseCatalog(); });
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
    const url = new URL(location.href);
    url.hash = link.dataset.target;
    history.replaceState({ ...history.state, scrollY: window.scrollY }, '', url);
    selectResource(link.dataset.target);
  }));
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const category = resourceCategories.find(item => '#' + item.id === link.getAttribute('href'));
    if (!category) return;
    event.preventDefault();
    const url = new URL(location.href);
    url.hash = category.id;
    history.pushState({ ...history.state, scrollY: window.scrollY }, '', url);
    selectResource(category.id);
    const heading = category.querySelector('h2');
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  });
  byId('resourceRail').hidden = false;
  renderResources();
  window.addEventListener('hashchange', openResourceHash);
  openResourceHash();
  const setInitialSelect = (id, value) => {
    if (value && [...byId(id).options].some(option => option.value === value)) byId(id).value = value;
  };
  setInitialSelect('typeFilter', initialParams.get('type'));
  setInitialSelect('productFilter', initialParams.get('product'));
  byId('scenario').value = query;
  if (catalogMode) {
    byId('advancedSearch').open = true;
    if (!byId('typeFilter').value) byId('typeFilter').value = 'Skill';
    limit = Math.max(12, limit);
  }
  window.addEventListener('pagehide', () => {
    history.replaceState({ ...history.state, scrollY: window.scrollY }, '', location.href);
  });
  window.addEventListener('popstate', event => {
    const params = new URLSearchParams(location.search);
    query = params.get('q') || '';
    catalogMode = params.get('mode') === 'skills' || location.hash === '#skills';
    selectedGoal = params.get('goal');
    if (!SSPSearch.journeys.some(journey => journey.id === selectedGoal)) selectedGoal = null;
    limit = Math.max(catalogMode ? 12 : 3, Number.parseInt(params.get('limit') || '0', 10) || 0);
    activeDetail = params.get('detail') || '';
    pendingDetail = activeDetail;
    restoreScroll = Number.isFinite(event.state?.scrollY) ? event.state.scrollY : null;
    byId('scenario').value = query;
    byId('typeFilter').value = [...byId('typeFilter').options].some(option => option.value === (params.get('type') || '')) ? params.get('type') || '' : '';
    byId('productFilter').value = [...byId('productFilter').options].some(option => option.value === (params.get('product') || '')) ? params.get('product') || '' : '';
    byId('advancedSearch').open = catalogMode || Boolean(byId('typeFilter').value || byId('productFilter').value);
    renderJourney(false);
    render();
    openResourceHash();
  });
  document.addEventListener('ssp:preview-open', event => {
    activeDetail = event.detail?.url || '';
    syncUrl();
  });
  document.addEventListener('ssp:preview-close', () => {
    activeDetail = '';
    syncUrl();
  });
  syncUrl();
  loadIndex();
})();