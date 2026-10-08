const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const sourceUrl = 'https://microsoft.github.io/power-cat-skills/power-platform-migration-factory/data/catalog.json';
const marketplaceUrl = 'https://microsoft.github.io/power-cat-skills/power-platform-migration-factory/';
const output = path.join(__dirname, '../assets/data/powercat-marketplace.json');

function detailUrl(detailId) {
  return marketplaceUrl + 'skill.html?id=' + encodeURIComponent(detailId);
}

function parseCatalog(json) {
  const data = JSON.parse(json);
  if (!Array.isArray(data.categories) || !data.categories.length ||
      !Array.isArray(data.plugins) || !data.plugins.length ||
      !Array.isArray(data.skills) || !data.skills.length ||
      !Array.isArray(data.migrationTracks) || !data.migrationTracks.length) {
    throw new Error('Published Power CAT marketplace catalog is incomplete.');
  }

  const categoryIds = new Set(data.categories.map(category => category.id));
  const pluginIds = new Set(data.plugins.map(plugin => plugin.id));
  const detailIds = new Set();
  const skills = data.skills.map(item => {
    if (!item.id || !item.detailId || detailIds.has(item.detailId) || !item.title ||
        typeof item.description !== 'string' ||
        !categoryIds.has(item.categoryId) ||
        (!pluginIds.has(item.plugin) && item.plugin !== 'powercat-migration-factory') ||
        !Array.isArray(item.tags) || !Array.isArray(item.products) ||
        !Array.isArray(item.when) || !Array.isArray(item.how) ||
        typeof item.install !== 'string' || !item.install ||
        typeof item.source !== 'string' || !item.source.startsWith('https://')) {
      throw new Error('Invalid Power CAT skill entry: ' + (item.id || 'unknown'));
    }
    detailIds.add(item.detailId);
    return {
      id: item.id,
      detailId: item.detailId,
      title: item.title,
      categoryId: item.categoryId,
      category: item.categoryLabel || item.category,
      plugin: item.plugin,
      pluginLabel: item.pluginLabel,
      description: item.description,
      tags: item.tags,
      products: item.products.map(product => product.label),
      what: item.what,
      when: item.when,
      how: item.how,
      install: item.install,
      source: item.source,
      docsSource: item.docsSource,
      detailUrl: detailUrl(item.detailId)
    };
  });

  const migrationTracks = data.migrationTracks.map(track => {
    if (!track.id || !track.title || !track.description || !track.detailId ||
        !detailIds.has(track.detailId) || typeof track.source !== 'string' ||
        !track.source.startsWith('https://')) {
      throw new Error('Invalid Power CAT migration track: ' + (track.id || 'unknown'));
    }
    return {
      id: track.id,
      title: track.title,
      description: track.description,
      products: track.products.map(product => product.label),
      status: track.status,
      cta: track.cta,
      skillId: track.skillId,
      detailId: track.detailId,
      source: track.source,
      detailUrl: detailUrl(track.detailId)
    };
  });

  return {
    source: sourceUrl,
    marketplace: marketplaceUrl,
    retrieved: new Date().toISOString(),
    sha256: crypto.createHash('sha256').update(json).digest('hex'),
    categories: data.categories,
    plugins: data.plugins,
    skills,
    migrationTracks
  };
}

function comparable(catalog) {
  return {
    source: catalog.source,
    marketplace: catalog.marketplace,
    categories: catalog.categories,
    plugins: catalog.plugins,
    skills: catalog.skills,
    migrationTracks: catalog.migrationTracks
  };
}

async function sync() {
  const response = await fetch(sourceUrl, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error('Power CAT marketplace request failed: ' + response.status);
  const catalog = parseCatalog(await response.text());
  if (process.argv.includes('--check')) {
    const snapshot = JSON.parse(await fs.readFile(output, 'utf8'));
    if (JSON.stringify(comparable(snapshot)) !== JSON.stringify(comparable(catalog))) {
      throw new Error('Power CAT marketplace changed. Run node scripts/sync-powercat-marketplace.js to refresh the snapshot.');
    }
    console.log('PASS: all ' + catalog.skills.length + ' Power CAT skills and ' +
      catalog.migrationTracks.length + ' migration tracks match the published marketplace.');
    return;
  }
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output + '.tmp', JSON.stringify(catalog, null, 2) + '\n');
  await fs.rename(output + '.tmp', output);
  console.log(JSON.stringify({
    skills: catalog.skills.length,
    migrationTracks: catalog.migrationTracks.length,
    output
  }, null, 2));
}

if (require.main === module) sync().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});

module.exports = { detailUrl, parseCatalog };
