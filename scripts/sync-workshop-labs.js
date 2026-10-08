const fs = require('node:fs/promises');
const path = require('node:path');

const repository = 'microsoft/apps-agents-workshop';
const source = 'https://microsoft.github.io/apps-agents-workshop/labs/';
const output = path.join(__dirname, '../assets/data/workshop-labs.json');

function parseLab(markdown, labPath) {
  const header = markdown.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  if (!header || !/^lab:\s*true\s*$/im.test(header[1])) return null;
  if (!/^[\w /.-]+\.md$/i.test(labPath) || labPath.split('/').includes('..')) throw new Error('Invalid lab path: ' + labPath);
  const fields = {};
  for (const line of header[1].split(/\r?\n/)) {
    const match = line.match(/^(title|description|persona|level|estimated_duration|duration|tags):\s*(.+)$/);
    if (!match) continue;
    let value = match[2].trim();
    if (value.startsWith('"')) value = JSON.parse(value);
    else if (value.startsWith("'")) value = value.slice(1, -1).replace(/''/g, "'");
    if (match[1] === 'tags') {
      if (!/^\[[\w\s,-]*\]$/.test(value)) throw new Error('Unsupported lab tags: ' + labPath);
      fields.tags = value.slice(1, -1).split(',').map(tag => tag.trim()).filter(Boolean);
    } else {
      if (['|', '>'].includes(value)) throw new Error('Unsupported multiline metadata: ' + labPath);
      fields[match[1]] = value.trim();
    }
  }
  for (const key of ['title', 'description', 'persona', 'level', 'tags']) {
    if (!fields[key]) throw new Error('Missing ' + key + ': ' + labPath);
  }
  const duration = fields.estimated_duration || fields.duration;
  if (!duration) throw new Error('Missing duration: ' + labPath);
  const url = new URL('lab.html', source);
  url.searchParams.set('path', labPath);
  url.searchParams.set('branch', 'main');
  return {
    title: fields.title,
    description: fields.description,
    text: [fields.description, fields.persona, 'Level ' + fields.level, duration, ...fields.tags.map(tag => tag.replace(/-/g, ' ')), 'Power Platform Power Series workshop lab labs hands-on learning training'].join(' '),
    category: 'Learn / Power Series', type: 'Learning', url: url.href,
    source, sourceName: 'Power Series labs', path: labPath,
    level: fields.level, duration, persona: fields.persona
  };
}

async function request(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error('Workshop request failed: ' + response.status + ' ' + url);
  return response;
}

async function sync() {
  const commit = await (await request(`https://api.github.com/repos/${repository}/commits/main`)).json();
  const tree = await (await request(`https://api.github.com/repos/${repository}/git/trees/${commit.sha}?recursive=1`)).json();
  if (tree.truncated || !Array.isArray(tree.tree)) throw new Error('Incomplete repository tree.');
  const paths = tree.tree.filter(item => item.type === 'blob' && item.path.startsWith('labs/') && /\.md$/i.test(item.path))
    .map(item => item.path.slice(5)).filter(item => item.split('/').length <= 2 || path.posix.basename(item).toLowerCase() === 'readme.md');
  const labs = [];
  for (const labPath of paths) {
    const encoded = labPath.split('/').map(encodeURIComponent).join('/');
    const markdown = await (await request(`https://raw.githubusercontent.com/${repository}/${commit.sha}/labs/${encoded}`)).text();
    const lab = parseLab(markdown, labPath);
    if (lab) labs.push(lab);
  }
  if (!labs.length) throw new Error('No published labs found; snapshot was not replaced.');
  labs.sort((first, second) => first.path.localeCompare(second.path));
  const snapshot = { repository: `https://github.com/${repository}`, source, commit: commit.sha, retrieved: new Date().toISOString(), license: 'CC-BY-4.0', labs };
  if (process.argv.includes('--check')) {
    const existing = JSON.parse(await fs.readFile(output, 'utf8'));
    if (JSON.stringify(existing.labs) !== JSON.stringify(labs)) throw new Error('Workshop catalog changed. Run node scripts/sync-workshop-labs.js to refresh.');
    console.log(`PASS: ${labs.length} labs match the repository.`);
    return;
  }
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output + '.tmp', JSON.stringify(snapshot, null, 2) + '\n');
  await fs.rename(output + '.tmp', output);
  console.log(`Imported ${labs.length} published labs from ${commit.sha}.`);
}

if (require.main === module) sync().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { parseLab };