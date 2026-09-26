const fs = require('node:fs/promises');
const path = require('node:path');

const feeds = {
  news: 'https://www.microsoft.com/en-us/power-platform/blog/feed/',
  events: 'https://www.microsoft.com/en-us/power-platform/blog/content-type/events/feed/'
};
const output = path.join(__dirname, '../assets/data/latest-content.json');
const itemLimit = 3;

function decodeXml(value) {
  return value
    .replace(/^<!\[CDATA\[|\]\]>$/g, '')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[\u200b-\u200d\ufeff]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function readElement(item, name) {
  const match = item.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'));
  return match ? decodeXml(match[1]) : '';
}

function normalizeUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || !/(^|\.)microsoft\.com$/i.test(url.hostname)) {
    throw new Error('Unsupported feed destination: ' + value);
  }
  url.pathname = url.pathname.replace(/^\/en-us\//, '/');
  return url.href;
}

function parseFeed(xml) {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map(match => {
    const title = readElement(match[1], 'title');
    const link = readElement(match[1], 'link');
    const published = new Date(readElement(match[1], 'pubDate'));
    if (!title || !link || Number.isNaN(published.getTime())) {
      throw new Error('Published feed item is missing a title, link, or valid date.');
    }
    return { title, url: normalizeUrl(link), published: published.toISOString().slice(0, 10) };
  });
  if (!items.length) throw new Error('Published feed is empty or its format changed.');
  return items;
}

async function readFeed(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Feed request failed: ${response.status} ${url}`);
  return parseFeed(await response.text());
}

async function sync() {
  const [allNews, allEvents] = await Promise.all([readFeed(feeds.news), readFeed(feeds.events)]);
  const eventUrls = new Set(allEvents.map(item => item.url));
  const news = allNews
    .filter(item => !eventUrls.has(item.url) && !/copilot-studio/i.test(item.title + ' ' + item.url))
    .slice(0, itemLimit);
  const events = allEvents.slice(0, itemLimit);
  if (news.length !== itemLimit || events.length !== itemLimit) {
    throw new Error(`Expected ${itemLimit} news and event entries; received ${news.length} news and ${events.length} events.`);
  }
  const snapshot = { feeds, retrieved: new Date().toISOString(), news, events };
  if (process.argv.includes('--check')) {
    const existing = JSON.parse(await fs.readFile(output, 'utf8'));
    if (JSON.stringify(existing.news) !== JSON.stringify(news) ||
        JSON.stringify(existing.events) !== JSON.stringify(events)) {
      throw new Error('Latest news or events changed. Run node scripts/sync-latest-content.js to refresh the snapshot.');
    }
    console.log(`PASS: ${news.length} news and ${events.length} event entries match the official feeds.`);
    return;
  }
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output + '.tmp', JSON.stringify(snapshot, null, 2) + '\n');
  await fs.rename(output + '.tmp', output);
  console.log(JSON.stringify({ news: news.length, events: events.length, output }, null, 2));
}

if (require.main === module) sync().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { parseFeed };
