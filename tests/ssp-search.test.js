const { test } = require('node:test');
const assert = require('node:assert/strict');
const { rank, relaxedRank, guidance, journeys, nextStep } = require('../assets/js/ssp-search-engine.js');
const { parseCatalog } = require('../scripts/sync-skills-advisor.js');
const { parseCatalog: parsePowerCatCatalog, detailUrl } = require('../scripts/sync-powercat-marketplace.js');
const { parseFeed } = require('../scripts/sync-latest-content.js');
const catalog = require('../assets/data/skills-advisor.json');
const powerCatCatalog = require('../assets/data/powercat-marketplace.json');
const { readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');
const { execFileSync } = require('node:child_process');
const { runInNewContext } = require('node:vm');
const advisor = require('../assets/js/ssp-design-advisor.js');

const sspPages = ['ssp-landing.html', 'ssp-search.html', 'ssp-design.html', 'ssp-design-guide.html', 'ssp-build.html', 'ssp-build-guide.html', 'ssp-review.html'];
const slug = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function navigationTargets(file) {
  const html = readFileSync(join(__dirname, '..', file), 'utf8');
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
  for (const card of html.matchAll(/<article class="skill-card"[\s\S]*?<\/article>/g)) {
    const heading = card[0].match(/<h3>([^<]+)<\/h3>/)?.[1];
    if (heading) ids.add('skill-' + slug(heading));
  }
  if (file === 'ssp-search.html') {
    const searchScript = readFileSync(join(__dirname, '../assets/js/ssp-search.js'), 'utf8');
    assert.match(searchScript, /location\.hash === '#skills'/);
    ids.add('skills');
  }
  return { html, ids };
}

test('Workshop labs are searchable and point to the published lab viewer', () => {
  const workshop = require('../assets/data/workshop-labs.json');
  const { parseLab } = require('../scripts/sync-workshop-labs.js');
  assert.ok(workshop.labs.length >= 20);
  assert.equal(new Set(workshop.labs.map(lab => lab.path)).size, workshop.labs.length);
  for (const lab of workshop.labs) {
    const url = new URL(lab.url);
    assert.equal(url.origin + url.pathname, 'https://microsoft.github.io/apps-agents-workshop/labs/lab.html');
    assert.equal(url.searchParams.get('path'), lab.path);
    assert.equal(url.searchParams.get('branch'), 'main');
    assert.equal(rank(workshop.labs, lab.title)[0]?.url, lab.url);
  }
  for (const [query, expected] of [
    ['cloud flow approval lab', 'automation-01-cloud-flow/01-cloud-flow.md'],
    ['Power Pages workshop', 'byoc-powerpages/byoc-powerpages.md'],
    ['work queues advanced', 'automation-05b-work-queues-advanced/05-b-work-queues.md']
  ]) assert.ok(rank(workshop.labs, query).some(lab => lab.path === expected), query);
  assert.equal(parseLab('# Not a lab', 'README.md'), null);
  assert.throws(() => parseLab('---\nlab: true\ntitle: Missing fields\n---', 'test.md'), /Missing/);
  assert.throws(() => parseLab('---\nlab: true\n---', '../test.md'), /Invalid lab path/);
});

test('Latest-content feeds accept complete Microsoft RSS items and reject unsafe links', () => {
  const item = title => `<rss><channel><item><title><![CDATA[${title}]]></title><link>https://www.microsoft.com/en-us/power-platform/blog/example/</link><pubDate>Wed, 23 Sep 2026 06:50:12 +0000</pubDate></item></channel></rss>`;
  assert.deepEqual(parseFeed(item('Power Apps &amp; Power Automate')), [{
    title: 'Power Apps & Power Automate',
    url: 'https://www.microsoft.com/power-platform/blog/example/',
    published: '2026-09-23'
  }]);
  assert.throws(() => parseFeed(item('Unsafe').replace('https://www.microsoft.com/', 'https://example.com/')), /Unsupported feed destination/);
  assert.throws(() => parseFeed('<rss><channel></channel></rss>'), /empty|format changed/);
});

test('Search explains matches without presenting token coverage as confidence', () => {
  const { matchDetails, explain } = require('../assets/js/ssp-search-engine.js');
  const entry = { title: 'Cloud flow approvals', text: 'Power Automate approval training lab' };
  assert.equal(matchDetails(entry, 'approval lab').percent, 100);
  assert.deepEqual(matchDetails(entry, 'approval lab').keywords, ['approval', 'lab']);
  assert.equal(matchDetails(entry, 'approval migration').percent, 50);
  assert.deepEqual(matchDetails(entry, 'approval migration').missing, ['migration']);
  assert.equal(matchDetails(entry, 'SAP migration').percent, 0);
  assert.equal(matchDetails(entry, '').percent, null);
  assert.equal(matchDetails(entry, 'please help').percent, 0);
  assert.equal(matchDetails(entry, 'approval approval lab').percent, 100);
  const related = matchDetails({ title: 'App performance' }, 'slow app');
  assert.equal(related.percent, 75);
  assert.deepEqual(related.related, [{ keyword: 'slow', match: 'performance' }]);
  assert.match(explain(entry, 'approval lab'), /"approval", "lab"/);
  assert.equal(explain(entry, ''), '');
  assert.equal(explain(entry, 'SAP'), '');
  assert.equal(explain({ ...entry, recommendationReason: 'Check the trigger first.' }, 'approval'), 'Check the trigger first.');
  const renderer = readFileSync(join(__dirname, '../assets/js/ssp-search.js'), 'utf8');
  assert.doesNotMatch(renderer, /% keyword match|result-coverage|result-keywords/);
  assert.match(renderer, /Direct match.*Related result.*Filtered result/s);
  assert.match(renderer, /resourceLink\.dataset\.previewReason = reason/);
});

test('Imported skill details retain exact identity, source, and published usage metadata', () => {
  const script = readFileSync(join(__dirname, '../assets/js/ssp-search.js'), 'utf8');
  assert.equal(new Set(catalog.skills.map(item => item.id)).size, catalog.skills.length);
  assert.match(script, /catalog\.skills\.filter\(item => item\.marketplace !== 'Power CAT Skills'\)/);
  assert.match(script, /const destination = 'https:\/\/aka\.ms\/powerplatformskillsadvisor'/);
  assert.match(script, /canonicalSource: item\.source/);
  assert.match(script, /route: 'Power Platform Skills Advisor'/);
  assert.match(script, /status: item\.status, publisher: item\.publisher, marketplace: item\.marketplace/);
  assert.match(script, /prompt: item\.action\?\.prompt \|\| ''/);
  assert.match(script, /item\.type === 'Migration track' \? 'View migration track details' : 'View skill details'/);
  assert.match(script, /source\.dataset\.previewTitle = item\.title/);
  const preview = readFileSync(join(__dirname, '../assets/js/ssp-search-entry.js'), 'utf8');
  assert.match(preview, /details\.replaceChildren\(\)/);
  assert.match(preview, /skill\.route === 'Power CAT Skills Marketplace'[\s\S]*?\? 'Open marketplace details'/);
  assert.match(preview, /skill\.route === 'Canonical skill source' \? 'Open canonical skill source'/);
});

test('Power CAT marketplace snapshot preserves every skill and migration track', () => {
  assert.equal(powerCatCatalog.skills.length, 16);
  assert.equal(powerCatCatalog.migrationTracks.length, 4);
  assert.equal(new Set(powerCatCatalog.skills.map(item => item.detailId)).size, powerCatCatalog.skills.length);
  for (const item of [...powerCatCatalog.skills, ...powerCatCatalog.migrationTracks]) {
    assert.equal(item.detailUrl, detailUrl(item.detailId));
    assert.match(item.source, /^https:\/\/github\.com\/microsoft\/power-cat-skills\//);
  }
  const publishedShape = {
    categories: powerCatCatalog.categories,
    plugins: powerCatCatalog.plugins,
    skills: powerCatCatalog.skills.map(item => ({
      ...item,
      categoryLabel: item.category,
      products: item.products.map(label => ({ label }))
    })),
    migrationTracks: powerCatCatalog.migrationTracks.map(item => ({
      ...item,
      products: item.products.map(label => ({ label }))
    }))
  };
  const parsed = parsePowerCatCatalog(JSON.stringify(publishedShape));
  assert.equal(parsed.skills.length, powerCatCatalog.skills.length);
  assert.equal(parsed.migrationTracks.length, powerCatCatalog.migrationTracks.length);
  const duplicate = structuredClone(publishedShape);
  duplicate.skills[1].detailId = duplicate.skills[0].detailId;
  assert.throws(() => parsePowerCatCatalog(JSON.stringify(duplicate)), /Invalid Power CAT skill/);
  const unsafe = structuredClone(publishedShape);
  unsafe.skills[0].source = 'javascript:alert(1)';
  assert.throws(() => parsePowerCatCatalog(JSON.stringify(unsafe)), /Invalid Power CAT skill/);

  const search = readFileSync(join(__dirname, '../assets/js/ssp-search.js'), 'utf8');
  assert.match(search, /fetch\('assets\/data\/powercat-marketplace\.json'/);
  assert.match(search, /powerCat\.skills\.map/);
  assert.match(search, /powerCat\.migrationTracks\.map/);
  assert.match(search, /identity: 'powercat-track:' \+ track\.detailId/);
  assert.match(search, /route: sourceName/);
  const workflow = readFileSync(join(__dirname, '../.github/workflows/refresh-site-content.yml'), 'utf8');
  assert.match(workflow, /scripts\/sync-powercat-marketplace\.js/);
  assert.match(workflow, /assets\/data\/powercat-marketplace\.json/);
});

test('Lab details preserve published metadata and dialogs expose a labeled close control', () => {
  const workshop = require('../assets/data/workshop-labs.json');
  const script = readFileSync(join(__dirname, '../assets/js/ssp-search.js'), 'utf8');
  const start = script.indexOf('workshop.labs.map(lab => (');
  const end = script.indexOf(' })) });', start);
  assert.ok(start >= 0 && end > start);
  const items = runInNewContext(script.slice(start, end + ' }))'.length), { workshop });
  items.forEach((item, index) => {
    assert.equal(item.url, workshop.labs[index].url);
    assert.equal(item.labDetails.persona, workshop.labs[index].persona);
    assert.equal(item.labDetails.duration, workshop.labs[index].duration);
    assert.equal(item.labDetails.level, workshop.labs[index].level);
  });
  assert.match(script, /'View lab details'/);
  assert.match(script, /source\.dataset\.labDetails = JSON\.stringify\(item\.labDetails\)/);
  const preview = readFileSync(join(__dirname, '../assets/js/ssp-search-entry.js'), 'utf8');
  assert.match(preview, /close\.setAttribute\('aria-label', 'Close details'\)/);
  assert.match(preview, /querySelectorAll\('button'\)\.forEach/);
  assert.match(preview, /continueLink\.textContent = 'Open lab'/);
});

test('Featured cards resolve configured catalog, guide, and lab destinations', () => {
  const html = readFileSync(join(__dirname, '../ssp-landing.html'), 'utf8');
  const design = readFileSync(join(__dirname, '../ssp-design.html'), 'utf8');
  const featured = require('../assets/data/about-featured.json');
  const workshop = require('../assets/data/workshop-labs.json');
  const cards = [...html.matchAll(/<a class="fcard" href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
  assert.equal(cards.length, featured.items.length);
  assert.equal(cards[0][1], 'ssp-search.html#skills');
  assert.match(cards[0][2], new RegExp(`${catalog.skills.length} catalog entries`));
  const guide = featured.items.find(item => item.type === 'guide');
  const guideCard = cards.find(([, href]) => href === `${guide.page}#${guide.anchor}`);
  assert.ok(guideCard);
  assert.ok(design.includes('<h3>' + guideCard[2].match(/<h3>([^<]+)<\/h3>/)[1] + '</h3>'));
  const lab = workshop.labs.find(item => item.path === featured.items.find(item => item.type === 'lab').path);
  const labCard = cards.find(([, href]) => href.replace(/&amp;/g, '&') === lab.url);
  assert.ok(labCard);
  assert.match(labCard[2], /<span class="fkind">Lab<\/span>/);
  for (const [, , content] of cards) assert.doesNotMatch(content, /1:1 fidelity|HTML report|class="stars"/);
});

test('About statistics and featured guidance match their canonical sources', () => {
  execFileSync(process.execPath, [join(__dirname, '../scripts/update-about.js'), '--check']);
  const html = readFileSync(join(__dirname, '../ssp-landing.html'), 'utf8');
  const resources = readFileSync(join(__dirname, '../ssp-search.html'), 'utf8');
  const workshop = require('../assets/data/workshop-labs.json');
  const latest = require('../assets/data/latest-content.json');
  const pillarCss = readFileSync(join(__dirname, '../assets/css/ssp-design.css'), 'utf8');
  const searchCss = readFileSync(join(__dirname, '../assets/css/ssp-search.css'), 'utf8');
  const hero = html.slice(html.indexOf('<!-- HERO -->'), html.indexOf('<!-- PILLARS -->'));
  assert.doesNotMatch(hero, /Curated by Power CAT\s*·\s*Open to everyone/i);
  assert.match(html, /--hero-bg:#f3ecfa; --hero-image:radial-gradient\(700px 260px at 78% 25%,rgba\(107,58,143,.16\),transparent 68%\)/);
  assert.match(html, /--hero-bg:#0c1430; --hero-image:none;/);
  assert.match(html, /\.hero\{[^}]*background-color:var\(--hero-bg\);background-image:var\(--hero-image\)/);
  assert.match(pillarCss, /--hero-bg: #f3ecfa;/);
  assert.match(pillarCss, /--hero-bg: #0c1430;/);
  assert.match(pillarCss, /\.design-hero \{[^}]*background-color: var\(--hero-bg\); background-image: var\(--hero-image\);/);
  assert.match(searchCss, /\.scenario-entry\{background-color:var\(--hero-bg\);background-image:var\(--hero-image\);/);
  assert.match(html, new RegExp(`<strong>${powerCatCatalog.skills.length} \\+ ${powerCatCatalog.migrationTracks.length}</strong><span>Power CAT skills · migration tracks</span>`));
  assert.match(html, new RegExp(`<strong>${workshop.labs.length}</strong><span>Power Series labs</span>`));
  assert.match(html, new RegExp(`<li>${workshop.labs.length} hands-on labs</li>`));
  assert.match(html, new RegExp(`<span class="chip">${workshop.labs.length} labs</span>`));
  assert.match(html, new RegExp(`<div class="n">${workshop.labs.length}</div><div class="l">Hands-on labs</div>`));
  assert.doesNotMatch(html, /\b39 hands-on labs\b|>39 labs<|<div class="n">39<\/div>/i);
  assert.match(html, /<div class="kicker">Featured guidance<\/div>/);
  assert.match(html, /Curated by Power CAT on a weekly cadence/);
  assert.doesNotMatch(html, /Featured this week|Popular skills &amp; guidance/);
  assert.doesNotMatch(html, /Open the Power CAT marketplace \(\d+ skills, \d+ migration tracks\)/);
  for (const item of [...latest.news, ...latest.events]) {
    assert.ok(resources.includes(item.title));
    assert.ok(resources.includes(`datetime="${item.published}"`));
  }
  assert.match(resources, /BEGIN GENERATED LATEST NEWS/);
  assert.match(resources, /BEGIN GENERATED LATEST EVENTS/);
});

test('About and Start here menus close on Escape and return keyboard focus', () => {
  for (const file of ['ssp-landing.html', 'assets/js/ssp-search.js']) {
    const source = readFileSync(join(__dirname, '../', file), 'utf8');
    const script = file.endsWith('.html')
      ? source.slice(source.indexOf('function toggleSiteMenu()'), source.indexOf('const heroSlides='))
      : source.slice(source.indexOf("  const menuButton = document.querySelector('.menu-toggle');"), source.indexOf('  const resourceCategories ='));
    const attributes = { 'aria-expanded': 'false' };
    const handlers = {};
    let open = false;
    let focused = false;
    const button = {
      setAttribute: (name, value) => { attributes[name] = value; },
      getAttribute: name => attributes[name],
      focus: () => { focused = true; },
      addEventListener: (name, handler) => { handlers[name] = handler; }
    };
    const nav = { classList: {
      contains: () => open,
      toggle: (name, force) => { open = force === undefined ? !open : force; return open; }
    } };
    const context = {
      byId: () => nav,
      document: {
        getElementById: () => nav,
        querySelector: () => button,
        addEventListener: (name, handler) => { handlers[name] = handler; }
      }
    };
    runInNewContext(script, context);
    if (context.toggleSiteMenu) context.toggleSiteMenu();
    else handlers.click();
    assert.equal(open, true);
    handlers.keydown({ key: 'Enter' });
    assert.equal(open, true);
    handlers.keydown({ key: 'Escape' });
    assert.equal(open, false);
    assert.equal(attributes['aria-expanded'], 'false');
    assert.equal(attributes['aria-label'], 'Open navigation menu');
    assert.equal(focused, true);
    focused = false;
    handlers.keydown({ key: 'Escape' });
    assert.equal(focused, false);
  }
});

test('Root defaults to About while legacy resource bookmarks preserve their destinations and theme', () => {
  const html = readFileSync(join(__dirname, '../index.html'), 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const resources = readFileSync(join(__dirname, '../ssp-search.html'), 'utf8');
  const categories = [...resources.matchAll(/data-target="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(categories).size, 13);
  for (const fragment of ['resources', ...new Set(categories), '', 'pillars']) {
    let redirect;
    runInNewContext(script, { URL, window: { location: {
      href: 'https://example.org/ssp/index.html?clawpilotTheme=dark#' + fragment,
      search: '?clawpilotTheme=dark', hash: fragment ? '#' + fragment : '',
      replace: value => { redirect = new URL(value); }
    } } });
    assert.equal(redirect.pathname, '/ssp/' + (!fragment || fragment === 'pillars' ? 'ssp-landing.html' : 'ssp-search.html'));
    assert.equal(redirect.hash, fragment ? '#' + fragment : '');
    assert.equal(redirect.searchParams.get('scoutTheme'), 'dark');
  }
});

test('About carousel uses accessible dot navigation without automatic controls', () => {
  const html = readFileSync(join(__dirname, '../ssp-landing.html'), 'utf8');
  assert.doesNotMatch(html, /id="hero(?:Prev|Next|Pause)"/);
  assert.doesNotMatch(html, /hero-pause|startHeroRotation|sspHeroPaused|setInterval/);
  assert.match(html, /\.hero-dot:focus-visible/);
  assert.match(html, /\.hero-dot\{[^}]*width:24px;height:24px/);
  const script = html.slice(html.indexOf('const heroSlides='), html.indexOf('// Horizontal accordion'));
  function control() {
    return {
      attributes: {}, listeners: {}, icon: {},
      classList: { toggle() {} },
      setAttribute(name, value) { this.attributes[name] = value; },
      removeAttribute(name) { delete this.attributes[name]; },
      addEventListener(name, handler) { this.listeners[name] = handler; },
      querySelector() { return this.icon; },
      appendChild() {}
    };
  }
  const actions = Array.from({ length: 4 }, control);
  const slides = actions.map(action => ({ ...control(), querySelector: () => action }));
  const dots = Array.from({ length: 4 }, control);
  const document = {
    querySelectorAll: selector => selector === '.hero-slide' ? slides : dots,
    querySelector: () => control()
  };
  runInNewContext(script, { document });
  assert.equal(slides[0].attributes['aria-hidden'], 'false');
  assert.equal(dots[0].attributes['aria-current'], 'true');
  dots[1].listeners.click();
  assert.equal(slides[0].attributes['aria-hidden'], 'true');
  assert.equal(slides[1].attributes['aria-hidden'], 'false');
  assert.equal(dots[1].attributes['aria-current'], 'true');
});

test('Generic catalog actions and self-service review guidance are labeled accurately', () => {
  for (const [pillar, count] of [['build', 7], ['review', 3]]) {
    const html = readFileSync(join(__dirname, `../ssp-${pillar}.html`), 'utf8');
    assert.doesNotMatch(html, />Open skill /);
    assert.equal((html.match(/>Browse Skills Advisor </g) || []).length, count);
  }
  const review = readFileSync(join(__dirname, '../ssp-review.html'), 'utf8');
  const build = readFileSync(join(__dirname, '../ssp-build.html'), 'utf8');
  for (const title of ['Cloud Flow Builder', 'Approval Workflow Accelerator']) {
    const card = [...build.matchAll(/<article class="skill-card"[\s\S]*?<\/article>/g)].map(match => match[0]).find(item => item.includes(`<h3>${title}</h3>`));
    assert.ok(card);
    assert.match(card, /<span class="skill-kind">Implementation guide<\/span>/);
    assert.doesNotMatch(card, /href="https:\/\/aka\.ms\/powerplatformskillsadvisor"/);
  }
  assert.match(build, /Start the coached automation journey/);
  assert.match(build, /Start the approval flow lab/);
  assert.match(build, /data-preview-summary="Build an automated approval process/);
  assert.match(build, /data-item-label="Build guide" data-item-label-plural="Build guides"/);
  assert.match(build, /ssp-pillar\.js\?v=20260926-guide-labels/);
  for (const source of [review, build, readFileSync(join(__dirname, '../assets/js/ssp-pillar.js'), 'utf8')]) {
    assert.doesNotMatch(source, /Power CAT team|deep review availability|submission portal|review-submission-url|review team needs/i);
  }
  assert.match(review, /Use self-service guidance, automated checks, and dedicated viewers/);
  assert.match(build, /Review's self-service guidance and tools/);
});

test('Hero category totals match the available focus filters', () => {
  for (const [pillar, label] of [['design', 'Focus areas'], ['build', 'Delivery areas']]) {
    const html = readFileSync(join(__dirname, `../ssp-${pillar}.html`), 'utf8');
    const total = Number(html.match(new RegExp('<strong>(\\d+)</strong><span>' + label))[1]);
    assert.equal(total, (html.match(/<button class="filter"/g) || []).length);
  }
});

test('Design Advisor applies and exports up to three ranked priorities', () => {
  const base = { role: 'maker', goal: 'new', users: 'internal', workload: 'app', data: 'dataverse', experience: 'records' };
  assert.equal(advisor.recommend({ ...base, constraint: [] }).complete, false);
  assert.deepEqual(advisor.normalize({ constraint: ['scale', 'scale', 'invalid', 'sensitive', 'integration', 'licensing'] }).constraint, ['scale', 'sensitive', 'integration']);
  assert.deepEqual(advisor.normalize({ constraint: ['licensing', 'unsure'] }).constraint, ['unsure']);
  assert.deepEqual(advisor.normalize({ constraint: 'licensing' }).constraint, ['licensing']);
  const result = advisor.recommend({ ...base, constraint: ['scale', 'sensitive', 'integration'] });
  assert.equal(result.complete, true);
  assert.deepEqual(result.recommendations.slice(1, 4).map(item => item.id), ['well-architected-design-check', 'security-role-mapper', 'integration-pattern-selector']);
  assert.match(result.recommendations[1].reason, /^Priority 1:/);
  assert.match(result.assumptions.join(' '), /classification/);
  assert.match(result.assumptions.join(' '), /concurrency/);
  assert.match(result.assumptions.join(' '), /API limits/);
  const markdown = advisor.toMarkdown(result, 'https://example.org/ssp-design.html');
  assert.match(markdown, /1\. Scale.*2\. Sensitive.*3\. Integration/);
  const reversed = advisor.recommend({ ...base, constraint: ['integration', 'scale'] });
  assert.equal(reversed.recommendations[1].id, 'integration-pattern-selector');
  const licensing = advisor.recommend({ ...base, constraint: ['licensing', 'sensitive'] });
  assert.match(licensing.assumptions.join(' '), /licensing owner/);
});

test('Design guide uses accurate naming and stages above the question counter', () => {
  const html = readFileSync(join(__dirname, '../ssp-design.html'), 'utf8');
  assert.doesNotMatch(html, /class="advisor-rail"/);
  assert.doesNotMatch(html, /Design Advisor|Advisor stages/);
  assert.match(html, /class="kicker">Design guide</);
  assert.match(html, /not a final solution design/);
  const app = html.indexOf('id="advisorApp"');
  const stages = html.indexOf('class="advisor-stages"');
  const counter = html.indexOf('id="advisorProgress"');
  assert.ok(app >= 0 && stages > app && counter > stages);
  assert.match(html, /class="advisor-stages" aria-label="Design guide stages"/);
  assert.match(html, /Next steps<\/li>/);
});

test('Design guide advances on answer activation and reserves Continue for ranked priorities', () => {
  const script = readFileSync(join(__dirname, '../assets/js/ssp-design.js'), 'utf8');
  const html = readFileSync(join(__dirname, '../ssp-design.html'), 'utf8');
  assert.match(script, /input\.addEventListener\("click", \(\) => \{\s*answers = engine\.normalize\([^\n]+\);\s*advance\(\);/);
  assert.match(script, /next\.hidden = !question\.ranked/);
  assert.match(script, /if \(step === 6\) renderResult\(\)/);
  assert.match(script, /byId\("advisorEdit"\)\.addEventListener\("click", \(\) => \{ step = 6; renderQuestion\(\); \}\)/);
  assert.match(html, /id="advisorEdit"[^\n]+ Back<\/button>/);
  assert.match(html, /ssp-design\.js\?v=20260926-pdf-brief/);
});

test('Design topic choices precede the advisor and guide catalog', () => {
  const html = readFileSync(join(__dirname, '../ssp-design.html'), 'utf8');
  const sections = ['class="design-hero"', 'aria-labelledby="outcomes-heading"', 'id="design-advisor"', 'id="skills"', 'aria-labelledby="process-heading"'];
  const positions = sections.map(section => html.indexOf(section));
  assert.ok(positions.every(position => position >= 0));
  assert.ok(positions.every((position, index) => index === 0 || position > positions[index - 1]));
  assert.equal((html.match(/aria-labelledby="outcomes-heading"/g) || []).length, 1);
});

test('Design Advisor branches across all goals and rejects incomplete or stale answers', () => {
  const base = { role: 'maker', users: 'internal', workload: 'app', data: 'dataverse', constraint: 'licensing' };
  for (const [goal, branch, value] of [['new', 'experience', 'records'], ['modernize', 'pain', 'performance'], ['govern', 'scope', 'tenant'], ['review', 'evidence', 'live']]) {
    const answers = { ...base, goal, [branch]: value };
    assert.equal(advisor.questionsFor(answers).length, 7);
    assert.equal(advisor.recommend(answers).complete, true);
    assert.equal(advisor.recommend({ ...answers, [branch]: 'invalid' }).complete, false);
    assert.equal(advisor.normalize({ ...answers, goal: 'unknown' })[branch], undefined);
    const changed = advisor.normalize({ ...answers, goal: 'new', experience: 'mobile' });
    if (branch !== 'experience') assert.equal(changed[branch], undefined);
  }
  assert.equal(advisor.recommend({}).complete, false);
});

test('Design Advisor recommendations are scoped, source-linked, and exportable', () => {
  const base = { role: 'architect', goal: 'new', users: 'external', workload: 'app', data: 'existing', constraint: 'sensitive', experience: 'portal' };
  const result = advisor.recommend(base);
  assert.match(result.options.join(' '), /Power Pages/);
  assert.match(result.assumptions.join(' '), /Do not assume a migration/);
  assert.match(result.assumptions.join(' '), /web roles and table permissions/);
  assert.equal(new Set(result.recommendations.map(item => item.id)).size, result.recommendations.length);
  const design = readFileSync(join(__dirname, '../ssp-design.html'), 'utf8');
  for (const item of result.recommendations) {
    assert.ok(design.includes('<h3>' + item.title + '</h3>'));
    assert.ok(item.source.startsWith('https://learn.microsoft.com/'));
  }
  const markdown = advisor.toMarkdown(result, 'https://example.org/ssp/ssp-design.html');
  assert.match(markdown, /https:\/\/example.org\/ssp\/ssp-design.html#skill-/);
  assert.match(markdown, /not architecture approval/);
  assert.throws(() => advisor.toMarkdown(advisor.recommend({}), 'https://example.org/'));
  const slow = advisor.recommend({ ...base, goal: 'modernize', pain: 'performance' });
  assert.match(slow.options.join(' '), /Diagnose.*before.*migration/);
  const uncertain = advisor.recommend({ ...base, users: 'unsure', workload: 'unsure', data: 'unsure', constraint: 'unsure', experience: 'unsure' });
  assert.equal(uncertain.assumptions.filter(item => item.startsWith('Unresolved:')).length, 5);
});

test('Design Advisor handles every offered branch and reuses verified guide sources', () => {
  const base = { role: 'both', users: 'internal', workload: 'app', data: 'dataverse', constraint: 'licensing' };
  const html = readFileSync(join(__dirname, '../ssp-design.html'), 'utf8');
  assert.doesNotMatch(html, /copilot-studio-agent-url|id="agentLaunch"|connection pending/);
  assert.match(html, /id="advisorForm"/);
  assert.match(html, /id="advisorDownload"/);
  assert.match(html, /id="advisorPdf"[^>]+>[\s\S]*?Save as PDF<\/button>/);
  assert.match(readFileSync(join(__dirname, '../assets/js/ssp-design.js'), 'utf8'), /window\.print\(\)/);
  const sources = new Set();
  for (const goal of ['new', 'modernize', 'govern', 'review']) {
    const questions = advisor.questionsFor({ goal });
    const branch = questions.at(-1);
    for (const option of branch.options) {
      for (const workload of questions.find(item => item.id === 'workload').options) {
        const result = advisor.recommend({ ...base, goal, [branch.id]: option.value, workload: workload.value });
        assert.equal(result.complete, true);
        assert.ok(result.options.length);
        assert.ok(result.assumptions.length);
        assert.equal(result.answers.length, 7);
        result.recommendations.forEach(item => {
          assert.ok(html.includes('<h3>' + item.title + '</h3>'), item.title);
          assert.ok(html.includes('href="' + item.source + '"'), item.source);
          sources.add(item.source);
        });
      }
    }
  }
  assert.ok(sources.size >= 5);
  const live = advisor.recommend({ ...base, goal: 'review', evidence: 'live' });
  assert.equal(live.reviewUrl, 'ssp-review.html#skills');
  const draft = advisor.recommend({ ...base, goal: 'review', evidence: 'design' });
  assert.equal(draft.reviewUrl, null);
  const markdown = advisor.toMarkdown(live, 'https://example.org/ssp-design.html', [{ title: 'Scoped skill', url: 'https://example.org/skill', scope: 'Product-specific scope.' }]);
  assert.match(markdown, /Supporting published skills/);
  assert.match(markdown, /Product-specific scope/);
});

test('Build release checklist connects ALM stages to guides and review', () => {
  const html = readFileSync(join(__dirname, '../ssp-build.html'), 'utf8');
  const section = html.match(/<section aria-labelledby="process-heading">[\s\S]*?<\/section>/)[0];
  assert.match(section, /Prepare your solution for release/);
  assert.match(section, /application lifecycle management \(ALM\)/);
  assert.doesNotMatch(section, /thin slice|releasable increment/);
  assert.equal((section.match(/<li class="step">/g) || []).length, 4);
  assert.equal((section.match(/<li>/g) || []).length, 8);
  assert.match(section, /ssp-review\.html#skills/);
  assert.match(section, /https:\/\/learn\.microsoft\.com\/power-platform\/alm\/overview-alm/);
  for (const [, page, anchor] of section.matchAll(/href="(ssp-design.html)?#(skill-[^"]+)"/g)) {
    const target = page ? readFileSync(join(__dirname, '../', page), 'utf8') : html;
    const ids = [...target.matchAll(/<h3>([^<]+)<\/h3>/g)].map(match => 'skill-' + match[1].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    assert.ok(ids.includes(anchor), anchor);
  }
});

test('Build and Review catalogs use category-only panels with matching counts and copy', () => {
  for (const [pillar, initialCategory, total] of [['build', 'apps', 14], ['review', 'architecture', 9]]) {
    const html = readFileSync(join(__dirname, `../ssp-${pillar}.html`), 'utf8');
    const cards = [...html.matchAll(/<article class="skill-card"[^>]*data-category="([^"]+)"/g)];
    const filters = [...html.matchAll(/<button class="filter"[^>]*data-category="([^"]+)"[^>]*aria-pressed="([^"]+)"[^>]*data-description="([^"]+)"[^>]*>[\s\S]*?<span class="guide-label">([^<]+)<\/span><span class="guide-count">(\d+)<\/span><\/button>/g)];
    assert.equal(cards.length, total);
    assert.equal(filters.length, new Set(cards.map(card => card[1])).size);
    assert.doesNotMatch(html, /data-category="all"/);
    assert.deepEqual(filters.filter(filter => filter[2] === 'true').map(filter => filter[1]), [initialCategory]);
    assert.match(html, /class="guide-rail"/);
    assert.match(html, /class="guide-panel" role="region" aria-labelledby="guide-panel-heading"/);
    assert.doesNotMatch(html, /id="clearFilters"|>Clear search</);
    for (const [, category, selected, description, label, count] of filters) {
      assert.equal(Number(count), cards.filter(card => card[1] === category).length);
      assert.ok(description.length > 30);
      if (selected === 'true') {
        assert.ok(html.includes(`id="guide-panel-heading">${label} guides</h2>`));
        assert.ok(html.includes(`id="guide-panel-description">${description}</p>`));
      }
    }
  }
});

test('Build and Review hero actions and highlights show only useful choices and values', () => {
  const build = readFileSync(join(__dirname, '../ssp-build.html'), 'utf8');
  const review = readFileSync(join(__dirname, '../ssp-review.html'), 'utf8');
  const entryScript = readFileSync(join(__dirname, '../assets/js/ssp-search-entry.js'), 'utf8');
  const buildActions = build.match(/<div class="hero-actions">([\s\S]*?)<\/div>/)[1];

  assert.equal((buildActions.match(/class="btn"/g) || []).length, 2);
  assert.doesNotMatch(buildActions, /class="btn ghost"/);
  assert.doesNotMatch(entryScript, /Browse all advisor skills/);
  assert.doesNotMatch(build + review, /Browse all advisor skills/);
  assert.doesNotMatch(review, /PII permitted/);
});

test('Every portal footer shows the publication month semantically', () => {
  for (const page of sspPages) {
    const html = readFileSync(join(__dirname, '..', page), 'utf8');
    const footer = html.match(/<footer[\s\S]*?<\/footer>/)?.[0];
    assert.ok(footer, `${page} footer`);
    assert.match(footer, /Last published: <time datetime="2026-10">Oct, 2026<\/time>/, page);
  }
});

test('Design guides route skills by owner after providing local context', () => {
  const html = readFileSync(join(__dirname, '../ssp-design.html'), 'utf8');
  const searchScript = readFileSync(join(__dirname, '../assets/js/ssp-search.js'), 'utf8');
  const cards = [...html.matchAll(/<article class="skill-card"[\s\S]*?<\/article>/g)].map(match => match[0]);
  assert.equal(cards.length, 8);
  assert.doesNotMatch(html, /id="clearFilters"|>Clear search</);
  assert.match(html, /3 Design guides/);
  assert.doesNotMatch(html, /data-category="all"|All Design guides|>All guides</);
  assert.match(html, /data-category="architecture" aria-pressed="true"/);
  assert.match(html, /class="guide-rail"/);
  assert.match(html, /class="guide-panel" role="region" aria-labelledby="guide-panel-heading"/);
  for (const card of cards) {
    assert.match(card, /class="guide-resources"/);
    assert.match(card, /<details open><summary>Inputs and intended output/);
    assert.match(card, /https:\/\/learn\.microsoft\.com\//);
    const powerCat = card.match(/data-skill-owner="power-cat"[\s\S]*?href="(https:\/\/microsoft\.github\.io\/power-cat-skills\/power-platform-migration-factory\/skill\.html\?id=[^"]+)"/);
    const nonPowerCat = card.match(/data-skill-owner="non-power-cat"[\s\S]*?data-canonical-source="(https:\/\/github\.com\/[^"]+)"[\s\S]*?href="(https:\/\/github\.com\/[^"]+)"/);
    if (powerCat) assert.ok(powerCatCatalog.skills.some(entry => entry.detailUrl === powerCat[1]), powerCat[1]);
    else if (nonPowerCat) {
      assert.equal(nonPowerCat[2], nonPowerCat[1]);
      assert.ok(catalog.skills.some(entry => entry.marketplace !== 'Power CAT Skills' && entry.source === nonPowerCat[1]), nonPowerCat[1]);
    }
    else assert.match(card, /Documentation-led guide|Microsoft architecture guidance|Well-Architected assessment/);
  }
  assert.equal(cards.filter(card => card.includes('data-skill-owner=')).length, 5);
  assert.doesNotMatch(html, /verified in the imported catalog|No dedicated integration-pattern selector|No published skill with this guide's name/);
  assert.doesNotMatch(searchScript, /Source verified/);
});

test('Design intents open curated topic pages instead of filtering the skill catalog', () => {
  const design = readFileSync(join(__dirname, '../ssp-design.html'), 'utf8');
  const guide = readFileSync(join(__dirname, '../ssp-design-guide.html'), 'utf8');
  assert.doesNotMatch(design, /<button class="outcome"/);
  for (const topic of ['new', 'modernize', 'govern', 'review']) {
    assert.ok(design.includes(`href="ssp-design-guide.html?return=ssp-design.html%23outcomes-heading#${topic}"`));
    const article = guide.match(new RegExp(`<article class="topic" id="${topic}"[\\s\\S]*?</article>`))[0];
    assert.equal((article.match(/<li><h3>/g) || []).length, 3);
    assert.match(article, /https:\/\/learn\.microsoft\.com\//);
    assert.match(article, /ssp-design\.html#skill-/);
    assert.match(article, /Supporting published skills/);
    for (const match of article.matchAll(/href="(https:\/\/github\.com\/[^"]+)"/g)) {
      assert.ok(catalog.skills.some(skill => skill.tier === 'skill' && skill.source === match[1]), match[1]);
    }
  }
  const cardIds = [...design.matchAll(/<h3>([^<]+)<\/h3>/g)].map(match => 'skill-' + match[1].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  for (const match of guide.matchAll(/href="ssp-design.html#(skill-[^"]+)"/g)) assert.ok(cardIds.includes(match[1]), match[1]);
  assert.match(guide, /history\.replaceState\(\{ designTopic: topic\.id, designStep: index \+ 1 \}/);
  assert.match(guide, /link\.href = 'ssp-design\.html\?return=' \+ encodeURIComponent\('ssp-design-guide\.html#' \+ steps\[index\]\.id\) \+ destination\.hash/);
  assert.match(design, /const returnTarget = new URLSearchParams\(location\.search\)\.get\('return'\)/);
  assert.match(guide, /not one-to-one names of published skills/);
  assert.match(guide, /new: \[\['Plan',[\s\S]*\['Model',[\s\S]*\['Validate',/);
  assert.match(guide, /<h3>Plan the solution boundary<\/h3>/);
  assert.match(guide, /<h3>Model the experience and data<\/h3>/);
  assert.match(guide, /<h3>Validate access and design risks<\/h3>/);
  assert.doesNotMatch(guide, /Back to first step/);
  assert.equal((guide.match(/<h2>Before you start<\/h2>/g) || []).length, 4);
  assert.equal((guide.match(/<h2>Before you start<\/h2>\s*<p>Bring /g) || []).length, 4);
  assert.match(guide, /actionPanel\.className = 'topic-step-actions'/);
  assert.match(guide, /supporting\.className = 'topic-supporting-resources'/);
  assert.match(guide, /Supporting resources \(\$\{items\.length - 1\}\)/);
  assert.doesNotMatch(guide, /supporting = document\.createElement\('details'\)/);
  assert.match(guide, /View supporting skills/);
  assert.match(guide, /skillsHeading\.scrollIntoView/);
});

test('Enterprise environment guidance covers the managed governance model', () => {
  const design = readFileSync(join(__dirname, '../ssp-design.html'), 'utf8');
  const guide = readFileSync(join(__dirname, '../ssp-design-guide.html'), 'utf8');
  const resources = readFileSync(join(__dirname, '../ssp-search.html'), 'utf8');
  const card = [...design.matchAll(/<article class="skill-card"[\s\S]*?<\/article>/g)]
    .map(match => match[0])
    .find(item => item.includes('<h3>Environment Strategy Blueprint</h3>'));
  assert.ok(card);
  for (const term of ['Managed Environments', 'environment groups', 'personal developer environments', 'default-environment reduction plan', 'cannot be overridden per environment']) {
    assert.match(card, new RegExp(term, 'i'));
  }
  const govern = guide.match(/<article class="topic" id="govern"[\s\S]*?<\/article>/)?.[0];
  assert.ok(govern);
  for (const term of ['reduce default-environment dependence', 'inherited rules', 'separately governed group', 'Route makers', 'personal developer environments', 'licensing checks']) {
    assert.match(govern, new RegExp(term, 'i'));
  }
  for (const path of ['managed-environment-overview', 'environment-groups', 'environment-groups-rules', 'default-environment-routing', 'manage-default-environment']) {
    assert.match(design + guide + resources, new RegExp(`learn\\.microsoft\\.com/power-platform/(?:admin|guidance/adoption)/${path}`));
  }
});

const entries = [
  ['App Performance Review', 'Examine queries, delegation and monitor traces.', 'Skill'],
  ['Dataverse Data Model Designer', 'Design tables, ownership and relationships.', 'Skill'],
  ['Design better apps: performant apps', 'Create performant apps.', 'Resource'],
  ['Troubleshoot a cloud flow', 'Troubleshoot cloud flow failures.', 'Resource'],
  ['Cloud Flow Builder', 'Build automation with retries and exception handling.', 'Skill'],
  ['Approval Workflow Accelerator', 'Implement approvals with escalation.', 'Skill'],
  ['Environment Strategy Blueprint', 'Plan environments and DLP governance.', 'Skill'],
  ['Security Role Mapper', 'Define least-privilege security access.', 'Skill'],
  ['ALM Topology Planner', 'Plan pipelines and release responsibilities.', 'Skill'],
  ['Solution Security Review', 'Assess security risks.', 'Skill'],
  ['Power Platform training hub', 'Training and learning paths.', 'Resource'],
  ['Power Series hands-on labs', 'Guided exercises.', 'Learning']
].map(([title, text, type], index) => ({ title, text, type, category: type, url: 'destination-' + index }));

test('Plain-language search requires the task rather than an incidental shared word', () => {
  const examples = [
    ['Customer training', 'Sign up to deliver trainings for our customers.'],
    ['Create your first website', 'Create a Power Pages website.'],
    ['Reduce risk in automation projects', 'Plan for failure.'],
    ['Licensing and pricing', 'Power Apps licensing and costs.'],
    ['Solution Architecture Blueprint', 'Record a decision log.'],
    ['Connect', 'Authenticate to Dataverse.'],
    ['Power Apps: Website', 'Power Apps homepage.'],
    ['Admin portal', 'Administration website for the platform.']
  ].map(([title, text], index) => ({ title, text, category: 'Resource', url: 'resource-' + index }));
  assert.equal(rank(examples, 'I need a website for customers')[0].title, 'Create your first website');
  assert.deepEqual(rank(examples, 'I need a website for customers').map(item => item.title), ['Create your first website']);
  assert.equal(rank(examples, 'I need to reduce licensing costs')[0].title, 'Licensing and pricing');
  assert.deepEqual(rank(examples, 'I cannot log in'), []);
  assert.deepEqual(rank(examples, 'How do I connect to SAP?'), []);
});

test('Product-specific performance searches do not recommend a different app type', () => {
  const examples = [
    { title: 'Canvas app performance', text: 'Performance guidance for canvas apps.', category: 'Resource', type: 'Resource', url: 'https://learn.microsoft.com/power-apps/maker/canvas-apps/create-performant-apps-overview' },
    { title: 'Model-driven app performance', text: 'Troubleshoot slow model-driven apps.', category: 'Resource', type: 'Resource', url: 'model-driven-performance' }
  ];
  assert.deepEqual(rank(examples, 'My model-driven app is slow').map(item => item.title), ['Model-driven app performance']);
  assert.equal(guidance(entries, 'My model-driven app is slow'), null);
  assert.equal(guidance(entries, 'My Power Pages app is slow'), null);
  assert.equal(guidance(entries, 'My Power BI report is slow'), null);
});

test('Search normalizes common product typos, plurals, and punctuation', () => {
  const examples = [
    ['Canvas App Rapid Start', 'Build a canvas app.'],
    ['Model-Driven App Builder', 'Create a model-driven app.'],
    ['Dataverse', 'Dataverse data platform.'],
    ['Power Automate', 'Power Automate cloud flows.'],
    ['Power Apps', 'Power Apps canvas apps.']
  ].map(([title, text], index) => ({ title, text, category: 'Guide', url: 'guide-' + index }));
  assert.ok(rank(examples, 'canvas apps').some(item => item.title === 'Canvas App Rapid Start'));
  assert.deepEqual(rank(examples, 'model driven').map(item => item.title), ['Model-Driven App Builder']);
  assert.equal(rank(examples, 'datavers')[0].title, 'Dataverse');
  assert.deepEqual(rank(examples, 'Power Automte').map(item => item.title), ['Power Automate']);
  assert.deepEqual(rank(examples, 'powerautomate').map(item => item.title), ['Power Automate']);
});

test('slow-app queries match performance by synonym', () => {
  assert.equal(rank(entries, 'my app is slow')[0].title, 'App Performance Review');
});
test('a proposed migration does not override performance diagnosis', () => {
  assert.equal(rank(entries, 'Our app is slow. Should we migrate to Dataverse?')[0].title, 'App Performance Review');
  const path = guidance(entries, 'Our app is slow. Should we migrate to Dataverse?');
  assert.equal(path.id, 'performance');
  assert.equal(path.steps[0].result.title, 'App Performance Review');
  assert.equal(path.steps[1].result.title, 'Design better apps: performant apps');
});
test('a failing approval flow prioritizes troubleshooting over building', () => {
  const path = guidance(entries, 'Our approval flow is failing');
  assert.equal(path.id, 'troubleshoot');
  assert.equal(path.steps[0].result.type, 'Resource');
});
test('multi-word searches relax only after strict matching returns nothing', () => {
  assert.deepEqual(rank(entries, 'expense approval'), []);
  const relaxed = relaxedRank(entries, 'expense approval');
  assert.deepEqual(relaxed.terms, ['approval']);
  assert.equal(relaxed.results[0].title, 'Approval Workflow Accelerator');
  assert.deepEqual(relaxedRank(entries, 'approval'), { terms: [], results: [] });
  assert.deepEqual(relaxedRank(entries, 'unknown expense'), { terms: [], results: [] });
});
test('enterprise rollout starts with environment strategy', () => {
  assert.equal(guidance(entries, 'Roll out across our company').steps[0].result.title, 'Environment Strategy Blueprint');
});
test('security review and learning have source-backed paths', () => {
  assert.equal(guidance(entries, 'security review').steps[0].result.title, 'Solution Security Review');
  assert.equal(guidance(entries, 'I want hands-on training').steps[1].result.type, 'Learning');
});
test('unknown, blank, and stop-word-only queries do not invent matches', () => {
  for (const query of ['', 'the and my', 'unrelatedxyz']) {
    assert.deepEqual(rank(entries, query), []);
    assert.equal(guidance(entries, query), null);
  }
});
test('exact titles rank first and partial words do not match', () => {
  assert.equal(rank(entries, 'Security Role Mapper')[0].title, 'Security Role Mapper');
  assert.deepEqual(rank(entries, 'applicable'), []);
});
test('unavailable sources are omitted and destinations are not repeated', () => {
  assert.equal(guidance([], 'slow app'), null);
  const path = guidance(entries.slice(0, 1), 'slow app');
  assert.equal(path.steps.length, 1);
  assert.equal(new Set(path.steps.map(step => step.result.url)).size, path.steps.length);
});

test('published snapshot preserves unique IDs, source links and all three tiers', () => {
  const parsed = parseCatalog('const DATA = ' + JSON.stringify({ generated: catalog.sourceGenerated, skills: catalog.skills }) + ';');
  assert.deepEqual(parsed.skills, catalog.skills);
  assert.equal(new Set(catalog.skills.map(item => item.id)).size, catalog.skills.length);
  for (const tier of ['skill', 'mcp-capability', 'reference']) assert.ok(catalog.skills.some(item => item.tier === tier));
});
test('all imported skills are searchable by their published name', () => {
  const imported = catalog.skills.map(item => ({ title: item.displayName || item.name, text: item.name + ' ' + item.description, category: item.products.join(' '), id: item.id }));
  for (const item of catalog.skills.filter(item => item.tier === 'skill')) {
    assert.ok(rank(imported, item.name).some(result => result.id === item.id), item.name);
  }
});
test('catalog parsing rejects changed formats, duplicate IDs and unsafe source URLs', () => {
  assert.throws(() => parseCatalog('const DATA = {}; alert("never executed");'));
  assert.throws(() => parseCatalog('const DATA = {"skills":[]};'));
  const item = catalog.skills[0];
  assert.throws(() => parseCatalog('const DATA = ' + JSON.stringify({ skills: [item, item] }) + ';'));
  assert.throws(() => parseCatalog('const DATA = ' + JSON.stringify({ skills: [{ ...item, source: 'javascript:alert(1)' }] }) + ';'));
});
test('SSP guides remain eligible for curated scenario recommendations', () => {
  const guides = entries.map(item => ({ ...item, type: item.type === 'Skill' ? 'Guide' : item.type }));
  assert.equal(guidance(guides, 'slow app').steps[0].result.title, 'App Performance Review');
});

test('Resources owns the complete resource catalog below search', () => {
  const html = readFileSync(join(__dirname, '../ssp-search.html'), 'utf8');
  assert.match(html, /<title>Self-Service Portal - Resources<\/title>/);
  assert.ok(html.indexOf('id="resources"') > html.indexOf('id="searchResults"'));
  const categories = [...html.matchAll(/<article class="panel(?: active)?" id="([^"]+)"/g)];
  assert.equal(categories.length, 13);
  assert.equal(new Set(categories.map(match => match[1])).size, 13);
  const categoryButtons = [...html.matchAll(/class="cat-link(?: active)?" data-target="([^"]+)"/g)];
  assert.deepEqual(categoryButtons.map(match => match[1]), categories.map(match => match[1]));
  assert.doesNotMatch(html, /resource-category|id="resourceCategory"/);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(existsSync(join(__dirname, '../ssp-resources.html')), false);
});

test('Resources is appended as the final navigation tab', () => {
  const script = readFileSync(join(__dirname, '../assets/js/ssp-search-entry.js'), 'utf8');
  const navigation = script.slice(0, script.indexOf('  const themeToggle')) + '})();';
  for (const pathname of ['/ssp-search.html', '/ssp-landing.html']) {
    const links = [{ textContent: 'About' }, { textContent: 'Learn' }];
    const nav = { querySelector: () => null, append: link => links.push(link) };
    runInNewContext(navigation, {
      location: { pathname },
      document: {
        getElementById: () => nav,
        createElement: () => ({ setAttribute(name, value) { this[name] = value; } })
      }
    });
    assert.equal(links.at(-1).textContent, 'Resources');
    assert.equal(links.at(-1).href, 'ssp-search.html');
    assert.equal(links.at(-1)['aria-current'], pathname === '/ssp-search.html' ? 'page' : undefined);
  }
});

test('Search is available beside the theme control', () => {
  const script = readFileSync(join(__dirname, '../assets/js/ssp-search-entry.js'), 'utf8');
  assert.match(script, /searchLink\.className = 'icon-btn header-search'/);
  assert.match(script, /searchLink\.href = 'ssp-search\.html\?focus=search'/);
  assert.match(script, /themeToggle\.parentElement\.insertBefore\(searchLink, themeToggle\)/);
  assert.match(script, /searchLink\.setAttribute\('aria-label', 'Search the Self-Service Portal'\)/);
  const searchPage = readFileSync(join(__dirname, '../assets/js/ssp-search.js'), 'utf8');
  assert.match(searchPage, /initialParams\.get\('focus'\) === 'search'/);
  assert.match(searchPage, /byId\('scenario'\)\.focus\(\)/);
});

test('About has no scenario form and portal pages no longer link to the retired resource page', () => {
  const about = readFileSync(join(__dirname, '../ssp-landing.html'), 'utf8');
  assert.match(about, /<title>Self-Service Portal - About<\/title>/);
  assert.doesNotMatch(about, /data-scenario-entry|id="landingScenario"/);
  assert.doesNotMatch(about, /class="rgrid"|class="rtile/);
  assert.match(about, /href="ssp-search.html#resources">Explore Power Platform resources<\/a>/);
  for (const page of ['landing', 'search', 'design', 'build', 'review']) {
    const html = readFileSync(join(__dirname, `../ssp-${page}.html`), 'utf8');
    assert.doesNotMatch(html, /ssp-resources\.html|>Home<\/a>/);
    assert.match(html, /href="ssp-landing.html"[^>]*>About<\/a>/);
  }
});

test('every guided goal has a clear next action and an unsure path', () => {
  assert.equal(journeys.length, 5);
  assert.equal(new Set(journeys.map(journey => journey.id)).size, 5);
  const html = readFileSync(join(__dirname, '../ssp-search.html'), 'utf8');
  const script = readFileSync(join(__dirname, '../assets/js/ssp-search.js'), 'utf8');
  for (const journey of journeys) {
    assert.ok(journey.intro.length > 80, journey.id);
    assert.ok(journey.options.some(option => option.id === 'unsure'), journey.id);
    assert.equal(new Set(journey.options.map(option => option.id)).size, journey.options.length);
    for (const option of journey.options) {
      assert.equal(nextStep(journey.id, option.id), option);
      assert.ok(option.title && option.why && option.action);
      assert.ok(option.bestFor.length > 40, `${journey.id}/${option.id} bestFor`);
      assert.ok(option.outcome.length > 40, `${journey.id}/${option.id} outcome`);
      assert.ok(option.related.length <= 2);
      assert.ok(!option.url.includes('powerplatformskillsadvisor'));
      const url = new URL(option.url, 'https://example.test/ssp-search.html');
      assert.equal(url.protocol, 'https:');
      if (option.url.startsWith('#')) assert.ok(html.includes(`id="${option.url.slice(1)}"`));
      else if (!option.url.startsWith('https:')) assert.ok(existsSync(join(__dirname, '..', option.url.split('#')[0])));
      for (const id of option.related) assert.ok(html.includes(`id="${id}"`));
    }
  }
  assert.equal(nextStep('unknown', 'unknown'), null);
  assert.equal(nextStep('learn', 'unknown'), null);
  assert.match(script, /journey\.options\.forEach\(option => \{/);
  assert.match(script, /\["You'll leave with", selectedOption\.outcome\]/);
  assert.match(script, /selectedOption\.destination/);
  assert.match(script, /element\('p', 'Recommended next action', 'journey-recommendation-label'\)/);
  assert.match(script, /element\('details', null, 'journey-recommendation-details'\)/);
  assert.match(script, /set\('path', selectedGoal \? selectedPath : ''\)/);
  assert.match(nextStep('learn', 'practice').url, /automation-01-cloud-flow/);
  assert.match(nextStep('build', 'site').url, /byoc-powerpages/);
  assert.match(nextStep('build', 'agent').url, /power-apps-mcp-server-agents-and-agent-feed/);
  assert.equal(nextStep('review', 'pages').url, 'ssp-review.html#skill-powercat-overpage');
  assert.equal(nextStep('review', 'flows').url, 'ssp-review.html#skill-powercat-overflow');
  assert.equal(nextStep('review', 'solution').url, 'ssp-review.html#skill-well-architected-solution-review');
});

test('internal fragment navigation resolves to specific site targets', () => {
  const pages = new Map(sspPages.map(file => [file, navigationTargets(file)]));
  const failures = [];
  for (const [source, { html }] of pages) {
    for (const match of html.matchAll(/\bhref="([^"]+)"/g)) {
      const href = match[1].replace(/&amp;/g, '&');
      const resolved = new URL(href, `https://example.test/${source}`);
      if (resolved.origin !== 'https://example.test' || !resolved.hash) continue;
      const targetFile = resolved.pathname.slice(1) || source;
      if (!targetFile.startsWith('ssp-') || !targetFile.endsWith('.html')) continue;
      const target = pages.get(targetFile);
      const id = decodeURIComponent(resolved.hash.slice(1));
      if (!target) failures.push(`${source}: ${href} points to missing page ${targetFile}`);
      else if (!target.ids.has(id)) failures.push(`${source}: ${href} points to missing target #${id}`);
    }
  }
  assert.deepEqual(failures, []);

  const broadTargets = new Set(['skills', 'resources', 'building', 'architecture-guidance', 'products']);
  for (const journey of journeys) {
    for (const option of journey.options) {
      if (option.id === 'unsure' || !option.url.startsWith('ssp-') || !option.url.includes('#')) continue;
      const resolved = new URL(option.url, 'https://example.test/ssp-search.html');
      const targetFile = resolved.pathname.slice(1);
      const id = resolved.hash.slice(1);
      assert.ok(!broadTargets.has(id), `${journey.id}/${option.id} should link to a specific target, not #${id}`);
      assert.ok(pages.get(targetFile)?.ids.has(id), `${journey.id}/${option.id} points to missing ${targetFile}#${id}`);
    }
  }
});

test('search state, filter-only browsing, and beginner guidance are persistent', () => {
  const html = readFileSync(join(__dirname, '../ssp-search.html'), 'utf8');
  const script = readFileSync(join(__dirname, '../assets/js/ssp-search.js'), 'utf8');
  assert.doesNotMatch(html, /id="scenario"[^>]*\srequired(?:\s|>)/);
  assert.match(html, /id="beginner-route"/);
  assert.match(html, /About 60 minutes/);
  assert.match(html, /A working automated approval process/);
  for (const term of ['Skill', 'Skills Advisor', 'Power CAT Skills Marketplace']) assert.match(html, new RegExp(`<dt>${term}</dt>`));
  assert.match(script, /const hasFilters = Boolean\(type \|\| product\)/);
  assert.match(script, /!query && !catalogMode && !hasFilters/);
  assert.match(script, /searchClarify'\)\.hidden = !query \|\| filtered\.length > 0/);
  assert.match(script, /beginner-route'\)\.hidden = Boolean\(query \|\| catalogMode \|\| hasFilters/);
  assert.match(script, /const plainText = text => clean\(text\)/);
  assert.match(script, /const description = plainText\(item\.description \|\| item\.text\)/);
  for (const parameter of ['q', 'type', 'product', 'mode', 'goal', 'limit', 'detail']) {
    assert.match(script, new RegExp(`set\\('${parameter}'`));
  }
  assert.match(script, /window\.addEventListener\('popstate'/);
  assert.match(script, /window\.addEventListener\('pagehide'/);
  assert.doesNotMatch(script, /byId\('typeFilter'\)\.value = '';\s*byId\('productFilter'\)\.value = '';\s*limit = 3;\s*render\(\);/);
  assert.doesNotMatch(script, /selectedAnswer|journeyBack|journeyReset/);
});

test('Interactive cards share Design lift with keyboard and reduced-motion support', () => {
  const css = readFileSync(join(__dirname, '../assets/css/header-brand.css'), 'utf8');
  const designCss = readFileSync(join(__dirname, '../assets/css/ssp-design.css'), 'utf8');
  const buildGuideCss = readFileSync(join(__dirname, '../assets/css/ssp-build-guide.css'), 'utf8');
  assert.match(css, /:is\(\.outcome, #goalChoices \.journey-choice, \.fcard, \.path-choice\)/);
  assert.match(css, /@media \(hover: hover\) and \(pointer: fine\)/);
  assert.match(css, /:focus-visible\s*\{\s*transform: translateY\(-3px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?transform: none;\s*transition: none;/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?:is\(:hover, :focus-visible\)/);
  for (const page of ['search', 'design', 'build', 'review', 'landing', 'design-guide', 'build-guide']) {
    const html = readFileSync(join(__dirname, `../ssp-${page}.html`), 'utf8');
    const header = html.match(/<header class="topbar"[\s\S]*?<\/header>/)[0];
    const logo = header.match(/<a class="logo"[\s\S]*?<\/a>/)[0];
    assert.match(html, /header-brand\.css\?v=20261001-search-icon/);
    assert.equal((header.match(/class="powercat-logo header-powercat"/g) || []).length, 1);
    assert.doesNotMatch(logo, /powercat-logo|cat-divider/);
  }
  assert.match(css, /\.topbar \.row\s*\{[\s\S]*?height: 92px;/);
  assert.match(css, /\.platform-logo\s*\{[\s\S]*?width: 220px;[\s\S]*?height: 92px;/);
  assert.match(css, /\.topbar \.header-powercat img\s*\{[\s\S]*?width: 118px;[\s\S]*?height: 46px;[\s\S]*?object-fit: contain;/);
  assert.match(css, /@media \(max-width: 1080px\)\s*\{[\s\S]*?\.topbar nav\.main\s*\{[\s\S]*?top: 92px;/);
  assert.match(css, /@media \(min-width: 1081px\)\s*\{[\s\S]*?\.topbar nav\.main\s*\{[\s\S]*?margin-left: auto;[\s\S]*?\.topbar \.spacer\s*\{[\s\S]*?display: none;/);
  assert.match(css, /@media \(max-width: 560px\)\s*\{[\s\S]*?\.topbar \.row\s*\{[\s\S]*?height: 87px;/);
  assert.match(css, /@media \(max-width: 560px\)[\s\S]*?\.topbar nav\.main\s*\{[\s\S]*?top: 87px;/);
  assert.match(css, /@media \(max-width: 300px\)[\s\S]*?\.wrap\s*\{[\s\S]*?padding-right: 16px;[\s\S]*?padding-left: 16px;/);
  assert.match(css, /@media \(max-width: 300px\)[\s\S]*?\.platform-logo\s*\{[\s\S]*?width: 80px;/);
  assert.match(css, /@media \(max-width: 300px\)[\s\S]*?\.topbar \.header-powercat\s*\{[\s\S]*?display: none;/);
  assert.match(designCss, /\.skills-section \.guide-panel \.skill-actions\s*\{\s*justify-content: flex-start;\s*gap: 18px;\s*flex-wrap: wrap;/);
  assert.match(buildGuideCss, /\.coached-steps\s*\{[^}]*min-width: 0;/);
  assert.match(buildGuideCss, /\.coached-step\s*\{[^}]*min-width: 0;[^}]*overflow-wrap: anywhere;/);
  assert.match(designCss, /\.skills-section \.guide-panel \.guide-resources a\s*\{[^}]*text-align: left;/);
  assert.match(designCss, /\.alm-checklist \.step > a\s*\{[^}]*align-self: flex-start;[^}]*text-align: left;/);
  const guide = readFileSync(join(__dirname, '../ssp-design-guide.html'), 'utf8');
  assert.match(guide, /\.topic-links\{[^}]*justify-content:flex-start;/);
  assert.doesNotMatch(guide, /\.topic(?:-steps|\\.enhanced)>?[^{}]*topic-links[^{}]*text-align:right/);
  assert.match(css, /\.external-preview\s*\{[\s\S]*?inset: 0 0 0 auto;/);
  assert.match(css, /@media \(max-width: 600px\)[\s\S]*?\.external-preview\s*\{[\s\S]*?width: 100%;/);
});

test('External previews use listing summaries and skip internal, non-web, and download links', () => {
  const script = readFileSync(join(__dirname, '../assets/js/ssp-search-entry.js'), 'utf8');
  const describe = runInNewContext(script.slice(script.indexOf('  function describeExternalLink'), script.indexOf('  let preview;')) + '\ndescribeExternalLink;', {
    URL, location: { href: 'https://example.org/ssp/ssp-search.html', origin: 'https://example.org' }
  });
  function link(href, summary = '', download = false) {
    return {
      href, dataset: { previewSummary: summary },
      hasAttribute: name => name === 'download' && download,
      getAttribute: () => null,
      cloneNode: () => ({ textContent: 'Resource title', querySelectorAll: () => [] }),
      closest: () => null
    };
  }
  for (const href of ['#resources', 'ssp-design.html', 'mailto:someone@example.org', 'tel:123', 'blob:https://example.org/brief']) assert.equal(describe(link(href)), null);
  assert.equal(describe(link('https://learn.microsoft.com/file', '', true)), null);
  assert.equal(describe(link('https://learn.microsoft.com/power-platform/', 'Full published description.')), null);
  assert.match(describe(link('https://example.net/unknown')).summary, /No additional summary/);
  assert.match(describe(link('https://aka.ms/powerplatformskillsadvisor')).summary, /not an individual guide/);
  const learn = link('https://microsoft.github.io/apps-agents-workshop/labs/');
  learn.closest = selector => selector === '#siteNav' ? {} : null;
  assert.equal(describe(learn), null);
  const lab = describe(link('https://microsoft.github.io/apps-agents-workshop/labs/lab.html?path=test.md', 'Specific lab description'));
  assert.equal(lab.title, 'Resource title');
  assert.equal(lab.summary, 'Specific lab description');
  assert.match(script, /learnLink\.target = '_blank'/);
  assert.match(script, /Learn \(opens in a new tab\)/);
  assert.match(script, /const skillsAdvisorUrl = 'https:\/\/aka\.ms\/powerplatformskillsadvisor'/);
  assert.match(script, /link\.dataset\.skillOwner \|\| \(link\.href === skillsAdvisorUrl \? 'non-power-cat' : ''\)/);
  assert.match(script, /skill\?\.route === 'Power Platform Skills Advisor' \? skillsAdvisorUrl : resource\.url\.href/);
  assert.match(script, /plainText\(link\.dataset\.previewSummary/);
  for (const page of ['search', 'design', 'build', 'review', 'landing', 'design-guide', 'build-guide']) {
    assert.match(readFileSync(join(__dirname, `../ssp-${page}.html`), 'utf8'), /ssp-search-entry\.js\?v=20261006-footer-actions/);
  }
});

test('About and Resources use consistent navigation and landmarks', () => {
  const about = readFileSync(join(__dirname, '../ssp-landing.html'), 'utf8');
  const resources = readFileSync(join(__dirname, '../ssp-search.html'), 'utf8');
  assert.equal((about.match(/<main>/g) || []).length, 1);
  assert.equal((about.match(/<\/main>/g) || []).length, 1);
  assert.ok(about.indexOf('<main>') < about.indexOf('<!-- HERO -->'));
  assert.ok(about.indexOf('</main>') < about.indexOf('<footer>'));
  assert.match(about, /aria-label="Switch to dark theme"[^>]*id="themeBtn"/);
  assert.match(about, /function syncThemeButton\(\)/);
  assert.match(resources, /<a class="logo" href="ssp-landing\.html" aria-label="About Self-Service Portal">/);
});

test('Self-Service Portal naming is consistent in user-facing copy', () => {
  for (const page of sspPages) {
    const html = readFileSync(join(__dirname, '..', page), 'utf8');
    const visibleText = html
      .replace(/<script\b[\s\S]*?<\/script>/gi, '')
      .replace(/<style\b[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ');
    assert.doesNotMatch(visibleText, /\bSSP\b/);
    for (const match of visibleText.matchAll(/self[\s-]service portal/gi)) {
      assert.equal(match[0], 'Self-Service Portal', `${page} uses inconsistent portal naming`);
    }
  }

  for (const script of ['ssp-design-advisor.js', 'ssp-design.js', 'ssp-search-engine.js', 'ssp-search.js']) {
    const source = readFileSync(join(__dirname, '../assets/js', script), 'utf8');
    assert.doesNotMatch(source, /\bSSP\b/);
    for (const match of source.matchAll(/self[\s-]service portal/gi)) {
      assert.equal(match[0], 'Self-Service Portal', `${script} uses inconsistent portal naming`);
    }
  }
});

test('Build offers four coached outcome journeys with sixteen visible stages', () => {
  const landing = readFileSync(join(__dirname, '../ssp-build.html'), 'utf8');
  const guide = readFileSync(join(__dirname, '../ssp-build-guide.html'), 'utf8');
  for (const id of ['create-app', 'automate-process', 'extend-experience', 'ship-safely']) {
    assert.match(landing, new RegExp(`href="ssp-build-guide\\.html#${id}"`));
    assert.match(guide, new RegExp(`<article class="build-journey" id="${id}"`));
  }
  assert.equal((guide.match(/class="coached-step"/g) || []).length, 16);
  for (const subtype of ['Canvas app', 'Model-driven app', 'Code app', 'Generative page', 'Cloud flow', 'Desktop flow', 'Mobile app']) {
    assert.match(guide, new RegExp(subtype));
  }
  assert.match(guide, /Define rollback criteria before promotion/);
  assert.equal((guide.match(/<aside class="journey-support"/g) || []).length, 4);
  const search = readFileSync(join(__dirname, '../assets/js/ssp-search.js'), 'utf8');
  assert.match(search, /\{ file: 'ssp-build-guide\.html', name: 'Build journeys' \}/);
  assert.match(search, /querySelectorAll\('\.build-journey'\)/);
});

test('Review provides canonical OverPage and OverFlow launches and actionable local OverCode guidance', () => {
  const html = readFileSync(join(__dirname, '../ssp-review.html'), 'utf8');
  for (const id of ['skill-powercat-overpage', 'skill-powercat-overflow', 'skill-well-architected-solution-review']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /href="https:\/\/microsoft\.github\.io\/power-cat-skills\/PowerCAT-OverPage\.html"/);
  assert.match(html, /href="https:\/\/microsoft\.github\.io\/power-cat-skills\/PowerCAT-Overflow\.html"/);
  const overCode = [...html.matchAll(/<article class="skill-card"[^>]*>[\s\S]*?<\/article>/g)]
    .map(match => match[0])
    .find(card => card.includes('<h3>PowerCAT OverCode</h3>'));
  assert.ok(overCode);
  assert.match(overCode, /Run locally/);
  assert.match(overCode, /How to proceed:/);
  assert.match(overCode, /approved local coding-assistant or code-review workflow/);
  assert.doesNotMatch(overCode, /unavailable|No canonical hosted OverCode viewer|repository catalog/);
  assert.doesNotMatch(overCode, /<a class="btn"/);
});

test('About pillars share aligned actions and flexible content tracks', () => {
  const html = readFileSync(join(__dirname, '../ssp-landing.html'), 'utf8');
  assert.match(html, /\.pillar\.open\{flex:1 1 0;/);
  assert.doesNotMatch(html, /transition:flex/);
  assert.match(html, /@media\(prefers-reduced-motion:reduce\)\{\.hero-slide,\.pillar,\.pillar-launch\{transition:none\}/);
  assert.match(html, /\.pillar-body\{display:grid;grid-template-columns:minmax\(0,\.85fr\) minmax\(0,1\.25fr\) minmax\(0,\.8fr\)/);
  assert.match(html, /\.pillar \.meta\{display:flex;justify-content:flex-end;/);
  assert.match(html, /\.pb-actions \.pillar-launch\{box-sizing:border-box;width:100%;max-width:200px;min-height:44px;text-align:center/);
  assert.equal((html.match(/class="pb-actions"/g) || []).length, 4);
});

test('About resource action is grouped with the statistics', () => {
  const html = readFileSync(join(__dirname, '../ssp-landing.html'), 'utf8');
  const section = html.slice(html.indexOf('<section id="categories"'), html.indexOf('<!-- FEATURED -->'));
  assert.equal((section.match(/<section/g) || []).length, 1);
  assert.match(section, /class="stats"[\s\S]+class="catalog-action"/);
  assert.match(section, /class="btn ghost" href="ssp-search.html#resources"/);
});

test('New-tab indicators are scoped to search results', () => {
  const css = readFileSync(join(__dirname, '../assets/css/ssp-search.css'), 'utf8');
  const indicator = css.split('\n').find(line => line.includes('\\2197'));
  assert.ok(indicator);
  assert.ok(indicator.startsWith('#resultList a[target="_blank"]::after'));
  assert.ok(indicator.includes('opens in a new tab'));
  const shared = readFileSync(join(__dirname, '../assets/css/header-brand.css'), 'utf8');
  assert.doesNotMatch(shared, /\\2197/);
});

test('guided choices and mobile-first search keep advanced controls optional', () => {
  const html = readFileSync(join(__dirname, '../ssp-search.html'), 'utf8');
  const introduction = html.slice(html.indexOf('<section class="scenario-entry"'), html.indexOf('<div class="resource-band">'));
  assert.ok(introduction.includes('id="scenarioForm"'));
  assert.doesNotMatch(introduction, /search-band|<textarea|privacy-note|describe your scenario/i);
  assert.match(introduction, /<input id="scenario" type="search"/);
  assert.equal([...html.matchAll(/<input\b[^>]*type="search"/g)].length, 1);
  assert.doesNotMatch(html, /id="(?:resourceQuery|resourceTools|clearResources|resourceEmpty)"/);
  const css = readFileSync(join(__dirname, '../assets/css/ssp-search.css'), 'utf8');
  assert.match(css, /@media\(max-width:520px\)\{\.scenario-entry>\.wrap\{display:flex;flex-direction:column\}/);
  assert.match(css, /\.scenario-entry #searchSection\{order:1;/);
  assert.match(css, /\.scenario-entry #searchResults\{order:2\}/);
  assert.match(css, /\.scenario-entry #goalChoices\{order:4;/);
  assert.ok(html.indexOf('id="searchResults"') < html.indexOf('id="guidance"'));
  assert.match(html, /<p class="search-eyebrow">Related guidance<\/p>/);
  assert.match(readFileSync(join(__dirname, '../index.html'), 'utf8'), /<noscript><meta http-equiv="refresh" content="0; url=ssp-landing.html"/);
  assert.ok(html.indexOf('id="goalChoices"') < html.indexOf('id="scenarioForm"'));
  assert.match(introduction, /id="journeyIntro"/);
  assert.match(introduction, /id="answerChoices" class="journey-paths"/);
  assert.doesNotMatch(introduction, /id="journeyBack"|id="journeyReset"|id="journeyRecommendation"/);
  assert.match(html, /<details id="advancedSearch" class="advanced-search">/);
  assert.ok(html.indexOf('id="advancedSearch"') < html.indexOf('id="typeFilter"'));
  assert.doesNotMatch(html, /id="starterScenarios"|data-scenario=/);
});