const { test } = require('node:test');
const assert = require('node:assert/strict');
const { rank, guidance } = require('../assets/js/ssp-search-engine.js');
const { parseCatalog } = require('../scripts/sync-skills-advisor.js');
const catalog = require('../assets/data/skills-advisor.json');
const { readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');

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

test('slow-app queries match performance by synonym', () => {
  assert.equal(rank(entries, 'my app is slow')[0].title, 'App Performance Review');
});
test('a proposed migration does not override performance diagnosis', () => {
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
  for (const page of ['landing', 'search', 'design', 'build', 'review']) {
    const html = readFileSync(join(__dirname, `../ssp-${page}.html`), 'utf8');
    assert.doesNotMatch(html, /ssp-resources\.html|>Home<\/a>/);
    assert.match(html, /href="ssp-landing.html"[^>]*>About<\/a>/);
  }
});