const fs = require('node:fs/promises');
const path = require('node:path');

const root = path.join(__dirname, '..');
const powerCatMarketplaceUrl = 'https://microsoft.github.io/power-cat-skills/power-platform-migration-factory/';
const files = {
  about: path.join(root, 'ssp-landing.html'),
  resources: path.join(root, 'ssp-search.html'),
  skills: path.join(root, 'assets/data/skills-advisor.json'),
  labs: path.join(root, 'assets/data/workshop-labs.json'),
  featured: path.join(root, 'assets/data/about-featured.json'),
  latest: path.join(root, 'assets/data/latest-content.json'),
  marketplace: path.join(root, 'assets/data/powercat-marketplace.json')
};

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function textFromHtml(value) {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&middot;/g, '·')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function replaceRequired(source, pattern, replacement, label) {
  if (!pattern.test(source)) throw new Error('Could not find ' + label + '.');
  pattern.lastIndex = 0;
  return source.replace(pattern, replacement);
}

function replaceGeneratedBlock(source, name, content) {
  const start = `<!-- BEGIN GENERATED ${name} -->`;
  const end = `<!-- END GENERATED ${name} -->`;
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end);
  if (startIndex < 0 || endIndex < 0 || endIndex < startIndex) {
    throw new Error(`Missing or invalid generated block: ${name}.`);
  }
  if (source.indexOf(start, startIndex + start.length) >= 0 ||
      source.indexOf(end, endIndex + end.length) >= 0) {
    throw new Error(`Generated block must appear exactly once: ${name}.`);
  }
  const newline = source.includes('\r\n') ? '\r\n' : '\n';
  return source.slice(0, startIndex + start.length) + newline +
    content.split('\n').join(newline) + newline + source.slice(endIndex);
}

function parseSnapshot(value, label) {
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`${label} snapshot is not valid JSON: ${error.message}`);
  }
}

function validateMarketplace(marketplace) {
  if (!marketplace || typeof marketplace !== 'object' || Array.isArray(marketplace)) {
    throw new Error('Power CAT marketplace snapshot must be an object.');
  }
  if (marketplace.marketplace !== powerCatMarketplaceUrl) {
    throw new Error(`Power CAT marketplace snapshot must use the canonical URL: ${powerCatMarketplaceUrl}`);
  }
  for (const field of ['skills', 'migrationTracks']) {
    const entries = marketplace[field];
    if (!Array.isArray(entries) || !entries.length) {
      throw new Error(`Power CAT marketplace snapshot ${field} must be a non-empty array.`);
    }
    const detailIds = entries.map((entry, index) => {
      if (!entry || typeof entry !== 'object' ||
          typeof entry.id !== 'string' || !entry.id.trim() ||
          typeof entry.detailId !== 'string' || !entry.detailId.trim()) {
        throw new Error(`Power CAT marketplace snapshot ${field}[${index}] needs non-empty id and detailId values.`);
      }
      return entry.detailId;
    });
    if (new Set(detailIds).size !== detailIds.length) {
      throw new Error(`Power CAT marketplace snapshot ${field} contains duplicate detailIds.`);
    }
  }
}

function deriveResourceStats(html) {
  const start = html.indexOf('<div id="resourceCategories"');
  const end = html.indexOf('</main>', start);
  if (start < 0 || end < 0) throw new Error('Resource catalog markup was not found.');
  const region = html.slice(start, end);
  const panels = [...region.matchAll(/<article class="panel(?: active)?" id="([^"]+)"[^>]*>([\s\S]*?)(?=<article class="panel(?: active)?" id="|$)/g)]
    .map(match => ({
      id: match[1],
      topics: (match[2].match(/<h3 class="resource-group-title"(?:\s|>)/g) || []).length,
      links: (match[2].match(/<a\b/g) || []).length
    }));
  if (!panels.length || panels.some(panel => !panel.links)) {
    throw new Error('Resource panels must contain at least one link.');
  }
  return {
    panels,
    categories: panels.length,
    links: panels.reduce((total, panel) => total + panel.links, 0)
  };
}

