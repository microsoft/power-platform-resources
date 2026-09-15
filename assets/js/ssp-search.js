(() => {
  const sources = [
    { file: 'ssp-resources.html', name: 'Resources' },
    { file: 'ssp-design.html', name: 'Design' },
    { file: 'ssp-build.html', name: 'Build' },
    { file: 'ssp-review.html', name: 'Review' },
    { file: 'ssp-landing.html', name: 'Home' }
  ];
  const byId = id => document.getElementById(id);
  let entries = [];
  let query = '';
  let limit = 12;
  let ready = false;
  let catalogMode = location.hash === '#skills';
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
  function extract(doc, source) {
    const items = [];
    doc.querySelectorAll('.panel-body li a[href]').forEach(link => {
      const url = new URL(link.getAttribute('href'), new URL(source.file, location.href));
      if (!['https:', 'http:'].includes(url.protocol)) return;
      const panel = link.closest('.panel');
      const row = clean(link.closest('li').textContent);
      const label = clean(link.textContent);
      const prefix = row.includes(' - ') ? row.split(' - ')[0] : '';
      const title = prefix && !label.toLowerCase().includes(prefix.toLowerCase()) ? prefix + ': ' + label : label;
      const context = link.closest('li').cloneNode(true);
      context.querySelectorAll('a').forEach(sibling => sibling.remove());
      const text = clean(context.textContent.replace(/\|/g, ' ')) + ' ' + label;
      items.push({ title, text, category: clean(panel.querySelector('h2').textContent), type: 'Resource', url: url.href, source: source.file + '#' + panel.id, sourceName: 'Resource catalog' });
    });
    doc.querySelectorAll('.skill-card').forEach(card => {
      const title = clean(card.querySelector('h3').textContent);
      const description = [...card.querySelectorAll('p')].map(paragraph => clean(paragraph.textContent)).join(' ');
      const tags = [...card.querySelectorAll('.tag, .skill-kind')].map(tag => clean(tag.textContent)).join(' ');
      items.push({ title, description, text: description + ' ' + tags, category: source.name + ' / ' + card.dataset.category, type: 'Guide', url: source.file + '#skill-' + slug(title), source: source.file + '#skills', sourceName: source.name + ' pillar' });
    });
    const heading = doc.querySelector('h1');
    if (heading) items.push({ title: source.name + ': ' + clean(heading.textContent), text: clean(doc.querySelector('.lead, .sub, .pagehead p')?.textContent || ''), category: source.name, type: 'Page', url: source.file, source: source.file, sourceName: source.name });
    if (source.name === 'Home') {
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
      results.push({ items: catalog.skills.map(item => ({
        advisorId: item.id,
        title: item.displayName || item.name,
        description: item.description,
        text: [item.name, item.description, ...item.products, ...item.locations, item.purpose, item.action?.note || ''].join(' '),
        category: [item.purpose, ...item.products].join(' / '),
        type: types[item.tier],
        availability: item.status,
        products: item.products,
        url: item.source,
        source: catalog.source,
        sourceName: 'Skills Advisor',
        verified: item.verified
      })) });
    } catch { results.push({ failed: 'Skills Advisor catalog', items: [] }); }
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
    byId('retryIndex').hidden = !failed.length;
    render();
  }
  function render() {
    if (!ready) return;
    const pool = catalogMode ? entries.filter(item => item.advisorId) : entries;
    let ranked = catalogMode && !query ? pool.map(item => ({ ...item, matched: [] })).sort((first, second) => first.title.localeCompare(second.title)) : SSPSearch.rank(pool, query);
    const type = byId('typeFilter').value;
    const product = byId('productFilter').value;
    const guide = ranked.length && !catalogMode && !product && !type ? SSPSearch.guidance(entries.filter(item => !item.advisorId), query) : null;
    if (guide) {
      const recommended = guide.steps.map(step => step.result);
      const urls = new Set(recommended.map(item => item.url));
      ranked = [...recommended, ...ranked.filter(item => !urls.has(item.url))];
    }
    const filtered = ranked.filter(item => (!type || item.type === type) && (!product || SSPSearch.tokens(product).every(word => SSPSearch.tokens(item.title + ' ' + item.text).includes(word))));
    byId('starterScenarios').hidden = Boolean(query) || catalogMode;
    byId('searchResults').hidden = !query && !catalogMode;
    byId('resultsHeading').textContent = catalogMode ? 'Skills Advisor catalog' : 'Results across the site';
    byId('resetSearch').textContent = catalogMode ? 'Search across SSP' : 'Clear search';
    byId('guidance').hidden = !guide || !query;
    byId('guidanceSteps').replaceChildren();
    if (guide) {
      byId('guidanceTitle').textContent = guide.title;
      byId('guidanceWhy').textContent = guide.why;
      guide.steps.forEach(step => {
        const item = element('li');
        item.append(element('h3', step.title), element('p', step.why), anchor(step.result.title, step.result.url));
        byId('guidanceSteps').append(item);
      });
    }
    byId('resultSummary').textContent = `${filtered.length} matching entr${filtered.length === 1 ? 'y' : 'ies'}${type || product ? ' with these filters' : ''}`;
    byId('resultList').replaceChildren();
    filtered.slice(0, limit).forEach(item => {
      const article = element('article', '', 'search-result');
      if (item.advisorId) article.dataset.advisorId = item.advisorId;
      const heading = element('h3');
      heading.append(anchor(item.title, item.url));
      const description = item.description || item.text;
      const excerpt = description.length > 270 ? description.slice(0, 267) + '...' : description;
      const source = anchor('View in ' + item.sourceName, item.source);
      source.className = 'result-source';
      article.append(element('div', item.type + ' / ' + item.category, 'result-meta'), heading, element('p', excerpt));
      if (item.availability) article.append(element('p', item.availability + (item.verified ? ' / Source verified ' + item.verified : ''), 'result-match'));
      if (item.matched.length) article.append(element('p', 'Matched topics: ' + item.matched.slice(0, 6).join(', '), 'result-match'));
      article.append(source);
      byId('resultList').append(article);
    });
    byId('emptyResults').hidden = filtered.length > 0;
    byId('moreResults').hidden = filtered.length <= limit;
  }
  function search(value) {
    catalogMode = false;
    if (location.hash === '#skills') history.replaceState(null, '', location.pathname);
    query = value.trim();
    byId('scenario').value = query;
    byId('typeFilter').value = '';
    byId('productFilter').value = '';
    limit = 12;
    render();
  }
  byId('scenarioForm').addEventListener('submit', event => {
    event.preventDefault();
    search(byId('scenario').value);
    if (ready && query) byId('resultsHeading').focus({ preventScroll: true });
  });
  document.querySelectorAll('[data-scenario]').forEach(button => button.addEventListener('click', () => search(button.dataset.scenario)));
  ['typeFilter', 'productFilter'].forEach(id => byId(id).addEventListener('change', () => { limit = 12; render(); }));
  byId('moreResults').addEventListener('click', () => { limit += 12; render(); });
  byId('resetSearch').addEventListener('click', () => { search(''); byId('scenario').focus(); });
  byId('retryIndex').addEventListener('click', loadIndex);
  function browseCatalog() {
    catalogMode = true;
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
  document.querySelector('.menu-toggle').addEventListener('click', event => {
    const open = byId('siteNav').classList.toggle('is-open');
    event.currentTarget.setAttribute('aria-expanded', String(open));
    event.currentTarget.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
  });
  try {
    const pending = sessionStorage.getItem('sspScenario');
    sessionStorage.removeItem('sspScenario');
    if (pending) search(pending);
  } catch {}
  loadIndex();
})();