const { test } = require('node:test');
const assert = require('node:assert/strict');
const { rank, guidance, journeys, nextStep } = require('../assets/js/ssp-search-engine.js');
const { parseCatalog } = require('../scripts/sync-skills-advisor.js');
const catalog = require('../assets/data/skills-advisor.json');
const { readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');
const { runInNewContext } = require('node:vm');
const advisor = require('../assets/js/ssp-design-advisor.js');

test('Featured cards link to their named guides or an accurately labeled catalog', () => {
  const html = readFileSync(join(__dirname, '../ssp-landing.html'), 'utf8');
  const design = readFileSync(join(__dirname, '../ssp-design.html'), 'utf8');
  const cards = [...html.matchAll(/<a class="fcard" href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
  assert.equal(cards.length, 3);
  for (const [, href, content] of cards) {
    const title = content.match(/<h4>([^<]+)<\/h4>/)[1];
    if (href === 'ssp-search.html#skills') {
      assert.equal(title, 'Browse published skills');
    } else {
      assert.equal(href, 'ssp-design.html#skill-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
      assert.ok(design.includes('<h3>' + title + '</h3>'));
    }
    assert.doesNotMatch(content, /1:1 fidelity|HTML report|class="stars"/);
  }
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

test('Legacy resource bookmarks redirect to Start here while preserving theme and fragments', () => {
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
    assert.equal(redirect.pathname, '/ssp/' + (fragment && fragment !== 'pillars' ? 'ssp-search.html' : 'ssp-landing.html'));
    assert.equal(redirect.hash, fragment ? '#' + fragment : '');
    assert.equal(redirect.searchParams.get('scoutTheme'), 'dark');
  }
});

test('About carousel preserves pause and suspends rotation for focus, hover, visibility, and reduced motion', () => {
  const html = readFileSync(join(__dirname, '../ssp-landing.html'), 'utf8');
  const script = html.slice(html.indexOf('const heroSlides='), html.indexOf('// Horizontal accordion'));
  function control() {
    return {
      attributes: {}, listeners: {}, icon: {},
      classList: { toggle() {} },
      setAttribute(name, value) { this.attributes[name] = value; },
      removeAttribute(name) { delete this.attributes[name]; },
      addEventListener(name, handler) { this.listeners[name] = handler; },
      querySelector() { return this.icon; },
      appendChild() {}, contains(target) { return Boolean(target); }
    };
  }
  for (const reduced of [false, true]) {
    const controls = Object.fromEntries(['heroPause', 'heroNext', 'heroPrev'].map(id => [id, control()]));
    const hero = control();
    const actions = Array.from({ length: 4 }, control);
    const slides = actions.map(action => ({ ...control(), querySelector: () => action }));
    const dots = Array.from({ length: 4 }, control);
    const media = { ...control(), matches: reduced };
    const timers = new Map();
    let nextTimer = 0;
    const document = {
      ...control(), hidden: false,
      getElementById: id => controls[id],
      querySelectorAll: selector => selector === '.hero-slide' ? slides : dots,
      querySelector: selector => selector === '.hero' ? hero : control()
    };
    runInNewContext(script, {
      document, window: { matchMedia: () => media },
      setInterval: callback => { timers.set(++nextTimer, callback); return nextTimer; },
      clearInterval: id => timers.delete(id)
    });
    const pause = controls.heroPause;
    assert.equal(timers.size, reduced ? 0 : 1);
    if (reduced) pause.listeners.click();
    assert.equal(timers.size, 1);
    [...timers.values()][0]();
    assert.equal(slides[1].attributes['aria-hidden'], 'false');
    pause.listeners.click();
    controls.heroNext.listeners.click();
    document.listeners.visibilitychange();
    assert.equal(timers.size, 0);
    assert.equal(pause.attributes['aria-label'], 'Resume automatic rotation');
    pause.listeners.click();
    assert.equal(timers.size, 1);
    hero.listeners.focusin();
    assert.equal(timers.size, 0);
    hero.listeners.focusout({ relatedTarget: controls.heroNext });
    assert.equal(timers.size, 0);
    hero.listeners.focusout({ relatedTarget: null });
    assert.equal(timers.size, 1);
    hero.listeners.mouseenter();
    assert.equal(timers.size, 0);
    hero.listeners.mouseleave();
    assert.equal(timers.size, 1);
    document.hidden = true;
    document.listeners.visibilitychange();
    assert.equal(timers.size, 0);
    document.hidden = false;
    document.listeners.visibilitychange();
    assert.equal(timers.size, 1);
    media.listeners.change({ matches: true });
    assert.equal(timers.size, 0);
    media.listeners.change({ matches: false });
    assert.equal(timers.size, 0);
  }
});

test('Generic catalog actions and pending review availability are labeled accurately', () => {
  for (const [pillar, count] of [['build', 9], ['review', 4]]) {
    const html = readFileSync(join(__dirname, `../ssp-${pillar}.html`), 'utf8');
    assert.doesNotMatch(html, />Open skill /);
    assert.equal((html.match(/>Browse Skills Advisor </g) || []).length, count);
    assert.match(html, /catalog links do not/);
  }
  const review = readFileSync(join(__dirname, '../ssp-review.html'), 'utf8');
  assert.match(review, /href="#deep-review">Deep review availability/);
  assert.doesNotMatch(review, />Submit for deep review</);
  assert.match(review, /id="reviewLaunch"[^>]*disabled>Submission portal pending/);
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
  for (const [pillar, initialCategory, total] of [['build', 'apps', 9], ['review', 'architecture', 6]]) {
    const html = readFileSync(join(__dirname, `../ssp-${pillar}.html`), 'utf8');
    const cards = [...html.matchAll(/<article class="skill-card" data-category="([^"]+)"/g)];
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

test('Design guides use scoped skill sources and direct resources instead of generic redirects', () => {
  const html = readFileSync(join(__dirname, '../ssp-design.html'), 'utf8');
  const cards = [...html.matchAll(/<article class="skill-card"[\s\S]*?<\/article>/g)].map(match => match[0]);
  assert.equal(cards.length, 8);
  assert.doesNotMatch(html, /id="clearFilters"|>Clear search</);
  assert.match(html, /3 Design guides/);
  assert.doesNotMatch(html, /data-category="all"|All Design guides|>All guides</);
  assert.match(html, /data-category="architecture" aria-pressed="true"/);
  assert.match(html, /class="guide-rail"/);
  assert.match(html, /class="guide-panel" role="region" aria-labelledby="guide-panel-heading"/);
  for (const card of cards) {
    assert.doesNotMatch(card, /aka\.ms\/powerplatformskillsadvisor|>Open skill /);
    assert.match(card, /class="guide-resources"/);
    assert.match(card, /<details open><summary>Inputs and intended output/);
    assert.match(card, /https:\/\/learn\.microsoft\.com\//);
    const skill = card.match(/href="(https:\/\/github\.com\/[^"]+)"/);
    if (skill) assert.ok(catalog.skills.some(entry => entry.tier === 'skill' && entry.source === skill[1]), skill[1]);
    else assert.match(card, /No (dedicated|published).*verified in the imported catalog/);
  }
  assert.equal(cards.filter(card => card.includes('https://github.com/')).length, 4);
});

test('Design intents open curated topic pages instead of filtering the skill catalog', () => {
  const design = readFileSync(join(__dirname, '../ssp-design.html'), 'utf8');
  const guide = readFileSync(join(__dirname, '../ssp-design-guide.html'), 'utf8');
  assert.doesNotMatch(design, /<button class="outcome"/);
  for (const topic of ['new', 'modernize', 'govern', 'review']) {
    assert.ok(design.includes(`href="ssp-design-guide.html#${topic}"`));
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
  assert.match(guide, /not one-to-one names of published skills/);
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

test('Start here owns the complete resource catalog below search', () => {
  const html = readFileSync(join(__dirname, '../ssp-search.html'), 'utf8');
  assert.match(html, /<title>SSP - Start here<\/title>/);
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

test('About has no scenario form and SSP pages no longer link to Resources', () => {
  const about = readFileSync(join(__dirname, '../ssp-landing.html'), 'utf8');
  assert.match(about, /<title>SSP - About<\/title>/);
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
  for (const journey of journeys) {
    assert.ok(journey.options.some(option => option.id === 'unsure'), journey.id);
    assert.equal(new Set(journey.options.map(option => option.id)).size, journey.options.length);
    for (const option of journey.options) {
      assert.equal(nextStep(journey.id, option.id), option);
      assert.ok(option.title && option.why && option.action);
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
});

test('guided choices precede search and advanced controls stay optional', () => {
  const html = readFileSync(join(__dirname, '../ssp-search.html'), 'utf8');
  assert.ok(html.indexOf('id="goalChoices"') < html.indexOf('id="scenarioForm"'));
  assert.match(html, /<details id="advancedSearch" class="advanced-search">/);
  assert.ok(html.indexOf('id="advancedSearch"') < html.indexOf('id="typeFilter"'));
  assert.doesNotMatch(html, /id="starterScenarios"|data-scenario=/);
});