function updateResourceCounts(html, stats) {
  let updated = html;
  for (const panel of stats.panels) {
    const id = escapeRegex(panel.id);
    const navPattern = new RegExp(`(<button class="cat-link(?: active)?"[^>]*data-target="${id}"[^>]*>[\\s\\S]*?<span class="cat-count">)\\d+(</span>)`);
    updated = replaceRequired(updated, navPattern, `$1${panel.links}$2`, `navigation count for ${panel.id}`);
    const subtitlePattern = new RegExp(`(<article class="panel(?: active)?" id="${id}"[^>]*>[\\s\\S]*?<p class="panel-sub">)((?:\\d+ topics · )?)\\d+ curated (?:links|resources)(</p>)`);
    const links = `${panel.links} curated ${panel.links === 1 ? 'link' : 'links'}`;
    updated = replaceRequired(updated, subtitlePattern, `$1$2${links}$3`, `panel summary for ${panel.id}`);
  }
  return updated;
}

function formatDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value + 'T00:00:00Z'))) {
    throw new Error('Featured reviewed date must use YYYY-MM-DD.');
  }
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
  }).format(new Date(value + 'T00:00:00Z'));
}

function findGuide(html, page, anchor) {
  const cards = [...html.matchAll(/<article class="skill-card"([^>]*)>([\s\S]*?)<\/article>/g)];
  for (const card of cards) {
    const titleMatch = card[2].match(/<h3>([\s\S]*?)<\/h3>/);
    if (!titleMatch || 'skill-' + slugify(textFromHtml(titleMatch[1])) !== anchor) continue;
    const descriptionMatch = card[2].match(/<h3>[\s\S]*?<\/h3>\s*<p>([\s\S]*?)<\/p>/);
    const categoryMatch = card[1].match(/\bdata-category="([^"]+)"/);
    if (!descriptionMatch || !categoryMatch) throw new Error('Guide metadata is incomplete: ' + anchor);
    return {
      title: textFromHtml(titleMatch[1]),
      description: textFromHtml(descriptionMatch[1]),
      href: page + '#' + anchor,
      kind: 'Guide',
      footer: categoryMatch[1][0].toUpperCase() + categoryMatch[1].slice(1) + ' guide'
    };
  }
  throw new Error('Featured guide was not found: ' + page + '#' + anchor);
}

async function resolveFeaturedItem(item, sources) {
  if (!item || typeof item !== 'object' || !item.type || !item.badge || !item.reason) {
    throw new Error('Each featured item needs type, badge, and reason.');
  }
  if (item.type === 'catalog') {
    return {
      title: 'Browse published skills',
      description: `Explore ${sources.skills.skills.length} published skills by product and task, with source instructions and availability details.`,
      href: 'ssp-search.html#skills',
      kind: 'Catalog',
      footer: `${sources.skills.skills.length} catalog entries`
    };
  }
  if (item.type === 'guide') {
    if (!item.page || !item.anchor || path.basename(item.page) !== item.page) {
      throw new Error('Featured guides need a safe local page and anchor.');
    }
    const html = await fs.readFile(path.join(root, item.page), 'utf8');
    return findGuide(html, item.page, item.anchor);
  }
  if (item.type === 'lab') {
    const lab = sources.labs.labs.find(entry => entry.path === item.path);
    if (!lab) throw new Error('Featured lab was not found: ' + item.path);
    return {
      title: lab.title,
      description: lab.description,
      href: lab.url,
      kind: 'Lab',
      footer: `${lab.persona} · ${lab.duration}`
    };
  }
  if (item.type === 'skill') {
    const skill = sources.skills.skills.find(entry => entry.id === item.id);
    if (!skill) throw new Error('Featured skill was not found: ' + item.id);
    return {
      title: skill.displayName || skill.name,
      description: skill.description,
      href: skill.source,
      kind: 'Skill',
      footer: `${skill.marketplace} · ${skill.status}`
    };
  }
  throw new Error('Unsupported featured item type: ' + item.type);
}

