const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');

const WEBHOOK = process.env.DISCORD_WEBHOOK_URL;
if (!WEBHOOK) {
  console.error('Falta DISCORD_WEBHOOK_URL en los secrets.');
  process.exit(1);
}

const POSTED_FILE = 'posted.json';

const PAGES = [
  { name: 'SBC', url: 'https://www.futbin.com/squad-building-challenges' },
  { name: 'Objectives', url: 'https://www.futbin.com/objectives' },
  { name: 'News', url: 'https://www.futbin.com/news' },
];

function loadPosted() {
  try {
    return JSON.parse(fs.readFileSync(POSTED_FILE, 'utf8'));
  } catch (e) {
    return { posted: [] };
  }
}

function savePosted(obj) {
  fs.writeFileSync(POSTED_FILE, JSON.stringify(obj, null, 2));
}

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; DiscordBot/1.0; +https://github.com)',
    },
  });
  if (!res.ok) throw new Error(`Error ${res.status} al obtener ${url}`);
  return await res.text();
}

function extractItemsFromHtml(html, baseUrl) {
  const $ = cheerio.load(html);
  let items = [];
  const containers = ['#content', '.news-list', '.list-group', '.sbcList', '.items'];
  let found = false;

  for (const sel of containers) {
    const el = $(sel);
    if (el.length) {
      el.find('a').each((_, a) => {
        const $a = $(a);
        const text = $a.text().trim();
        const href = $a.attr('href');
        if (text && href) {
          const link = href.startsWith('http') ? href : new URL(href, baseUrl).toString();
          items.push({ title: text.replace(/\s+/g, ' ').trim(), link });
        }
      });
      if (items.length) { found = true; break; }
    }
  }

  if (!found) {
    $('article a, .news a, a').each((_, a) => {
      const $a = $(a);
      const text = $a.text().trim();
      const href = $a.attr('href');
      if (text && href) {
        const link = href.startsWith('http') ? href : new URL(href, baseUrl).toString();
        items.push({ title: text.replace(/\s+/g, ' ').trim(), link });
      }
    });
  }

  const seen = new Set();
  items = items.filter(it => {
    if (!it.link) return false;
    if (seen.has(it.link)) return false;
    seen.add(it.link);
    return true;
  });

  return items;
}

async function gatherNewItems() {
  const allNew = [];
  for (const p of PAGES) {
    try {
      const html = await fetchPage(p.url);
      const items = extractItemsFromHtml(html, p.url);
      const top = items.slice(0, 15).map(it => ({ ...it, source: p.name }));
      allNew.push(...top);
    } catch (err) {
      console.error('Error al procesar', p.url, err.message);
    }
  }
  return allNew;
}

async function sendWebhook(content) {
  const res = await fetch(WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  return res;
}

(async () => {
  const store = loadPosted();
  const posted = new Set(store.posted || []);

  const items = await gatherNewItems();
  const newItems = items.filter(it => !posted.has(it.link));

  if (newItems.length === 0) {
    console.log('No hay items nuevos hoy.');
    return;
  }

  let content = 🎮 **Contenido nuevo de FC26 Ultimate Team (${new Date().toLocaleDateString()})**\n\n;
  const bySource = {};
  newItems.forEach(it => {
    if (!bySource[it.source]) bySource[it.source] = [];
    bySource[it.source].push(it);
  });

  for (const key of Object.keys(bySource)) {
    content += **${key}**\n;
    bySource[key].slice(0, 10).forEach(it => {
      content += • ${it.title}\n  ${it.link}\n;
    });
    content += \n;
  }

  if (content.length > 1900) content = content.slice(0, 1900) + '\n\n(Mensaje recortado)';

  const resp = await sendWebhook(content);
  console.log('Webhook enviado, status:', resp.status);

  for (const it of newItems) posted.add(it.link);
  store.posted = Array.from(posted);
  savePosted(store);
})();
