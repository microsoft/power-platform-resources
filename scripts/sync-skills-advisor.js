const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const sourceUrl = 'https://microsoft.github.io/power-cat-skills/skill-advisor/';
const output = path.join(__dirname, '../assets/data/skills-advisor.json');

function parseCatalog(html) {
  const match = html.match(/^const DATA = (\{[^\r\n]+\});\s*$/m);
  if (!match) throw new Error('Published catalog format changed; existing snapshot was not replaced.');
  const data = JSON.parse(match[1]);
  if (!Array.isArray(data.skills) || !data.skills.length) throw new Error('Catalog is empty.');
  const ids = new Set();
  for (const item of data.skills) {
    if (!item.id || ids.has(item.id) || !item.name || !item.description ||
        !['skill', 'mcp-capability', 'reference'].includes(item.tier) ||
        !Array.isArray(item.products) || !Array.isArray(item.locations) ||
        typeof item.source !== 'string' || !item.source.startsWith('https://')) {
      throw new Error('Invalid catalog entry: ' + item.id);
    }
    ids.add(item.id);
  }
  return {
    source: sourceUrl,
    sourceGenerated: data.generated,
    retrieved: new Date().toISOString(),
    sha256: crypto.createHash('sha256').update(match[1]).digest('hex'),
    skills: data.skills
  };
}

async function sync() {
  const response = await fetch(sourceUrl, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error('Catalog request failed: ' + response.status);
  const catalog = parseCatalog(await response.text());
  if (process.argv.includes('--check')) {
    const snapshot = JSON.parse(await fs.readFile(output, 'utf8'));
    if (JSON.stringify(snapshot.skills) !== JSON.stringify(catalog.skills)) {
      throw new Error('Skills Advisor changed. Run node scripts/sync-skills-advisor.js to refresh the snapshot.');
    }
    console.log('PASS: all ' + catalog.skills.length + ' entries exactly match the published Skills Advisor catalog.');
    return;
  }
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output + '.tmp', JSON.stringify(catalog, null, 2) + '\n');
  await fs.rename(output + '.tmp', output);
  const counts = {};
  for (const item of catalog.skills) counts[item.tier] = (counts[item.tier] || 0) + 1;
  console.log(JSON.stringify({ total: catalog.skills.length, counts, output }, null, 2));
}

if (require.main === module) sync().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { parseCatalog };