function renderMetrics(stats, labs, marketplace) {
  return [
    '        <div class="hero-metrics" aria-label="Portal catalog statistics">',
    `          <div class="hero-metric"><strong>${stats.links}</strong><span>Curated links</span></div>`,
    `          <div class="hero-metric"><strong>${stats.categories}</strong><span>Categories</span></div>`,
    `          <div class="hero-metric"><strong>${labs.labs.length}</strong><span>Power Series labs</span></div>`,
    `          <div class="hero-metric"><strong>${marketplace.skills.length} + ${marketplace.migrationTracks.length}</strong><span>Power CAT skills · migration tracks</span></div>`,
    '        </div>'
  ].join('\n');
}

function renderLearnLabCount(labs) {
  return `              <li>${labs.labs.length} hands-on labs</li>`;
}

function renderLearnMeta(stats, labs) {
  return `            <div class="meta"><span class="chip">${labs.labs.length} labs</span><span class="chip">${stats.links} resources</span></div>`;
}

function renderResourceStats(stats, labs) {
  return [
    '    <div class="stats">',
    `    <div class="stat"><div class="n">${stats.links}</div><div class="l">Curated resources</div></div>`,
    `    <div class="stat"><div class="n">${stats.categories}</div><div class="l">Resource categories</div></div>`,
    `    <div class="stat"><div class="n">${labs.labs.length}</div><div class="l">Hands-on labs</div></div>`,
    '    <div class="stat"><div class="n">24/7</div><div class="l">Always available</div></div>',
    '    </div>'
  ].join('\n');
}

function renderLatest(items, heading, id) {
  if (!Array.isArray(items) || items.length !== 3) {
    throw new Error(`Latest ${id} snapshot must contain exactly three entries.`);
  }
  const entries = items.map(item => {
    if (!item.title || !item.url || !/^\d{4}-\d{2}-\d{2}$/.test(item.published)) {
      throw new Error(`Invalid latest ${id} entry.`);
    }
    const url = new URL(item.url);
    if (url.protocol !== 'https:' || !/(^|\.)microsoft\.com$/i.test(url.hostname)) {
      throw new Error(`Unsupported latest ${id} destination: ${item.url}`);
    }
    return `          <li><a href="${escapeHtml(item.url)}" target="_blank" rel="noopener">${escapeHtml(item.title)}</a> — published <time datetime="${item.published}">${formatDate(item.published)}</time></li>`;
  });
  return [
    `        <h3 class="resource-group-title" id="latest-${id}-heading">${heading}</h3>`,
    `        <ul aria-labelledby="latest-${id}-heading">`,
    ...entries,
    '        </ul>'
  ].join('\n');
}

function renderFeatured(config, items) {
  const cards = items.map((item, index) => {
    const configured = config.items[index];
    const external = /^https:\/\//.test(item.href);
    const attributes = external ? ' target="_blank" rel="noopener"' : '';
    return [
      `      <a class="fcard" href="${escapeHtml(item.href)}"${attributes} data-feature-reason="${escapeHtml(configured.reason)}">`,
      `        <div class="ftop"><span class="fbadge">${escapeHtml(configured.badge)}</span><span class="fkind">${escapeHtml(item.kind)}</span></div>`,
      '        <div class="fbody">',
      `          <h3>${escapeHtml(item.title)}</h3>`,
      `          <p>${escapeHtml(item.description)}</p>`,
      `          <div class="ffoot"><span>${escapeHtml(item.footer)}</span></div>`,
      '        </div>',
      '      </a>'
    ].join('\n');
  }).join('\n');
  return [
    '  <div class="wrap">',
    '    <div class="sec-head">',
    '      <div class="kicker">Featured guidance</div>',
    '      <h2>Selected skills, labs &amp; guidance</h2>',
    '    </div>',
    '    <div class="feat-grid">',
    cards,
    '    </div>',
    '  </div>'
  ].join('\n');
}

async function generate() {
  const [about, resources, skillsText, labsText, featuredText, latestText, marketplaceText] = await Promise.all([
    fs.readFile(files.about, 'utf8'),
    fs.readFile(files.resources, 'utf8'),
    fs.readFile(files.skills, 'utf8'),
    fs.readFile(files.labs, 'utf8'),
    fs.readFile(files.featured, 'utf8'),
    fs.readFile(files.latest, 'utf8'),
    fs.readFile(files.marketplace, 'utf8')
  ]);
  const skills = parseSnapshot(skillsText, 'Skills');
  const labs = parseSnapshot(labsText, 'Workshop');
  const featured = parseSnapshot(featuredText, 'Featured');
  const latest = parseSnapshot(latestText, 'Latest content');
  const marketplace = parseSnapshot(marketplaceText, 'Power CAT marketplace');
  if (!Array.isArray(skills.skills) || !skills.skills.length) throw new Error('Skills snapshot is empty.');
  if (!Array.isArray(labs.labs) || !labs.labs.length) throw new Error('Workshop snapshot is empty.');
  validateMarketplace(marketplace);
  if (typeof featured.owner !== 'string' || !featured.owner.trim() ||
      typeof featured.cadence !== 'string' || !featured.cadence.trim() ||
      !Array.isArray(featured.items) || featured.items.length !== 3) {
    throw new Error('Featured configuration needs an owner, cadence, and exactly three items.');
  }
  const items = [];
  for (const item of featured.items) items.push(await resolveFeaturedItem(item, { skills, labs }));
  let latestResources = replaceGeneratedBlock(resources, 'LATEST NEWS', renderLatest(latest.news, 'Latest from Microsoft Power Platform', 'news'));
  latestResources = replaceGeneratedBlock(latestResources, 'LATEST EVENTS', renderLatest(latest.events, 'Latest event announcements', 'events'));
  const stats = deriveResourceStats(latestResources);
  const expectedResources = updateResourceCounts(latestResources, stats);
  let expectedAbout = replaceGeneratedBlock(about, 'ABOUT METRICS', renderMetrics(stats, labs, marketplace));
  expectedAbout = replaceGeneratedBlock(expectedAbout, 'ABOUT LEARN LAB COUNT', renderLearnLabCount(labs));
  expectedAbout = replaceGeneratedBlock(expectedAbout, 'ABOUT LEARN META', renderLearnMeta(stats, labs));
  expectedAbout = replaceGeneratedBlock(expectedAbout, 'ABOUT RESOURCE STATS', renderResourceStats(stats, labs));
  expectedAbout = replaceGeneratedBlock(expectedAbout, 'ABOUT FEATURED', renderFeatured(featured, items));
  return { about, resources, expectedAbout, expectedResources, stats, skills, labs, marketplace };
}

async function main() {
  const result = await generate();
  const check = process.argv.includes('--check');
  const stale = [];
  if (result.about !== result.expectedAbout) stale.push(path.relative(root, files.about));
  if (result.resources !== result.expectedResources) stale.push(path.relative(root, files.resources));
  if (check && stale.length) throw new Error('Generated site content is stale: ' + stale.join(', ') + '. Run node scripts/update-about.js.');
  if (!check) {
    if (result.about !== result.expectedAbout) await fs.writeFile(files.about, result.expectedAbout);
    if (result.resources !== result.expectedResources) await fs.writeFile(files.resources, result.expectedResources);
  }
  console.log(JSON.stringify({
    status: check ? 'current' : 'updated',
    curatedLinks: result.stats.links,
    categories: result.stats.categories,
    labs: result.labs.labs.length,
    catalogEntries: result.skills.skills.length,
    powerCatSkills: result.marketplace.skills.length,
    migrationTracks: result.marketplace.migrationTracks.length
  }, null, 2));
}

if (require.main === module) main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});

module.exports = { deriveResourceStats, findGuide, generate, updateResourceCounts };
